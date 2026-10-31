import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { PaymentModal } from '../components/PaymentModal';
import { NewSubscriptionModal } from '../components/NewSubscriptionModal';
import {
  Repeat,
  FileText,
  CreditCard,
  ShoppingBag,
  Pause,
  Play,
  RotateCw,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import api from '../api/client';

export const CustomerPortalPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlanForSub, setSelectedPlanForSub] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, invRes, planRes, prodRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/invoices'),
        api.get('/plans'),
        api.get('/products')
      ]);
      setSubscriptions(subRes.data.subscriptions || []);
      setInvoices(invRes.data.invoices || []);
      setPlans(planRes.data.plans || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePause = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      showToast('Subscription paused.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      showToast('Subscription resumed to Active!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume');
    }
  };

  const handleRenew = async (id) => {
    try {
      const res = await api.post(`/subscriptions/${id}/renew`);
      showToast(`Subscription renewed! New expiry: ${res.data.newExpiry}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to renew');
    }
  };

  const pendingInvoices = invoices.filter((i) => i.status === 'Confirmed');
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-brand-300">Customer Self-Service Portal</span>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Welcome, {user?.name || 'Customer'}
          </h1>
          <p className="text-xs text-indigo-200 mt-0.5">
            {user?.company_name || 'Individual'} • Manage subscriptions, renew licenses, and pay invoices instantly
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPlanForSub(null);
            setShowSubscribeModal(true);
          }}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Browse Catalog & Subscribe
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Outstanding Invoices Alert if any */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-xs">
                You have {pendingInvoices.length} outstanding invoice(s)
              </h4>
              <p className="text-[11px] text-amber-700">
                Total due: ₹{pendingInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPayingInvoice(pendingInvoices[0])}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            Pay Now ({pendingInvoices[0].invoice_number})
          </button>
        </div>
      )}

      {/* Section 1: My Subscriptions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-indigo-600" /> My Subscriptions ({subscriptions.length})
          </h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
            You don't have any active subscriptions yet. Browse the catalog below to subscribe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-700">{sub.subscription_number}</span>
                      <h3 className="font-bold text-slate-900 text-base">{sub.plan_name}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {/* Configured Products & Variants */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    {sub.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{it.product_name} {it.variant_name && <span className="text-indigo-600 font-semibold">({it.variant_name})</span>}</span>
                        <span className="font-mono font-bold">Qty: {it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-[11px] text-slate-400">Next Billing:</span>
                      <span className="font-semibold text-slate-800">{sub.next_billing_date || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400">Recurring Price:</span>
                      <span className="font-bold text-slate-900">₹{Number(sub.total_amount).toLocaleString()} / {sub.billing_interval}</span>
                    </div>
                  </div>
                </div>

                {/* Self-Service Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {sub.status === 'Active' && sub.can_pause === 1 && (
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}
                    {sub.status === 'Paused' && (
                      <button
                        onClick={() => handleResume(sub.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    )}
                    {sub.can_renew === 1 && (
                      <button
                        onClick={() => handleRenew(sub.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" /> Renew License
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Terms: {sub.payment_terms}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: My Invoices */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" /> Billing History & Invoices
        </h2>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.billing_period_start} to {inv.billing_period_end}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{inv.due_date}</td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900">₹{Number(inv.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActiveInvoiceId(inv.id)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" /> Pay Now
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

      {/* Section 3: Available Plans Catalog for Self-Service */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" /> Explore Plans & Add-ons
          </h2>
          <p className="text-xs text-slate-500">Subscribe or expand your Brightloop suite with instant automated activation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {p.billing_interval}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">{p.name}</h3>
                <div className="my-2">
                  <span className="text-2xl font-black text-slate-900">₹{p.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-mono"> / {p.billing_interval}</span>
                </div>
                <p className="text-xs text-slate-500">{p.description || 'Full platform capabilities'}</p>
                <div className="mt-3 text-[11px] text-slate-400">Min seats: {p.minimum_quantity}</div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlanForSub(p.id);
                  setShowSubscribeModal(true);
                }}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {activeInvoiceId && (
        <InvoiceDetailModal
          invoiceId={activeInvoiceId}
          onClose={() => setActiveInvoiceId(null)}
          onPayClick={(inv) => {
            setActiveInvoiceId(null);
            setPayingInvoice(inv);
          }}
          onInvoiceUpdated={() => fetchData()}
        />
      )}

      {/* Payment Modal */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaymentSuccess={() => {
            fetchData();
            showToast('Payment settled! Invoice marked as Paid.');
          }}
        />
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <NewSubscriptionModal
          initialPlanId={selectedPlanForSub}
          customerMode={true}
          onClose={() => setShowSubscribeModal(false)}
          onSuccess={() => {
            fetchData();
            showToast('Subscription created and activated!');
          }}
        />
      )}
    </div>
  );
};

