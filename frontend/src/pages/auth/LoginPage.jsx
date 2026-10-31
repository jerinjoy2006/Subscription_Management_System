import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Layers, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleKey) => {
    const cred = DEMO_USERS[roleKey];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.password);
      toast.info(`Filled credentials for ${cred.role}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-brand-500 to-indigo-400 text-white shadow-xl shadow-indigo-500/25 mb-3.5 transform hover:rotate-3 transition-transform">
          <Layers className="w-8 h-8 stroke-[2.3]" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Subscript<span className="text-brand-400">IQ</span>
        </h2>
        <p className="text-xs text-indigo-200 mt-1 font-medium">
          Brightloop Software • Subscription & Recurring Revenue Engine
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-indigo-950/50 rounded-3xl sm:px-10 border border-white/20">
          <h3 className="text-base font-black text-slate-900 mb-4">Sign in to your account</h3>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Login Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 text-center">
              Quick 1-Click Hackathon Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-bold text-slate-700 transition-all shadow-2xs"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('staff')}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-bold text-slate-700 transition-all shadow-2xs"
              >
                💼 Staff
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('customer')}
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-indigo-50/60 hover:border-indigo-200 text-xs font-bold text-slate-700 transition-all shadow-2xs"
              >
                👤 Customer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            New customer?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
