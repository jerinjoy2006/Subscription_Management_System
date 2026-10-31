import { query, get, run } from '../config/db.js';

// Helper to advance date by billing interval
export const getNextBillingDate = (dateStr, interval) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  const next = new Date(date);
  switch (interval?.toLowerCase()) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().split('T')[0];
};

export const runBillingEngine = async (targetDate = new Date().toISOString().split('T')[0]) => {
  console.log(`[BillingEngine] Running billing cycle for date: ${targetDate}`);

  // Fetch all active or confirmed subscriptions due on or before targetDate
  const dueSubscriptions = await query(
    `SELECT s.*, u.name as customer_name, u.email as customer_email, p.name as plan_name, p.auto_close_on_expiry
     FROM subscriptions s
     JOIN users u ON s.customer_id = u.id
     JOIN plans p ON s.plan_id = p.id
     WHERE s.status IN ('Active', 'Confirmed')
       AND (s.next_billing_date <= ? OR s.next_billing_date IS NULL);`,
    [targetDate]
  );

  const results = {
    processed: 0,
    generatedInvoices: [],
    closedSubscriptions: [],
    skipped: []
  };

  for (const sub of dueSubscriptions) {
    // Check if subscription has expired and should auto-close
    if (sub.expiry_date && sub.expiry_date < targetDate) {
      if (sub.auto_close || sub.auto_close_on_expiry) {
        await run(`UPDATE subscriptions SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [sub.id]);
        results.closedSubscriptions.push({ id: sub.id, number: sub.subscription_number, reason: 'Plan expired and auto-close enabled' });
        continue;
      }
    }

    // Determine billing period
    const periodStart = sub.next_billing_date || targetDate;
    const periodEnd = getNextBillingDate(periodStart, sub.billing_interval);

    // Duplicate check: Prevent duplicate billing for the same subscription and period!
    const existingInvoice = await get(
      `SELECT id, invoice_number FROM invoices
       WHERE subscription_id = ?
         AND billing_period_start = ?
         AND status != 'Cancelled' LIMIT 1;`,
      [sub.id, periodStart]
    );

    if (existingInvoice) {
      results.skipped.push({
        id: sub.id,
        number: sub.subscription_number,
        reason: `Invoice ${existingInvoice.invoice_number} already exists for period starting ${periodStart}`
      });
      continue;
    }

    // Fetch subscription items
    const items = await query(
      `SELECT si.*, p.name as product_name, pv.variant_name
       FROM subscription_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN product_variants pv ON si.variant_id = pv.id
       WHERE si.subscription_id = ?;`,
      [sub.id]
    );

    if (items.length === 0) {
      results.skipped.push({ id: sub.id, number: sub.subscription_number, reason: 'No subscription items found' });
      continue;
    }

    // Calculate line items, taxes, discounts
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const lineBase = item.quantity * item.unit_price;
      subtotal += lineBase;
      const lineTax = (lineBase * (item.tax_rate || 0)) / 100;
      taxAmount += lineTax;
    }

    // Check discount applicability
    let discountAmount = 0;
    if (sub.discount_id) {
      const disc = await get(`SELECT * FROM discounts WHERE id = ? AND is_active = 1;`, [sub.discount_id]);
      if (disc) {
        const now = targetDate;
        const validDates = (!disc.start_date || disc.start_date <= now) && (!disc.end_date || disc.end_date >= now);
        const validUsage = !disc.max_usage_limit || disc.current_usage_count < disc.max_usage_limit;

        if (validDates && validUsage) {
          if (disc.type === 'percentage') {
            discountAmount = (subtotal * disc.value) / 100;
          } else {
            discountAmount = Math.min(disc.value, subtotal);
          }
          // Increment discount usage
          await run(`UPDATE discounts SET current_usage_count = current_usage_count + 1 WHERE id = ?;`, [disc.id]);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    // Create Invoice
    const invCount = await get(`SELECT COUNT(*) as count FROM invoices;`);
    const invNum = `INV-${new Date().getFullYear()}-${String(invCount.count + 1).padStart(4, '0')}`;

    // Due date standard: 15 days from issue date
    const dueDateObj = new Date(periodStart);
    dueDateObj.setDate(dueDateObj.getDate() + 15);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const invRes = await run(
      `INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
        total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?);`,
      [
        invNum, sub.id, sub.customer_id, periodStart, dueDate,
        periodStart, periodEnd, subtotal, taxAmount, discountAmount,
        totalAmount, `Automated recurring billing for ${sub.subscription_number}`
      ]
    );

    // Insert invoice items
    for (const item of items) {
      await run(
        `INSERT INTO invoice_items (
          invoice_id, product_id, product_name, variant_name, quantity, unit_price, tax_rate, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          invRes.id, item.product_id, item.product_name, item.variant_name || null,
          item.quantity, item.unit_price, item.tax_rate, item.line_total
        ]
      );
    }

    // Update subscription next_billing_date and status to Active
    await run(
      `UPDATE subscriptions
       SET status = 'Active',
           next_billing_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [periodEnd, sub.id]
    );

    results.generatedInvoices.push({
      invoiceId: invRes.id,
      invoiceNumber: invNum,
      subscriptionNumber: sub.subscription_number,
      customer: sub.customer_name,
      amount: totalAmount,
      periodStart,
      periodEnd
    });
    results.processed++;
  }

  return results;
};

