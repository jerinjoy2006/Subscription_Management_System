import { run, get, query } from '../config/db.js';
import { getNextBillingDate } from '../services/billingEngine.js';

export const getSubscriptions = async (req, res) => {
  try {
    const { status, customer_id, plan_id, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name,
             p.name as plan_name, p.billing_interval as plan_interval, p.can_pause, p.can_renew, p.can_close_early,
             d.code as discount_code, d.value as discount_value
      FROM subscriptions s
      JOIN users u ON s.customer_id = u.id
      JOIN plans p ON s.plan_id = p.id
      LEFT JOIN discounts d ON s.discount_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based isolation: if customer, restrict to their own subscriptions
    if (req.user && req.user.role === 'customer') {
      sql += ` AND s.customer_id = ?`;
      params.push(req.user.id);
    } else if (customer_id) {
      sql += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    if (plan_id) {
      sql += ` AND s.plan_id = ?`;
      params.push(plan_id);
    }

    if (search) {
      sql += ` AND (s.subscription_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.id DESC LIMIT ? OFFSET ?;`;
    params.push(Number(limit), Number(offset));

    const subscriptions = await query(sql, params);

    // Fetch line items for these subscriptions
    const subIds = subscriptions.map((s) => s.id);
    let items = [];
    if (subIds.length > 0) {
      items = await query(`
        SELECT si.*, p.name as product_name, pv.variant_name
        FROM subscription_items si
        JOIN products p ON si.product_id = p.id
        LEFT JOIN product_variants pv ON si.variant_id = pv.id
        WHERE si.subscription_id IN (${subIds.map(() => '?').join(',')});
      `, subIds);
    }

    const subscriptionsWithItems = subscriptions.map((sub) => ({
      ...sub,
      items: items.filter((it) => it.subscription_id === sub.id)
    }));

    res.json({ subscriptions: subscriptionsWithItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
};

export const getSubscriptionById = async (req, res) => {
  try {
    const sub = await get(
      `SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name, u.phone as customer_phone,
              p.name as plan_name, p.billing_interval as plan_interval, p.can_pause, p.can_renew, p.can_close_early,
              d.code as discount_code, d.value as discount_value
       FROM subscriptions s
       JOIN users u ON s.customer_id = u.id
       JOIN plans p ON s.plan_id = p.id
       LEFT JOIN discounts d ON s.discount_id = d.id
       WHERE s.id = ?;`,
      [req.params.id]
    );

    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Isolation check
    if (req.user && req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const items = await query(
      `SELECT si.*, p.name as product_name, pv.variant_name
       FROM subscription_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN product_variants pv ON si.variant_id = pv.id
       WHERE si.subscription_id = ?;`,
      [sub.id]
    );

    const invoices = await query(
      `SELECT * FROM invoices WHERE subscription_id = ? ORDER BY id DESC;`,
      [sub.id]
    );

    res.json({ subscription: { ...sub, items, invoices } });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching subscription.' });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const {
      customer_id,
      plan_id,
      billing_interval,
      start_date,
      payment_terms = 'Immediate',
      discount_code,
      items = [],
      notes,
      auto_close
    } = req.body;

    // Use current user id if customer
    const targetCustomerId = req.user.role === 'customer' ? req.user.id : customer_id;

    if (!targetCustomerId || !plan_id || items.length === 0) {
      return res.status(400).json({ error: 'Customer, Plan, and at least one item line are required.' });
    }

    const plan = await get(`SELECT * FROM plans WHERE id = ?;`, [plan_id]);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    // Validate minimum quantity
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
    if (totalQty < plan.minimum_quantity) {
      return res.status(400).json({
        error: `Selected plan "${plan.name}" requires a minimum quantity of ${plan.minimum_quantity} seats/units.`
      });
    }

    const countRow = await get(`SELECT COUNT(*) as count FROM subscriptions;`);
    const subNumber = `SUB-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(3, '0')}`;

    const effectiveInterval = billing_interval || plan.billing_interval;
    const effectiveStart = start_date || new Date().toISOString().split('T')[0];

    // Compute expiry (1 year default)
    const expDate = new Date(effectiveStart);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const expiry_date = expDate.toISOString().split('T')[0];

    // Calculate line items subtotal and tax
    let subtotal = 0;
    let taxAmount = 0;
    for (const it of items) {
      const lineSub = Number(it.quantity) * Number(it.unit_price);
      subtotal += lineSub;
      taxAmount += (lineSub * Number(it.tax_rate || 0)) / 100;
    }

    // Check discount
    let discountId = null;
    let discountAmount = 0;
    if (discount_code) {
      const disc = await get(`SELECT * FROM discounts WHERE code = ? AND is_active = 1;`, [discount_code.trim().toUpperCase()]);
      if (disc) {
        discountId = disc.id;
        if (disc.type === 'percentage') {
          discountAmount = (subtotal * disc.value) / 100;
        } else {
          discountAmount = Math.min(disc.value, subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    const subRes = await run(
      `INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, status, billing_interval,
        start_date, expiry_date, next_billing_date, payment_terms,
        subtotal, tax_amount, discount_id, discount_amount, total_amount, auto_close, notes
      ) VALUES (?, ?, ?, 'Confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        subNumber,
        targetCustomerId,
        plan_id,
        effectiveInterval,
        effectiveStart,
        expiry_date,
        effectiveStart,
        payment_terms,
        subtotal,
        taxAmount,
        discountId,
        discountAmount,
        totalAmount,
        auto_close !== undefined ? (auto_close ? 1 : 0) : plan.auto_close_on_expiry,
        notes || null
      ]
    );

    for (const it of items) {
      const lineTotal = Number(it.quantity) * Number(it.unit_price);
      await run(
        `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [subRes.id, it.product_id, it.variant_id || null, it.quantity, it.unit_price, it.tax_rate || 0, lineTotal]
      );
    }

    res.status(201).json({
      message: 'Subscription created successfully',
      subscriptionId: subRes.id,
      subscriptionNumber: subNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription.' });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    await run(`UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [status, req.params.id]);
    res.json({ message: `Subscription status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscription status.' });
  }
};

export const pauseSubscription = async (req, res) => {
  try {
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
    if (sub.status !== 'Active') return res.status(400).json({ error: 'Only Active subscriptions can be paused.' });

    await run(`UPDATE subscriptions SET status = 'Paused', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [req.params.id]);
    res.json({ message: 'Subscription paused successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause subscription.' });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
    if (sub.status !== 'Paused') return res.status(400).json({ error: 'Only Paused subscriptions can be resumed.' });

    await run(`UPDATE subscriptions SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [req.params.id]);
    res.json({ message: 'Subscription resumed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resume subscription.' });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Extend expiry date by 1 year from current expiry or today
    const currentExp = sub.expiry_date ? new Date(sub.expiry_date) : new Date();
    currentExp.setFullYear(currentExp.getFullYear() + 1);
    const newExpiry = currentExp.toISOString().split('T')[0];

    await run(
      `UPDATE subscriptions
       SET status = 'Active',
           expiry_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [newExpiry, req.params.id]
    );

    res.json({ message: `Subscription renewed until ${newExpiry}.`, newExpiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to renew subscription.' });
  }
};

export const closeSubscription = async (req, res) => {
  try {
    await run(`UPDATE subscriptions SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [req.params.id]);
    res.json({ message: 'Subscription closed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close subscription.' });
  }
};

