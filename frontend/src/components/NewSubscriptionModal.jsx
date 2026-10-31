import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  Layers
} from 'lucide-react';
import api from '../api/client';

export const NewSubscriptionModal = ({ onClose, onSuccess, initialPlanId = null, customerMode = false }) => {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || '');
  const [paymentTerms, setPaymentTerms] = useState('Immediate');
  const [items, setItems] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, prodRes, taxRes] = await Promise.all([
          api.get('/plans'),
          api.get('/products'),
          api.get('/taxes')
        ]);
        setPlans(planRes.data.plans || []);
        setProducts(prodRes.data.products || []);
        setTaxes(taxRes.data.taxes || []);

        if (!customerMode) {
          const custRes = await api.get('/customers');
          setCustomers(custRes.data.customers || []);
          if (custRes.data.customers?.length > 0) {
            setSelectedCustomerId(custRes.data.customers[0].id);
          }
        }

        if (initialPlanId) {
          setSelectedPlanId(initialPlanId);
        } else if (planRes.data.plans?.length > 0) {
          setSelectedPlanId(planRes.data.plans[0].id);
        }

        // Add first product by default
        if (prodRes.data.products?.length > 0) {
          const p = prodRes.data.products[0];
          setItems([
            {
              product_id: p.id,
              variant_id: p.variants?.[0]?.id || '',
              quantity: 1,
              unit_price: p.sales_price + (p.variants?.[0]?.additional_price || 0),
              tax_rate: taxRes.data.taxes?.[0]?.rate_percent || 18
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [initialPlanId, customerMode]);

  const handleProductChange = (index, productId) => {
    const p = products.find((prod) => prod.id === Number(productId));
    if (!p) return;
    const newItems = [...items];
    const defaultVariant = p.variants?.[0];
    const price = p.sales_price + (defaultVariant ? defaultVariant.additional_price : 0);
    newItems[index] = {
      ...newItems[index],
      product_id: p.id,
      variant_id: defaultVariant ? defaultVariant.id : '',
      unit_price: price
    };
    setItems(newItems);
  };

  const handleVariantChange = (index, variantId) => {
    const item = items[index];
    const p = products.find((prod) => prod.id === Number(item.product_id));
    if (!p) return;

    let price = p.sales_price;
    if (variantId) {
      const v = p.variants?.find((vr) => vr.id === Number(variantId));
      if (v) price += v.additional_price;
    }

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      variant_id: variantId || '',
      unit_price: price
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, Number(qty));
    setItems(newItems);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const p = products[0];
    setItems([
      ...items,
      {
        product_id: p.id,
        variant_id: p.variants?.[0]?.id || '',
        quantity: 1,
        unit_price: p.sales_price + (p.variants?.[0]?.additional_price || 0),
        tax_rate: taxes[0]?.rate_percent || 18
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unit_price), 0);
  const taxAmount = items.reduce(
    (sum, it) => sum + (Number(it.quantity) * Number(it.unit_price) * Number(it.tax_rate || 0)) / 100,
    0
  );

  let discountAmount = 0;
  if (couponResult?.valid) {
    discountAmount = couponResult.discountAmount;
  }
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleApplyCoupon = async () => {
    if (!discountCode.trim()) return;
    try {
      const totalQty = items.reduce((s, it) => s + Number(it.quantity), 0);
      const res = await api.post('/discounts/validate', {
        code: discountCode.trim(),
        quantity: totalQty,
        amount: subtotal
      });
      setCouponResult(res.data);
      setError(null);
    } catch (err) {
      setCouponResult({ valid: false, error: err.response?.data?.error || 'Invalid coupon' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const selectedPlan = plans.find((p) => p.id === Number(selectedPlanId));
    const totalQty = items.reduce((s, it) => s + Number(it.quantity), 0);
    if (selectedPlan && totalQty < selectedPlan.minimum_quantity) {
      setError(`The plan "${selectedPlan.name}" requires at least ${selectedPlan.minimum_quantity} seat(s). Currently: ${totalQty}`);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customer_id: customerMode ? undefined : selectedCustomerId,
        plan_id: selectedPlanId,
        payment_terms: paymentTerms,
        discount_code: couponResult?.valid ? discountCode.trim() : undefined,
        items,
        notes
      };

      const res = await api.post('/subscriptions', payload);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-up">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {customerMode ? 'Subscribe to Brightloop Plan' : 'Create New Customer Subscription'}
              </h3>
              <p className="text-xs text-slate-400">Configure recurring plan, seat quantity, and line items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Customer & Plan selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!customerMode && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company_name || c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Subscription Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                required
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price} ({p.billing_interval}) [Min Qty: {p.minimum_quantity}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
              >
                <option value="Immediate">Immediate / Due Upon Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days (Enterprise)</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider">Product & Add-on Lines</label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product / Add-on
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {items.map((it, idx) => {
                const currentProd = products.find((p) => p.id === Number(it.product_id));
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    {/* Product */}
                    <div className="col-span-4">
                      <select
                        value={it.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.sales_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant */}
                    <div className="col-span-3">
                      <select
                        value={it.variant_id}
                        onChange={(e) => handleVariantChange(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs"
                      >
                        <option value="">Standard Edition</option>
                        {currentProd?.variants?.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.variant_name} (+₹{v.additional_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        placeholder="Seats"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-center text-xs font-semibold"
                      />
                    </div>

                    {/* Line total */}
                    <div className="col-span-2 text-right font-bold text-slate-800">
                      ₹{(it.quantity * it.unit_price).toLocaleString()}
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Discount Coupon (e.g. BULK15, FLAT500)"
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs uppercase font-mono font-semibold flex-1"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs"
              >
                Apply
              </button>
            </div>
            {couponResult?.valid && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {couponResult.message}
              </div>
            )}
            {couponResult && !couponResult.valid && (
              <div className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {couponResult.error}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount:</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxes (18% GST):</span>
              <span className="font-semibold text-slate-800">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
              <span>Initial Recurring Total:</span>
              <span className="text-indigo-600">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Confirm Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
