import { query, get } from '../config/db.js';

export const getDashboardAnalytics = async (timeFilter = 'All Time') => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Date filtering logic based on timeFilter
  let paymentDateFilter = '';
  const queryParams = [];
  if (timeFilter === 'This Quarter') {
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
    paymentDateFilter = ' AND payment_date >= ?';
    queryParams.push(quarterStart);
  } else if (timeFilter === 'YTD') {
    const ytdStart = `${now.getFullYear()}-01-01`;
    paymentDateFilter = ' AND payment_date >= ?';
    queryParams.push(ytdStart);
  }

  // 1. Total Customers
  const custCountRow = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'customer';`);
  const totalCustomers = custCountRow?.count || 0;

  // 2. Active Subscriptions
  const activeSubsRow = await get(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'Active';`);
  const activeSubscriptions = activeSubsRow?.count || 0;

  // 3. Monthly Recurring Revenue (MRR) - normalized from active subscriptions
  const activeSubs = await query(`
    SELECT subtotal, total_amount, billing_interval
    FROM subscriptions
    WHERE status = 'Active';
  `);

  let mrr = 0;
  for (const s of activeSubs) {
    const amount = Number(s.subtotal || 0);
    switch (s.billing_interval?.toLowerCase()) {
      case 'daily':
        mrr += amount * 30;
        break;
      case 'weekly':
        mrr += amount * 4.333;
        break;
      case 'monthly':
        mrr += amount * 1;
        break;
      case 'yearly':
        mrr += amount / 12;
        break;
      default:
        mrr += amount;
    }
  }
  mrr = Math.round(mrr * 100) / 100;

  // 4. Total Revenue Collected (from actual database payments)
  const totalRevRow = await get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Success'${paymentDateFilter};`,
    queryParams
  );
  const totalRevenue = Math.round(Number(totalRevRow?.total || 0) * 100) / 100;

  // 5. Outstanding Amount (Confirmed/Draft invoices minus applied payments)
  const outstandingRow = await get(`
    SELECT (
      COALESCE((SELECT SUM(total_amount) FROM invoices WHERE status = 'Confirmed'), 0) -
      COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.status = 'Confirmed' AND p.status = 'Success'
      ), 0)
    ) as total;
  `);
  const outstandingAmount = Math.max(0, Math.round(Number(outstandingRow?.total || 0) * 100) / 100);

  // 6. Overdue Invoices (Confirmed invoices past due date)
  const overdueRow = await get(`
    SELECT COUNT(id) as count, COALESCE(SUM(total_amount), 0) as total
    FROM invoices
    WHERE status = 'Confirmed' AND due_date < ?;
  `, [today]);
  const overdueInvoicesCount = overdueRow?.count || 0;
  const overdueInvoicesAmount = Math.round(Number(overdueRow?.total || 0) * 100) / 100;

  // 7. Status breakdown of subscriptions
  const subsByStatus = await query(`
    SELECT status, COUNT(*) as count
    FROM subscriptions
    GROUP BY status;
  `);

  // 8. Invoices breakdown
  const invoicesByStatus = await query(`
    SELECT status, COUNT(*) as count, SUM(total_amount) as total
    FROM invoices
    GROUP BY status;
  `);

  // 9. Revenue by Subscription Plan
  const revenueByPlan = await query(`
    SELECT p.name as plan_name, p.billing_interval, COUNT(s.id) as subscriber_count, SUM(s.total_amount) as total_value
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status IN ('Active', 'Confirmed')
    GROUP BY p.id;
  `);

  // 10. Real Monthly Revenue from database payments (continuous trailing 6 months)
  const paymentsByMonth = await query(`
    SELECT strftime('%Y-%m', payment_date) as month_key,
           COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE status = 'Success'
    GROUP BY month_key
    ORDER BY month_key ASC;
  `);

  const paymentMap = {};
  for (const row of paymentsByMonth) {
    if (row.month_key) {
      paymentMap[row.month_key] = Number(row.revenue || 0);
    }
  }

  const monthlyRevenue = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    const monthLabel = `${monthNames[d.getMonth()]} ${yyyy}`;
    monthlyRevenue.push({
      month: monthLabel,
      monthKey: key,
      revenue: Math.round((paymentMap[key] || 0) * 100) / 100
    });
  }

  // Calculate real growth rate
  const currentMonthRev = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
  const previousMonthRev = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
  let mrrGrowthRate = '+0.0%';
  if (previousMonthRev > 0) {
    const diff = ((currentMonthRev - previousMonthRev) / previousMonthRev) * 100;
    mrrGrowthRate = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  } else if (currentMonthRev > 0) {
    mrrGrowthRate = '+100.0%';
  }

  // 11. Standout Feature: "Subscription Intelligence" Smart Insights
  // A) Upcoming renewals in next 30 days
  const upcomingRenewals = await query(`
    SELECT s.id, s.subscription_number, s.expiry_date, s.total_amount, u.name as customer_name, u.email
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    WHERE s.status = 'Active'
      AND s.expiry_date IS NOT NULL
      AND s.expiry_date >= ?
      AND s.expiry_date <= date(?, '+30 days')
    ORDER BY s.expiry_date ASC;
  `, [today, today]);

  // B) Overdue invoices list
  const overdueInvoicesList = await query(`
    SELECT i.id, i.invoice_number, i.total_amount, i.due_date, u.name as customer_name, u.email
    FROM invoices i
    JOIN users u ON i.customer_id = u.id
    WHERE i.status = 'Confirmed' AND i.due_date < ?
    ORDER BY i.due_date ASC;
  `, [today]);

  // C) Bulk Discount Opportunities: customers with 5+ seats without a discount
  const bulkOpportunities = await query(`
    SELECT s.id, s.subscription_number, u.name as customer_name, si.quantity, p.name as product_name
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    JOIN subscription_items si ON si.subscription_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.discount_id IS NULL AND si.quantity >= 5 AND s.status = 'Active';
  `);

  const intelligence = {
    renewalAlerts: {
      count: upcomingRenewals.length,
      items: upcomingRenewals,
      message: upcomingRenewals.length > 0
        ? `${upcomingRenewals.length} subscription(s) are due for renewal in the next 30 days.`
        : 'All active subscriptions have healthy renewal horizons.'
    },
    paymentAlerts: {
      count: overdueInvoicesCount,
      amount: overdueInvoicesAmount,
      items: overdueInvoicesList,
      message: overdueInvoicesCount > 0
        ? `${overdueInvoicesCount} overdue invoice(s) totaling ₹${overdueInvoicesAmount.toLocaleString()} require immediate follow-up.`
        : 'Zero overdue invoices. Payment collections are 100% on schedule.'
    },
    customerInsights: {
      count: bulkOpportunities.length,
      items: bulkOpportunities,
      message: bulkOpportunities.length > 0
        ? `${bulkOpportunities.length} customer account(s) qualify for seat volume discounts (e.g. BULK15).`
        : 'All eligible enterprise seats are currently optimized.'
    },
    revenueInsight: {
      mrrGrowthRate,
      arr: Math.round(mrr * 12),
      message: `Monthly Recurring Revenue (MRR) pacing at ₹${mrr.toLocaleString()} (${mrrGrowthRate} MoM).`
    }
  };

  return {
    metrics: {
      totalCustomers,
      activeSubscriptions,
      mrr,
      arr: Math.round(mrr * 12),
      totalRevenue,
      outstandingAmount,
      overdueInvoicesCount,
      overdueInvoicesAmount
    },
    charts: {
      monthlyRevenue,
      subsByStatus,
      invoicesByStatus,
      revenueByPlan
    },
    intelligence
  };
};

