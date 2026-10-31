import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  FileSpreadsheet,
  PackageCheck,
  Percent,
  Users,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'customer';

  const adminStaffLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, badge: null },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat, badge: 'Lifecycle' },
    { name: 'Invoices', path: '/invoices', icon: FileText, badge: 'Billing' },
    { name: 'Payments', path: '/payments', icon: CreditCard, badge: 'Ledger' },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet, badge: 'Sales' },
    { name: 'Customers', path: '/customers', icon: Users, badge: null },
  ];

  const adminOnlyLinks = [
    { name: 'Products & Plans', path: '/products-plans', icon: PackageCheck, badge: 'Pricing' },
    { name: 'Taxes & Discounts', path: '/discounts', icon: Percent, badge: 'Rules' },
    { name: 'Staff Management', path: '/staff', icon: ShieldCheck, badge: 'RBAC' },
  ];

  const customerLinks = [
    { name: 'My Subscriptions', path: '/portal', icon: Repeat, badge: 'Active' },
    { name: 'Browse Plans & Add-ons', path: '/portal/catalog', icon: ShoppingBag, badge: 'Catalog' },
    { name: 'My Invoices', path: '/invoices', icon: FileText, badge: 'Receipts' },
    { name: 'Payment History', path: '/payments', icon: CreditCard, badge: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 select-none">
      <div className="space-y-6">
        {/* Operations Section */}
        {role !== 'customer' ? (
          <>
            <div>
              <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Core Operations
              </div>
              <nav className="space-y-1">
                {adminStaffLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-50 to-brand-50 text-indigo-700 shadow-2xs font-bold border border-indigo-100/80'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Administration Section */}
            {role === 'admin' && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Administration & Config
                </div>
                <nav className="space-y-1">
                  {adminOnlyLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-50 to-brand-50 text-indigo-700 shadow-2xs font-bold border border-indigo-100/80'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Quick Portal Switcher */}
            <div className="pt-2">
              <NavLink
                to="/portal"
                className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl border border-dashed border-slate-200 transition-all"
              >
                <span>Preview Customer Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </>
        ) : (
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Customer Account
            </div>
            <nav className="space-y-1">
              {customerLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-brand-50 text-indigo-700 shadow-2xs font-bold border border-indigo-100/80'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* System Engine Health Card */}
      <div className="p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Brightloop Core</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Zero-delay automated recurring billing engine with atomic transactions.
        </p>
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-400" /> SQLite WAL
          </span>
          <span>&lt; 5ms</span>
        </div>
      </div>
    </aside>
  );
};
