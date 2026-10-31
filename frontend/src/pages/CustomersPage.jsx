import React, { useState, useEffect } from 'react';
import { Users, Search, Building2, Mail, Phone, Repeat, Plus, X, Eye, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import api from '../api/client';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Add Customer modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
    address: '',
    gstin: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Customer Detail modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenDetails = async (customerId) => {
    setSelectedCustomerId(customerId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      setCustomerDetails(res.data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCustomerId(null);
    setCustomerDetails(null);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/customers', formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        company_name: '',
        phone: '',
        address: '',
        gstin: ''
      });
      await fetchCustomers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create customer account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered business subscribers, active contracts, and lifetime spend
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, contact person, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Customer / Company</th>
              <th className="py-3 px-4">Contact Details</th>
              <th className="py-3 px-3 text-center">Total Contracts</th>
              <th className="py-3 px-3 text-center">Active Subs</th>
              <th className="py-3 px-4 text-right">Lifetime Settled</th>
              <th className="py-3 px-3">Onboarded</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">Loading customer accounts...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">No customers found.</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{c.company_name || c.name}</div>
                    <div className="text-slate-500 text-[11px]">Contact: {c.name}</div>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                    {c.subscription_count || 0}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {c.active_subscriptions || 0} Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    ₹{Number(c.total_spent || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                    {c.created_at?.split(' ')[0] || c.created_at?.split('T')[0]}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleOpenDetails(c.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Add New Customer
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Mahindra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Apex Tech Ltd"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State, PIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 360 Details Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Customer 360° View
                </h2>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails || !customerDetails ? (
              <div className="py-16 text-center text-slate-400">Loading customer profile...</div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 mt-4 text-xs">
                {/* Profile Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Company / Name</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {customerDetails.customer.company_name || customerDetails.customer.name}
                    </p>
                    <p className="text-slate-500">{customerDetails.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contact</span>
                    <p className="text-slate-700 font-medium mt-0.5">{customerDetails.customer.email}</p>
                    <p className="text-slate-500">{customerDetails.customer.phone || 'No phone'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">GSTIN / Tax</span>
                    <p className="font-mono text-slate-700 font-bold mt-0.5">
                      {customerDetails.customer.gstin || 'Unregistered'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
                    <p className="text-slate-600 mt-0.5 line-clamp-2">
                      {customerDetails.customer.address || 'No address specified'}
                    </p>
                  </div>
                </div>

                {/* Subscriptions */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-indigo-600" />
                    Subscription Contracts ({customerDetails.subscriptions?.length || 0})
                  </h3>
                  {customerDetails.subscriptions?.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-slate-400 text-center">No subscriptions found</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Product / Plan</th>
                            <th className="p-2.5">Interval</th>
                            <th className="p-2.5 text-right">Recurring Fee</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerDetails.subscriptions.map((s) => (
                            <tr key={s.id}>
                              <td className="p-2.5 font-mono font-bold text-indigo-600">{s.code}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{s.plan_name}</td>
                              <td className="p-2.5 capitalize text-slate-600">{s.billing_interval}</td>
                              <td className="p-2.5 text-right font-black text-slate-900">₹{Number(s.recurring_amount).toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                  s.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  s.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Invoices ({customerDetails.invoices?.length || 0})
                  </h3>
                  {customerDetails.invoices?.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-slate-400 text-center">No invoices found</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Invoice #</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Due Date</th>
                            <th className="p-2.5 text-right">Total</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerDetails.invoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="p-2.5 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                              <td className="p-2.5 font-mono text-slate-500">{inv.invoice_date?.split(' ')[0] || inv.invoice_date}</td>
                              <td className="p-2.5 font-mono text-slate-500">{inv.due_date?.split(' ')[0] || inv.due_date}</td>
                              <td className="p-2.5 text-right font-black text-slate-900">₹{Number(inv.total_amount).toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                  inv.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Payment Ledger ({customerDetails.payments?.length || 0})
                  </h3>
                  {customerDetails.payments?.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-slate-400 text-center">No payment transactions recorded</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Payment Ref</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5 text-right">Settled Amount</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerDetails.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-2.5 font-mono font-bold text-slate-800">{p.payment_code}</td>
                              <td className="p-2.5 font-mono text-slate-500">{p.payment_date?.split(' ')[0] || p.payment_date}</td>
                              <td className="p-2.5 text-slate-700 capitalize">{p.payment_method}</td>
                              <td className="p-2.5 text-right font-black text-emerald-600">₹{Number(p.amount).toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


