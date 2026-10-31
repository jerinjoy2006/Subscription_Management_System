import { run, get, query } from '../config/db.js';

export const getInvoices = async (req, res) => {
  try {
    const { status, customer_id, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name,
             s.subscription_number,
             (SELECT COUNT(*) FROM payments p WHERE p.invoice_id = i.id AND p.status = 'Success') as payment_count
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      JOIN subscriptions s ON i.subscription_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Customer role isolation
    if (req.user && req.user.role === 'customer') {
      sql += ` AND i.customer_id = ?`;
      params.push(req.user.id);
    } else if (customer_id) {
      sql += ` AND i.customer_id = ?`;
      params.push(customer_id);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (i.invoice_number LIKE ? OR u.name LIKE ? OR s.subscription_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY i.id DESC LIMIT ? OFFSET ?;`;
    params.push(Number(limit), Number(offset));

    const invoices = await query(sql, params);
    res.json({ invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await get(
      `SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name, u.phone as customer_phone,
              s.subscription_number, s.billing_interval, s.payment_terms
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       JOIN subscriptions s ON i.subscription_id = s.id
       WHERE i.id = ?;`,
      [req.params.id]
    );

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (req.user && req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const items = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC;`,
      [invoice.id]
    );

    const payments = await query(
      `SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC;`,
      [invoice.id]
    );

    res.json({
      invoice: {
        ...invoice,
        items,
        payments
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoice details.' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Confirmed', 'Paid', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    await run(`UPDATE invoices SET status = ? WHERE id = ?;`, [status, req.params.id]);
    res.json({ message: `Invoice status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice.' });
  }
};

export const sendInvoice = async (req, res) => {
  try {
    const invoice = await get(`SELECT id, invoice_number, customer_id FROM invoices WHERE id = ?;`, [req.params.id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const now = new Date().toISOString();
    await run(`UPDATE invoices SET sent_at = ? WHERE id = ?;`, [now, invoice.id]);

    res.json({
      message: `Invoice ${invoice.invoice_number} sent to customer's registered email address.`,
      sentAt: now
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invoice.' });
  }
};
