import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './src/routes/api.js';
import { seedDatabase } from './src/config/seed.js';

dotenv.config();

const app = express();
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let server;

async function runTests() {
  console.log('--- Starting SubscriptIQ Full Integration Test Suite ---');
  await seedDatabase();
  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Admin Login
    console.log('\n[1] Admin Authentication');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@brightloop.com', password: 'Admin@12345!' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logged in successfully');
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Create Product and Subscription Plan
    console.log('\n[2] Create Product & Subscription Plan');
    const prodRes = await request('/products', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'AI Analytics Copilot',
        description: 'Next-gen analytics engine add-on',
        sales_price: 15000,
        tax_id: 1,
        variants: [
          { variant_name: 'Pro Multi-Seat', additional_price: 5000 }
        ]
      }
    });
    assert(prodRes.status === 201 && prodRes.data.productId, `Created product (ID: ${prodRes.data.productId})`);
    const productId = prodRes.data.productId;

    const planRes = await request('/plans', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Enterprise AI Suite',
        description: 'Comprehensive annual enterprise license',
        price: 180000,
        billing_interval: 'yearly',
        payment_terms: 'Net 30',
        minimum_quantity: 5,
        can_pause: 1,
        can_renew: 1,
        can_close_early: 1,
        auto_close_on_expiry: 0
      }
    });
    assert(planRes.status === 201 && planRes.data.planId, `Created subscription plan (ID: ${planRes.data.planId})`);
    const planId = planRes.data.planId;

    // 3. Create Customer
    console.log('\n[3] Create Customer Account');
    const custRes = await request('/customers', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Vikram Mehta',
        email: `vikram_${Date.now()}@mehtaindustries.com`,
        password: 'Customer@12345!',
        company_name: 'Mehta Heavy Industries Ltd',
        phone: '+91 98200 12345',
        address: '42 Nariman Point, Mumbai 400021',
        gstin: '27AABCU9603R1ZM'
      }
    });
    assert(custRes.status === 201 && custRes.data.customerId, `Created customer account (ID: ${custRes.data.customerId})`);
    const customerId = custRes.data.customerId;
    const customerEmail = custRes.data.customer.email;

    // Verify Customer 360 profile endpoint
    const custProfile = await request(`/customers/${customerId}`, {
      method: 'GET',
      headers: adminHeaders
    });
    assert(custProfile.status === 200 && custProfile.data.customer.email === customerEmail, 'Customer 360 profile fetched successfully');

    // 4. Create Subscription & verify initial invoice auto-generation
    console.log('\n[4] Create Subscription & Verify Initial Invoice');
    const subRes = await request('/subscriptions', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        customer_id: customerId,
        plan_id: planId,
        payment_terms: 'Net 30',
        items: [
          {
            product_id: productId,
            variant_id: prodRes.data.variants?.[0]?.id || null,
            quantity: 5,
            unit_price: 20000,
            tax_rate: 18
          }
        ]
      }
    });
    assert(subRes.status === 201 && subRes.data.subscriptionId, `Created subscription ${subRes.data.subscriptionNumber} (ID: ${subRes.data.subscriptionId})`);
    const subId = subRes.data.subscriptionId;

    // Verify invoice was automatically created for this subscription
    const invList = await request('/invoices', {
      method: 'GET',
      headers: adminHeaders
    });
    const subInvoices = invList.data.invoices.filter((i) => i.subscription_id === subId);
    assert(subInvoices.length >= 1, `Initial invoice automatically generated (${subInvoices[0]?.invoice_number})`);
    const initialInvoice = subInvoices[0];

    // 5. On-Demand Invoice Generation
    console.log('\n[5] On-Demand Invoice Generation');
    const onDemandRes = await request(`/subscriptions/${subId}/generate-invoice`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(onDemandRes.status === 201 && onDemandRes.data.invoiceId, `Generated on-demand recurring invoice ${onDemandRes.data.invoiceNumber}`);

    // 6. Process Simulated Payment
    console.log('\n[6] Process Simulated Payment');
    const payRes = await request('/payments', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        invoice_id: initialInvoice.id,
        amount: initialInvoice.total_amount,
        payment_method: 'bank_transfer',
        transaction_ref: `UTR-${Date.now()}`,
        notes: 'Full annual enterprise advance settlement'
      }
    });
    const paymentNum = payRes.data.payment?.paymentNumber || payRes.data.paymentCode;
    assert(payRes.status === 201 && paymentNum, `Recorded payment ${paymentNum} for ₹${payRes.data.payment?.amount}`);

    // 7. Verify Invoice and Subscription Statuses
    console.log('\n[7] Verify Post-Payment Status Updates');
    const singleInv = await request(`/invoices/${initialInvoice.id}`, {
      method: 'GET',
      headers: adminHeaders
    });
    assert(singleInv.data.invoice?.status === 'Paid', `Invoice ${initialInvoice.invoice_number} is now marked 'Paid'`);

    const singleSub = await request(`/subscriptions/${subId}`, {
      method: 'GET',
      headers: adminHeaders
    });
    assert(singleSub.data.subscription.status === 'Active', `Subscription ${subRes.data.subscriptionNumber} is now 'Active'`);

    // 8. Prevent Duplicate Payment on already-settled invoice
    console.log('\n[8] Duplicate Payment Prevention');
    const dupPay = await request('/payments', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        invoice_id: initialInvoice.id,
        amount: 500,
        payment_method: 'credit_card'
      }
    });
    assert(dupPay.status === 400, 'Duplicate payment on settled invoice correctly rejected (HTTP 400)');

    // 9. Quotations Workflow & Conversion
    console.log('\n[9] Quotation Creation & 1-Click Conversion');
    const quoteRes = await request('/quotations', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        customer_id: customerId,
        plan_id: planId,
        validity_days: 30,
        notes: 'Special Q4 Enterprise Discount Proposal',
        items: [
          {
            product_id: productId,
            quantity: 10,
            unit_price: 15000,
            tax_rate: 18
          }
        ]
      }
    });
    assert(quoteRes.status === 201 && quoteRes.data.quotationId, `Created quotation ${quoteRes.data.quotationNumber}`);
    const quoteId = quoteRes.data.quotationId;

    // Convert quotation to subscription
    const convertRes = await request(`/quotations/${quoteId}/convert`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(convertRes.status === 200 && convertRes.data.subscriptionNumber, `Converted quotation to subscription ${convertRes.data.subscriptionNumber}`);

    // Verify duplicate conversion guard
    const dupConvert = await request(`/quotations/${quoteId}/convert`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(dupConvert.status === 400, 'Duplicate quotation conversion correctly prevented (HTTP 400)');

    // 10. Subscription Lifecycle (Pause, Resume, Renew, Close)
    console.log('\n[10] Subscription Lifecycle State Transitions');
    const pauseRes = await request(`/subscriptions/${subId}/pause`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(pauseRes.status === 200, 'Subscription successfully paused');

    const resumeRes = await request(`/subscriptions/${subId}/resume`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(resumeRes.status === 200, 'Subscription successfully resumed to Active');

    const renewRes = await request(`/subscriptions/${subId}/renew`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(renewRes.status === 200 && renewRes.data.newExpiry, `Subscription renewed! New expiry: ${renewRes.data.newExpiry}`);

    const closeRes = await request(`/subscriptions/${subId}/close`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(closeRes.status === 200, 'Subscription successfully closed');

    // 11. Customer Tenant Isolation
    console.log('\n[11] Customer Tenant Isolation Security Verification');
    const custLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: customerEmail, password: 'Customer@12345!' }
    });
    assert(custLogin.status === 200 && custLogin.data.token, 'Customer logged into portal');
    const custToken = custLogin.data.token;
    const custHeaders = { Authorization: `Bearer ${custToken}` };

    // Customer lists subscriptions - should only see their own
    const custSubs = await request('/subscriptions', {
      method: 'GET',
      headers: custHeaders
    });
    const hasOtherCustSubs = custSubs.data.subscriptions.some((s) => s.customer_id !== customerId);
    assert(!hasOtherCustSubs, 'Customer can only view their own subscriptions (zero leakage)');

    // Customer attempts to pause another customer's subscription (ID 1 belongs to seeded Apex Retail)
    const unauthorizedPause = await request('/subscriptions/1/pause', {
      method: 'POST',
      headers: custHeaders
    });
    assert(unauthorizedPause.status === 403, 'Customer forbidden from altering another customer subscription (HTTP 403)');

    // Customer attempts to view another customer's private 360 profile
    const unauthorizedProfile = await request('/customers/1', {
      method: 'GET',
      headers: custHeaders
    });
    assert(unauthorizedProfile.status === 403, 'Customer forbidden from viewing another customer profile (HTTP 403)');

    // 12. Dashboard Live Telemetry Analytics
    console.log('\n[12] Dashboard Live Telemetry & SQL Aggregation');
    const analyticsRes = await request('/analytics?timeFilter=All%20Time', {
      method: 'GET',
      headers: adminHeaders
    });
    assert(analyticsRes.status === 200, 'Analytics telemetry endpoint responded successfully');
    assert(analyticsRes.data.metrics.totalRevenue > 0, `Total Revenue is live and positive (₹${analyticsRes.data.metrics.totalRevenue})`);
    assert(Array.isArray(analyticsRes.data.charts.monthlyRevenue), 'Continuous trailing monthly revenue trend array generated');
    assert(analyticsRes.data.charts.monthlyRevenue.length === 6, 'Contains 6 consecutive calendar months');

    console.log('\n=================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
