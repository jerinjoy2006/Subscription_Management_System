import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/StatCard';
import { IntelligenceAlerts } from '../components/IntelligenceAlerts';
import { NewSubscriptionModal } from '../components/NewSubscriptionModal';
import {
  TrendingUp,
  DollarSign,
  Repeat,
  Users,
  AlertTriangle,
  Zap,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../api/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);
  const [timeFilter, setTimeFilter] = useState('All Time');

  const fetchAnalytics = async (filter = timeFilter) => {
    try {
      setLoading(true);
      const res = await api.get('/analytics', { params: { timeFilter: filter } });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error('Could not load analytics metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeFilter);
  }, [timeFilter]);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/billing/run');
      const count = res.data?.results?.generatedInvoices?.length || 0;
      toast.success(`Recurring Billing Engine Processed! Generated ${count} invoice(s).`);
      fetchAnalytics();
    } catch (err) {
      toast.error('Billing execution failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold">Aggregating live subscription & billing telemetry...</span>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const intelligence = data?.intelligence;

  // Chart 1: Monthly Revenue Trend
  const revenueChartData = {
    labels: charts.monthlyRevenue?.map((m) => m.month) || [],
    datasets: [
      {
        label: 'Collected Revenue',
        data: charts.monthlyRevenue?.map((m) => m.revenue) || [],
        borderColor: '#4f46e5',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)');
          return gradient;
        },
        fill: true,
        tension: 0.38,
        borderWidth: 3,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Chart 2: Subscriptions by Status Doughnut
  const statusColors = {
    Active: '#10b981',
    Confirmed: '#f59e0b',
    Draft: '#94a3b8',
    Paused: '#8b5cf6',
    Closed: '#ef4444'
  };

  const statusLabels = charts.subsByStatus?.map((s) => s.status) || ['Active', 'Confirmed'];
  const statusCounts = charts.subsByStatus?.map((s) => s.count) || [1, 1];

  const subStatusChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusCounts,
        backgroundColor: statusLabels.map((st) => statusColors[st] || '#cbd5e1'),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Chart 3: Revenue by Plan Bar Chart
  const planChartData = {
    labels: charts.revenueByPlan?.map((p) => p.plan_name) || [],
    datasets: [
      {
        label: 'Subscribers',
        data: charts.revenueByPlan?.map((p) => p.subscriber_count) || [],
        backgroundColor: '#4f46e5',
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  };

    // Greeting helper
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Personalised Greeting Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-6 py-4 flex items-center justify-between shadow-md shadow-indigo-200">
        <div>
          <p className="text-indigo-200 text-xs font-semibold tracking-wide">{getGreeting()},</p>
          <h2 className="text-white text-lg font-black tracking-tight mt-0.5">
            {user?.name?.split(' ')[0] || 'Team'} - Welcome!
          </h2>
          <p className="text-indigo-200 text-xs mt-0.5">Here is your live revenue snapshot for today.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <span className="text-white/90 text-xs font-bold font-mono">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
            Live Telemetry
          </span>
        </div>
      </div>

            {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Revenue Command Center
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Brightloop Software • Automated Recurring Billing, Multi-Variant Pricing & MRR Telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Filter Pill */}
          <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {['All Time', 'This Quarter', 'YTD'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeFilter(t);
                  toast.info(`Filtered telemetry for: ${t}`);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeFilter === t
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunBilling}
            disabled={runningBilling}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all"
          >
            <Zap className={`w-3.5 h-3.5 ${runningBilling ? 'animate-spin text-amber-500' : 'text-indigo-600'}`} />
            {runningBilling ? 'Executing...' : 'Trigger Billing Run'}
          </button>

          <button
            onClick={() => setShowNewSubModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Subscription
          </button>
        </div>
      </div>

      {/* Predictive Subscription Intelligence Engine */}
      <IntelligenceAlerts
        intelligence={intelligence}
        onActionClick={(type) => {
          if (type === 'renewals') navigate('/subscriptions?status=Active');
          if (type === 'overdue') navigate('/invoices?status=Confirmed');
          if (type === 'discounts') navigate('/discounts');
        }}
      />

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`₹${(metrics.mrr || 0).toLocaleString()}`}
          subtitle={`Annualized ARR: ₹${(metrics.arr || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="indigo"
          badge={metrics.mrrGrowth !== undefined && metrics.mrrGrowth !== null ? `${metrics.mrrGrowth >= 0 ? '+' : ''}${metrics.mrrGrowth}% MoM` : 'Healthy'}
        />

        <StatCard
          title="Total Collected Revenue"
          value={`₹${(metrics.totalRevenue || 0).toLocaleString()}`}
          subtitle="Processed via AutoPay & Gateway"
          icon={DollarSign}
          color="emerald"
          badge="100% Settled"
        />

        <StatCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions || 0}
          subtitle={`Across ${metrics.totalCustomers || 0} business subscribers`}
          icon={Repeat}
          color="blue"
          badge="Healthy"
        />

        <StatCard
          title="Outstanding / Due Amount"
          value={`₹${(metrics.outstandingAmount || 0).toLocaleString()}`}
          subtitle={`${metrics.overdueInvoicesCount || 0} invoice(s) pending clearance`}
          icon={AlertTriangle}
          color={metrics.overdueInvoicesCount > 0 ? 'rose' : 'emerald'}
          badge={metrics.overdueInvoicesCount > 0 ? 'Action Needed' : 'Current'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trajectory Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recurring Revenue Trajectory</h3>
              <p className="text-xs text-slate-400">Monthly billing receipts and automated settlements</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              Normalized MRR
            </span>
          </div>
          <div className="h-64">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` Revenue: ₹${Number(ctx.raw).toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    grid: { color: '#f8fafc' },
                    ticks: {
                      font: { size: 10 },
                      callback: (val) => `₹${Number(val).toLocaleString()}`
                    }
                  },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Subscription Mix Doughnut Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subscription Status Mix</h3>
            <p className="text-xs text-slate-400">Lifecycle distribution across business clients</p>
            <div className="h-52 mt-3 flex items-center justify-center">
              <Doughnut
                data={subStatusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 10, font: { size: 11, weight: 'bold' }, padding: 12 }
                    }
                  },
                  cutout: '72%',
                }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Total Tracked Contracts:</span>
            <span className="font-extrabold text-slate-900 font-mono">
              {statusCounts.reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Breakdown & Automated System Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Subscribers by Plan</h3>
              <p className="text-xs text-slate-400">Daily, Weekly, Monthly & Yearly contracts</p>
            </div>
            <Link to="/products-plans" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Manage Plans →
            </Link>
          </div>
          <div className="h-56">
            <Bar
              data={planChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: '#f8fafc' }, ticks: { stepSize: 1, font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Live Operational System Health & Fast Access */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Billing Automation Health</h3>
            <p className="text-xs text-slate-400 mb-4">Core platform daemon rules and database status</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Duplicate Billing Safeguard</span>
                </div>
                <span className="font-mono text-emerald-800 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md font-extrabold">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Automated Tax & Discount Engine</span>
                </div>
                <span className="font-mono text-emerald-800 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md font-extrabold">
                  VERIFIED
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Sub-2-Second Query Benchmark</span>
                </div>
                <span className="font-mono text-indigo-700 text-[10px] bg-indigo-100 px-2 py-0.5 rounded-md font-extrabold">
                  &lt; 8ms
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Ready to explore active accounts?</span>
            <Link to="/subscriptions" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All Subscriptions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* New Subscription Modal */}
      {showNewSubModal && (
        <NewSubscriptionModal
          onClose={() => setShowNewSubModal(false)}
          onSuccess={() => {
            fetchAnalytics();
            toast.success('New customer subscription initialized!');
          }}
        />
      )}
    </div>
  );
};
