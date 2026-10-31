import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';

export const StaffManagementPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff');
      setStaff(res.data.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/auth/staff', form);
      setSuccess(`Staff member ${res.data.staff.name} added successfully.`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff member.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-only controls to provision operational staff accounts with restricted permissions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {success}
          </span>
          <button onClick={() => setSuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Role / Permissions</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">Loading staff directory...</td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">No staff accounts registered.</td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{s.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Operations Staff
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{s.phone || '—'}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                    {s.created_at?.split(' ')[0] || s.created_at?.split('T')[0]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Alex Staff"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@brightloop.com"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars, uppercase, lowercase, special char"
                  className="w-full border rounded-lg p-2 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must contain &gt;8 chars, uppercase, lowercase, special character (e.g. Staff@12345!)</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43211"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 mt-2"
              >
                Provision Staff Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

