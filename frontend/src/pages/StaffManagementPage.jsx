import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../api/client';

export const StaffManagementPage = () => {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff');
      setStaff(res.data.staff || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/staff', form);
      toast.success(`Staff member "${res.data.staff.name}" provisioned successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add staff member.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-only controls to provision operational staff accounts with restricted permissions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Role / Scope</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Date Provisioned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">Loading staff directory...</td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">No staff accounts registered.</td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-4 px-4 font-mono text-slate-600">{s.email}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Operations Staff
                    </span>
                  </td>
                  <td className="py-4 px-3 text-slate-500 font-medium">{s.phone || '—'}</td>
                  <td className="py-4 px-3 font-mono text-slate-500 text-[11px]">
                    {s.created_at?.split(' ')[0] || s.created_at?.split('T')[0]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Alex Staff"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@brightloop.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars, uppercase, lowercase, special char"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must contain &gt;8 chars, uppercase, lowercase, symbol (e.g. Staff@12345!)</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43211"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all mt-2"
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
