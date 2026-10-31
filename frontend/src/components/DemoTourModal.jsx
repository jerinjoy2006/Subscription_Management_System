import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package,
  FileSpreadsheet,
  Zap,
  CreditCard,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

export const DemoTourModal = ({ isOpen, onClose, onRunBilling }) => {
  const navigate = useNavigate();
  const { quickSwitchRole } = useAuth();

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Products, Variants & Plans',
      icon: Package,
      desc: 'Admin configures Business Management Software with brand variants (e.g. Odoo Brand +₹560) and billing intervals (Daily, Weekly, Monthly, Yearly).',
      actionLabel: 'Inspect Products & Plans',
      action: () => {
        quickSwitchRole('admin');
        navigate('/products-plans');
        onClose();
      }
    },
    {
      num: 2,
      title: 'Quotation Templates & Subscriptions',
      icon: FileSpreadsheet,
      desc: 'Sales reps start from pre-built quotation templates and convert accepted quotes into active recurring subscriptions with 1 click.',
      actionLabel: 'View Quotations Pipeline',
      action: () => {
        quickSwitchRole('staff');
        navigate('/quotations');
        onClose();
      }
    },
    {
      num: 3,
      title: 'Automated Billing Engine & Duplicate Prevention',
      icon: Zap,
      desc: 'Billing engine identifies due subscriptions, computes taxes (GST 18%), applies volume discounts, and generates invoices with zero duplication.',
      actionLabel: 'Trigger Billing Run Now',
      action: () => {
        quickSwitchRole('admin');
        if (onRunBilling) onRunBilling();
        onClose();
      }
    },
    {
      num: 4,
      title: 'Customer Portal & Instant Checkout',
      icon: CreditCard,
      desc: 'Customer logs into their self-service portal, manages plans (pause, renew), and settles invoices via simulated UPI AutoPay or Credit Card.',
      actionLabel: 'Open Customer Portal as Rahul',
      action: () => {
        quickSwitchRole('customer');
        navigate('/portal');
        onClose();
      }
    },
    {
      num: 5,
      title: 'Subscription Intelligence & MRR Analytics',
      icon: TrendingUp,
      desc: 'Finance leads review normalized MRR, ARR, overdue warnings, and AI alerts for 30-day renewals and bulk seat upsell opportunities.',
      actionLabel: 'Open Executive Command Center',
      action: () => {
        quickSwitchRole('admin');
        navigate('/');
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-brand-300 border border-indigo-400/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                  Hackathon Evaluation Guide
                </span>
                <h2 className="text-xl font-black tracking-tight">Brightloop Software Billing Lifecycle</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-indigo-200 mt-2 leading-relaxed">
            Follow this 5-step scenario to demonstrate how SubscriptIQ eliminates manual spreadsheets and automates the complete billing lifecycle.
          </p>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                    {s.num}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={s.action}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>{s.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Tip: You can also use the <b>Demo Switch</b> buttons in the top navbar at any time.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

