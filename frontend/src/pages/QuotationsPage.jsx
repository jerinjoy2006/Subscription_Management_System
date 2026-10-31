import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Copy,
  User,
  Calendar,
  X
} from 'lucide-react';
import api from '../api/client';

export const QuotationsPage = () => {
  const toast = useToast();
  const [quotations, setQuotations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    customer_id: '',
    plan_id: '',
    validity_days: 15,
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, tRes, cRes, pRes, prRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/quotations/templates'),
        api.get('/customers'),
        api.get('/plans'),
        api.get('/products')
      ]);
      setQuotations(qRes.data.quotations || []);
      setTemplates(tRes.data.templates || []);
      setCustomers(cRes.data.customers || []);
      setPlans(planRes.data.plans || []);
      setProducts(prRes.data.products || []);

      if (cRes.data.customers?.length > 0) {
        setQuoteForm((prev) => ({ ...prev, customer_id: cRes.data.customers[0].id }));
      }
      if (pRes.data.plans?.length > 0) {
        setQuoteForm((prev) => ({ ...prev, plan_id: pRes.data.plans[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotations pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConvertToSubscription = async (quoteId, quoteNum) => {
    try {
      const res = await api.post(`/quotations/${quoteId}/convert`);
      toast.success(res.data.message || `Quotation ${quoteNum} converted into active subscription!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to convert quotation: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const defaultProd = products[0];
      if (!defaultProd) {
        toast.error('No products available to quote');
        return;
      }

      await api.post('/quotations', {
        customer_id: quoteForm.customer_id,
        plan_id: quoteForm.plan_id,
        validity_days: Number(quoteForm.validity_days),
        notes: quoteForm.notes || 'Official Enterprise Proposal',
        items: [
          {
            product_id: defaultProd.id,
            variant_id: defaultProd.variants?.[0]?.id || null,
            quantity: 1,
            unit_price: defaultProd.sales_price + (defaultProd.variants?.[0]?.additional_price || 0),
            tax_rate: 18
          }
        ]
      });

      toast.success('Quotation generated successfully!');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create quotation');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quotations & Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn customer quotes into active subscriptions with 1-click conversion
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Quotation Offer
        </button>
      </div>

      {/* Section 1: Pre-Configured Templates */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Copy className="w-4 h-4 text-indigo-600" /> Pre-Configured Quotation Templates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">
                    {tpl.plan_name || 'Standard Plan'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Valid {tpl.validity_days} days</span>
                </div>

                <h3 className="font-black text-slate-900 text-base mt-1">{tpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.notes}</p>

                {/* Pre-bundled lines */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider block">
                    Bundled Products & Add-ons:
                  </span>
                  {tpl.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-slate-800">
                      <div>
                        <span className="font-bold">{it.product_name}</span>
                        {it.variant_name && (
                          <span className="text-indigo-600 font-bold ml-1.5 text-[11px]">
                            ({it.variant_name})
                          </span>
                        )}
                      </div>
                      <span className="font-black font-mono text-slate-900">₹{Number(it.unit_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Rapid quotation generator for sales team</span>
                <span className="text-indigo-600 font-bold">Standard Suite</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Active Quotations Pipeline */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Quotations Pipeline
        </h2>

        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-3">Plan Offering</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-3 text-right">Quote Value</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">Loading pipeline...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">No active quotations in pipeline.</td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-700">{q.quotation_number}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{q.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{q.company_name}</div>
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-800">{q.plan_name}</td>
                    <td className="py-4 px-3 font-mono text-slate-600">{q.valid_until}</td>
                    <td className="py-4 px-3 text-right font-black text-slate-900 text-sm">₹{Number(q.total_amount).toLocaleString()}</td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        q.status === 'converted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${q.status === 'converted' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {q.status !== 'converted' ? (
                        <button
                          onClick={() => handleConvertToSubscription(q.id, q.quotation_number)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
                        >
                          <span>Convert to Subscription</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Active Subscription</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create New Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={quoteForm.customer_id}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customer_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={quoteForm.plan_id}
                  onChange={(e) => setQuoteForm({ ...quoteForm, plan_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} ({p.billing_interval})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={quoteForm.validity_days}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validity_days: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proposal Notes</label>
                <textarea
                  rows="2"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  placeholder="Terms, custom deliverables, or discounts..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                Generate & Dispatch Quote
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
