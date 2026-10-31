import { run } from './db.js';

export const initializeDatabase = async () => {
  // Enable foreign keys and WAL mode for high performance concurrency
  await run(`PRAGMA foreign_keys = ON;`);
  await run(`PRAGMA journal_mode = WAL;`);

  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'staff', 'customer')) NOT NULL DEFAULT 'customer',
      company_name TEXT,
      phone TEXT,
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

  // Products table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Software',
      sales_price REAL NOT NULL DEFAULT 0.0,
      cost_price REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Product Variants table (e.g., Odoo Brand variant adds ₹560)
  await run(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      variant_name TEXT NOT NULL,
      additional_price REAL NOT NULL DEFAULT 0.0,
      sku TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);`);

  // Plans table (Daily, Weekly, Monthly, Yearly)
  await run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      billing_interval TEXT CHECK(billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL DEFAULT 'monthly',
      price REAL NOT NULL DEFAULT 0.0,
      minimum_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      auto_close_on_expiry INTEGER NOT NULL DEFAULT 0,
      can_pause INTEGER NOT NULL DEFAULT 1,
      can_renew INTEGER NOT NULL DEFAULT 1,
      can_close_early INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Taxes table
  await run(`
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate_percent REAL NOT NULL DEFAULT 0.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Discounts table
  await run(`
    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('percentage', 'fixed')) NOT NULL DEFAULT 'percentage',
      value REAL NOT NULL DEFAULT 0.0,
      min_quantity INTEGER DEFAULT 0,
      min_purchase_amount REAL DEFAULT 0.0,
      start_date TEXT,
      end_date TEXT,
      max_usage_limit INTEGER DEFAULT 100,
      current_usage_count INTEGER DEFAULT 0,
      applicable_to TEXT CHECK(applicable_to IN ('all', 'specific_product')) DEFAULT 'all',
      product_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Quotation Templates table
  await run(`
    CREATE TABLE IF NOT EXISTS quotation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan_id INTEGER,
      validity_days INTEGER NOT NULL DEFAULT 30,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
    );
  `);

  // Quotation Template Items
  await run(`
    CREATE TABLE IF NOT EXISTS quotation_template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_id INTEGER,
      FOREIGN KEY (template_id) REFERENCES quotation_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
      FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE SET NULL
    );
  `);

  // Quotations table
  await run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      valid_until TEXT,
      status TEXT CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'converted')) NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
    );
  `);

  // Quotation Items table
  await run(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      line_total REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );
  `);

  // Subscriptions table (Draft -> Quotation -> Confirmed -> Active -> Closed / Paused)
  await run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed')) NOT NULL DEFAULT 'Draft',
      billing_interval TEXT CHECK(billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL DEFAULT 'monthly',
      start_date TEXT NOT NULL,
      expiry_date TEXT,
      next_billing_date TEXT,
      payment_terms TEXT NOT NULL DEFAULT 'Immediate',
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      discount_id INTEGER,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      auto_close INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
      FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_subs_billing_date ON subscriptions(next_billing_date);`);

  // Subscription Items table
  await run(`
    CREATE TABLE IF NOT EXISTS subscription_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      line_total REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );
  `);

  // Invoices table (Draft -> Confirmed -> Paid / Cancelled)
  await run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      billing_period_start TEXT,
      billing_period_end TEXT,
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      status TEXT CHECK(status IN ('Draft', 'Confirmed', 'Paid', 'Cancelled')) NOT NULL DEFAULT 'Draft',
      notes TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_invoices_subs ON invoices(subscription_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_invoices_cust ON invoices(customer_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);`);

  // Invoice Items table
  await run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      line_total REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Payments table
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      invoice_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT CHECK(payment_method IN ('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Bank Transfer', 'Cash')) NOT NULL DEFAULT 'UPI',
      payment_date TEXT NOT NULL,
      notes TEXT,
      status TEXT CHECK(status IN ('Success', 'Pending', 'Failed')) NOT NULL DEFAULT 'Success',
      transaction_ref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);`);
  await run(`CREATE INDEX IF NOT EXISTS idx_payments_cust ON payments(customer_id);`);

  // Activity Logs
  await run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  console.log('Database tables and indexes successfully created.');
};

