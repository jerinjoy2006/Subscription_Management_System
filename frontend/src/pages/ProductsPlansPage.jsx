import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Plus,
  Layers,
  Calendar,
  CheckCircle,
  Tag,
  DollarSign,
  Trash2,
  X
} from 'lucide-react';
import api from '../api/client';

export const ProductsPlansPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(null); // holds product id

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'Software',
    sales_price: '',
    cost_price: '',
    notes: '',
    variant_name: '',
    variant_price: ''
  });

  const [variantForm, setVariantForm] = useState({
    variant_name: '',
    additional_price: '',
    sku: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    billing_interval: 'monthly',
    price: '',
    minimum_quantity: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_close_on_expiry: false,
    can_pause: true,
    can_renew: true,
    can_close_early: true,
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, planRes] = await Promise.all([
        api.get('/products'),
        api.get('/plans')
      ]);
      setProducts(prodRes.data.products || []);
      setPlans(planRes.data.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        type: productForm.type,
        sales_price: Number(productForm.sales_price),
        cost_price: Number(productForm.cost_price || 0),
        notes: productForm.notes,
        variants: productForm.variant_name
          ? [{ variant_name: productForm.variant_name, additional_price: Number(productForm.variant_price || 0) }]
          : []
      };
      await api.post('/products', payload);
      setShowProductModal(false);
      setProductForm({ name: '', type: 'Software', sales_price: '', cost_price: '', notes: '', variant_name: '', variant_price: '' });
      fetchData();
    } catch (err) {
      alert('Failed to create product');
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${showVariantModal}/variants`, {
        variant_name: variantForm.variant_name,
        additional_price: Number(variantForm.additional_price || 0),
        sku: variantForm.sku
      });
      setShowVariantModal(null);
      setVariantForm({ variant_name: '', additional_price: '', sku: '' });
      fetchData();
    } catch (err) {
      alert('Failed to add variant');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plans', {
        ...planForm,
        price: Number(planForm.price),
        minimum_quantity: Number(planForm.minimum_quantity)
      });
      setShowPlanModal(false);
      setPlanForm({
        name: '',
        billing_interval: 'monthly',
        price: '',
        minimum_quantity: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        auto_close_on_expiry: false,
        can_pause: true,
        can_renew: true,
        can_close_early: true,
        description: ''
      });
      fetchData();
    } catch (err) {
      alert('Failed to create plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products & Subscription Plans</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure software offerings, add-on modules, pricing tiers, and billing intervals
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          ) : (
            <button
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors ${
            activeTab === 'products'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Products & Add-ons ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 transition-colors ${
            activeTab === 'plans'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Billing Plans ({plans.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                    prod.type === 'Software' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {prod.type}
                  </span>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">₹{prod.sales_price.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 block">Cost: ₹{prod.cost_price}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{prod.notes || 'Brightloop business offering'}</p>

                {/* Variants List */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase">
                    <span>Configured Variants</span>
                    <button
                      onClick={() => setShowVariantModal(prod.id)}
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] normal-case font-bold"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {prod.variants?.length > 0 ? (
                    <div className="space-y-1">
                      {prod.variants.map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-xs">
                          <span className="font-semibold text-slate-700">{v.variant_name}</span>
                          <span className="font-bold text-indigo-700 font-mono">+₹{v.additional_price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No variants configured (standard only)</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>Margin: ₹{(prod.sales_price - prod.cost_price).toLocaleString()}</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {plan.billing_interval}
                  </span>
                  <span className="text-xs text-slate-400">Min: {plan.minimum_quantity} seats</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-mono"> / {plan.billing_interval}</span>
                </div>
                <p className="text-xs text-slate-500">{plan.description || 'Full platform capabilities'}</p>

                {/* Plan Rules / Governance */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Auto-close on expiry:</span>
                    <span className={`font-bold ${plan.auto_close_on_expiry ? 'text-amber-600' : 'text-slate-400'}`}>
                      {plan.auto_close_on_expiry ? 'Yes (Strict)' : 'No (Renewable)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allows Pause:</span>
                    <span className="font-semibold text-slate-700">{plan.can_pause ? 'Allowed' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allows Renew:</span>
                    <span className="font-semibold text-slate-700">{plan.can_renew ? 'Allowed' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Active subs:</span>
                <span className="font-bold text-indigo-700">{plan.active_subscriber_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Business Management Software"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                    placeholder="1000"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  placeholder="400"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <span className="font-bold text-slate-600 block">Initial Variant (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={productForm.variant_name}
                    onChange={(e) => setProductForm({ ...productForm, variant_name: e.target.value })}
                    placeholder="e.g. Odoo Brand"
                    className="border rounded p-1.5 text-xs bg-white"
                  />
                  <input
                    type="number"
                    value={productForm.variant_price}
                    onChange={(e) => setProductForm({ ...productForm, variant_price: e.target.value })}
                    placeholder="Additional ₹560"
                    className="border rounded p-1.5 text-xs bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
              >
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Variant to Product</h3>
              <button onClick={() => setShowVariantModal(null)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleAddVariant} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Variant Name</label>
                <input
                  type="text"
                  required
                  value={variantForm.variant_name}
                  onChange={(e) => setVariantForm({ ...variantForm, variant_name: e.target.value })}
                  placeholder="e.g. Odoo Brand Connector"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Price (₹)</label>
                <input
                  type="number"
                  required
                  value={variantForm.additional_price}
                  onChange={(e) => setVariantForm({ ...variantForm, additional_price: e.target.value })}
                  placeholder="560"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
              >
                Save Variant
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Subscription Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Professional Monthly"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Interval</label>
                  <select
                    value={planForm.billing_interval}
                    onChange={(e) => setPlanForm({ ...planForm, billing_interval: e.target.value })}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="999"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Quantity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  value={planForm.minimum_quantity}
                  onChange={(e) => setPlanForm({ ...planForm, minimum_quantity: e.target.value })}
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div className="space-y-1 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.auto_close_on_expiry}
                    onChange={(e) => setPlanForm({ ...planForm, auto_close_on_expiry: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Automatically close subscription when plan ends</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.can_pause}
                    onChange={(e) => setPlanForm({ ...planForm, can_pause: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Allow customers/staff to pause subscriptions</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
              >
                Create Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

