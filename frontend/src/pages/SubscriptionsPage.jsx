import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

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

  const handlePause = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      showMessage('Subscription paused successfully.');
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause subscription');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      showMessage('Subscription resumed to Active.');
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume subscription');
    }
  };

  const handleRenew = async (id) => {
    try {
      const res = await api.post(`/subscriptions/${id}/renew`);
      showMessage(`Subscription renewed! New expiry: ${res.data.newExpiry}`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to renew subscription');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this subscription?')) return;
    try {
      await api.post(`/subscriptions/${id}/close`);
      showMessage('Subscription closed.');
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close subscription');
    }
  };

  const showMessage = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Confirmed: 'bg-amber-100 text-amber-800 border-amber-200',
      Draft: 'bg-slate-100 text-slate-700 border-slate-200',
      Quotation: 'bg-blue-100 text-blue-800 border-blue-200',
      Paused: 'bg-purple-100 text-purple-800 border-purple-200',
      Closed: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${map[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage subscription lifecycles: Draft → Quotation → Confirmed → Active → Closed
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Subscription
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, customer, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Status:</span>
          {['', 'Active', 'Confirmed', 'Draft', 'Paused', 'Closed'].map((st) => (
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

      {/* Subscriptions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Plan / Cadence</th>
                <th className="py-3 px-3">Lifecycle Status</th>
                <th className="py-3 px-3">Next Billing</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Recurring Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No subscriptions found matching query.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {sub.subscription_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{sub.company_name || sub.customer_email}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{sub.plan_name}</div>
                      <span className="text-[11px] capitalize text-slate-500 font-mono">
                        {sub.billing_interval}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {getStatusBadge(sub.status)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {sub.next_billing_date || '—'}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {sub.expiry_date || 'Ongoing'}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      ₹{Number(sub.total_amount).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Pause / Resume */}
                        {sub.status === 'Active' && sub.can_pause === 1 && (
                          <button
                            onClick={() => handlePause(sub.id)}
                            title="Pause Subscription"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleResume(sub.id)}
                            title="Resume Subscription"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Renew */}
                        {sub.can_renew === 1 && sub.status !== 'Closed' && (
                          <button
                            onClick={() => handleRenew(sub.id)}
                            title="Renew Subscription (+1 Year)"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Close Early */}
                        {sub.status !== 'Closed' && sub.can_close_early === 1 && (
                          <button
                            onClick={() => handleClose(sub.id)}
                            title="Close Subscription"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View Item Breakdown Modal */}
                        <button
                          onClick={() => setSelectedSub(sub)}
                          title="View Details"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Subscription Details</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedSub.subscription_number}</h3>
                <p className="text-xs text-slate-500">{selectedSub.customer_name} ({selectedSub.company_name})</p>
              </div>
              <button onClick={() => setSelectedSub(null)} className="p-1 text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Configured Products & Add-ons</span>
              {selectedSub.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60 last:border-none">
                  <div>
                    <span className="font-semibold text-slate-800">{it.product_name}</span>
                    {it.variant_name && <span className="text-indigo-600 block text-[11px]">Variant: {it.variant_name}</span>}
                    <span className="text-slate-500 block text-[11px]">Qty: {it.quantity} × ₹{it.unit_price}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{Number(it.line_total).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1 bg-white p-3 border border-slate-200 rounded-xl">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{Number(selectedSub.subtotal).toLocaleString()}</span>
              </div>
              {selectedSub.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{Number(selectedSub.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxes:</span>
                <span>₹{Number(selectedSub.tax_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{Number(selectedSub.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSub(null)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewSubscriptionModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            fetchSubscriptions();
            showMessage('New subscription created successfully!');
          }}
        />
      )}
    </div>
  );
};

