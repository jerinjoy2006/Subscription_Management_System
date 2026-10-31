import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layers, Mail, Lock, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../../api/client';

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenParam || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resetLink, setResetLink] = useState(null);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.token) {
        setResetLink(res.data.resetLink);
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setMessage(res.data.message);
      setToken('');
      setResetLink(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-brand-500 text-white shadow-lg mb-3">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Recovery</h2>
        <p className="text-xs text-slate-500 mt-1">Reset your Brightloop access credentials</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!token ? (
            <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enter your registered email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {loading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enter New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, symbol"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {loading ? 'Resetting...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-xs">
            <Link to="/login" className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

