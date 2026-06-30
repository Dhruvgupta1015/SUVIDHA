/**
 * AnalyticsPanel.jsx — Advanced Admin Analytics with Recharts
 *
 * T3: Enterprise analytics for SUVIDHA Admin Dashboard.
 *
 * Charts:
 *   1. Complaint volume by department (bar)
 *   2. Priority distribution (pie)
 *   3. Status distribution (bar)
 *   4. SLA health summary (stat cards)
 */
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { adminAPI } from '../utils/api';
import { TrendingUp, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react';

const PRIORITY_COLORS = {
  Critical: '#DC2626',
  High:     '#F97316',
  Standard: '#3B82F6'
};

const STATUS_COLORS = {
  Pending:       '#FBBF24',
  'In-Progress': '#3B82F6',
  Approved:      '#10B981',
  Rejected:      '#EF4444',
  Completed:     '#16A34A'
};

const DEPT_COLORS = ['#1D4ED8', '#0891B2', '#7C3AED', '#16A34A', '#EA580C'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
        {label && <p className="font-bold text-gray-700 mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.color }}>
            <span className="font-bold">{p.name || p.dataKey}:</span> {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await adminAPI.getAnalytics();
      setData(res.data.analytics);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.response?.data?.message || 'Analytics load failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="gov-card p-8 text-center space-y-3">
      <div className="w-8 h-8 border-3 border-[#1D4ED8] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-gray-500 font-medium">Loading analytics…</p>
    </div>
  );

  if (error) return (
    <div className="gov-card p-6 text-center text-red-600 text-xs space-y-2">
      <AlertTriangle className="w-6 h-6 mx-auto" />
      <p>{error}</p>
      <button onClick={load} className="text-[#1D4ED8] font-bold underline">Retry</button>
    </div>
  );

  if (!data) return null;

  // Prepare chart data
  const priorityData = (data.priorityDist || []).map(p => ({
    name:  p._id || 'Unknown',
    value: p.count,
    fill:  PRIORITY_COLORS[p._id] || '#6B7280'
  }));

  const deptData = (data.departmentDist || [])
    .filter(d => d._id)
    .map((d, i) => ({
      name:  d._id.replace(' Department', '').replace('Management', 'Mgmt'),
      count: d.count,
      fill:  DEPT_COLORS[i % DEPT_COLORS.length]
    }));

  const statusData = (data.statusDist || []).map(s => ({
    name:  s._id || 'Unknown',
    count: s.count,
    fill:  STATUS_COLORS[s._id] || '#6B7280'
  }));

  const KpiCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className={`p-4 rounded-2xl border ${color} flex items-center gap-3`}>
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-5 h-5" style={{ color: color.includes('red') ? '#DC2626' : color.includes('amber') ? '#F97316' : color.includes('green') ? '#16A34A' : '#3B82F6' }} />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
        <p className="text-[10px] font-bold opacity-80">{label}</p>
        {sub && <p className="text-[9px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1D4ED8]" />
          <h4 className="section-label text-gray-700">Advanced Analytics</h4>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-gray-400">Updated: {lastRefresh.toLocaleTimeString('en-IN')}</span>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={ShieldAlert}    label="Active Emergencies"   value={data.emergencyCount}    color="bg-red-50 border-red-200 text-red-800" />
        <KpiCard icon={AlertTriangle}  label="SLA Escalated"        value={data.escalatedCount}    color="bg-amber-50 border-amber-200 text-amber-800" />
        <KpiCard icon={FileWarning}    label="Suspicious Evidence"  value={data.suspiciousCount}   color="bg-orange-50 border-orange-200 text-orange-800" />
        <KpiCard icon={CheckCircle2}   label="Resolved Today"       value={data.todayResolved}     color="bg-green-50 border-green-200 text-green-800"  sub="since midnight" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 1. Department Volume Bar Chart */}
        <div className="gov-card p-4 space-y-3">
          <h5 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">Complaint Volume by Department</h5>
          {deptData.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                  {deptData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 2. Priority Distribution Pie Chart */}
        <div className="gov-card p-4 space-y-3">
          <h5 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">Priority Distribution</h5>
          {priorityData.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3. Status Distribution Bar Chart */}
        <div className="gov-card p-4 space-y-3">
          <h5 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">Status Distribution</h5>
          {statusData.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 4. Resolution Rate gauge */}
        <div className="gov-card p-4 space-y-3">
          <h5 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">Resolution Metrics</h5>
          {(() => {
            const total     = (data.statusDist || []).reduce((s, d) => s + d.count, 0);
            const completed = (data.statusDist || []).find(d => d._id === 'Completed')?.count || 0;
            const rejected  = (data.statusDist || []).find(d => d._id === 'Rejected')?.count || 0;
            const rate      = total > 0 ? Math.round(((completed + rejected) / total) * 100) : 0;
            const emerRate  = total > 0 ? Math.round((data.emergencyCount / total) * 100) : 0;
            const suspRate  = total > 0 ? Math.round((data.suspiciousCount / total) * 100) : 0;

            return (
              <div className="space-y-3 pt-1">
                {[
                  { label: 'Resolution Rate', value: rate, color: 'bg-green-500', subcolor: 'text-green-700' },
                  { label: 'Emergency Rate', value: emerRate, color: 'bg-red-500', subcolor: 'text-red-700' },
                  { label: 'Suspicious Evidence Rate', value: suspRate, color: 'bg-amber-500', subcolor: 'text-amber-700' },
                ].map(m => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-600">{m.label}</span>
                      <span className={m.subcolor}>{m.value}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`${m.color} h-full rounded-full transition-all duration-700`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-[9px] text-gray-400 text-center">
                  Total: {total} complaints · Updated {lastRefresh?.toLocaleTimeString('en-IN')}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
