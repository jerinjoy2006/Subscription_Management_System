import { run, get, query, getNextSequenceNumber } from '../config/db.js';

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

    if (!invoice_id || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invoice ID and a positive payment amount are required.' });
    }

    const invoice = await get(`SELECT * FROM invoices WHERE id = ?;`, [invoice_id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    // Isolation check
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to pay for this invoice.' });
    }

    // Check if invoice is already settled
    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: `Invoice ${invoice.invoice_number} is already fully paid.` });
    }

    if (invoice.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot record payment for cancelled invoice ${invoice.invoice_number}.` });
    }

    // Check existing settled payments for this invoice
    const existingPayments = await get(
      `SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = ? AND status = 'Success';`,
      [invoice.id]
    );
    const totalPaidBefore = Number(existingPayments?.paid || 0);
    const outstanding = Math.max(0, invoice.total_amount - totalPaidBefore);

    if (outstanding <= 0.01) {
      // Mark as Paid if not already
      await run(`UPDATE invoices SET status = 'Paid' WHERE id = ?;`, [invoice.id]);
      return res.status(400).json({ error: `Invoice ${invoice.invoice_number} has zero remaining balance.` });
    }

    // Amount to apply (cannot exceed outstanding balance)
    const paymentAmount = Math.min(Number(amount), outstanding);

    // Normalize payment method to meet schema CHECK constraint
    const METHOD_MAP = {
      'credit_card': 'Credit Card',
      'credit card': 'Credit Card',
      'debit_card': 'Debit Card',
      'debit card': 'Debit Card',
      'upi': 'UPI',
      'net_banking': 'Net Banking',
      'net banking': 'Net Banking',
      'bank_transfer': 'Bank Transfer',
      'bank transfer': 'Bank Transfer',
      'cash': 'Cash'
    };
    const normalizedMethod = METHOD_MAP[String(payment_method).toLowerCase().trim()] || 'UPI';

    const payRes = await run(
      `INSERT INTO payments (
        payment_number, invoice_id, customer_id, amount, payment_method, payment_date, notes, status, transaction_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Success', ?);`,
      [
        payNumber,
        invoice.id,
        invoice.customer_id,
        paymentAmount,
        normalizedMethod,
        today,
        notes || `Payment for ${invoice.invoice_number}`,
        generatedRef
      ]
    );
        payment_method,
        today,
        notes || `Payment for ${invoice.invoice_number}`,
        generatedRef
      ]
    );

    // If fully paid, update invoice status
    const newTotalPaid = totalPaidBefore + paymentAmount;
    if (newTotalPaid >= invoice.total_amount - 0.01) {
      await run(`UPDATE invoices SET status = 'Paid' WHERE id = ?;`, [invoice.id]);
    }

    // Activate parent subscription if it was Confirmed
    await run(
      `UPDATE subscriptions SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'Confirmed';`,
      [invoice.subscription_id]
    );

    res.status(201).json({
      message: newTotalPaid >= invoice.total_amount - 0.01
        ? `Payment recorded successfully! Invoice ${invoice.invoice_number} is now marked as Paid.`
        : `Partial payment of ₹${paymentAmount.toLocaleString()} recorded. Remaining balance: ₹${(invoice.total_amount - newTotalPaid).toLocaleString()}.`,
      payment: {
        id: payRes.id,
        paymentNumber: payNumber,
        invoiceNumber: invoice.invoice_number,
        amount: paymentAmount,
        method: payment_method,
        transactionRef: generatedRef,
        date: today,
        remainingBalance: Math.max(0, invoice.total_amount - newTotalPaid)
      }
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
};

