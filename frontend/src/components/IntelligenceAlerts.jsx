import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  Gift,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export const IntelligenceAlerts = ({ intelligence, onActionClick }) => {
  const [activeTab, setActiveTab] = useState('all');

  if (!intelligence) return null;

  const { renewalAlerts, paymentAlerts, customerInsights, revenueInsight } = intelligence;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
      {/* Decorative background flare */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-indigo-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-brand-300 border border-indigo-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">Subscription Intelligence Engine</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-500/30 text-brand-200 border border-brand-400/40 px-2 py-0.5 rounded-full">
                AI Standout Feature
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">Real-time proactive revenue alerts, renewal forecasting & customer retention insights</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-300 font-medium">Growth Velocity:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {revenueInsight.mrrGrowthRate} MRR
          </span>
        </div>
      </div>

      {/* Grid of Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Renewal Alert */}
        <div className="bg-white/10 hover:bg-white/15 transition-all p-4 rounded-xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Upcoming Renewals
              </span>
              <span className="text-xs font-extrabold bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                {renewalAlerts.count} Due
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {renewalAlerts.message}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Automated reminders queued</span>
            <span className="font-semibold text-brand-300">Target: 30d</span>
          </div>
        </div>

        {/* 2. Payment Alert */}
        <div className="bg-white/10 hover:bg-white/15 transition-all p-4 rounded-xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Payment Alert
              </span>
              <span className="text-xs font-extrabold bg-rose-400/20 text-rose-200 px-2 py-0.5 rounded-full">
                {paymentAlerts.count} Overdue
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {paymentAlerts.message}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Overdue sum: ₹{paymentAlerts.amount.toLocaleString()}</span>
            <span className="font-semibold text-rose-300">Action Required</span>
          </div>
        </div>

        {/* 3. Customer Upsell & Discount Insight */}
        <div className="bg-white/10 hover:bg-white/15 transition-all p-4 rounded-xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> Volume Upsell Insight
              </span>
              <span className="text-xs font-extrabold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
                {customerInsights.count} Eligible
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {customerInsights.message}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Apply Coupon BULK15</span>
            <span className="font-semibold text-emerald-300">Boost Retention</span>
          </div>
        </div>
      </div>
    </div>
  );
};
