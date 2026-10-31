import { run, get, query } from '../config/db.js';

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
    const quotations = await query(`
      SELECT q.*, u.name as customer_name, u.email as customer_email, u.company_name,
             p.name as plan_name, p.billing_interval
      FROM quotations q
      JOIN users u ON q.customer_id = u.id
      JOIN plans p ON q.plan_id = p.id
      ORDER BY q.id DESC;
    `);
    res.json({ quotations });
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

    const countRow = await get(`SELECT COUNT(*) as count FROM quotations;`);
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(4, '0')}`;

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
    const totalAmount = subtotal + taxAmount;

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

    const plan = await get(`SELECT * FROM plans WHERE id = ?;`, [quotation.plan_id]);
    const items = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?;`, [id]);

    const countRow = await get(`SELECT COUNT(*) as count FROM subscriptions;`);
    const subNumber = `SUB-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(3, '0')}`;

    const startDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year default
    const nextBilling = startDate;

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

    // Mark quotation as converted
    await run(`UPDATE quotations SET status = 'converted' WHERE id = ?;`, [id]);

    res.json({
      message: `Quotation converted successfully into Subscription ${subNumber}`,
      subscriptionId: subRes.id,
      subscriptionNumber: subNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to convert quotation to subscription.' });
  }
};

