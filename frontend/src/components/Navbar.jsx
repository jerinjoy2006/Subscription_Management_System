import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DemoTourModal } from './DemoTourModal';
import {
  Layers,
  Zap,
  LogOut,
  ShieldCheck,
  Briefcase,
  User,
  Sparkles,
  HelpCircle,
  Bell,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import api from '../api/client';

export const Navbar = ({ onBillingRunTriggered }) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const toast = useToast();
  const [runningBilling, setRunningBilling] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/billing/run', {});
      const count = res.data?.results?.generatedInvoices?.length || 0;
      toast.success(`Billing Engine Executed! Generated ${count} invoice(s) with duplicate checks.`);
      if (onBillingRunTriggered) onBillingRunTriggered(res.data);
    } catch (err) {
      toast.error('Billing run failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRunningBilling(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <Briefcase className="w-3.5 h-3.5" /> Operations Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <User className="w-3.5 h-3.5" /> Customer Portal
          </span>
        );
    }
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-brand-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 transform hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    Subscript<span className="text-indigo-600">IQ</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                    Brightloop OS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Enterprise Recurring Billing Engine</p>
              </div>
            </div>

            {/* Role Perspective Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
                Perspective:
              </span>
              <button
                onClick={() => {
                  quickSwitchRole('admin');
                  toast.info('Switched view to Sarah Admin (Full Management Access)');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  user?.role === 'admin'
                    ? 'bg-white text-rose-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                👑 Admin
              </button>
              <button
                onClick={() => {
                  quickSwitchRole('staff');
                  toast.info('Switched view to Alex Staff (Operational Access)');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  user?.role === 'staff'
                    ? 'bg-white text-amber-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                💼 Staff
              </button>
              <button
                onClick={() => {
                  quickSwitchRole('customer');
                  toast.info('Switched view to Rahul Sharma (Customer Self-Service Portal)');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  user?.role === 'customer'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                👤 Customer
              </button>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-2.5">
              {/* Interactive Platform Tour */}
              <button
                onClick={() => setShowTour(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100 transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Platform Tour</span>
              </button>

              {/* Trigger Recurring Billing Engine Button */}
              {user?.role !== 'customer' && (
                <button
                  onClick={handleRunBilling}
                  disabled={runningBilling}
                  title="Simulates automated recurring billing cycle, generates due invoices with zero duplicate checks"
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-300"
                >
                  <Zap className={`w-3.5 h-3.5 ${runningBilling ? 'animate-spin text-amber-300' : ''}`} />
                  {runningBilling ? 'Processing...' : 'Run Billing Engine'}
                </button>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800">{user?.name || 'Account'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{user?.company_name || user?.email}</div>
                </div>

                <div>{getRoleBadge(user?.role)}</div>

                <button
                  onClick={logout}
                  title="Sign out of account"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Tour Modal */}
      <DemoTourModal
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onRunBilling={handleRunBilling}
      />
    </>
  );
};
