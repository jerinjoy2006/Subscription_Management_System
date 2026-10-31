import { getDashboardAnalytics } from '../services/analyticsService.js';
import { runBillingEngine } from '../services/billingEngine.js';

export const getAnalytics = async (req, res) => {
  try {
    const data = await getDashboardAnalytics();
    res.json(data);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to compute dashboard analytics.' });
  }
};

export const triggerBillingRun = async (req, res) => {
  try {
    const { targetDate } = req.body;
    const results = await runBillingEngine(targetDate);
    res.json({
      message: `Billing engine executed successfully. Generated ${results.generatedInvoices.length} invoices.`,
      results
    });
  } catch (err) {
    console.error('Billing run error:', err);
    res.status(500).json({ error: 'Failed to run recurring billing cycle.' });
  }
};

