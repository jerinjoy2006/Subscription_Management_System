import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  UserCheck,
  Zap,
  LogOut,
  Bell,
  ChevronDown,
  ShieldCheck,
  Briefcase,
  User
} from 'lucide-react';
import api from '../api/client';

export const Navbar = ({ onBillingRunTriggered }) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/billing/run', {});
      setBillingResult(res.data);
      if (onBillingRunTriggered) onBillingRunTriggered(res.data);
      setTimeout(() => setBillingResult(null), 5000);
    } catch (err) {
      alert('Billing run failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRunningBilling(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><ShieldCheck className="w-3 h-3"/> Admin</span>;
      case 'staff':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Briefcase className="w-3 h-3"/> Staff</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200"><User className="w-3 h-3"/> Customer</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">Subscript<span className="text-indigo-600">IQ</span></span>
                <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">Brightloop OS</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Recurring Billing & Revenue Engine</p>
            </div>
          </div>

          {/* Quick Role Switcher for Hackathon Presentation */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wider">Demo Switch:</span>
            <button
              onClick={() => quickSwitchRole('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'admin'
                  ? 'bg-white text-rose-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 Admin
            </button>
            <button
              onClick={() => quickSwitchRole('staff')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'staff'
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💼 Staff
            </button>
            <button
              onClick={() => quickSwitchRole('customer')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                user?.role === 'customer'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 Customer
            </button>
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Trigger Billing Engine Button (Admin/Staff only) */}
            {user?.role !== 'customer' && (
              <button
                onClick={handleRunBilling}
                disabled={runningBilling}
                title="Runs the recurring billing engine to detect due subscriptions and generate invoices"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-xs"
              >
                <Zap className={`w-3.5 h-3.5 ${runningBilling ? 'animate-spin text-amber-500' : 'text-indigo-600'}`} />
                {runningBilling ? 'Processing...' : 'Run Billing Engine'}
              </button>
            )}

            {/* User Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.name || 'User'}</div>
                <div className="text-[11px] text-slate-400">{user?.company_name || user?.email}</div>
              </div>
              <div>{getRoleBadge(user?.role)}</div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Billing Notification */}
        {billingResult && (
          <div className="mb-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚡ Billing Engine Result:</span>
              <span>{billingResult.message}</span>
            </div>
            <button onClick={() => setBillingResult(null)} className="text-emerald-700 font-bold px-1">✕</button>
          </div>
        )}
      </div>
    </header>
  );
};

