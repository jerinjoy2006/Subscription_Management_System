import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NewSubscriptionModal } from '../components/NewSubscriptionModal';
import {
  Repeat,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  RotateCw,
  XCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Calendar,
  Building2,
  Tag,
  FileText
} from 'lucide-react';
import api from '../api/client';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions', {
        params: {
          status: statusFilter || undefined,
          search: searchTerm || undefined
        }
      });
      setSubscriptions(res.data.subscriptions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handleGenerateInvoice = async (id, num) => {
    try {
      const res = await api.post(`/subscriptions/${id}/generate-invoice`);
      toast.success(res.data.message || `Invoice ${res.data.invoiceNumber} generated!`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate invoice');
    }
  };

  const handlePause = async (id, num) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      toast.info(`Subscription ${num} has been paused.`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pause subscription');
    }
  };

  const handleResume = async (id, num) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      toast.success(`Subscription ${num} resumed to Active!`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resume subscription');
    }
  };

  const handleRenew = async (id, num) => {
    try {
      const res = await api.post(`/subscriptions/${id}/renew`);
      toast.success(`Subscription ${num} renewed! New expiry: ${res.data.newExpiry}`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to renew subscription');
    }
  };

  const handleClose = async (id, num) => {
    if (!window.confirm(`Are you sure you want to close subscription ${num}?`)) return;
    try {
      await api.post(`/subscriptions/${id}/close`);
      toast.warning(`Subscription ${num} closed.`);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close subscription');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      Confirmed: 'bg-amber-50 text-amber-700 border-amber-200/80',
      Draft: 'bg-slate-100 text-slate-700 border-slate-200/80',
      Quotation: 'bg-blue-50 text-blue-700 border-blue-200/80',
      Paused: 'bg-purple-50 text-purple-700 border-purple-200/80',
      Closed: 'bg-rose-50 text-rose-700 border-rose-200/80',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${map[status] || 'bg-slate-100'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === 'Active' ? 'bg-emerald-500 animate-pulse' : status === 'Confirmed' ? 'bg-amber-500' : 'bg-slate-400'
        }`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full Lifecycle Management: Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Subscription
        </button>
      </div>

      {/* Lifecycle Flow Graphic */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <div className="min-w-[600px] flex items-center justify-between text-xs font-bold text-slate-500">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Lifecycle Pipeline:</span>
          {['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'].map((stage, idx) => (
            <React.Fragment key={stage}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-slate-800">{stage}</span>
              </div>
              {idx < 4 && <span className="text-slate-300">➔</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, customer, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase text-[10px] mr-1">Filter:</span>
          {['', 'Active', 'Confirmed', 'Draft', 'Paused', 'Closed'].map((st) => (
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

      {/* Subscriptions Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4">Customer & Account</th>
                <th className="py-3 px-3">Plan / Cadence</th>
                <th className="py-3 px-3">Lifecycle Status</th>
                <th className="py-3 px-3">Next Billing</th>
                <th className="py-3 px-3">Contract Expiry</th>
                <th className="py-3 px-3 text-right">Value</th>
                <th className="py-3 px-4 text-center">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">No subscriptions found matching query.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                      {sub.subscription_number}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{sub.company_name || sub.customer_email}</div>
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-semibold text-slate-800">{sub.plan_name}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {sub.billing_interval}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      {getStatusBadge(sub.status)}
                    </td>

                    <td className="py-4 px-3 font-mono font-semibold text-slate-700">
                      {sub.next_billing_date || '—'}
                    </td>

                    <td className="py-4 px-3 font-mono text-slate-500 text-[11px]">
                      {sub.expiry_date || 'Ongoing'}
                    </td>

                    <td className="py-4 px-3 text-right font-black text-slate-900 text-sm">
                      ₹{Number(sub.total_amount).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Generate On-Demand Invoice */}
                        {['Active', 'Confirmed'].includes(sub.status) && (
                          <button
                            onClick={() => handleGenerateInvoice(sub.id, sub.subscription_number)}
                            title="Generate Next Recurring Invoice"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pause / Resume */}
                        {sub.status === 'Active' && sub.can_pause === 1 && (
                          <button
                            onClick={() => handlePause(sub.id, sub.subscription_number)}
                            title="Pause Subscription"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleResume(sub.id, sub.subscription_number)}
                            title="Resume Subscription"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Renew */}
                        {sub.can_renew === 1 && sub.status !== 'Closed' && (
                          <button
                            onClick={() => handleRenew(sub.id, sub.subscription_number)}
                            title="Renew License (+1 Year)"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Close Early */}
                        {sub.status !== 'Closed' && sub.can_close_early === 1 && (
                          <button
                            onClick={() => handleClose(sub.id, sub.subscription_number)}
                            title="Close Subscription"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View Item Breakdown Modal */}
                        <button
                          onClick={() => setSelectedSub(sub)}
                          title="View Full Line Items Breakdown"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Line Items Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">
                  Subscription Summary
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedSub.subscription_number}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedSub.customer_name} ({selectedSub.company_name})</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50 text-xs space-y-3">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block">
                Configured Products & Variants
              </span>
              {selectedSub.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-200/60 last:border-none">
                  <div>
                    <span className="font-bold text-slate-900">{it.product_name}</span>
                    {it.variant_name && (
                      <span className="text-indigo-600 font-bold block text-[11px]">
                        Variant: {it.variant_name}
                      </span>
                    )}
                    <span className="text-slate-500 block text-[11px] font-medium">
                      Qty: {it.quantity} seat(s) × ₹{Number(it.unit_price).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 font-mono">
                    ₹{Number(it.line_total).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50/80 p-4 border border-slate-200 rounded-2xl">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{Number(selectedSub.subtotal).toLocaleString()}</span>
              </div>
              {selectedSub.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied:</span>
                  <span>-₹{Number(selectedSub.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxes (GST):</span>
                <span className="font-semibold text-slate-800">₹{Number(selectedSub.tax_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Recurring Value:</span>
                <span className="text-indigo-600">₹{Number(selectedSub.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSub(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewSubscriptionModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            fetchSubscriptions();
            toast.success('Subscription successfully created and activated!');
          }}
        />
      )}
    </div>
  );
};
