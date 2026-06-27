import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, Settings, Activity, PlusCircle, Trash2,
  CheckCircle2, Clock, AlertTriangle, Building2, UserCheck,
  ToggleLeft, ToggleRight, Database, Cpu, Search, RefreshCw, BarChart2
} from 'lucide-react';
import { adminAPI } from '../utils/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'officers' | 'services' | 'telemetry'

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
  const [wsLogs, setWsLogs] = useState([
    { id: 1, type: "info", time: new Date().toLocaleTimeString(), text: "[Socket.io] Admin connection established successfully." },
    { id: 2, type: "success", time: new Date(Date.now() - 3000).toLocaleTimeString(), text: "[API Gateway] JWT verified for admin token." },
    { id: 3, type: "warn", time: new Date(Date.now() - 10000).toLocaleTimeString(), text: "[Database] Auto-cleaned 4 old expired sessions." }
  ]);

  // Telemetry hardware stats
  const [cpuLoad, setCpuLoad] = useState(24);
  const [ramLoad, setRamLoad] = useState(42);

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
    } catch (err) {
      console.warn("Officers list call failed, falling back.");
    }
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
      setErrorMsg(err.response?.data?.message || 'Failed to register new officer.');
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
      setErrorMsg(err.response?.data?.message || 'Failed to delete officer.');
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

  // Dynamic telemetry simulator
  useEffect(() => {
    if (activeTab !== 'telemetry') return;
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(15 + Math.random() * 20));
      setRamLoad(Math.floor(40 + Math.random() * 5));
      
      const events = [
        "[Socket.io] Client socket disconnected (Kiosk Node-04).",
        "[Database] Executed aggregation pipeline metrics fetch.",
        "[API Gateway] Routed GET /api/admin/dashboard.",
        "[Socket.io] New client session connected from +91 9876543210.",
        "[Config dispatch] Synced service configuration registry."
      ];
      const selectedEvent = events[Math.floor(Math.random() * events.length)];
      setWsLogs(prev => [
        { id: Date.now(), type: "info", time: new Date().toLocaleTimeString(), text: selectedEvent },
        ...prev.slice(0, 15) // Keep last 15 logs
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-up">
      
      {/* 1. Header Banner */}
      {currentAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-[#1D4ED8]" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Super Administrator Console
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Admin Workspace · Logged in as: <strong className="text-gray-700">{currentAdmin.name}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            { id: 'telemetry', label: 'System Telemetry', icon: <Database className="w-4 h-4" /> }
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
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total Tickets', value: metrics.total, color: 'text-gray-900 bg-gray-50 border-gray-200', icon: <BarChart2 className="w-4 h-4 text-gray-500" /> },
                  { label: 'Pending Queue', value: metrics.pending, color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4 text-amber-500" /> },
                  { label: 'Active Work', value: metrics.inProgress, color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <Activity className="w-4 h-4 text-[#1D4ED8]" /> },
                  { label: 'Resolved Cases', value: metrics.completed, color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
                  { label: 'SLA Overdue', value: slaViolations.length, color: slaViolations.length > 0 ? 'text-red-700 bg-red-50 border-red-200 animate-pulse' : 'text-gray-400 bg-gray-50 border-gray-200', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> }
                ].map(stat => (
                  <div key={stat.label} className="gov-card p-4 text-center flex flex-col items-center justify-center gap-2">
                    <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Breakdown & SLA Splits */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                
                {/* Custom CSS Bar Chart (2 cols) */}
                <div className="md:col-span-2 gov-card p-5 space-y-4">
                  <h4 className="section-label text-gray-700 border-b border-gray-100 pb-2">Category Distribution</h4>
                  
                  <div className="space-y-4 text-xs">
                    {[
                      { type: 'electricity', label: 'Electricity Connection', color: 'bg-[#1D4ED8]' },
                      { type: 'water', label: 'Water Supply Systems', color: 'bg-cyan-600' },
                      { type: 'gas', label: 'PNG Gas Infrastructure', color: 'bg-orange-500' },
                      { type: 'waste', label: 'Solid Waste Operations', color: 'bg-green-600' },
                      { type: 'general', label: 'General Civic Redressals', color: 'bg-purple-600' }
                    ].map(item => {
                      const countObj = serviceBreakdown.find(s => s._id === item.type);
                      const count = countObj ? countObj.count : 0;
                      const percentage = metrics.total > 0 ? ((count / metrics.total) * 100).toFixed(0) : 0;

                      return (
                        <div key={item.type} className="space-y-1.5">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-700">{item.label}</span>
                            <span className="text-gray-900">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SLA Violations Queue (3 cols) */}
                <div className="md:col-span-3 gov-card p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h4 className="section-label text-gray-700">SLA Violations (&gt;48 Hours)</h4>
                    <span className="status-badge badge-critical">Immediate Action</span>
                  </div>

                  {slaViolations.length === 0 ? (
                    <div className="py-14 text-center text-xs text-gray-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="font-bold text-gray-700">All connections within SLA limits</p>
                      <p className="text-[10px]">No active complaints exceed the 48h limit.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {slaViolations.map(ticket => (
                        <div key={ticket.requestId} className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#1D4ED8]">{ticket.requestId}</span>
                            <span className="text-[10px] text-gray-500 capitalize block mt-0.5">
                              {ticket.serviceType} · {ticket.citizenId?.name || 'Aadhaar User'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black text-red-600 block uppercase tracking-wider">Overdue</span>
                            <span className="text-[9px] text-gray-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
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
                        <Cpu className="w-4 h-4 text-[#1D4ED8]" /> Qualcomm Edge AI CPU
                      </span>
                      <span className="font-bold text-gray-900">{cpuLoad}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1D4ED8] h-full transition-all duration-300" style={{ width: `${cpuLoad}%` }} />
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
                    <div className="flex justify-between">Database connection: <span className="text-[#16A34A] font-bold">MONGODB CONNECTED</span></div>
                    <div className="flex justify-between">WS Socket tunnels: <span className="text-gray-900 font-bold">2 terminals active</span></div>
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

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
