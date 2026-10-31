import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Copy
} from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export const QuotationsPage = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, tRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/quotations/templates')
      ]);
      setQuotations(qRes.data.quotations || []);
      setTemplates(tRes.data.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConvertToSubscription = async (quoteId) => {
    try {
      const res = await api.post(`/quotations/${quoteId}/convert`);
      setToastMessage(res.data.message);
      fetchData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      alert('Failed to convert quotation: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotations & Quotation Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured offer templates for sales reps • Instant conversion into active recurring subscriptions
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

      {/* Section 1: Quotation Templates */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Copy className="w-4 h-4 text-indigo-600" /> Pre-Configured Quotation Templates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-100">
                    Template: {tpl.plan_name || 'Multi-Plan'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Valid {tpl.validity_days} days</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{tpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tpl.notes}</p>

                {/* Pre-bundled lines */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider block">Bundled Lines:</span>
                  {tpl.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-slate-700">
                      <div>
                        <span className="font-semibold">{it.product_name}</span>
                        {it.variant_name && <span className="text-indigo-600 ml-1 text-[11px]">({it.variant_name})</span>}
                      </div>
                      <span className="font-bold font-mono text-slate-800">₹{it.unit_price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Fast quote generation for enterprise clients</span>
                <span className="text-indigo-600 font-bold">Standard Suite</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Active Quotations */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-700" /> Quotations Pipeline
        </h2>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-3 text-right">Quote Value</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No active quotations in pipeline.</td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{q.quotation_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{q.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{q.company_name}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{q.plan_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{q.valid_until}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">₹{Number(q.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        q.status === 'converted' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {q.status !== 'converted' ? (
                        <button
                          onClick={() => handleConvertToSubscription(q.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors"
                        >
                          Convert to Subscription <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Converted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
