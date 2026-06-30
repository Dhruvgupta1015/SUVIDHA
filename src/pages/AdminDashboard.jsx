import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, Settings, Activity, PlusCircle, Trash2,
  CheckCircle2, Clock, AlertTriangle, Building2, UserCheck,
  ToggleLeft, ToggleRight, Database, Cpu, Search, RefreshCw, BarChart2, Zap, X
} from 'lucide-react';
import { adminAPI, requestAPI } from '../utils/api';
import { useAccessibility } from '../context/AccessibilityContext';
import { computeSlaStatus } from '../utils/slaEngine';
import { io } from 'socket.io-client';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { DemoModePanel } from '../components/DemoModePanel';
import { SystemHealthPanel } from '../components/SystemHealthPanel';
import { NotificationCenter, useNotifications } from '../components/NotificationCenter';
import { AuditPanel } from '../components/AuditPanel';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'officers' | 'services' | 'telemetry' | 'governance'

  // Data state
  const [metrics, setMetrics] = useState({ total: 5, pending: 3, inProgress: 1, completed: 1, approved: 0, rejected: 0 });
  const [slaViolations, setSlaViolations] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Officer creation form state
  const [newOffName, setNewOffName] = useState('');
  const [newOffEmail, setNewOffEmail] = useState('');
  const [newOffPassword, setNewOffPassword] = useState('');
  const [newOffDept, setNewOffDept] = useState('Electricity Department');
  const [formSuccess, setFormSuccess] = useState(false);
  const [submittingOfficer, setSubmittingOfficer] = useState(false);

  // Urgent alert toast & notification center
  const [urgentToast, setUrgentToast] = useState(null);
  const { notifications, addNotification, clearAll, markRead } = useNotifications();

  // T3: Escalation trigger state
  const [escalationRunning, setEscalationRunning] = useState(false);
  const [escalationResult, setEscalationResult] = useState(null);

  // Active Services state (Saved in local storage for dynamic citizen response)
  const [servicesConfig, setServicesConfig] = useState(() => {
    const saved = localStorage.getItem('services_status_config');
    return saved ? JSON.parse(saved) : {
      electricity: true,
      water: true,
      gas: true,
      waste: true,
      general: true
    };
  });

  // Telemetry logs state
  const [wsLogs, setWsLogs] = useState([]);
  const [cpuLoad, setCpuLoad] = useState(0);
  const [ramLoad, setRamLoad] = useState(0);
  const [dbStatus, setDbStatus] = useState('CHECKING');
  const [socketCount, setSocketCount] = useState(0);

  // Phase 5: Governance & Audit State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMetrics, setAuditMetrics] = useState({ mostEscalated: 0, rejectedEvidence: 0, emergencyFrequency: 0 });

  // Poll Telemetry data when tab is active
  useEffect(() => {
    let interval;
    if (activeTab === 'telemetry') {
      const fetchTelemetry = async () => {
        try {
          // Fetch logs
          const logRes = await adminAPI.getTelemetry();
          if (logRes.data?.success) setWsLogs(logRes.data.logs);
          
          // Fetch health (requires full path if not in API route prefix)
          // The base url is /api, we can fetch root /health
          const healthRes = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/health`);
          const healthData = await healthRes.json();
          if (healthData.success) {
            setCpuLoad(parseFloat(healthData.cpu));
            setRamLoad(parseFloat(healthData.memory.heapUsed)); // using raw MB for visual demo
            setDbStatus(healthData.dbStatus);
            setSocketCount(healthData.socketsCount);
          }
        } catch (e) {
          console.warn('Telemetry fetch failed', e);
        }
      };
      
      fetchTelemetry();
      interval = setInterval(fetchTelemetry, 3000); // refresh every 3 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Verification checks on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth?role=admin');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      navigate('/auth?role=admin');
      return;
    }
    setCurrentAdmin(user);
    fetchAdminDashboard();
    fetchOfficers();
  }, [navigate]);

  // Socket: urgentAlert listener (T8)
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const sock = io(socketUrl, { reconnection: true, reconnectionAttempts: 3 });
    sock.on('urgentAlert', (data) => {
      setUrgentToast(data);
      addNotification({
        title: data.isEmergency ? 'Critical Emergency' : 'Urgent Alert',
        body: data.message,
        type: data.isEmergency ? 'emergency' : (data.priority === 'Critical' ? 'critical' : 'escalation'),
        time: data.time
      });
      setTimeout(() => setUrgentToast(null), 8000);
    });
    return () => sock.close();
  }, [addNotification]);

  const fetchAdminDashboard = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const response = await adminAPI.dashboard();
      if (response.data && response.data.success) {
        setMetrics(response.data.metrics);
        setSlaViolations(response.data.slaViolations || []);
        setServiceBreakdown(response.data.serviceBreakdown || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await adminAPI.getOfficers();
      if (response.data && response.data.officers) {
        setOfficersList(response.data.officers);
      }
    } catch { /* silent — officers list is non-critical */ }
  };

  // Add Officer Account
  const handleAddOfficerSubmit = async (e) => {
    e.preventDefault();
    if (!newOffName || !newOffEmail || !newOffPassword) {
      setErrorMsg('Please enter all officer specifications.');
      return;
    }

    setSubmittingOfficer(true);
    setErrorMsg('');
    try {
      const payload = {
        name: newOffName,
        email: newOffEmail,
        password: newOffPassword,
        department: newOffDept
      };
      const response = await adminAPI.createOfficer(payload);
      if (response.data && response.data.success) {
        setFormSuccess(true);
        speak(`Officer ${newOffName} added successfully`);
        fetchOfficers();
        
        // Reset form
        setNewOffName('');
        setNewOffEmail('');
        setNewOffPassword('');
        setTimeout(() => setFormSuccess(false), 2000);
      }
    } catch (err) {
      setErrorMsg(err.friendlyMessage || 'Failed to register new officer.');
    } finally {
      setSubmittingOfficer(false);
    }
  };

  // Delete Officer Account
  const handleDeleteOfficer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Officer ${name}?`)) return;

    setErrorMsg('');
    try {
      await adminAPI.deleteOfficer(id);
      setOfficersList(prev => prev.filter(o => o._id !== id && o.id !== id));
      speak(`Deleted officer ${name}`);
    } catch (err) {
      setErrorMsg(err.friendlyMessage || 'Failed to delete officer.');
    }
  };

  // Toggle citizen service active status
  const handleToggleService = (service) => {
    const nextConfig = {
      ...servicesConfig,
      [service]: !servicesConfig[service]
    };
    setServicesConfig(nextConfig);
    localStorage.setItem('services_status_config', JSON.stringify(nextConfig));
    speak(`Service category ${service} toggled`);
    
    // Add web socket log
    setWsLogs(prev => [
      { 
        id: Date.now(), 
        type: "warn", 
        time: new Date().toLocaleTimeString(), 
        text: `[Config dispatch] Service category "${service}" status updated to: ${nextConfig[service] ? 'ENABLED' : 'DISABLED'}.` 
      },
      ...prev
    ]);
  };

  // Phase 5: Fetch Audit Data when Governance tab is active
  useEffect(() => {
    if (activeTab === 'governance') {
      const fetchAuditData = async () => {
        try {
          const [logsRes, metricsRes] = await Promise.all([
            adminAPI.getAuditLogs(),
            adminAPI.getAuditMetrics()
          ]);
          if (logsRes.data?.success) setAuditLogs(logsRes.data.logs);
          if (metricsRes.data?.success) setAuditMetrics(metricsRes.data.metrics);
        } catch (e) {
          console.error('Failed to fetch audit data', e);
        }
      };
      fetchAuditData();
    }
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-up">

      {/* T8: Urgent Alert Toast */}
      {urgentToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-fade-in">
          <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-red-400 bg-red-50 shadow-2xl">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-red-800 text-sm">System Alert</p>
              <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{urgentToast.message}</p>
              <p className="text-[10px] text-red-500 mt-1 font-mono">{urgentToast.requestId}</p>
            </div>
            <button onClick={() => setUrgentToast(null)} className="text-red-400 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      {currentAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                Super Administrator Console
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Admin Workspace · Logged in as: <strong className="text-gray-700">{currentAdmin.name}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter notifications={notifications} onClear={clearAll} onMarkRead={markRead} />
            <button
              onClick={() => { fetchAdminDashboard(true); fetchOfficers(); }}
              className="btn-ghost text-xs px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Tab Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        
        {/* Left Sidebar Nav Tabs */}
        <div className="lg:col-span-1 gov-card p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
          {[
            { id: 'analytics', label: 'Analytics & SLA', icon: <Activity className="w-4 h-4" /> },
            { id: 'officers', label: 'Officer Manager', icon: <Users className="w-4 h-4" /> },
            { id: 'services', label: 'Service Manager', icon: <Settings className="w-4 h-4" /> },
            { id: 'telemetry', label: 'System Telemetry', icon: <Database className="w-4 h-4" /> },
            { id: 'governance', label: 'Governance & Audit', icon: <ShieldAlert className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setErrorMsg(''); }}
              className={`sidebar-link flex-shrink-0 lg:w-full ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Content Pane (Takes 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* ──────────────────────────────
              TAB 1: ANALYTICS & SLA
          ────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              {/* T8: System Health Panel */}
              <SystemHealthPanel />

              {/* T4: Demo Mode Engine */}
              <DemoModePanel onScenarioCreated={fetchAdminDashboard} />

              {/* T3: Advanced Analytics Panel */}
              <AnalyticsPanel />


              {/* T6: Immediate Attention Required Panel */}
              {(() => {
                const critical  = slaViolations.filter(t => {
                  const { slaStatus } = computeSlaStatus(t.createdAt);
                  return slaStatus === 'Critical' || slaStatus === 'Escalated';
                });
                const escalated = slaViolations.filter(t => computeSlaStatus(t.createdAt).slaStatus === 'Escalated');
                const emergencyCount = notifications.filter(a => a.type === 'emergency').length;
                const criticalPriority = slaViolations.filter(t => t.priority === 'Critical').length;
                const hasAlert = emergencyCount > 0 || critical.length > 0 || criticalPriority > 0;
                if (!hasAlert) return null;
                return (
                  <div className="p-4 rounded-2xl border-2 border-red-300 bg-red-50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🚨</span>
                      <h4 className="font-black text-red-700 text-sm">Immediate Attention Required</h4>
                      <span className="ml-auto text-[10px] text-red-500 font-bold uppercase tracking-wider animate-pulse">LIVE</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: '🚨 Emergency Reports',   value: emergencyCount,      color: 'text-red-700 bg-red-100 border-red-200' },
                        { label: '⚡ Critical Priority',    value: criticalPriority,    color: 'text-orange-700 bg-orange-100 border-orange-200' },
                        { label: '🔴 SLA Escalated',       value: escalated.length,    color: 'text-red-700 bg-red-100 border-red-200' },
                        { label: '⚠️ SLA Breached',        value: critical.length,     color: 'text-amber-700 bg-amber-100 border-amber-200' },
                      ].map(c => (
                        <div key={c.label} className={`p-3 rounded-xl border text-center ${c.color}`}>
                          <div className="text-2xl font-black">{c.value}</div>
                          <div className="text-[10px] font-bold mt-0.5">{c.label}</div>
                        </div>
                      ))}
                    </div>
                    {notifications.filter(a => a.type === 'emergency' || a.type === 'critical').length > 0 && (
                      <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto">
                        {notifications.filter(a => a.type === 'emergency' || a.type === 'critical').slice(0, 5).map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-red-700 bg-white border border-red-100 rounded-lg p-2">
                            <span>🚨</span>
                            <span className="font-mono font-bold">{a.title}</span>
                            <span className="flex-1 truncate">{a.body}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* T3: SLA Escalation Trigger */}
                    <div className="mt-3 pt-3 border-t border-red-200 flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setEscalationRunning(true); setEscalationResult(null);
                          try {
                            const res = await requestAPI.checkEscalations();
                            setEscalationResult(res.data);
                            if (res.data.escalated > 0) speak(`${res.data.escalated} requests escalated.`);
                          } catch(e) {
                            setEscalationResult({ error: true, message: e.response?.data?.message || 'Escalation check failed' });
                          } finally { setEscalationRunning(false); }
                        }}
                        disabled={escalationRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-black rounded-xl transition disabled:opacity-60"
                      >
                        {escalationRunning
                          ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking…</>
                          : <>🔴 Run SLA Escalation Check</>}
                      </button>
                      {escalationResult && !escalationResult.error && (
                        <span className="text-[10px] text-red-700 font-bold">
                          {escalationResult.escalated > 0
                            ? `✅ ${escalationResult.escalated} escalated: ${escalationResult.ids?.join(', ')}`
                            : '✅ All SLAs within bounds — no escalations needed'}
                        </span>
                      )}
                      {escalationResult?.error && (
                        <span className="text-[10px] text-gray-500">{escalationResult.message}</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Breakdown & SLA Splits */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                
                {/* SLA Violations Queue with tier badges (Full width) */}
                <div className="md:col-span-5 gov-card p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h4 className="section-label text-gray-700">SLA Intelligence Monitor</h4>
                    <span className="status-badge badge-critical">Immediate Action</span>
                  </div>

                  {slaViolations.length === 0 ? (
                    <div className="py-14 text-center text-xs text-gray-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="font-bold text-gray-700">All connections within SLA limits</p>
                      <p className="text-[10px]">No alerts or escalations found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {slaViolations.map(ticket => {
                        const { slaStatus, ageHours } = computeSlaStatus(ticket.createdAt);
                        const tierColor = {
                          Escalated: 'bg-red-50 border-red-200',
                          Critical:  'bg-orange-50 border-orange-200',
                          Warning:   'bg-yellow-50 border-yellow-200',
                          Safe:      'bg-gray-50 border-gray-100'
                        }[slaStatus] || 'bg-gray-50 border-gray-100';
                        const tierText = {
                          Escalated: 'text-red-700',
                          Critical:  'text-orange-700',
                          Warning:   'text-yellow-700',
                          Safe:      'text-gray-500'
                        }[slaStatus] || 'text-gray-500';
                        return (
                          <div key={ticket.requestId} className={`p-3 border rounded-xl flex justify-between items-center text-xs ${tierColor}`}>
                            <div>
                              <span className="font-mono font-bold text-blue-600">{ticket.requestId}</span>
                              {ticket.isEmergency && <span className="ml-1">🚨</span>}
                              <span className="text-[10px] text-gray-500 capitalize block mt-0.5">
                                {ticket.serviceType} · {ticket.citizenId?.name || 'Aadhaar User'}
                              </span>
                              {/* T4: Emergency audit source */}
                              {ticket.emergencySource && (
                                <span className="text-[9px] text-red-500 font-bold block mt-0.5">
                                  🔍 Emergency source: {ticket.emergencySource}
                                  {ticket.emergencyTriggeredAt && ` · ${new Date(ticket.emergencyTriggeredAt).toLocaleString('en-IN')}`}
                                </span>
                              )}
                              {/* T2: Routing confidence */}
                              {ticket.routingConfidence != null && (
                                <span className="text-[9px] text-blue-500 font-bold block mt-0.5">
                                  ⚡ Routing confidence: {Math.round(ticket.routingConfidence * 100)}%
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`text-[9px] font-black block uppercase tracking-wider ${tierText}`}>
                                {slaStatus === 'Escalated' ? '🔴' : slaStatus === 'Critical' ? '🟠' : '⚠️'} {slaStatus} ({ageHours}h)
                              </span>
                              <span className="text-[9px] text-gray-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>



            </div>
          )}

          {/* ──────────────────────────────
              TAB 2: OFFICER MANAGER
          ────────────────────────────── */}
          {activeTab === 'officers' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
              
              {/* Add Officer Form (2 cols) */}
              <div className="md:col-span-2 gov-card p-5 space-y-4">
                <h4 className="section-label text-gray-700 border-b border-gray-100 pb-2">Register Departmental Officer</h4>

                {formSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                    <UserCheck className="w-4 h-4" />
                    <span>Officer registered successfully!</span>
                  </div>
                )}

                <form onSubmit={handleAddOfficerSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Officer Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Shah (EE)"
                      value={newOffName}
                      onChange={e => setNewOffName(e.target.value)}
                      className="gov-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Official Email ID</label>
                    <input
                      type="email"
                      placeholder="officer.dept@suvidha.gov.in"
                      value={newOffEmail}
                      onChange={e => setNewOffEmail(e.target.value)}
                      className="gov-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Security Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newOffPassword}
                      onChange={e => setNewOffPassword(e.target.value)}
                      className="gov-input font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Department</label>
                    <select
                      value={newOffDept}
                      onChange={e => setNewOffDept(e.target.value)}
                      className="gov-input font-semibold text-gray-700"
                    >
                      <option value="Electricity Department">Electricity Department</option>
                      <option value="Water Department">Water Department</option>
                      <option value="Gas Department">Gas Department</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="General Administration">General Administration</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOfficer}
                    className="btn-primary w-full py-2.5 text-xs shadow-none mt-2"
                  >
                    {submittingOfficer ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><PlusCircle className="w-4 h-4" /> Create Officer Account</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Officers Directory List (3 cols) */}
              <div className="md:col-span-3 gov-card p-5 space-y-4">
                <h4 className="section-label text-gray-700 border-b border-gray-100 pb-2">
                  Officers Directory ({officersList.length})
                </h4>

                {officersList.length === 0 ? (
                  <div className="py-14 text-center text-xs text-gray-400">No officers found in the system registry.</div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {officersList.map(off => (
                      <div key={off._id || off.id} className="p-3 bg-gray-50 hover:bg-white hover:border-gray-200 border border-gray-100 rounded-xl flex justify-between items-center text-xs transition">
                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">OFFICER</span>
                            <span className="truncate">{off.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {off.email} <span className="mx-1 text-gray-300">·</span> <strong className="text-gray-700">{off.department}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteOfficer(off._id || off.id, off.name)}
                          className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title={`Delete Officer ${off.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ──────────────────────────────
              TAB 3: SERVICE MANAGER
          ────────────────────────────── */}
          {activeTab === 'services' && (
            <div className="gov-card p-6 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-gray-900">Active Service Channels Configuration</h3>
                <p className="text-xs text-gray-500 mt-1">Temporarily toggle active status to suspend new connection requests or grievance logs.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'electricity', label: 'Electricity Connections Desk', desc: 'Allows filing new meter connections and line checks.' },
                  { id: 'water', label: 'Water Supply Connections Desk', desc: 'Controls new pipe connections and leakage complaints.' },
                  { id: 'gas', label: 'PNG Gas Infrastructure Desk', desc: 'Controls meter inspections, pressure drops, or repairs.' },
                  { id: 'waste', label: 'Municipal Waste Disposal Desk', desc: 'Allows filing solid waste collections or sewage clogs.' },
                  { id: 'general', label: 'General Administration Desk', desc: 'Streetlights failures, road potholes, and signages.' }
                ].map((svc) => (
                  <div key={svc.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-gray-900">{svc.label}</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px]">{svc.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleService(svc.id)}
                      className="shrink-0 transition-colors"
                    >
                      {servicesConfig[svc.id] ? (
                        <div className="flex items-center gap-1 font-bold text-[11px] text-green-600">
                          <span>Active</span>
                          <ToggleRight className="w-9 h-9" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-bold text-[11px] text-gray-400">
                          <span>Suspended</span>
                          <ToggleLeft className="w-9 h-9" />
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────────────────────
              TAB 4: SYSTEM STATUS (TELEMETRY)
          ────────────────────────────── */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
              
              {/* Load telemetries (2 cols) */}
              <div className="md:col-span-2 gov-card p-5 space-y-6">
                <h4 className="section-label text-gray-700 border-b border-gray-100 pb-2">Hardware Telemetry</h4>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Cpu className="w-4 h-4 text-blue-600" /> Qualcomm Edge AI CPU
                      </span>
                      <span className="font-bold text-gray-900">{cpuLoad}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${cpuLoad}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Database className="w-4 h-4 text-blue-600" /> RAM Allocated Pool
                      </span>
                      <span className="font-bold text-gray-900">{ramLoad}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-650 h-full transition-all duration-300 bg-blue-600" style={{ width: `${ramLoad}%` }} />
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl space-y-2 text-[10px] text-gray-500 font-semibold leading-relaxed">
                    <div className="flex justify-between">Database connection: <span className={dbStatus === 'CONNECTED' ? 'text-[#16A34A] font-bold' : 'text-red-500 font-bold'}>{dbStatus}</span></div>
                    <div className="flex justify-between">WS Socket tunnels: <span className="text-gray-900 font-bold">{socketCount} terminals active</span></div>
                    <div className="flex justify-between">Auto SLA validator daemon: <span className="text-green-600 font-bold">RUNNING</span></div>
                  </div>
                </div>
              </div>

              {/* Live Web Socket events logs (3 cols) */}
              <div className="md:col-span-3 p-5 bg-gray-900 rounded-xl border border-gray-800 text-left space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    Live WebSocket Events Log
                  </span>
                </div>

                <div className="space-y-2 text-[10px] leading-relaxed max-h-[220px] overflow-y-auto pr-1">
                  {wsLogs.map((log) => (
                    <div key={log.id} className="text-gray-300">
                      <span className="text-gray-500">[{log.time}]</span>{' '}
                      <span className={`${
                        log.type === 'success' ? 'text-green-400 font-bold' :
                        log.type === 'warn' ? 'text-yellow-400 font-bold' :
                        'text-blue-400'
                      }`}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────
              TAB 5: GOVERNANCE & AUDIT
          ────────────────────────────── */}
          {activeTab === 'governance' && (
            <AuditPanel />
          )}

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
