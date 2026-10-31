import { run, get, query } from '../config/db.js';

export const getPlans = async (req, res) => {
  try {
    const plans = await query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'Active') as active_subscriber_count
      FROM plans p
      ORDER BY p.id ASC;
    `);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await get(`SELECT * FROM plans WHERE id = ?;`, [req.params.id]);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching plan.' });
  }
};

export const createPlan = async (req, res) => {
  try {
    const {
      name,
      billing_interval,
      price,
      minimum_quantity,
      start_date,
      end_date,
      auto_close_on_expiry,
      can_pause,
      can_renew,
      can_close_early,
      description
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Plan name and price are required.' });
    }

    const result = await run(
      `INSERT INTO plans (
        name, billing_interval, price, minimum_quantity, start_date, end_date,
        auto_close_on_expiry, can_pause, can_renew, can_close_early, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        name.trim(),
        billing_interval || 'monthly',
        Number(price),
        Number(minimum_quantity || 1),
        start_date || new Date().toISOString().split('T')[0],
        end_date || null,
        auto_close_on_expiry ? 1 : 0,
        can_pause !== undefined ? (can_pause ? 1 : 0) : 1,
        can_renew !== undefined ? (can_renew ? 1 : 0) : 1,
        can_close_early !== undefined ? (can_close_early ? 1 : 0) : 1,
        description || null
      ]
    );

    res.status(201).json({ message: 'Plan created successfully', planId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create plan.' });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const {
      name,
      billing_interval,
      price,
      minimum_quantity,
      start_date,
      end_date,
      auto_close_on_expiry,
      can_pause,
      can_renew,
      can_close_early,
      description,
      is_active
    } = req.body;

    await run(
      `UPDATE plans
       SET name = COALESCE(?, name),
           billing_interval = COALESCE(?, billing_interval),
           price = COALESCE(?, price),
           minimum_quantity = COALESCE(?, minimum_quantity),
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           auto_close_on_expiry = COALESCE(?, auto_close_on_expiry),
           can_pause = COALESCE(?, can_pause),
           can_renew = COALESCE(?, can_renew),
           can_close_early = COALESCE(?, can_close_early),
           description = COALESCE(?, description),
           is_active = COALESCE(?, is_active)
       WHERE id = ?;`,
      [
        name, billing_interval, price, minimum_quantity, start_date, end_date,
        auto_close_on_expiry, can_pause, can_renew, can_close_early, description,
        is_active, req.params.id
      ]
    );

    res.json({ message: 'Plan updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan.' });
  }
};

