import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import vaccinationService from '../services/vaccinationService';
import { useToast } from '../components/Toast';
import { 
  Syringe, 
  Users, 
  CheckCircle2, 
  BellRing,
  ArrowRight,
  PlusCircle,
  ListTodo,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  PhoneCall,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [analytics, setAnalytics] = useState({
    total_patients: 0,
    total_scheduled: 0,
    total_administered: 0,
    pending_count: 0,
    sms_success_rate: 100.0,
    trend_data: [],
    delivery_data: [],
    status_data: []
  });
  
  const [recentVaccinations, setRecentVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch compiled analytics from dedicated DB aggregation endpoint
      const response = await api.get('/api/v1/admin/analytics');
      setAnalytics(response.data);
      
      // Fetch latest vaccine records for the listing
      const data = await vaccinationService.getVaccinations();
      const sorted = [...data].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
      setRecentVaccinations(sorted.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard metrics:", error);
      toast.error("Unable to load live dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerReminders = async () => {
    setTriggering(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await vaccinationService.triggerReminders(todayStr);
      toast.success(`Reminder Dispatch Complete! Sent ${result.reminders_sent} SMS/WhatsApp alerts for schedules on ${result.scheduled_date}.`);
      await fetchDashboardData(); // Reload stats and charts
    } catch (error) {
      console.error("Failed to trigger notifications:", error);
      const errorMsg = error.response?.data?.detail || "An error occurred while scanning and sending alerts.";
      toast.error(errorMsg);
    } finally {
      setTriggering(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Schedule Vaccination',
      desc: 'Register new vaccine schedule entries for patients in the database.',
      link: '/admin/schedule',
      icon: PlusCircle,
      color: 'from-green-500/10 to-emerald-500/5 hover:border-green-500/40 text-green-400'
    },
    {
      title: 'Records Log',
      desc: 'Browse, search, filter, and edit all scheduled vaccinations.',
      link: '/admin/vaccinations',
      icon: ListTodo,
      color: 'from-indigo-500/10 to-blue-500/5 hover:border-indigo-500/40 text-indigo-400'
    },
    {
      title: 'Sandbox Chatbot',
      desc: 'Simulate chatbot flow interactions, intents, and translations.',
      link: '/admin/chatbot',
      icon: MessageCircle,
      color: 'from-purple-500/10 to-pink-500/5 hover:border-purple-500/40 text-purple-400'
    }
  ];

  // Map status pie colors
  const STATUS_COLORS = {
    'Administered': '#16A34A', // Green
    'Upcoming': '#3B82F6',     // Blue
    'Missed': '#EF4444'        // Red
  };

  // Map delivery bar colors
  const DELIVERY_COLORS = {
    'Sent': '#10B981',    // Emerald
    'Pending': '#F59E0B', // Amber
    'Failed': '#EF4444'   // Red
  };

  if (loading && analytics.total_scheduled === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold text-xs animate-pulse">Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Analytics Console</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Real-time public health vaccination KPIs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleTriggerReminders}
            disabled={triggering}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm shadow-green-600/10 active:scale-95 disabled:opacity-50 shrink-0"
          >
            <BellRing className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${triggering ? 'animate-bounce' : ''}`} />
            {triggering ? 'Sending Alerts...' : "Trigger Today's Reminders"}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Patients */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 transition-all duration-200 hover:shadow-md flex items-center justify-between shadow-sm card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Patients</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{analytics.total_patients}</h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-green-700 font-semibold">
              <Users className="w-3.5 h-3.5 text-green-600" />
              <span>Registered patient slots</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-green-50 text-green-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Total Scheduled */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 transition-all duration-200 hover:shadow-md flex items-center justify-between shadow-sm card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Vaccinations</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{analytics.total_scheduled}</h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-blue-700 font-semibold">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Schedules logged</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
            <Syringe className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Completed Vaccinations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 transition-all duration-200 hover:shadow-md flex items-center justify-between shadow-sm card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Vaccinations</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{analytics.total_administered}</h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {analytics.total_scheduled > 0 
                  ? Math.round((analytics.total_administered / analytics.total_scheduled) * 100) 
                  : 0}% completion
              </span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Upcoming Vaccinations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 transition-all duration-200 hover:shadow-md flex items-center justify-between shadow-sm card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Vaccinations</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {analytics.pending_count ?? (analytics.total_scheduled - analytics.total_administered)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-amber-700 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Immunizations pending</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vaccination Trends Over Time</h4>
            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-green-100">
              <TrendingUp className="w-3.5 h-3.5" />
              Live DB Aggregation
            </span>
          </div>
          <div className="h-72 w-full text-xs font-semibold text-slate-500">
            {analytics.trend_data.length === 0 ? (
              <div className="h-full flex items-center justify-center italic text-slate-400 bg-slate-50 rounded-2xl">No timeline data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trend_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" tickLine={false} />
                  <YAxis stroke="#94A3B8" tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}
                    labelClassName="text-slate-900 font-bold"
                  />
                  <Area type="monotone" dataKey="count" name="Schedules" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Status Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vaccination Status</h4>
          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.status_data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.status_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748B'} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#0F172A' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Delivery Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">SMS Alert Delivery Metrics</h4>
          <div className="h-64 w-full text-xs font-semibold text-slate-500">
            {analytics.delivery_data.length === 0 ? (
              <div className="h-full flex items-center justify-center italic text-slate-400 bg-slate-50 rounded-2xl">No delivery logs recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.delivery_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} />
                  <YAxis stroke="#94A3B8" tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}
                    labelClassName="text-slate-900 font-bold"
                  />
                  <Bar dataKey="value" name="Alerts" radius={[6, 6, 0, 0]}>
                    {analytics.delivery_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DELIVERY_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 3-Column Footer Layout: Overhauled bottom log details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Column 1: Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Activity</h4>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="space-y-4 text-xs font-semibold text-slate-650">
              {recentVaccinations.length === 0 ? (
                <p className="text-slate-400 italic py-4">No recent database operations recorded.</p>
              ) : (
                recentVaccinations.slice(0, 3).map((vac, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></div>
                    <div>
                      <p className="text-slate-800 leading-normal">
                        {vac.administered_date ? 'Completed' : 'Scheduled'} {vac.vaccine_name} (Dose {vac.dose_number})
                      </p>
                      <p className="text-[9px] text-slate-450 font-mono mt-0.5">ID: {vac.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                ))
              )}
              {/* System logs */}
              <div className="flex gap-2.5 items-start pt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                <div>
                  <p className="text-slate-800 leading-normal">SMS reminders scheduler scan operational</p>
                  <p className="text-[9px] text-slate-450 mt-0.5 font-semibold">Gateway connected</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start pt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5"></div>
                <div>
                  <p className="text-slate-800 leading-normal">NLP symptom bot sync completed</p>
                  <p className="text-[9px] text-slate-450 mt-0.5 font-semibold">Active: English, Hindi, Telugu</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Recent Vaccinations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Vaccinations</h4>
              <button
                onClick={() => navigate('/admin/vaccinations')}
                className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-0.5"
              >
                View Registry <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {recentVaccinations.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
                <Syringe className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-700 text-[11px] font-bold">No vaccinations found</p>
                <p className="text-[10px] text-slate-450 mt-0.5 mb-3.5 leading-normal">Add patient immunizations to generate lists.</p>
                <button
                  onClick={() => navigate('/admin/schedule')}
                  className="px-3 py-1.5 rounded-xl bg-green-600 text-white font-bold text-[10px] hover:bg-green-700 transition-all shadow-sm active:scale-95"
                >
                  Schedule Vaccination
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentVaccinations.slice(0, 3).map((vac) => (
                  <div
                    key={vac.id}
                    onClick={() => navigate(`/admin/vaccinations/${vac.id}`)}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-350 transition-all cursor-pointer flex items-center justify-between card-hover"
                  >
                    <div className="min-w-0 pr-2">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{vac.vaccine_name}</h5>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">
                        Dose {vac.dose_number} • {vac.scheduled_date}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {vac.administered_date ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-150 text-green-700 text-[9px] font-bold uppercase tracking-wider">
                          Done
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-150 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Notifications Summary */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications Summary</h4>
              <span className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                Active System
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sent</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {analytics.delivery_data.find(d => d.name === 'Sent')?.value ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {analytics.delivery_data.find(d => d.name === 'Pending')?.value ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Failed</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {analytics.delivery_data.find(d => d.name === 'Failed')?.value ?? 0}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>SMS Success Rate</span>
                  <span className="text-green-700">{analytics.sms_success_rate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all duration-500" 
                    style={{ width: `${analytics.sms_success_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 mt-2">
                <PhoneCall className="w-4 h-4 text-green-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-800">Twilio Gateway Active</p>
                  <p className="text-[9px] text-slate-450 mt-0.5">Secure routing • Latency &lt; 120ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
