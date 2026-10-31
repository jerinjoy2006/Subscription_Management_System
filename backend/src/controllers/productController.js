import { run, get, query } from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const products = await query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count
      FROM products p
      ORDER BY p.id ASC;
    `);

    // Fetch variants for each product
    const variants = await query(`SELECT * FROM product_variants ORDER BY id ASC;`);
    const productsWithVariants = products.map((prod) => ({
      ...prod,
      variants: variants.filter((v) => v.product_id === prod.id)
    }));

    res.json({ products: productsWithVariants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await get(`SELECT * FROM products WHERE id = ?;`, [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const variants = await query(`SELECT * FROM product_variants WHERE product_id = ?;`, [product.id]);
    res.json({ product: { ...product, variants } });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product.' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, type, sales_price, cost_price, notes, variants } = req.body;
    if (!name || sales_price === undefined) {
      return res.status(400).json({ error: 'Product name and sales price are required.' });
    }

    const result = await run(
      `INSERT INTO products (name, type, sales_price, cost_price, notes)
       VALUES (?, ?, ?, ?, ?);`,
      [name.trim(), type || 'Software', Number(sales_price), Number(cost_price || 0), notes || null]
    );

    // Insert variants if provided
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.variant_name) {
          await run(
            `INSERT INTO product_variants (product_id, variant_name, additional_price, sku)
             VALUES (?, ?, ?, ?);`,
            [result.id, v.variant_name, Number(v.additional_price || 0), v.sku || null]
          );
        }
      }
    }

    res.status(201).json({ message: 'Product created successfully', productId: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, type, sales_price, cost_price, notes, is_active } = req.body;
    await run(
      `UPDATE products
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           sales_price = COALESCE(?, sales_price),
           cost_price = COALESCE(?, cost_price),
           notes = COALESCE(?, notes),
           is_active = COALESCE(?, is_active)
       WHERE id = ?;`,
      [name, type, sales_price, cost_price, notes, is_active, req.params.id]
    );
    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

export const addVariant = async (req, res) => {
  try {
    const { variant_name, additional_price, sku } = req.body;
    if (!variant_name) {
      return res.status(400).json({ error: 'Variant name is required.' });
    }
    const result = await run(
      `INSERT INTO product_variants (product_id, variant_name, additional_price, sku)
       VALUES (?, ?, ?, ?);`,
      [req.params.id, variant_name, Number(additional_price || 0), sku || null]
    );
    res.status(201).json({ message: 'Variant added successfully', variantId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add variant.' });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    await run(`DELETE FROM product_variants WHERE id = ?;`, [req.params.variantId]);
    res.json({ message: 'Variant deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete variant.' });
  }
};

