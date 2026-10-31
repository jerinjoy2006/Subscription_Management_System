import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { run, get, query } from '../config/db.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { validatePassword, validateEmail } from '../middleware/validator.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, company_name, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    const existing = await get(`SELECT id FROM users WHERE email = ?;`, [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone)
       VALUES (?, ?, ?, 'customer', ?, ?);`,
      [name.trim(), email.toLowerCase().trim(), password_hash, company_name || null, phone || null]
    );

    const user = {
      id: result.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'customer',
      company_name
    };

    const token = generateToken(user);
    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error while registering user.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await get(
      `SELECT id, name, email, password_hash, role, company_name, phone FROM users WHERE email = ?;`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_name: user.company_name,
      phone: user.phone
    };

    const token = generateToken(safeUser);
    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await get(
      `SELECT id, name, email, role, company_name, phone, created_at FROM users WHERE id = ?;`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await get(`SELECT id, email FROM users WHERE email = ?;`, [email.toLowerCase().trim()]);
    if (!user) {
      // Don't leak user existence for security, but return simulated success
      return res.json({ message: 'If the email exists, a password reset link has been dispatched.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await run(
      `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?;`,
      [token, expiry, user.id]
    );

    // In a real email service this sends an email. For hackathon demo, we also return the token/link so it can be demonstrated immediately!
    res.json({
      message: 'Password reset link sent to your registered email.',
      resetLink: `/reset-password?token=${token}`,
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Error processing forgot password request.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    const now = new Date().toISOString();
    const user = await get(
      `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?;`,
      [token, now]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await run(
      `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?;`,
      [password_hash, user.id]
    );

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Error resetting password.' });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    const existing = await get(`SELECT id FROM users WHERE email = ?;`, [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone)
       VALUES (?, ?, ?, 'staff', 'Brightloop Operations', ?);`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null]
    );

    res.status(201).json({
      message: 'Staff member added successfully',
      staff: { id: result.id, name, email, role: 'staff', phone }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff member.' });
  }
};

export const listStaff = async (req, res) => {
  try {
    const staffList = await query(
      `SELECT id, name, email, role, phone, created_at FROM users WHERE role = 'staff' ORDER BY id DESC;`
    );
    res.json({ staff: staffList });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve staff list.' });
  }
};

export const listCustomers = async (req, res) => {
  try {
    const customers = await query(
      `SELECT u.id, u.name, u.email, u.company_name, u.phone, u.created_at,
              COUNT(DISTINCT s.id) as subscription_count,
              SUM(CASE WHEN s.status = 'Active' THEN 1 ELSE 0 END) as active_subscriptions,
              COALESCE(SUM(p.amount), 0) as total_spent
       FROM users u
       LEFT JOIN subscriptions s ON s.customer_id = u.id
       LEFT JOIN payments p ON p.customer_id = u.id AND p.status = 'Success'
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC;`
    );
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, email, password, company_name, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }
    const pwd = password || 'Customer@12345!';
    const passCheck = validatePassword(pwd);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }
    const existing = await get(`SELECT id FROM users WHERE email = ?;`, [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const password_hash = await bcrypt.hash(pwd, 10);
    const result = await run(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone)
       VALUES (?, ?, ?, 'customer', ?, ?);`,
      [name.trim(), email.toLowerCase().trim(), password_hash, company_name?.trim() || null, phone?.trim() || null]
    );

    res.status(201).json({
      message: 'Customer account provisioned successfully.',
      customerId: result.id,
      customer: {
        id: result.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'customer',
        company_name: company_name?.trim() || null,
        phone: phone?.trim() || null
      }
    });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer.' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await get(
      `SELECT id, name, email, role, company_name, phone, created_at FROM users WHERE id = ? AND role = 'customer';`,
      [req.params.id]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const subscriptions = await query(
      `SELECT s.*, p.name as plan_name FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.customer_id = ? ORDER BY s.id DESC;`,
      [customer.id]
    );
    const invoices = await query(
      `SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC;`,
      [customer.id]
    );
    const payments = await query(
      `SELECT p.*, i.invoice_number FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE p.customer_id = ? ORDER BY p.id DESC;`,
      [customer.id]
    );

    res.json({
      customer: {
        ...customer,
        subscriptions,
        invoices,
        payments
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer profile.' });
  }
};


