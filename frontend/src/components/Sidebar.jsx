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
  ExternalLink
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'customer';

  const adminStaffLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat, roles: ['admin', 'staff'] },
    { name: 'Invoices', path: '/invoices', icon: FileText, roles: ['admin', 'staff'] },
    { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'staff'] },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet, roles: ['admin', 'staff'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'staff'] },
  ];

  const adminOnlyLinks = [
    { name: 'Products & Plans', path: '/products-plans', icon: PackageCheck, roles: ['admin'] },
    { name: 'Taxes & Discounts', path: '/discounts', icon: Percent, roles: ['admin'] },
    { name: 'Staff Management', path: '/staff', icon: Users, roles: ['admin'] },
  ];

  const customerLinks = [
    { name: 'My Subscriptions', path: '/portal', icon: Repeat, roles: ['customer'] },
    { name: 'Browse Plans & Add-ons', path: '/portal/catalog', icon: ShoppingBag, roles: ['customer'] },
    { name: 'My Invoices', path: '/invoices', icon: FileText, roles: ['customer'] },
    { name: 'Payment History', path: '/payments', icon: CreditCard, roles: ['customer'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Main navigation */}
        {role !== 'customer' ? (
          <>
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Operations
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
                        `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {role === 'admin' && (
              <div>
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Administration
                </div>
                <nav className="space-y-1">
                  {adminOnlyLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Quick Link to view customer portal as admin/staff */}
            <div className="pt-2">
              <NavLink
                to="/portal"
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-dashed border-slate-200 transition-colors"
              >
                <span>Preview Customer Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </>
        ) : (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Customer Portal
            </div>
            <nav className="space-y-1">
              {customerLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
        <p className="text-xs font-semibold text-slate-700">Brightloop Software</p>
        <p className="text-[11px] text-slate-500">v1.0.0 • Hackathon Edition</p>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine Online (SQLite WAL)</span>
        </div>
      </div>
    </aside>
  );
};

