import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { adminAPI, requestAPI } from '../utils/api';
import { io } from 'socket.io-client';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  LogOut, 
  Activity, 
  Cpu, 
  AlertTriangle,
  Building,
  Smartphone,
  Eye,
  Settings,
  Bell,
  Play,
  RotateCcw,
  HelpCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Active Admin Tabs: 'dashboard' | 'requests' | 'controls'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Table search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Kiosk Service Status Controls (System Controls)
  const [servicesState, setServicesState] = useState({
    electricity: true,
    water: true,
    gas: true,
    waste: true,
    complaints: true
  });

  const [requests, setRequests] = useState([]);
  const [slaAlerts, setSlaAlerts] = useState([]);
  const [logs, setLogs] = useState([
    { text: "System boot active. Fleet monitoring running.", time: "Just now", type: "info" }
  ]);

  // Load backend statistics
  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.dashboard();
      const { metrics, requests: reqList, slaViolations } = response.data;
      
      const mapped = reqList.map(r => ({
        id: r.requestId,
        citizenName: r.citizenId?.name || "Citizen Profile",
        service: r.serviceType.toUpperCase(),
        subService: r.serviceType,
        status: r.status,
        department: r.assignedDepartment || "Nodal Wing",
        time: new Date(r.createdAt).toLocaleDateString()
      }));

      setRequests(mapped);

      const mappedSla = slaViolations.map(v => ({
        id: v.requestId,
        message: `SLA warning: ${v.serviceType.toUpperCase()} ticket pending response limit!`,
        location: v.assignedDepartment || "Nodal Wing"
      }));
      setSlaAlerts(mappedSla);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time socket events for citizen arrivals
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('newRequest', (newReq) => {
      console.log("[Socket] Received new citizen request in admin:", newReq);
      setRequests(prev => [newReq, ...prev]);
      setLogs(prev => [
        { text: `New complaint ${newReq.id} registered for ${newReq.service}`, time: "Just now", type: "info" },
        ...prev
      ]);
      speak("New request has arrived at the kiosk dispatch desk.");
    });

    socket.on('statusUpdate', (data) => {
      // Update local state in table
      setRequests(prev => prev.map(r => r.id === data.requestId ? { ...r, status: data.status, department: data.department } : r));
    });

    return () => socket.close();
  }, []);

  // Admin summary metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending' || r.status === 'In-Progress').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;
  const completedCount = requests.filter(r => r.status === 'Completed').length;

  // Handler for row actions posting to live endpoints
  const handleUpdateStatus = async (id, newStatus, e) => {
    speakElement(e, `Updating request ${id} to ${newStatus}`);
    
    try {
      if (newStatus === 'Approved') {
        await adminAPI.approve(id);
      } else {
        await requestAPI.updateStatus({
          id,
          status: newStatus,
          assignedDepartment: newStatus === 'Escalated' ? 'Division Executive Head' : 'Closed - Grievance Resolved'
        });
      }

      setLogs(prev => [{ text: `Official updated ticket ${id} to ${newStatus}`, time: "Just now", type: "info" }, ...prev]);
      speak(`Grievance ${id} status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      speak("Failed to dispatch status update to database");
      alert("Error updating status. Ensure backend is running.");
    }
  };

  // Toggle Services Enable/Disable
  const toggleService = (key, e) => {
    const nextVal = !servicesState[key];
    speakElement(e, `${key} service turned ${nextVal ? 'on' : 'off'}`);
    setServicesState(prev => ({ ...prev, [key]: nextVal }));
  };

  // Export Data Simulation
  const handleExport = (e) => {
    speakElement(e, "Exporting complaints data spreadsheet");
    alert("Export successful: SUVIDHA_Complaints_Report_2026.csv downloaded locally.");
  };

  const handleLogout = (e) => {
    speakElement(e, "Admin log out");
    speak("Administrator logged out successfully");
    navigate('/');
  };

  // Filter & Search rows
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col justify-start max-w-6xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Admin Top Navbar controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-kiosk-teal/15 border border-kiosk-teal/30 text-kiosk-teal">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-outfit font-black tracking-wide">SUVIDHA Administrative Portal</h2>
            <p className="text-[10px] text-slate-400">Urban Grievance Registry & Telemetry Feed</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          {['dashboard', 'requests', 'controls'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition capitalize kiosk-btn border ${
                activeTab === tab
                  ? 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal font-black shadow-kiosk-glow'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {tab === 'controls' ? 'Kiosk Controls' : tab}
            </button>
          ))}
          
          <button
            onClick={handleLogout}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-xl transition kiosk-btn"
            aria-label="Admin Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Dashboard Overview and Analytics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 1. Overview Counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Requests", val: totalCount, icon: FileSpreadsheet, color: "text-slate-300 border-slate-700/60 bg-kiosk-navy/40" },
              { label: "Pending", val: pendingCount, icon: Clock, color: "text-amber-400 border-amber-500/25 bg-amber-500/5" },
              { label: "Approved", val: approvedCount, icon: CheckCircle, color: "text-kiosk-teal border-kiosk-teal/25 bg-kiosk-teal/5" },
              { label: "Rejected", val: rejectedCount, icon: XCircle, color: "text-rose-400 border-rose-500/25 bg-rose-500/5" },
              { label: "Completed", val: completedCount, icon: CheckCircle, color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/5" }
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border shadow-md flex items-center justify-between transition ${stat.color}`}>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">{stat.label}</span>
                  <span className="text-xl font-outfit font-black block">{stat.val}</span>
                </div>
                <stat.icon className="w-5 h-5 opacity-70" />
              </div>
            ))}
          </div>

          {/* 2. Double split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: SLA Alerts & Service Breakdown (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SLA alerts banner list */}
              <div className={`p-6 rounded-3xl border shadow-kiosk-depth flex flex-col justify-start space-y-4 transition ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
              }`}>
                <h3 className="font-outfit font-black text-sm text-slate-200 flex items-center gap-2 select-none">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                  SLA Violation Alerts
                </h3>
                
                <div className="space-y-2.5">
                  {slaAlerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between text-xs gap-3">
                      <div>
                        <p className="font-bold text-rose-400">{alert.message}</p>
                        <p className="text-[10px] text-slate-400">Reference: {alert.id} • Location: {alert.location}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase font-bold shrink-0">CRITICAL</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Breakdown summary */}
              <div className={`p-6 rounded-3xl border shadow-kiosk-depth flex flex-col justify-start space-y-4 transition ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
              }`}>
                <h3 className="font-outfit font-black text-sm text-slate-200 flex items-center gap-2 select-none">
                  <Activity className="w-4.5 h-4.5 text-kiosk-teal" />
                  Service Category Breakdown
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {[
                    { label: "Electricity Services", count: 218, pct: "32%", color: "bg-amber-500" },
                    { label: "Water Services", count: 184, pct: "27%", color: "bg-blue-500" },
                    { label: "Gas Services", count: 96, pct: "14%", color: "bg-orange-500" },
                    { label: "Waste Management", count: 114, pct: "17%", color: "bg-emerald-500" },
                    { label: "General Complaints", count: 68, pct: "10%", color: "bg-indigo-500" }
                  ].map((cat, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span className="truncate pr-1">{cat.label}</span>
                        <span className="text-kiosk-teal font-mono">{cat.count}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${cat.color}`} style={{ width: cat.pct }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Column 2: Kiosk Health & Live Logs (1 Col) */}
            <div className="space-y-6">
              
              {/* Kiosk Fleet Health telemetry */}
              <div className={`p-6 rounded-3xl border shadow-kiosk-depth transition ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
              }`}>
                <h3 className="font-outfit font-black text-sm text-slate-200 flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
                  <Cpu className="w-4.5 h-4.5 text-kiosk-teal" />
                  Kiosk Fleet Telemetry
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Active fleet nodes:</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 12 Online
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Offline node status:</span>
                    <span className="font-mono font-bold text-slate-500">1 Offline</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 rounded-xl">
                    <span className="font-bold">Alert: K-BLR-03 (City Hall)</span>
                    <p className="mt-0.5">Printer paper rolls critically low. Target replacement SLA: 1 hour.</p>
                  </div>
                </div>
              </div>

              {/* Live activity feed logs */}
              <div className={`p-6 rounded-3xl border shadow-kiosk-depth transition ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
              }`}>
                <h3 className="font-outfit font-black text-sm text-slate-200 flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
                  <Bell className="w-4.5 h-4.5 text-kiosk-teal" />
                  Live Activity Feed
                </h3>
                
                <div className="space-y-3 overflow-y-auto max-h-[180px] text-[10px]">
                  {logs.map((log, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-2">
                      <p className="text-slate-300 leading-normal">{log.text}</p>
                      <span className="text-[8px] text-slate-500 mt-0.5 block font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Requests Management Table */}
      {activeTab === 'requests' && (
        <div className={`p-6 md:p-8 rounded-[2.5rem] border shadow-kiosk-depth transition space-y-6 ${
          highContrast ? 'bg-black border-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
        }`}>
          
          {/* Table Header actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex-1 max-w-sm relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Citizen Name, or Service..."
                className="w-full pl-9 pr-4 py-2.5 bg-kiosk-dark/70 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-kiosk-teal placeholder-slate-600 font-bold"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-kiosk-teal" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-semibold focus:ring-0 text-slate-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 kiosk-btn"
              >
                <Download className="w-3.5 h-3.5 text-kiosk-teal" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Large Management Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold select-none uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Request ID</th>
                  <th className="pb-3 font-bold">Citizen Name</th>
                  <th className="pb-3 font-bold">Service Category</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Assigned Department</th>
                  <th className="pb-3 font-bold">Time Log</th>
                  <th className="pb-3 font-bold text-center">Row Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-kiosk-teal">{req.id}</td>
                    <td className="py-4 font-semibold text-slate-200">{req.citizenName}</td>
                    <td className="py-4">
                      <p className="font-semibold text-slate-300 leading-none">{req.service}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">{req.subService}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                        req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        req.status === 'In-Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        req.status === 'Escalated' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-slate-400">{req.department}</td>
                    <td className="py-4 font-mono text-slate-500">{req.time}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => handleUpdateStatus(req.id, 'Approved', e)}
                          className="px-2 py-1 rounded bg-kiosk-teal/10 hover:bg-kiosk-teal text-kiosk-teal hover:text-kiosk-dark border border-kiosk-teal/20 text-[10px] font-bold transition kiosk-btn"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => handleUpdateStatus(req.id, 'Escalated', e)}
                          className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-[10px] font-bold transition kiosk-btn"
                        >
                          Escalate
                        </button>
                        <button
                          onClick={(e) => handleUpdateStatus(req.id, 'Completed', e)}
                          className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-bold transition kiosk-btn"
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-bold font-outfit text-sm">
                      No matching records found in register database
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 3: Admin Kiosk Settings and Controls */}
      {activeTab === 'controls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Service Master Toggles */}
          <div className={`p-6 rounded-3xl border shadow-kiosk-depth flex flex-col justify-start space-y-5 transition ${
            highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5 text-slate-100'
          }`}>
            <h3 className="font-outfit font-black text-sm text-slate-200 border-b border-white/5 pb-2 mb-2 select-none">
              Kiosk Service Master Toggles
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              Administrators can turn specific kiosk modules off during utility grid updates or maintenance window operations. Toggling instantly affects citizen welcome dashboards.
            </p>

            <div className="space-y-3.5">
              {[
                { key: 'electricity', label: "Electricity Board Portal" },
                { key: 'water', label: "Water & Sewage Board Portal" },
                { key: 'gas', label: "Piped Gas Grid Portal" },
                { key: 'waste', label: "Solid Waste Grievances Portal" },
                { key: 'complaints', label: "General Complaints Portal" }
              ].map((svc) => (
                <div key={svc.key} className="flex items-center justify-between p-3.5 bg-kiosk-dark/45 border border-white/5 rounded-2xl text-xs">
                  <span className="font-bold">{svc.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono ${servicesState[svc.key] ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {servicesState[svc.key] ? 'ENABLED' : 'DISABLED'}
                    </span>
                    <button
                      onClick={(e) => toggleService(svc.key, e)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${
                        servicesState[svc.key] ? 'bg-kiosk-teal' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        servicesState[svc.key] ? 'translate-x-6 bg-kiosk-dark' : 'bg-white'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Pack controls */}
          <div className={`p-6 rounded-3xl border shadow-kiosk-depth flex flex-col justify-start space-y-5 transition ${
            highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5 text-slate-100'
          }`}>
            <h3 className="font-outfit font-black text-sm text-slate-200 border-b border-white/5 pb-2 mb-2 select-none">
              Language Packs & System Toggles
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-kiosk-dark/45 border border-white/5 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-kiosk-teal block">Active Language Packs (Local NNP Lexicon)</span>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {['English (v2.4)', 'Hindi (v2.1)', 'Kannada (v1.9)', 'Tamil (v1.8)', 'Telugu (v1.8)'].map((l, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-xl">{l}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-kiosk-dark/45 border border-white/5 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-kiosk-teal block">AI Assistant Voice Target Modality</span>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-kiosk-teal text-kiosk-dark font-black rounded-lg text-[10px] text-center">Speech Synthesis (TTS)</button>
                  <button className="flex-1 py-2 bg-white/5 text-slate-400 font-bold border border-white/10 rounded-lg text-[10px] text-center">Haptic Feedback</button>
                </div>
              </div>

              {/* Diagnostics trigger */}
              <button
                onClick={(e) => {
                  speakElement(e, "Running full system diagnostics");
                  speak("Fleet Diagnostics check complete. Kiosk hardware optimal. Snapdragon NPU operational.");
                  alert("Diagnostics complete. 13 hardware assets parsed. Qualcomm NPU cores optimal.");
                }}
                className="w-full py-4.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 rounded-2xl text-xs flex items-center justify-center gap-2 kiosk-btn"
              >
                <Cpu className="w-4 h-4 text-kiosk-teal" />
                <span>Run Hardware Diagnostics</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Info banner */}
      <div className="text-center text-[10px] text-slate-500 py-2 flex items-center justify-center gap-1.5 font-bold select-none">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>SUVIDHA Control Desk v2.0 • Fleet IND-BLR-04 Metro Node. Built on Snapdragon NNP Framework.</span>
      </div>

    </div>
  );
};

export default AdminDashboard;
