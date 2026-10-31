import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import {
  PackageCheck,
  Plus,
  Layers,
  Calendar,
  CheckCircle,
  Tag,
  DollarSign,
  Trash2,
  X,
  TrendingUp,
  Percent,
  Sparkles
} from 'lucide-react';
import api from '../api/client';

export const ProductsPlansPage = () => {
  const toast = useToast();
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
      toast.error('Failed to fetch products and plans');
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
      toast.success(`Product "${productForm.name}" created successfully!`);
      setShowProductModal(false);
      setProductForm({ name: '', type: 'Software', sales_price: '', cost_price: '', notes: '', variant_name: '', variant_price: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create product');
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
      toast.success(`Variant "${variantForm.variant_name}" attached to product!`);
      setShowVariantModal(null);
      setVariantForm({ variant_name: '', additional_price: '', sku: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to add variant');
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
      toast.success(`Subscription plan "${planForm.name}" launched!`);
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
      toast.error('Failed to create plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products & Subscription Plans</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure software offerings, brand variants (e.g. Odoo Brand +₹560), and recurring cadences
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product Offering
            </button>
          ) : (
            <button
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Billing Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/90 space-x-6 text-xs font-black">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors ${
            activeTab === 'products'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Products & Add-on Modules ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 transition-colors ${
            activeTab === 'plans'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Recurring Plans ({plans.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md ${
                    prod.type === 'Software' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {prod.type}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 font-mono">₹{prod.sales_price.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 block font-medium">Cost: ₹{prod.cost_price}</span>
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-base">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prod.notes || 'Brightloop business offering'}</p>

                {/* Variants List */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>Configured Variants</span>
                    <button
                      onClick={() => setShowVariantModal(prod.id)}
                      className="text-indigo-600 hover:text-indigo-800 normal-case font-bold"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {prod.variants?.length > 0 ? (
                    <div className="space-y-1.5">
                      {prod.variants.map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-xs">
                          <span className="font-bold text-slate-800">{v.variant_name}</span>
                          <span className="font-black text-indigo-700 font-mono">+₹{v.additional_price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No variants configured (standard only)</p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold text-slate-600">Margin: ₹{(prod.sales_price - prod.cost_price).toLocaleString()}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
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
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    {plan.billing_interval}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold font-mono">Min: {plan.minimum_quantity}</span>
                </div>

                <h3 className="font-black text-slate-900 text-lg">{plan.name}</h3>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-black text-slate-900 font-mono">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-mono"> / {plan.billing_interval}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{plan.description || 'Full platform capabilities'}</p>

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
                    <span className="font-bold text-slate-700">{plan.can_pause ? 'Allowed' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allows Renew:</span>
                    <span className="font-bold text-slate-700">{plan.can_renew ? 'Allowed' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Subscribers:</span>
                <span className="font-black text-indigo-700 font-mono text-sm">{plan.active_subscriber_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Business Management Software"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                    placeholder="1000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  placeholder="400"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-slate-700 block uppercase text-[10px] tracking-wider">
                  Initial Variant (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={productForm.variant_name}
                    onChange={(e) => setProductForm({ ...productForm, variant_name: e.target.value })}
                    placeholder="e.g. Odoo Brand"
                    className="border border-slate-200 rounded-xl p-2 text-xs bg-white font-medium"
                  />
                  <input
                    type="number"
                    value={productForm.variant_price}
                    onChange={(e) => setProductForm({ ...productForm, variant_price: e.target.value })}
                    placeholder="Add ₹560"
                    className="border border-slate-200 rounded-xl p-2 text-xs bg-white font-mono font-semibold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all mt-2"
              >
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Variant to Product</h3>
              <button onClick={() => setShowVariantModal(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVariant} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Variant Name</label>
                <input
                  type="text"
                  required
                  value={variantForm.variant_name}
                  onChange={(e) => setVariantForm({ ...variantForm, variant_name: e.target.value })}
                  placeholder="e.g. Odoo Brand Connector"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Price (₹)</label>
                <input
                  type="number"
                  required
                  value={variantForm.additional_price}
                  onChange={(e) => setVariantForm({ ...variantForm, additional_price: e.target.value })}
                  placeholder="560"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all mt-2"
              >
                Save Variant
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create Subscription Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Professional Monthly"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cadence / Interval</label>
                  <select
                    value={planForm.billing_interval}
                    onChange={(e) => setPlanForm({ ...planForm, billing_interval: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Quantity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  value={planForm.minimum_quantity}
                  onChange={(e) => setPlanForm({ ...planForm, minimum_quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono"
                />
              </div>
              <div className="space-y-2 pt-2 text-slate-700 font-semibold">
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
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all mt-2"
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
