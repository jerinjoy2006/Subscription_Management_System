import React, { useState, useEffect } from 'react';
import { Percent, Plus, Tag, ShieldCheck, CheckCircle, Calendar, Hash } from 'lucide-react';
import api from '../api/client';

export const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);

  const [discountForm, setDiscountForm] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    min_quantity: 1,
    min_purchase_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_usage_limit: 100
  });

  const [taxForm, setTaxForm] = useState({
    name: '',
    rate_percent: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [discRes, taxRes] = await Promise.all([
        api.get('/discounts'),
        api.get('/taxes')
      ]);
      setDiscounts(discRes.data.discounts || []);
      setTaxes(taxRes.data.taxes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/discounts', {
        ...discountForm,
        value: Number(discountForm.value),
        min_quantity: Number(discountForm.min_quantity || 0),
        min_purchase_amount: Number(discountForm.min_purchase_amount || 0),
        max_usage_limit: Number(discountForm.max_usage_limit || 100)
      });
      setShowDiscountModal(false);
      setDiscountForm({
        code: '',
        name: '',
        type: 'percentage',
        value: '',
        min_quantity: 1,
        min_purchase_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        max_usage_limit: 100
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create discount');
    }
  };

  const handleCreateTax = async (e) => {
    e.preventDefault();
    try {
      await api.post('/taxes', {
        name: taxForm.name,
        rate_percent: Number(taxForm.rate_percent)
      });
      setShowTaxModal(false);
      setTaxForm({ name: '', rate_percent: '' });
      fetchData();
    } catch (err) {
      alert('Failed to create tax rule');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Taxes & Discount Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin controls for automated billing discounts, coupons, and statutory tax rates
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDiscountModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Discount Rule
          </button>
          <button
            onClick={() => setShowTaxModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Tax Rate
          </button>
        </div>
      </div>

      {/* Section 1: Discounts & Coupons */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" /> Active Discount Rules & Coupons
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg text-xs">
                    {d.code}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} FLAT`}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{d.name}</h3>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Min Seat Quantity:</span>
                    <span className="font-bold text-slate-800">{d.min_quantity || 'No min'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Date Window:</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {d.start_date || 'Any'} → {d.end_date || 'Perpetual'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Count / Cap:</span>
                    <span className="font-semibold text-slate-800">
                      {d.current_usage_count} / {d.max_usage_limit} used
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Applies on next invoice</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Taxes */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Percent className="w-4 h-4 text-slate-700" /> Automated Tax Rules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {taxes.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                <span className="text-xs text-slate-500">Auto-applied to line items</span>
              </div>
              <span className="text-xl font-black text-slate-900 font-mono">{t.rate_percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Discount Rule</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleCreateDiscount} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BULK15"
                  className="w-full border rounded-lg p-2 font-mono uppercase text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  placeholder="e.g. 15% Bulk Seat Discount"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    placeholder="15"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Quantity (Seats)</label>
                  <input
                    type="number"
                    value={discountForm.min_quantity}
                    onChange={(e) => setDiscountForm({ ...discountForm, min_quantity: e.target.value })}
                    placeholder="10"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Usages</label>
                  <input
                    type="number"
                    value={discountForm.max_usage_limit}
                    onChange={(e) => setDiscountForm({ ...discountForm, max_usage_limit: e.target.value })}
                    placeholder="100"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 mt-2"
              >
                Save Discount Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Tax Rule</h3>
              <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleCreateTax} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Name</label>
                <input
                  type="text"
                  required
                  value={taxForm.name}
                  onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                  placeholder="e.g. GST 18%"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Percentage Rate (%)</label>
                <input
                  type="number"
                  required
                  value={taxForm.rate_percent}
                  onChange={(e) => setTaxForm({ ...taxForm, rate_percent: e.target.value })}
                  placeholder="18"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 mt-2"
              >
                Save Tax Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

