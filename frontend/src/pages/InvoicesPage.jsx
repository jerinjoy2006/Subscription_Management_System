import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { PaymentModal } from '../components/PaymentModal';
import {
  FileText,
  Search,
  Filter,
  CreditCard,
  Printer,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

export const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSend = async (id, invNum) => {
    try {
      const res = await api.post(`/invoices/${id}/send`);
      showToast(`Invoice ${invNum} dispatched to customer email.`);
      fetchInvoices();
    } catch (err) {
      alert('Failed to send invoice');
    }
  };

  const getStatusBadge = (inv) => {
    const isOverdue = inv.status === 'Confirmed' && inv.due_date < new Date().toISOString().split('T')[0];
    if (isOverdue) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          Overdue
        </span>
      );
    }
    const map = {
      Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Confirmed: 'bg-amber-100 text-amber-800 border-amber-200',
      Draft: 'bg-slate-100 text-slate-700 border-slate-200',
      Cancelled: 'bg-slate-100 text-slate-500 border-slate-300'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${map[inv.status] || 'bg-slate-100'}`}>
        {inv.status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated recurring invoices with zero duplicate guarantees & instant payment settlements
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Filter:</span>
          {['', 'Confirmed', 'Paid', 'Draft', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Subscription Ref</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{inv.company_name}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-indigo-600 font-semibold">
                      {inv.subscription_number}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {inv.issue_date}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {inv.due_date}
                    </td>

                    <td className="py-3.5 px-3 text-right font-black text-slate-900">
                      ₹{Number(inv.total_amount).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      {getStatusBadge(inv)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View / Print */}
                        <button
                          onClick={() => setActiveInvoiceId(inv.id)}
                          title="View & Print Invoice"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Send Email */}
                        {user?.role !== 'customer' && (
                          <button
                            onClick={() => handleSend(inv.id, inv.invoice_number)}
                            title="Send to Customer Email"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pay Now Button */}
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors"
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

      {/* Payment Modal */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaymentSuccess={() => {
            fetchInvoices();
            showToast(`Payment successfully registered! Invoice marked as Paid.`);
          }}
        />
      )}
    </div>
  );
};

