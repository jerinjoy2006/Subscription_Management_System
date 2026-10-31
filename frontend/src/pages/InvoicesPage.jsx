import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { PaymentModal } from '../components/PaymentModal';
import {
  FileText,
  Search,
  Filter,
  CreditCard,
  Printer,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import api from '../api/client';

export const InvoicesPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices', {
        params: {
          status: statusFilter || undefined,
          search: searchTerm || undefined
        }
      });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleSend = async (id, invNum) => {
    try {
      const res = await api.post(`/invoices/${id}/send`);
      toast.success(`Invoice ${invNum} successfully dispatched to customer email.`);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to send invoice');
    }
  };

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  const getStatusBadge = (inv) => {
    const isOverdue = inv.status === 'Confirmed' && inv.due_date < new Date().toISOString().split('T')[0];
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          Overdue
        </span>
      );
    }
    const map = {
      Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      Confirmed: 'bg-amber-50 text-amber-700 border-amber-200/80',
      Draft: 'bg-slate-100 text-slate-700 border-slate-200/80',
      Cancelled: 'bg-slate-100 text-slate-500 border-slate-300'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${map[inv.status] || 'bg-slate-100'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        {inv.status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recurring Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated billing ledger with duplicate billing prevention and instant payment settlements
          </p>
        </div>

        {/* Quick KPI summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
            <span className="text-sm font-black text-rose-600">₹{totalOutstanding.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected</span>
            <span className="text-sm font-black text-emerald-600">₹{totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, subscription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase text-[10px] mr-1">Status:</span>
          {['', 'Confirmed', 'Paid', 'Draft', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-3">Subscription</th>
                <th className="py-3 px-3">Billing Cycle</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Invoice Total</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">No invoices found matching filter.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{inv.company_name}</div>
                    </td>

                    <td className="py-4 px-3 font-mono text-indigo-700 font-bold">
                      {inv.subscription_number}
                    </td>

                    <td className="py-4 px-3 font-mono text-slate-600 text-[11px]">
                      {inv.billing_period_start} → {inv.billing_period_end}
                    </td>

                    <td className="py-4 px-3 font-mono text-slate-700 font-semibold">
                      {inv.due_date}
                    </td>

                    <td className="py-4 px-3 text-right font-black text-slate-900 text-sm">
                      ₹{Number(inv.total_amount).toLocaleString()}
                    </td>

                    <td className="py-4 px-3">
                      {getStatusBadge(inv)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View & Print */}
                        <button
                          onClick={() => setActiveInvoiceId(inv.id)}
                          title="View / Print Official Invoice"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Send Email simulation */}
                        {user?.role !== 'customer' && (
                          <button
                            onClick={() => handleSend(inv.id, inv.invoice_number)}
                            title="Dispatch Invoice to Customer Email"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pay Now Button */}
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Print Modal */}
      {activeInvoiceId && (
        <InvoiceDetailModal
          invoiceId={activeInvoiceId}
          onClose={() => setActiveInvoiceId(null)}
          onPayClick={(inv) => {
            setActiveInvoiceId(null);
            setPayingInvoice(inv);
          }}
          onInvoiceUpdated={() => fetchInvoices()}
        />
      )}

      {/* Payment Checkout Modal */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaymentSuccess={() => {
            fetchInvoices();
            toast.success(`Payment settled for ${payingInvoice.invoice_number}! Invoice marked as Paid.`);
          }}
        />
      )}
    </div>
  );
};
