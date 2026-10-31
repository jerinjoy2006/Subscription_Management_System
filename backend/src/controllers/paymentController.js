import { run, get, query } from '../config/db.js';

export const getPayments = async (req, res) => {
  try {
    const { customer_id, invoice_id, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT p.*, i.invoice_number, u.name as customer_name, u.email as customer_email
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN users u ON p.customer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user && req.user.role === 'customer') {
      sql += ` AND p.customer_id = ?`;
      params.push(req.user.id);
    } else if (customer_id) {
      sql += ` AND p.customer_id = ?`;
      params.push(customer_id);
    }

    if (invoice_id) {
      sql += ` AND p.invoice_id = ?`;
      params.push(invoice_id);
    }

    sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?;`;
    params.push(Number(limit), Number(offset));

    const payments = await query(sql, params);
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const {
      invoice_id,
      amount,
      payment_method = 'UPI',
      notes,
      transaction_ref
    } = req.body;

    if (!invoice_id || amount === undefined) {
      return res.status(400).json({ error: 'Invoice ID and amount are required.' });
    }

    const invoice = await get(`SELECT * FROM invoices WHERE id = ?;`, [invoice_id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    // Isolation check
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to pay for this invoice.' });
    }

    const countRow = await get(`SELECT COUNT(*) as count FROM payments;`);
    const payNumber = `PAY-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const generatedRef = transaction_ref || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

    const payRes = await run(
      `INSERT INTO payments (
        payment_number, invoice_id, customer_id, amount, payment_method, payment_date, notes, status, transaction_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Success', ?);`,
      [
        payNumber,
        invoice.id,
        invoice.customer_id,
        Number(amount),
        payment_method,
        today,
        notes || `Payment for ${invoice.invoice_number}`,
        generatedRef
      ]
    );

    // Update invoice status to 'Paid'
    await run(`UPDATE invoices SET status = 'Paid' WHERE id = ?;`, [invoice.id]);

    // Also update parent subscription status to Active if it was Confirmed
    await run(`UPDATE subscriptions SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?;`, [invoice.subscription_id]);

    res.status(201).json({
      message: 'Payment recorded successfully! Invoice has been marked as Paid.',
      payment: {
        id: payRes.id,
        paymentNumber: payNumber,
        invoiceNumber: invoice.invoice_number,
        amount: Number(amount),
        method: payment_method,
        transactionRef: generatedRef,
        date: today
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
};
