import { run, get, query } from '../config/db.js';

export const getDiscounts = async (req, res) => {
  try {
    const discounts = await query(`
      SELECT d.*, p.name as product_name
      FROM discounts d
      LEFT JOIN products p ON d.product_id = p.id
      ORDER BY d.id DESC;
    `);
    res.json({ discounts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discounts.' });
  }
};

export const createDiscount = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      min_quantity,
      min_purchase_amount,
      start_date,
      end_date,
      max_usage_limit,
      applicable_to,
      product_id
    } = req.body;

    if (!code || !name || value === undefined) {
      return res.status(400).json({ error: 'Discount code, name, and value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await get(`SELECT id FROM discounts WHERE code = ?;`, [cleanCode]);
    if (existing) {
      return res.status(400).json({ error: 'A discount with this coupon code already exists.' });
    }

    const result = await run(
      `INSERT INTO discounts (
        code, name, type, value, min_quantity, min_purchase_amount,
        start_date, end_date, max_usage_limit, applicable_to, product_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        cleanCode,
        name.trim(),
        type || 'percentage',
        Number(value),
        Number(min_quantity || 0),
        Number(min_purchase_amount || 0),
        start_date || new Date().toISOString().split('T')[0],
        end_date || null,
        Number(max_usage_limit || 100),
        applicable_to || 'all',
        product_id || null
      ]
    );

    res.status(201).json({ message: 'Discount rule created successfully', discountId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create discount rule.' });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { name, type, value, min_quantity, min_purchase_amount, start_date, end_date, max_usage_limit, is_active } = req.body;
    await run(
      `UPDATE discounts
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           value = COALESCE(?, value),
           min_quantity = COALESCE(?, min_quantity),
           min_purchase_amount = COALESCE(?, min_purchase_amount),
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           max_usage_limit = COALESCE(?, max_usage_limit),
           is_active = COALESCE(?, is_active)
       WHERE id = ?;`,
      [name, type, value, min_quantity, min_purchase_amount, start_date, end_date, max_usage_limit, is_active, req.params.id]
    );
    res.json({ message: 'Discount updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update discount.' });
  }
};

export const validateDiscount = async (req, res) => {
  try {
    const { code, quantity = 1, amount = 0, product_id } = req.body;
    if (!code) return res.status(400).json({ error: 'Discount code is required.' });

    const disc = await get(`SELECT * FROM discounts WHERE code = ? AND is_active = 1;`, [code.trim().toUpperCase()]);
    if (!disc) {
      return res.status(404).json({ valid: false, error: 'Discount coupon code not found or inactive.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (disc.start_date && disc.start_date > today) {
      return res.status(400).json({ valid: false, error: 'Coupon is not yet active.' });
    }
    if (disc.end_date && disc.end_date < today) {
      return res.status(400).json({ valid: false, error: 'Coupon has expired.' });
    }
    if (disc.max_usage_limit && disc.current_usage_count >= disc.max_usage_limit) {
      return res.status(400).json({ valid: false, error: 'Coupon usage limit has been reached.' });
    }
    if (disc.min_quantity && quantity < disc.min_quantity) {
      return res.status(400).json({ valid: false, error: `Requires a minimum quantity of ${disc.min_quantity}.` });
    }
    if (disc.min_purchase_amount && amount < disc.min_purchase_amount) {
      return res.status(400).json({ valid: false, error: `Requires a minimum order value of ₹${disc.min_purchase_amount}.` });
    }

    let calculatedDiscount = 0;
    if (disc.type === 'percentage') {
      calculatedDiscount = (amount * disc.value) / 100;
    } else {
      calculatedDiscount = Math.min(disc.value, amount);
    }

    res.json({
      valid: true,
      discount: disc,
      discountAmount: calculatedDiscount,
      message: `Coupon ${disc.code} applied! You save ₹${calculatedDiscount.toLocaleString()}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Error validating coupon.' });
  }
};

