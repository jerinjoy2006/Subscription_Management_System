import { run, get, query } from '../config/db.js';

export const getTaxes = async (req, res) => {
  try {
    const taxes = await query(`SELECT * FROM taxes ORDER BY id ASC;`);
    res.json({ taxes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch taxes.' });
  }
};

export const createTax = async (req, res) => {
  try {
    const { name, rate_percent } = req.body;
    if (!name || rate_percent === undefined) {
      return res.status(400).json({ error: 'Tax name and percentage rate are required.' });
    }
    const result = await run(
      `INSERT INTO taxes (name, rate_percent) VALUES (?, ?);`,
      [name.trim(), Number(rate_percent)]
    );
    res.status(201).json({ message: 'Tax rule created successfully', taxId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tax rule.' });
  }
};

export const updateTax = async (req, res) => {
  try {
    const { name, rate_percent, is_active } = req.body;
    await run(
      `UPDATE taxes
       SET name = COALESCE(?, name),
           rate_percent = COALESCE(?, rate_percent),
           is_active = COALESCE(?, is_active)
       WHERE id = ?;`,
      [name, rate_percent, is_active, req.params.id]
    );
    res.json({ message: 'Tax rule updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tax rule.' });
  }
};

