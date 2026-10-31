import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

import { DashboardPage } from './pages/DashboardPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProductsPlansPage } from './pages/ProductsPlansPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { CustomersPage } from './pages/CustomersPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';

const ProtectedLayout = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
        Loading SubscriptIQ...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If customer tries to access admin page, send to portal
    if (user.role === 'customer') {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />

          {/* Admin & Staff Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedLayout allowedRoles={['admin', 'staff']}>
                <DashboardPage />
              </ProtectedLayout>
            }
          />

          {/* Shared Protected Pages */}
          <Route
            path="/subscriptions"
            element={
              <ProtectedLayout>
                <SubscriptionsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedLayout>
                <InvoicesPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedLayout>
                <PaymentsPage />
              </ProtectedLayout>
            }
          />

          {/* Quotations & Customers (Admin & Staff) */}
          <Route
            path="/quotations"
            element={
              <ProtectedLayout allowedRoles={['admin', 'staff']}>
                <QuotationsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedLayout allowedRoles={['admin', 'staff']}>
                <CustomersPage />
              </ProtectedLayout>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/products-plans"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <ProductsPlansPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/discounts"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <DiscountsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <StaffManagementPage />
              </ProtectedLayout>
            }
          />

          {/* Customer Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedLayout>
                <CustomerPortalPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/portal/catalog"
            element={
              <ProtectedLayout>
                <CustomerPortalPage />
              </ProtectedLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
