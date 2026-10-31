import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Layers, Lock, Mail, AlertCircle, ArrowRight,
  ShieldCheck, Sparkles, CheckCircle2, TrendingUp, Users, Zap
} from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Real-Time MRR Analytics', desc: 'Monitor monthly recurring revenue with live telemetry and chart breakdowns.' },
  { icon: Zap,        title: 'Automated Billing Engine', desc: 'Zero-delay recurring invoicing with atomic duplicate-prevention.' },
  { icon: Users,      title: 'Multi-Role Access Control', desc: 'Admin, Staff, and Customer roles with fine-grained RBAC permissions.' },
  { icon: CheckCircle2, title: 'Full Subscription Lifecycle', desc: 'Draft → Confirm → Pause → Resume → Close — tracked end-to-end.' },
];

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
      navigate(user.role === 'customer' ? '/portal' : '/');
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
      setError(null);
      toast.info(`Filled credentials for ${cred.role}`);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-brand-400 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Layers className="w-5 h-5 text-white stroke-[2.3]" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Subscript<span className="text-brand-400">IQ</span>
            </span>
          </div>
          <p className="text-xs text-indigo-300 font-medium">Brightloop Software · Subscription &amp; Revenue Engine</p>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              The complete<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-brand-400">
                subscription stack
              </span><br />
              for modern SaaS.
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
              Automate every phase of your subscription lifecycle — from quotation to recurring billing — with real-time analytics and role-based access control.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-slate-400 leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer badge */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with JWT · SQLite WAL Mode · Zero Cloud Dependency</span>
        </div>
      </div>

      {/* ── Right Login Panel ────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-slate-50 flex flex-col justify-center items-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-brand-400 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Layers className="w-6 h-6 stroke-[2.3]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscript<span className="text-indigo-600">IQ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Brightloop Software</p>
        </div>

        <div className="w-full max-w-sm animate-scale-up">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the platform.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-slide-in-up">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
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
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow shadow-xs font-mono"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-300 transition-all flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Access */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-3">
              Quick 1-Click Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'admin',    label: '🛡️ Admin',    color: 'hover:bg-rose-50 hover:border-rose-200' },
                { key: 'staff',    label: '👤 Staff',    color: 'hover:bg-indigo-50 hover:border-indigo-200' },
                { key: 'customer', label: '🏢 Customer', color: 'hover:bg-emerald-50 hover:border-emerald-200' },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDemoFill(key)}
                  className={`p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-xs ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            New customer?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
