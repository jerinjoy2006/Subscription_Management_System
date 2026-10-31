import { run, get, query, getNextSequenceNumber } from '../config/db.js';
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

    // Generate collision-proof subscription number
    const subNumber = await getNextSequenceNumber('SUB', 'subscriptions', 'subscription_number', 3);

    const effectiveInterval = billing_interval || plan.billing_interval;
    const effectiveStart = start_date || new Date().toISOString().split('T')[0];

    // Compute expiry (1 year default or cadence-based horizon)
    const expDate = new Date(effectiveStart);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const expiry_date = expDate.toISOString().split('T')[0];

    // Calculate line items subtotal and weighted tax rate
    let subtotal = 0;
    let rawTaxSum = 0;
    for (const it of items) {
      const lineSub = Number(it.quantity) * Number(it.unit_price);
      subtotal += lineSub;
      rawTaxSum += (lineSub * Number(it.tax_rate || 0)) / 100;
    }

    // Check discount eligibility
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

    // Tax is calculated on taxable amount after discounts (statutory GST rules)
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const effectiveTaxRate = subtotal > 0 ? (rawTaxSum / subtotal) : 0;
    const taxAmount = Math.round(taxableAmount * effectiveTaxRate * 100) / 100;
    const totalAmount = Math.max(0, Math.round((taxableAmount + taxAmount) * 100) / 100);

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

    // Save line items
    for (const it of items) {
      const lineTotal = Number(it.quantity) * Number(it.unit_price);
      await run(
        `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [subRes.id, it.product_id, it.variant_id || null, it.quantity, it.unit_price, it.tax_rate || 0, lineTotal]
      );
    }

    // Automatically generate the initial invoice for immediate settlement
    const periodEnd = getNextBillingDate(effectiveStart, effectiveInterval);
    const invNumber = await getNextSequenceNumber('INV', 'invoices', 'invoice_number', 4);

    let daysToAdd = 15;
    if (payment_terms === 'Immediate') daysToAdd = 0;
    else if (payment_terms === 'Net 30') daysToAdd = 30;

    const dueDateObj = new Date(effectiveStart);
    dueDateObj.setDate(dueDateObj.getDate() + daysToAdd);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const invRes = await run(
      `INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
        total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?);`,
      [
        invNumber, subRes.id, targetCustomerId, effectiveStart, dueDate,
        effectiveStart, periodEnd, subtotal, taxAmount, discountAmount,
        totalAmount, `Initial invoice for ${subNumber}`
      ]
    );

    for (const it of items) {
      const p = await get(`SELECT name FROM products WHERE id = ?;`, [it.product_id]);
      let vName = null;
      if (it.variant_id) {
        const v = await get(`SELECT variant_name FROM product_variants WHERE id = ?;`, [it.variant_id]);
        vName = v?.variant_name || null;
      }
      await run(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name, variant_name, quantity, unit_price, tax_rate, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [invRes.id, it.product_id, p?.name || 'Product', vName, it.quantity, it.unit_price, it.tax_rate || 0, Number(it.quantity) * Number(it.unit_price)]
      );
    }

    res.status(201).json({
      message: 'Subscription created successfully and initial invoice generated.',
      subscriptionId: subRes.id,
      subscriptionNumber: subNumber,
      invoiceId: invRes.id,
      invoiceNumber: invNumber
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

    // Isolation check: customer can only pause their own subscription
    if (req.user && req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
    }

    if (sub.status !== 'Active') return res.status(400).json({ error: 'Only Active subscriptions can be paused.' });

    // Check plan governance
    const plan = await get(`SELECT can_pause FROM plans WHERE id = ?;`, [sub.plan_id]);
    if (plan && plan.can_pause === 0) {
      return res.status(400).json({ error: 'This subscription plan does not permit pausing.' });
    }

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

    // Isolation check
    if (req.user && req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
    }

    if (sub.status !== 'Paused') return res.status(400).json({ error: 'Only Paused subscriptions can be resumed.' });

    // If next billing date was in the past while paused, reset to today
    const today = new Date().toISOString().split('T')[0];
    let nextBilling = sub.next_billing_date;
    if (sub.next_billing_date && sub.next_billing_date < today) {
      nextBilling = today;
    }

    await run(
      `UPDATE subscriptions SET status = 'Active', next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
      [nextBilling, req.params.id]
    );
    res.json({ message: 'Subscription resumed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resume subscription.' });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Isolation check
    if (req.user && req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
    }

    // Check plan governance
    const plan = await get(`SELECT can_renew, billing_interval FROM plans WHERE id = ?;`, [sub.plan_id]);
    if (plan && plan.can_renew === 0) {
      return res.status(400).json({ error: 'This subscription plan does not permit renewals.' });
    }

    // Cadence-aware extension
    const currentExp = sub.expiry_date ? new Date(sub.expiry_date) : new Date();
    const interval = sub.billing_interval || plan?.billing_interval || 'monthly';
    switch (interval.toLowerCase()) {
      case 'daily':
        currentExp.setDate(currentExp.getDate() + 30);
        break;
      case 'weekly':
        currentExp.setDate(currentExp.getDate() + 28);
        break;
      case 'monthly':
        currentExp.setMonth(currentExp.getMonth() + 1);
        break;
      case 'yearly':
        currentExp.setFullYear(currentExp.getFullYear() + 1);
        break;
      default:
        currentExp.setFullYear(currentExp.getFullYear() + 1);
    }
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
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Isolation check
    if (req.user && req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
    }

    // Check plan governance for customers
    if (req.user && req.user.role === 'customer') {
      const plan = await get(`SELECT can_close_early FROM plans WHERE id = ?;`, [sub.plan_id]);
      if (plan && plan.can_close_early === 0) {
        return res.status(400).json({ error: 'This plan does not permit early cancellation by customers. Please contact staff.' });
      }
    }

    await run(`UPDATE subscriptions SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [req.params.id]);
    res.json({ message: 'Subscription closed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close subscription.' });
  }
};

export const generateInvoiceForSubscription = async (req, res) => {
  try {
    const sub = await get(`SELECT * FROM subscriptions WHERE id = ?;`, [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
    if (sub.status === 'Closed') return res.status(400).json({ error: 'Cannot invoice a closed subscription.' });

    const periodStart = sub.next_billing_date || new Date().toISOString().split('T')[0];
    const periodEnd = getNextBillingDate(periodStart, sub.billing_interval);

    // Duplicate billing prevention check
    const existingInvoice = await get(
      `SELECT id, invoice_number FROM invoices WHERE subscription_id = ? AND billing_period_start = ? AND status != 'Cancelled' LIMIT 1;`,
      [sub.id, periodStart]
    );
    if (existingInvoice) {
      return res.status(400).json({
        error: `An active invoice (${existingInvoice.invoice_number}) already exists for period starting ${periodStart}.`
      });
    }

    let daysToAdd = 15;
    if (sub.payment_terms === 'Immediate') daysToAdd = 0;
    else if (sub.payment_terms === 'Net 30') daysToAdd = 30;

    const dueDateObj = new Date(periodStart);
    dueDateObj.setDate(dueDateObj.getDate() + daysToAdd);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const items = await query(
      `SELECT si.*, p.name as product_name, pv.variant_name
       FROM subscription_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN product_variants pv ON si.variant_id = pv.id
       WHERE si.subscription_id = ?;`,
      [sub.id]
    );

    const invNum = await getNextSequenceNumber('INV', 'invoices', 'invoice_number', 4);
    const invRes = await run(
      `INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
        total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?);`,
      [
        invNum, sub.id, sub.customer_id, periodStart, dueDate,
        periodStart, periodEnd, sub.subtotal, sub.tax_amount, sub.discount_amount,
        sub.total_amount, `Generated on-demand invoice for ${sub.subscription_number}`
      ]
    );

    for (const it of items) {
      await run(
        `INSERT INTO invoice_items (
          invoice_id, product_id, product_name, variant_name, quantity, unit_price, tax_rate, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [invRes.id, it.product_id, it.product_name, it.variant_name || null, it.quantity, it.unit_price, it.tax_rate, it.line_total]
      );
    }

    // Advance subscription next_billing_date
    await run(`UPDATE subscriptions SET next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [periodEnd, sub.id]);

    res.status(201).json({
      message: `Invoice ${invNum} generated successfully.`,
      invoiceId: invRes.id,
      invoiceNumber: invNum
    });
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
};

