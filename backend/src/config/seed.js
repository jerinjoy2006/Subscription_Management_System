import bcrypt from 'bcryptjs';
import { run, get, query } from './db.js';
import { initializeDatabase } from './initDb.js';

export const seedDatabase = async () => {
  await initializeDatabase();

  // Check if data already seeded
  const existingUser = await get(`SELECT id FROM users LIMIT 1;`);
  if (existingUser) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding initial data for Brightloop Software...');

  // Hash passwords
  const adminPass = await bcrypt.hash('Admin@12345!', 10);
  const staffPass = await bcrypt.hash('Staff@12345!', 10);
  const custPass = await bcrypt.hash('Customer@12345!', 10);

  // 1. Users
  const adminRes = await run(
    `INSERT INTO users (name, email, password_hash, role, company_name, phone)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['Sarah Admin', 'admin@brightloop.com', adminPass, 'admin', 'Brightloop HQ', '+91 98765 43210']
  );

  const staffRes = await run(
    `INSERT INTO users (name, email, password_hash, role, company_name, phone)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['Alex Staff', 'staff@brightloop.com', staffPass, 'staff', 'Brightloop Operations', '+91 98765 43211']
  );

  const cust1Res = await run(
    `INSERT INTO users (name, email, password_hash, role, company_name, phone)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['Rahul Sharma', 'apex@shop.com', custPass, 'customer', 'Apex Retail Shop', '+91 91234 56789']
  );

  const cust2Res = await run(
    `INSERT INTO users (name, email, password_hash, role, company_name, phone)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['Vikram Malhotra', 'enterprise@techcorp.com', custPass, 'customer', 'TechCorp Global Solutions', '+91 92345 67890']
  );

  const cust3Res = await run(
    `INSERT INTO users (name, email, password_hash, role, company_name, phone)
     VALUES (?, ?, ?, ?, ?, ?);`,
    ['Elena Gomez', 'solopreneur@devstudio.io', custPass, 'customer', 'DevStudio Digital', '+91 93456 78901']
  );

  // 2. Taxes
  const tax1 = await run(`INSERT INTO taxes (name, rate_percent) VALUES (?, ?);`, ['GST 18%', 18.0]);
  const tax2 = await run(`INSERT INTO taxes (name, rate_percent) VALUES (?, ?);`, ['GST 5%', 5.0]);
  const tax3 = await run(`INSERT INTO taxes (name, rate_percent) VALUES (?, ?);`, ['Zero Tax (Export)', 0.0]);

  // 3. Products
  const prod1 = await run(
    `INSERT INTO products (name, type, sales_price, cost_price, notes)
     VALUES (?, ?, ?, ?, ?);`,
    ['Business Management Software', 'Software', 1000.0, 400.0, 'Core ERP and billing solution for businesses']
  );

  const prod2 = await run(
    `INSERT INTO products (name, type, sales_price, cost_price, notes)
     VALUES (?, ?, ?, ?, ?);`,
    ['CRM & Client Communications', 'Add-on', 600.0, 200.0, 'Automated email, SMS, and WhatsApp alerts module']
  );

  const prod3 = await run(
    `INSERT INTO products (name, type, sales_price, cost_price, notes)
     VALUES (?, ?, ?, ?, ?);`,
    ['Automated Inventory Sync', 'Add-on', 450.0, 150.0, 'Real-time multi-warehouse inventory management']
  );

  const prod4 = await run(
    `INSERT INTO products (name, type, sales_price, cost_price, notes)
     VALUES (?, ?, ?, ?, ?);`,
    ['24/7 Dedicated SLA Support', 'Service', 300.0, 50.0, 'Round the clock live agent support']
  );

  // Product Variants
  const var1 = await run(
    `INSERT INTO product_variants (product_id, variant_name, additional_price, sku)
     VALUES (?, ?, ?, ?);`,
    [prod1.id, 'Odoo Brand Connector', 560.0, 'BMS-ODOO-01']
  );

  const var2 = await run(
    `INSERT INTO product_variants (product_id, variant_name, additional_price, sku)
     VALUES (?, ?, ?, ?);`,
    [prod1.id, 'Enterprise Multi-Branch Edition', 800.0, 'BMS-ENT-02']
  );

  // 4. Plans
  const planDaily = await run(
    `INSERT INTO plans (name, billing_interval, price, minimum_quantity, start_date, auto_close_on_expiry, can_pause, can_renew, can_close_early, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['Starter Daily Flex', 'daily', 50.0, 1, '2026-01-01', 0, 1, 1, 1, 'Short-term daily billing plan']
  );

  const planWeekly = await run(
    `INSERT INTO plans (name, billing_interval, price, minimum_quantity, start_date, auto_close_on_expiry, can_pause, can_renew, can_close_early, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['Standard Weekly', 'weekly', 299.0, 1, '2026-01-01', 0, 1, 1, 1, 'Weekly cadence billing plan']
  );

  const planMonthly = await run(
    `INSERT INTO plans (name, billing_interval, price, minimum_quantity, start_date, auto_close_on_expiry, can_pause, can_renew, can_close_early, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['Professional Monthly', 'monthly', 999.0, 1, '2026-01-01', 0, 1, 1, 1, 'Standard monthly recurring subscription']
  );

  const planYearly = await run(
    `INSERT INTO plans (name, billing_interval, price, minimum_quantity, start_date, auto_close_on_expiry, can_pause, can_renew, can_close_early, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['Enterprise Yearly Contract', 'yearly', 10000.0, 5, '2026-01-01', 0, 1, 1, 1, 'Annual billing for scaling organizations']
  );

  // 5. Discounts
  const disc1 = await run(
    `INSERT INTO discounts (code, name, type, value, min_quantity, min_purchase_amount, start_date, end_date, max_usage_limit, applicable_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['BULK15', 'Bulk Seats 15% Off', 'percentage', 15.0, 10, 0, '2026-01-01', '2026-12-31', 500, 'all']
  );

  const disc2 = await run(
    `INSERT INTO discounts (code, name, type, value, min_quantity, min_purchase_amount, start_date, end_date, max_usage_limit, applicable_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['FLAT500', 'Flat ₹500 First Month', 'fixed', 500.0, 1, 1500, '2026-01-01', '2026-12-31', 100, 'all']
  );

  // 6. Quotation Templates
  const template1 = await run(
    `INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
     VALUES (?, ?, ?, ?);`,
    ['Standard Business Suite Quote', planMonthly.id, 15, 'Standard package including Business Software + Odoo + CRM Addon']
  );

  await run(
    `INSERT INTO quotation_template_items (template_id, product_id, variant_id, quantity, unit_price, tax_id)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [template1.id, prod1.id, var1.id, 1, 1560.0, tax1.id]
  );
  await run(
    `INSERT INTO quotation_template_items (template_id, product_id, variant_id, quantity, unit_price, tax_id)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [template1.id, prod2.id, null, 1, 600.0, tax1.id]
  );

  // 7. Subscriptions
  // Subscription 1: Apex Retail (Monthly, Active)
  const sub1 = await run(
    `INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status, billing_interval,
      start_date, expiry_date, next_billing_date, payment_terms,
      subtotal, tax_amount, discount_id, discount_amount, total_amount, auto_close, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SUB-2026-001', cust1Res.id, planMonthly.id, 'Active', 'monthly',
      '2026-10-01', '2027-10-01', '2026-11-01', 'Due Upon Receipt',
      1560.0, 280.8, null, 0.0, 1840.8, 0, 'Apex retail shop single location setup'
    ]
  );
  await run(
    `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [sub1.id, prod1.id, var1.id, 1, 1560.0, 18.0, 1560.0]
  );

  // Subscription 2: TechCorp Global (Yearly, 50 seats, Active with 15% discount)
  // Subtotal = 50 * 10,000 = 500,000. Discount 15% = 75,000. Taxable = 425,000. Tax 18% = 76,500. Total = 501,500.
  const sub2 = await run(
    `INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status, billing_interval,
      start_date, expiry_date, next_billing_date, payment_terms,
      subtotal, tax_amount, discount_id, discount_amount, total_amount, auto_close, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SUB-2026-002', cust2Res.id, planYearly.id, 'Active', 'yearly',
      '2026-09-15', '2027-09-15', '2027-09-15', 'Net 30',
      500000.0, 76500.0, disc1.id, 75000.0, 501500.0, 0, 'TechCorp 50 seats yearly contract'
    ]
  );
  await run(
    `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [sub2.id, prod1.id, null, 50, 10000.0, 18.0, 500000.0]
  );

  // Subscription 3: DevStudio (Monthly, Confirmed / Pending First Invoice)
  const sub3 = await run(
    `INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status, billing_interval,
      start_date, expiry_date, next_billing_date, payment_terms,
      subtotal, tax_amount, discount_id, discount_amount, total_amount, auto_close, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SUB-2026-003', cust3Res.id, planMonthly.id, 'Confirmed', 'monthly',
      '2026-10-25', '2027-10-25', '2026-10-25', 'Immediate',
      1600.0, 288.0, null, 0.0, 1888.0, 0, 'DevStudio pending initial billing'
    ]
  );
  await run(
    `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [sub3.id, prod1.id, null, 1, 1000.0, 18.0, 1000.0]
  );
  await run(
    `INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [sub3.id, prod2.id, null, 1, 600.0, 18.0, 600.0]
  );

  // 8. Invoices
  // Invoice 1 for Apex Retail (Paid)
  const inv1 = await run(
    `INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, issue_date, due_date,
      billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
      total_amount, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'INV-2026-001', sub1.id, cust1Res.id, '2026-10-01', '2026-10-15',
      '2026-10-01', '2026-10-31', 1560.0, 280.8, 0.0,
      1840.8, 'Paid', 'October 2026 Billing for Apex Retail'
    ]
  );
  await run(
    `INSERT INTO invoice_items (invoice_id, product_id, product_name, variant_name, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [inv1.id, prod1.id, 'Business Management Software', 'Odoo Brand Connector', 1, 1560.0, 18.0, 1560.0]
  );

  // Payment for Invoice 1
  await run(
    `INSERT INTO payments (payment_number, invoice_id, customer_id, amount, payment_method, payment_date, notes, status, transaction_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['PAY-2026-001', inv1.id, cust1Res.id, 1840.8, 'UPI', '2026-10-02', 'Paid via UPI AutoPay', 'Success', 'UPI-9872198302']
  );

  // Invoice 2 for TechCorp (Confirmed / Outstanding)
  const inv2 = await run(
    `INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, issue_date, due_date,
      billing_period_start, billing_period_end, subtotal, tax_amount, discount_amount,
      total_amount, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'INV-2026-002', sub2.id, cust2Res.id, '2026-09-15', '2026-10-15',
      '2026-09-15', '2027-09-14', 500000.0, 76500.0, 75000.0,
      501500.0, 'Confirmed', 'Annual subscription billing (50 seats) - Net 30'
    ]
  );
  await run(
    `INSERT INTO invoice_items (invoice_id, product_id, product_name, variant_name, quantity, unit_price, tax_rate, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [inv2.id, prod1.id, 'Business Management Software', 'Standard Edition', 50, 10000.0, 18.0, 500000.0]
  );

  console.log('Seeding completed successfully!');
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
