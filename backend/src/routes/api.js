import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

import * as authCtrl from '../controllers/authController.js';
import * as prodCtrl from '../controllers/productController.js';
import * as planCtrl from '../controllers/planController.js';
import * as taxCtrl from '../controllers/taxController.js';
import * as discCtrl from '../controllers/discountController.js';
import * as quoteCtrl from '../controllers/quotationController.js';
import * as subCtrl from '../controllers/subscriptionController.js';
import * as invCtrl from '../controllers/invoiceController.js';
import * as payCtrl from '../controllers/paymentController.js';
import * as anCtrl from '../controllers/analyticsController.js';

const router = express.Router();

// Public Auth routes
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);

// Authenticated user profile
router.get('/auth/me', authenticate, authCtrl.getMe);

// Admin-only staff management
router.post('/auth/staff', authenticate, authorize(['admin']), authCtrl.createStaff);
router.get('/auth/staff', authenticate, authorize(['admin']), authCtrl.listStaff);
router.get('/customers', authenticate, authorize(['admin', 'staff']), authCtrl.listCustomers);

// Products & Variants (Public read for customer portal, Admin write)
router.get('/products', prodCtrl.getProducts);
router.get('/products/:id', prodCtrl.getProductById);
router.post('/products', authenticate, authorize(['admin']), prodCtrl.createProduct);
router.put('/products/:id', authenticate, authorize(['admin']), prodCtrl.updateProduct);
router.post('/products/:id/variants', authenticate, authorize(['admin']), prodCtrl.addVariant);
router.delete('/products/variants/:variantId', authenticate, authorize(['admin']), prodCtrl.deleteVariant);

// Plans (Public read for customer portal, Admin write)
router.get('/plans', planCtrl.getPlans);
router.get('/plans/:id', planCtrl.getPlanById);
router.post('/plans', authenticate, authorize(['admin']), planCtrl.createPlan);
router.put('/plans/:id', authenticate, authorize(['admin']), planCtrl.updatePlan);

// Taxes (Admin write, authenticated read)
router.get('/taxes', authenticate, taxCtrl.getTaxes);
router.post('/taxes', authenticate, authorize(['admin']), taxCtrl.createTax);
router.put('/taxes/:id', authenticate, authorize(['admin']), taxCtrl.updateTax);

// Discounts & Coupons
router.get('/discounts', authenticate, discCtrl.getDiscounts);
router.post('/discounts', authenticate, authorize(['admin']), discCtrl.createDiscount);
router.put('/discounts/:id', authenticate, authorize(['admin']), discCtrl.updateDiscount);
router.post('/discounts/validate', authenticate, discCtrl.validateDiscount);

// Quotation Templates & Quotations (Staff/Admin)
router.get('/quotations/templates', authenticate, authorize(['admin', 'staff']), quoteCtrl.getTemplates);
router.post('/quotations/templates', authenticate, authorize(['admin', 'staff']), quoteCtrl.createTemplate);
router.get('/quotations', authenticate, authorize(['admin', 'staff']), quoteCtrl.getQuotations);
router.post('/quotations', authenticate, authorize(['admin', 'staff']), quoteCtrl.createQuotation);
router.post('/quotations/:id/convert', authenticate, authorize(['admin', 'staff']), quoteCtrl.convertQuotationToSubscription);

// Subscriptions
router.get('/subscriptions', authenticate, subCtrl.getSubscriptions);
router.get('/subscriptions/:id', authenticate, subCtrl.getSubscriptionById);
router.post('/subscriptions', authenticate, subCtrl.createSubscription);
router.put('/subscriptions/:id/status', authenticate, authorize(['admin', 'staff']), subCtrl.updateSubscriptionStatus);
router.post('/subscriptions/:id/pause', authenticate, subCtrl.pauseSubscription);
router.post('/subscriptions/:id/resume', authenticate, subCtrl.resumeSubscription);
router.post('/subscriptions/:id/renew', authenticate, subCtrl.renewSubscription);
router.post('/subscriptions/:id/close', authenticate, subCtrl.closeSubscription);

// Invoices
router.get('/invoices', authenticate, invCtrl.getInvoices);
router.get('/invoices/:id', authenticate, invCtrl.getInvoiceById);
router.put('/invoices/:id/status', authenticate, authorize(['admin', 'staff']), invCtrl.updateInvoiceStatus);
router.post('/invoices/:id/send', authenticate, authorize(['admin', 'staff']), invCtrl.sendInvoice);

// Payments
router.get('/payments', authenticate, payCtrl.getPayments);
router.post('/payments', authenticate, payCtrl.recordPayment);

// Analytics & Intelligence Dashboard
router.get('/analytics', authenticate, authorize(['admin', 'staff']), anCtrl.getAnalytics);
router.post('/billing/run', authenticate, authorize(['admin', 'staff']), anCtrl.triggerBillingRun);

export default router;
