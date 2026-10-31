import { run, get, query, getNextSequenceNumber } from '../config/db.js';
import { getNextBillingDate } from '../services/billingEngine.js';

export const getTemplates = async (req, res) => {
  try {
    const templates = await query(`
      SELECT qt.*, p.name as plan_name, p.billing_interval,
             (SELECT COUNT(*) FROM quotation_template_items qti WHERE qti.template_id = qt.id) as item_count
      FROM quotation_templates qt
      LEFT JOIN plans p ON qt.plan_id = p.id
      ORDER BY qt.id DESC;
    `);

    // Fetch items for each template
    const items = await query(`
      SELECT qti.*, p.name as product_name, pv.variant_name, t.name as tax_name, t.rate_percent as tax_rate
      FROM quotation_template_items qti
      JOIN products p ON qti.product_id = p.id
      LEFT JOIN product_variants pv ON qti.variant_id = pv.id
      LEFT JOIN taxes t ON qti.tax_id = t.id;
    `);

    const fullTemplates = templates.map((t) => ({
      ...t,
      items: items.filter((i) => i.template_id === t.id)
    }));

    res.json({ templates: fullTemplates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotation templates.' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { name, plan_id, validity_days, notes, items } = req.body;
    if (!name) return res.status(400).json({ error: 'Template name is required.' });

    const result = await run(
      `INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
       VALUES (?, ?, ?, ?);`,
      [name.trim(), plan_id || null, Number(validity_days || 30), notes || null]
    );

    if (Array.isArray(items)) {
      for (const item of items) {
        await run(
          `INSERT INTO quotation_template_items (template_id, product_id, variant_id, quantity, unit_price, tax_id)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [result.id, item.product_id, item.variant_id || null, Number(item.quantity || 1), Number(item.unit_price || 0), item.tax_id || null]
        );
      }
    }

    res.status(201).json({ message: 'Quotation template created successfully', templateId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quotation template.' });
  }
};

export const getQuotations = async (req, res) => {
  try {
    let sql = `
      SELECT q.*, u.name as customer_name, u.email as customer_email, u.company_name,
             p.name as plan_name, p.billing_interval
      FROM quotations q
      JOIN users u ON q.customer_id = u.id
      JOIN plans p ON q.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Isolation check: customers only see quotations intended for them
    if (req.user && req.user.role === 'customer') {
      sql += ` AND q.customer_id = ?`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY q.id DESC;`;

    const quotations = await query(sql, params);

    // Fetch items for quotations
    const qIds = quotations.map((q) => q.id);
    let items = [];
    if (qIds.length > 0) {
      items = await query(`
        SELECT qi.*, p.name as product_name, pv.variant_name
        FROM quotation_items qi
        JOIN products p ON qi.product_id = p.id
        LEFT JOIN product_variants pv ON qi.variant_id = pv.id
        WHERE qi.quotation_id IN (${qIds.map(() => '?').join(',')});
      `, qIds);
    }

    const fullQuotations = quotations.map((q) => ({
      ...q,
      items: items.filter((it) => it.quotation_id === q.id)
    }));

    res.json({ quotations: fullQuotations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotations.' });
  }
};

export const createQuotation = async (req, res) => {
  try {
    const { customer_id, plan_id, validity_days = 15, items = [], notes } = req.body;
    if (!customer_id || !plan_id || items.length === 0) {
      return res.status(400).json({ error: 'Customer, plan, and at least one item are required.' });
    }

    const quoteNumber = await getNextSequenceNumber('QT', 'quotations', 'quotation_number', 4);

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + Number(validity_days));
    const validUntil = validUntilDate.toISOString().split('T')[0];

    let subtotal = 0;
    let taxAmount = 0;

    for (const it of items) {
      const lineSub = Number(it.quantity) * Number(it.unit_price);
      subtotal += lineSub;
      taxAmount += (lineSub * Number(it.tax_rate || 0)) / 100;
    }
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const result = await run(
      `INSERT INTO quotations (
        quotation_number, customer_id, plan_id, valid_until, status,
        subtotal, tax_amount, discount_amount, total_amount, notes
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, 0, ?, ?);`,
      [quoteNumber, customer_id, plan_id, validUntil, subtotal, taxAmount, totalAmount, notes || null]
    );

    for (const it of items) {
      const lineTotal = Number(it.quantity) * Number(it.unit_price);
      await run(
        `INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [result.id, it.product_id, it.variant_id || null, it.quantity, it.unit_price, it.tax_rate || 0, lineTotal]
      );
    }

    res.status(201).json({ message: 'Quotation created successfully', quotationId: result.id, quotationNumber: quoteNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create quotation.' });
  }
};

export const convertQuotationToSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await get(`SELECT * FROM quotations WHERE id = ?;`, [id]);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found.' });

    // Customer tenant isolation
    if (req.user.role === 'customer' && quotation.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You cannot convert another customer\'s quotation.' });
    }

    // Guard against duplicate conversion
    if (quotation.status === 'converted') {
      return res.status(400).json({ error: `Quotation ${quotation.quotation_number} has already been converted into a subscription.` });
    }

    const plan = await get(`SELECT * FROM plans WHERE id = ?;`, [quotation.plan_id]);
    const items = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?;`, [id]);

    const subNumber = await getNextSequenceNumber('SUB', 'subscriptions', 'subscription_number', 3);

    const startDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year default
    const periodEnd = getNextBillingDate(startDate, plan.billing_interval);
    const nextBilling = periodEnd;

    const subRes = await run(
      `INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, status, billing_interval,
        start_date, expiry_date, next_billing_date, payment_terms,
        subtotal, tax_amount, discount_amount, total_amount, auto_close, notes
      ) VALUES (?, ?, ?, 'Confirmed', ?, ?, ?, ?, 'Immediate', ?, ?, ?, ?, ?, ?);`,
      [
        subNumber,
        quotation.customer_id,
        quotation.plan_id,
        plan.billing_interval,
        startDate,
        expiryDate.toISOString().split('T')[0],
        nextBilling,
        quotation.subtotal,
        quotation.tax_amount,
        quotation.discount_amount,
        quotation.total_amount,
        plan.auto_close_on_expiry,
        `Converted from Quotation ${quotation.quotation_number}`
      ]
    );

    for (const it of items) {
      await run(
        `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [subRes.id, it.product_id, it.variant_id, it.quantity, it.unit_price, it.tax_rate, it.line_total]
      );
    }

    // Automatically generate the initial invoice for this confirmed subscription
    const invNumber = await getNextSequenceNumber('INV', 'invoices', 'invoice_number', 4);

    const invRes = await run(
      `INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
        total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?);`,
      [
        invNumber, subRes.id, quotation.customer_id, startDate, startDate,
        startDate, periodEnd, quotation.subtotal, quotation.tax_amount, quotation.discount_amount,
        quotation.total_amount, `Initial invoice from converted quotation ${quotation.quotation_number}`
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
        [invRes.id, it.product_id, p?.name || 'Product', vName, it.quantity, it.unit_price, it.tax_rate, it.line_total]
      );
    }

    // Mark quotation as converted
    await run(`UPDATE quotations SET status = 'converted' WHERE id = ?;`, [id]);

    res.json({
      message: `Quotation ${quotation.quotation_number} converted successfully into Subscription ${subNumber} and initial invoice ${invNumber} generated.`,
      subscriptionId: subRes.id,
      subscriptionNumber: subNumber,
      invoiceId: invRes.id,
      invoiceNumber: invNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to convert quotation to subscription.' });
  }
};

