import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  Printer,
  Sparkles,
  Zap,
  Building2
} from 'lucide-react';
import api from '../api/client';

export const CustomerPortalPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlanForSub, setSelectedPlanForSub] = useState(null);

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
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePause = async (id, num) => {
    try {
      await api.post(`/subscriptions/${id}/pause`);
      toast.info(`Subscription ${num} paused.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pause');
    }
  };

  const handleResume = async (id, num) => {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      toast.success(`Subscription ${num} resumed to Active!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resume');
    }
  };

  const handleRenew = async (id, num) => {
    try {
      const res = await api.post(`/subscriptions/${id}/renew`);
      toast.success(`Subscription ${num} renewed! New expiry: ${res.data.newExpiry}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to renew');
    }
  };

  const pendingInvoices = invoices.filter((i) => i.status === 'Confirmed');
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest bg-brand-500/20 text-brand-300 border border-brand-400/30 px-3 py-1 rounded-full">
                Customer Self-Service Portal
              </span>
              <span className="text-xs text-indigo-200">Rahul Sharma</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-white">
              {user?.company_name || 'Apex Retail Shop'}
            </h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
              Manage your software licenses, pause or renew subscriptions, and pay recurring invoices with automated receipt generation.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedPlanForSub(null);
              setShowSubscribeModal(true);
            }}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Catalog & Subscribe
          </button>
        </div>
      </div>

      {/* Outstanding Invoices Alert if any */}
      {pendingInvoices.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                You have {pendingInvoices.length} outstanding invoice(s) due
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Total balance payable: <span className="font-black font-mono">₹{pendingInvoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setPayingInvoice(pendingInvoices[0])}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Pay Due Invoice ({pendingInvoices[0].invoice_number})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 1: My Subscriptions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-indigo-600" /> My Active Licenses & Subscriptions
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {subscriptions.length} active contract(s)
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-xs text-slate-400">
            You don't have any active subscriptions yet. Browse the catalog below to subscribe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-700">{sub.subscription_number}</span>
                      <h3 className="font-black text-slate-900 text-lg mt-0.5">{sub.plan_name}</h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      sub.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'}`}></span>
                      {sub.status}
                    </span>
                  </div>

                  {/* Configured Products & Variants */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Licensed Modules:
                    </span>
                    {sub.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800">
                        <div>
                          <span className="font-bold">{it.product_name}</span>
                          {it.variant_name && (
                            <span className="text-indigo-600 font-bold ml-1.5 text-[11px]">
                              ({it.variant_name})
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200/60">
                          {it.quantity} seat(s)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Next Billing:</span>
                      <span className="font-mono font-bold text-slate-800 mt-0.5 block">{sub.next_billing_date || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Recurring Price:</span>
                      <span className="font-black text-slate-900 mt-0.5 block text-sm">
                        ₹{Number(sub.total_amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">/{sub.billing_interval}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Self-Service Controls */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {sub.status === 'Active' && sub.can_pause === 1 && (
                      <button
                        onClick={() => handlePause(sub.id, sub.subscription_number)}
                        className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    {sub.status === 'Paused' && (
                      <button
                        onClick={() => handleResume(sub.id, sub.subscription_number)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    )}
                    {sub.can_renew === 1 && (
                      <button
                        onClick={() => handleRenew(sub.id, sub.subscription_number)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Renew License (+1 Yr)
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">Terms: {sub.payment_terms}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Invoices */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" /> Billing History & Invoices
        </h2>

        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
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
                  <td colSpan="6" className="py-10 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-4 px-4 text-slate-600">{inv.billing_period_start} → {inv.billing_period_end}</td>
                    <td className="py-4 px-3 font-mono text-slate-600 font-semibold">{inv.due_date}</td>
                    <td className="py-4 px-3 text-right font-black text-slate-900 text-sm">₹{Number(inv.total_amount).toLocaleString()}</td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActiveInvoiceId(inv.id)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
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

      {/* Section 3: Available Plans Catalog */}
      <div id="catalog" className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" /> Explore Plans & Add-on Modules
          </h2>
          <p className="text-xs text-slate-500">Subscribe or expand your Brightloop suite with instant automated activation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                  {p.billing_interval}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2.5">{p.name}</h3>
                <div className="my-2.5">
                  <span className="text-2xl font-black text-slate-900">₹{p.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-mono"> / {p.billing_interval}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{p.description || 'Full platform capabilities'}</p>
                <div className="mt-3 text-[11px] text-slate-400 font-medium">Min quantity: {p.minimum_quantity} seats</div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlanForSub(p.id);
                  setShowSubscribeModal(true);
                }}
                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200"
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
            toast.success('Payment settled! Invoice marked as Paid.');
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
            toast.success('New subscription created and activated!');
          }}
        />
      )}
    </div>
  );
};
