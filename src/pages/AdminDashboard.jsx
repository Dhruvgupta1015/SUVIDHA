import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  Settings, 
  Activity, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Database,
  Cpu
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
  const [errorMsg, setErrorMsg] = useState('');

  // Officer creation form state
  const [newOffName, setNewOffName] = useState('');
  const [newOffEmail, setNewOffEmail] = useState('');
  const [newOffPassword, setNewOffPassword] = useState('');
  const [newOffDept, setNewOffDept] = useState('Electricity Department');
  const [formSuccess, setFormSuccess] = useState(false);

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

  // Simulated Web Socket Events
  const [wsLogs, setWsLogs] = useState([
    { id: 1, type: "info", time: new Date().toLocaleTimeString(), text: "[Socket.io] Admin connection established successfully." },
    { id: 2, type: "success", time: new Date(Date.now() - 3000).toLocaleTimeString(), text: "[API Gateway] JWT verified for admin token." },
    { id: 3, type: "warn", time: new Date(Date.now() - 10000).toLocaleTimeString(), text: "[Database] Auto-cleaned 4 old expired sessions." }
  ]);

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

  const fetchAdminDashboard = async () => {
    setLoading(true);
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

    setLoading(true);
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
      setLoading(false);
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

  // Mock server load stats updates
  const [cpuLoad, setCpuLoad] = useState(24);
  const [ramLoad, setRamLoad] = useState(42);

  useEffect(() => {
    if (activeTab !== 'telemetry') return;
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(15 + Math.random() * 20));
      setRamLoad(Math.floor(40 + Math.random() * 5));
      
      // Randomly append socket log
      const events = [
        "[Socket.io] Client socket disconnected (Kiosk Node-04).",
        "[Database] Executed aggregation pipeline metrics fetch.",
        "[API Gateway] Routed GET /api/admin/dashboard.",
        "[Socket.io] New client session connected from +91 9876543210."
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
    <div className="flex-1 flex flex-col space-y-6 w-full text-left">
      
      {/* 1. Header banner */}
      {currentAdmin && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg"><ShieldAlert className="w-5 h-5" /></span>
              <h2 className="text-lg md:text-xl font-bold font-sans">Super Administrator Console</h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Admin Workspace Portal • Logged in: <span className="text-slate-200 font-bold">{currentAdmin.name}</span>
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            System Config Desk • Ward-84 Nodal Office
          </div>
        </div>
      )}

      {/* 2. Side/Tab Menu Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Tabs Sidebar */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => { setActiveTab('analytics'); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'analytics'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Activity className="w-4 h-4" />
            Analytics & SLA
          </button>

          <button
            onClick={() => { setActiveTab('officers'); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'officers'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4" />
            Officer Manager
          </button>

          <button
            onClick={() => { setActiveTab('services'); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'services'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Settings className="w-4 h-4" />
            Service Manager
          </button>

          <button
            onClick={() => { setActiveTab('telemetry'); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'telemetry'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Database className="w-4 h-4" />
            System Status
          </button>
        </div>

        {/* Right Content Pane (Takes 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'analytics' && (
            /* TAB 1: Analytics & SLA Compliance */
            <div className="space-y-6">
              
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-450 uppercase block font-black tracking-wider">Total Tickets</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{metrics.total}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-450 uppercase block font-black tracking-wider">Pending</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">{metrics.pending}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-450 uppercase block font-black tracking-wider">Active</span>
                  <span className="text-2xl font-black text-orange-500 mt-1 block">{metrics.inProgress}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-450 uppercase block font-black tracking-wider">Resolved</span>
                  <span className="text-2xl font-black text-[#16A34A] mt-1 block">{metrics.completed}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-450 uppercase block font-black tracking-wider">SLA Overdue</span>
                  <span className={`text-2xl font-black mt-1 block ${slaViolations.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    {slaViolations.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Left side: Category distribution (2 cols) */}
                <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800">
                    Category Breakdown
                  </h4>
                  
                  <div className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
                    {[
                      { type: 'electricity', label: 'Electricity connection', color: 'bg-amber-500' },
                      { type: 'water', label: 'Water pipelines', color: 'bg-orange-500' },
                      { type: 'gas', label: 'PNG Gas lines', color: 'bg-orange-500' },
                      { type: 'waste', label: 'Waste collection', color: 'bg-emerald-500' },
                      { type: 'general', label: 'General / Streetlights', color: 'bg-purple-500' }
                    ].map((item) => {
                      const countObj = serviceBreakdown.find(s => s._id === item.type);
                      const count = countObj ? countObj.count : 0;
                      const percentage = metrics.total > 0 ? ((count / metrics.total) * 100).toFixed(0) : 0;

                      return (
                        <div key={item.type} className="space-y-1.5">
                          <div className="flex justify-between font-bold">
                            <span className="capitalize">{item.label}</span>
                            <span className="text-slate-900 dark:text-white">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: SLA Violation Tickets (3 cols) */}
                <div className="md:col-span-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>SLA Violations (&gt;48 Hours)</span>
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 text-[9px] font-black rounded-lg border border-red-200 dark:border-red-900/30">Immediate Action</span>
                  </h4>

                  {slaViolations.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-1.5" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">All connections within SLA limits</p>
                      <p className="text-[10px]">No tickets currently exceed the 48h nodal deadline.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {slaViolations.map((ticket) => (
                        <div key={ticket.requestId} className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl flex justify-between items-center text-xs text-left">
                          <div>
                            <span className="font-extrabold font-mono text-[#EA580C] dark:text-orange-400">{ticket.requestId}</span>
                            <span className="text-[10px] text-slate-500 capitalize block mt-0.5 font-bold">Category: {ticket.serviceType} • {ticket.citizenId?.name}</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[9px] font-bold text-red-600 dark:text-red-450 block uppercase tracking-wider">Overdue</span>
                            <span className="text-[9px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {activeTab === 'officers' && (
            /* TAB 2: Officer Manager */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Add Officer Form (2 cols) */}
              <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-5 shadow-sm">
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800">
                  Register Departmental Officer
                </h4>

                {formSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[#16A34A] text-xs font-bold rounded-xl flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Officer registered successfully!</span>
                  </div>
                )}

                <form onSubmit={handleAddOfficerSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Officer Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Amit Shah (EE)"
                      value={newOffName}
                      onChange={(e) => setNewOffName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Official Email</label>
                    <input
                      type="email"
                      placeholder="officer.dept@suvidha.gov.in"
                      value={newOffEmail}
                      onChange={(e) => setNewOffEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Security Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newOffPassword}
                      onChange={(e) => setNewOffPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">Assigned Department Wing</label>
                    <select
                      value={newOffDept}
                      onChange={(e) => setNewOffDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
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
                    disabled={loading}
                    className="w-full py-2.5 bg-[#EA580C] hover:bg-orange-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Officer Profile</span>
                  </button>
                </form>
              </div>

              {/* Officers Directory List (3 cols) */}
              <div className="md:col-span-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-4 shadow-sm">
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800">
                  Officers Directory ({officersList.length})
                </h4>

                {officersList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-450">No officers found in local system directory.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {officersList.map((off) => (
                      <div key={off._id || off.id} className="p-3.5 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1 text-left">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="p-1 bg-slate-200 dark:bg-slate-700 rounded-md text-[9px] tracking-wider uppercase font-black">{off.role}</span>
                            <span>{off.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {off.email} • <span className="font-extrabold text-slate-650 dark:text-slate-400">{off.department}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteOfficer(off._id || off.id, off.name)}
                          className="p-2 border border-red-200 dark:border-red-950/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                          title={`Delete Officer ${off.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'services' && (
            /* TAB 3: Service Manager Configuration */
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Citizen Counters Controls</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle active statuses for service connection logs (temporarily suspends registry if disabled)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'electricity', label: 'Electricity Connection Window', desc: 'Manage new electric connections and line checks.' },
                  { id: 'water', label: 'Water Connection & Pipeline leaks', desc: 'Control water pipe leak complaints and connections.' },
                  { id: 'gas', label: 'PNG Gas Service Counter', desc: 'Inspect pressure drops, gas meters, or repairs.' },
                  { id: 'waste', label: 'BBMP Solid Waste management', desc: 'Dispose trash bin clogs or street garbage complaints.' },
                  { id: 'general', label: 'General Streetlight/Potholes Desk', desc: 'Submit road or streetlight pole issues.' }
                ].map((svc) => (
                  <div key={svc.id} className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-extrabold text-xs text-slate-850 dark:text-white">{svc.label}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">{svc.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleService(svc.id)}
                      className={`text-[#EA580C] dark:text-orange-400 rounded transition shrink-0 ${
                        servicesConfig[svc.id] ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    >
                      {servicesConfig[svc.id] ? (
                        <div className="flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          <span>Active</span>
                          <ToggleRight className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-bold text-xs text-slate-400 dark:text-slate-500">
                          <span>Suspended</span>
                          <ToggleLeft className="w-10 h-10" />
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            /* TAB 4: System Telemetry Logs & Socket activities */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Load telemetries (2 cols) */}
              <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-6 shadow-sm">
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800">
                  Node Hardware Status
                </h4>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1 text-slate-650 dark:text-slate-405"><Cpu className="w-4 h-4 text-purple-500" /> Qualcomm NPU CPU Load</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{cpuLoad}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-650 h-full transition-all duration-300 bg-purple-500" style={{ width: `${cpuLoad}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1 text-slate-650 dark:text-slate-405"><Database className="w-4 h-4 text-indigo-500" /> RAM Memory Pool Allocation</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{ramLoad}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-650 h-full transition-all duration-300 bg-indigo-500" style={{ width: `${ramLoad}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50/50 dark:bg-blue-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl space-y-1.5 text-[10px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                    <div>Database: <span className="text-slate-850 dark:text-slate-200 font-bold">Mongoose Connected (127.0.0.1)</span></div>
                    <div>Socket instances: <span className="text-slate-850 dark:text-slate-200 font-bold">2 Active terminals</span></div>
                    <div>SLA limits validation: <span className="text-[#16A34A] font-bold">Running every 60s</span></div>
                  </div>
                </div>
              </div>

              {/* Live Web Socket events logs (3 cols) */}
              <div className="md:col-span-3 p-6 bg-slate-950 border border-slate-900 rounded-2xl text-left space-y-3 font-mono shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Live WebSocket events Logger</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping"></span>
                </div>

                <div className="space-y-1.5 text-[9px] leading-relaxed max-h-[220px] overflow-y-auto pr-1">
                  {wsLogs.map((log) => (
                    <div key={log.id} className="text-slate-350">
                      <span className="text-slate-500">[{log.time}]</span>{' '}
                      <span className={`${
                        log.type === 'success' ? 'text-emerald-400 font-bold' :
                        log.type === 'warn' ? 'text-amber-400 font-bold' :
                        'text-[#EA580C]'
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
