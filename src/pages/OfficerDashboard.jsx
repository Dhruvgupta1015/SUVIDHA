import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, AlertTriangle, FileText, User as UserIcon,
  ChevronRight, Users, Layers, FileCheck, Eye, Send, Search, Filter,
  RefreshCw, SortAsc, Bell, TrendingUp, X, MapPin, Calendar, Hash,
  ShieldCheck, Zap, Droplet, Flame, Trash2
} from 'lucide-react';
import { requestAPI } from '../utils/api';
import { useAccessibility } from '../context/AccessibilityContext';
import { computeSlaStatus, queueComparator } from '../utils/slaEngine';
import { io } from 'socket.io-client';
import { NotificationCenter, useNotifications } from '../components/NotificationCenter';

/* ─── Status helpers ─── */
const statusBadge = (s) => {
  const m = { Completed: 'badge-complete', 'In-Progress': 'badge-progress', Rejected: 'badge-rejected', Pending: 'badge-pending', Approved: 'badge-approved' };
  return `status-badge ${m[s] || 'badge-standard'}`;
};
const priorityBadge = (p) => {
  if (p === 'Critical') return 'status-badge badge-critical';
  if (p === 'High') return 'status-badge badge-high';
  return 'status-badge badge-standard';
};

const serviceIcon = (type) => ({
  electricity: <Zap className="w-4 h-4 text-[#2563EB]" />,
  water: <Droplet className="w-4 h-4 text-cyan-600" />,
  gas: <Flame className="w-4 h-4 text-orange-500" />,
  waste: <Trash2 className="w-4 h-4 text-green-600" />,
}[type] || <FileText className="w-4 h-4 text-purple-500" />);

const deptTeams = {
  'Electricity Department': ['BESCOM Maintenance Unit 2', 'Grid Safety Wing C', 'Substation Emergency Crew', 'Line Inspection Team Alpha'],
  'Water Department': ['BWSSB Leakage Squad 4', 'Main Supply Grid Crew', 'Emergency Piping Unit B', 'Reservoir Maintenance Wing'],
  'Gas Department': ['GAIL Pipeline Inspect Unit 3', 'Safety Audit Inspector Crew', 'Emergency Gas Valve Squad', 'Meter Repair Crew A'],
  'Waste Management': ['BBMP Trash Truck Route 3', 'Drainage Sweeper Crew Delta', 'Solid Waste Landfill Unit', 'Public Health Sanitation Wing'],
  'General Administration': ['General Admin Crew 1', 'Streetlight Repair Unit 5', 'Nodal Cell Inspection Squad', 'Field Verification Team'],
};

export const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [currentOfficer, setCurrentOfficer] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);

  /* Filter & Search state */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  /* Action form */
  const [statusVal, setStatusVal] = useState('In-Progress');
  const [assignedTeamVal, setAssignedTeamVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Evidence override */
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);

  /* Urgent alert toast & notifications */
  const [urgentToast, setUrgentToast] = useState(null);
  const { notifications, addNotification, clearAll, markRead } = useNotifications();

  /* ─── Auth guard ─── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { navigate('/auth?role=officer'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'officer' && user.role !== 'admin') { navigate('/auth?role=officer'); return; }
    setCurrentOfficer(user);
    fetchRequests();
  }, [navigate]);

  /* ─── Socket: urgentAlert ─── */
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
      speak(data.message || 'Urgent alert received');
    });
    sock.on('newRequest', (data) => {
      if (data.priority === 'Critical' || data.isEmergency) {
        fetchRequests(true);
      }
    });
    return () => sock.close();
  }, [addNotification]);

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await requestAPI.departmentRequests();
      if (res.data?.requests) {
        setAllRequests(res.data.requests);
        if (res.data.requests.length > 0) {
          const first = res.data.requests[0];
          setSelectedRequest(first);
          initForm(first);
        }
      }
    } catch { setErrorMsg('Failed to load department tickets.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const initForm = (req) => {
    if (!req) return;
    setStatusVal(req.status || 'In-Progress');
    setAssignedTeamVal(req.assignedTeam || '');
    setRemarksVal(req.remarks || '');
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    initForm(req);
    setErrorMsg('');
    setActionSuccess(false);
  };

  /* ─── Submit action ─── */
  const handleActionSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRequest) return;

    setSubmitting(true);
    setErrorMsg('');
    setActionSuccess(false);

    try {
      const payload = {
        status: statusVal,
        assignedTeam: assignedTeamVal,
        remarks: remarksVal
      };

      // Step 1: Update request in backend
      const res = await requestAPI.updateStatus(
        selectedRequest.requestId,
        payload
      );

      if (res.data?.success) {
        // Step 2: Fetch latest updated department queue
        const refreshed = await requestAPI.departmentRequests();

        const updatedRequests = refreshed.data.requests || [];

        // Step 3: Update all requests state
        setAllRequests(updatedRequests);

        // Step 4: Find latest updated selected request
        const latestRequest = updatedRequests.find(
          (r) => r.requestId === selectedRequest.requestId
        );

        if (latestRequest) {
          setSelectedRequest(latestRequest);

          // Sync form values with latest DB values
          initForm(latestRequest);
        }

        setActionSuccess(true);

        speak(
          `Ticket ${selectedRequest.requestId} updated successfully`
        );

        setTimeout(() => {
          setActionSuccess(false);
        }, 2500);
      }
    } catch (err) {
      setErrorMsg(err.friendlyMessage || 'Failed to update ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Evidence override (approve / reject / request-reupload) ─── */
  const handleEvidenceAction = async (docIndex, action) => {
    if (!selectedRequest || evidenceSubmitting) return;
    setEvidenceSubmitting(true);
    setErrorMsg('');
    try {
      const res = await requestAPI.evidenceAction(selectedRequest.requestId, { docIndex, action });
      if (res.data?.success && res.data.document) {
        // Update document in local state immediately
        setSelectedRequest(prev => {
          const docs = [...prev.documents];
          docs[docIndex] = { ...docs[docIndex], ...res.data.document };
          return { ...prev, documents: docs };
        });
        setAllRequests(prev => prev.map(r =>
          r.requestId === selectedRequest.requestId
            ? { ...r, documents: r.documents.map((d, i) => i === docIndex ? { ...d, ...res.data.document } : d) }
            : r
        ));
        speak(`Evidence ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 're-upload requested'}`);
      }
    } catch (err) {
      setErrorMsg(err.friendlyMessage || 'Evidence action failed.');
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  /* ─── Filtering + Predictive Queue Sorting (T5) ─── */
  const filteredRequests = allRequests
    .filter(r => {
      const matchSearch = !searchQuery ||
        r.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.citizenId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subService?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      // T5: Predictive — priority first, then SLA, then createdAt
      if (sortBy === 'smart' || sortBy === 'newest') return queueComparator(a, b);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const pOrder = { Critical: 0, High: 1, Standard: 2 };
        return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      }
      return 0;
    });

  /* ─── Stats ─── */
  const stats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status === 'Pending').length,
    inProgress: allRequests.filter(r => r.status === 'In-Progress').length,
    resolved: allRequests.filter(r => r.status === 'Completed').length,
    critical: allRequests.filter(r => r.priority === 'Critical').length,
  };

  /* ─── Teams for current department ─── */
  const teams = deptTeams[currentOfficer?.department] || deptTeams['General Administration'];

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-up">

      {/* ── T8: Urgent Alert Toast ── */}
      {urgentToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-fade-in">
          <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-red-400 bg-red-50 shadow-2xl">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-red-800 text-sm">Urgent Alert</p>
              <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{urgentToast.message}</p>
              <p className="text-[10px] text-red-500 mt-1 font-mono">{urgentToast.requestId}</p>
            </div>
            <button onClick={() => setUrgentToast(null)} className="text-red-400 hover:text-red-700 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ Officer Banner ══ */}
      {currentOfficer && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#2563EB]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {currentOfficer.department} Dashboard
                </h2>
                {stats.critical > 0 && (
                  <span className="status-badge badge-critical flex items-center gap-1">
                    <Bell className="w-3 h-3" /> {stats.critical} Critical
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Officer Console · <strong className="text-gray-700">{currentOfficer.name}</strong>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-[#2563EB] font-medium">{currentOfficer.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter notifications={notifications} onClear={clearAll} onMarkRead={markRead} />
            <button
              onClick={() => fetchRequests(true)}
              className="btn-ghost text-xs px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>
        </div>
      )}

      {/* ══ Stats Strip ══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Tickets', value: stats.total, color: 'text-gray-700 bg-gray-50 border-gray-200', icon: <Layers className="w-4 h-4" /> },
          { label: 'Pending', value: stats.pending, color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4" /> },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'Critical', value: stats.critical, color: 'text-red-700 bg-red-50 border-red-200', icon: <AlertTriangle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="gov-card p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
              <div className="text-[10px] text-gray-500 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ Error ══ */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* ══ Main Split: Ticket Queue + Action Panel ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ── Left: Request Queue (3 cols) ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Search + Filters */}
          <div className="gov-card p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Ref ID, Citizen name, or service…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="gov-input pl-10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                {['All', 'Pending', 'In-Progress', 'Completed', 'Rejected'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition whitespace-nowrap ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Priority filter */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                {['All', 'Critical', 'High', 'Standard'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition whitespace-nowrap ${priorityFilter === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="gov-input py-1.5 px-3 text-xs w-auto"
              >
                <option value="smart">⚡ Smart Queue (AI)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
          </div>

          {/* Queue count */}
          <div className="flex items-center justify-between px-1">
            <span className="section-label text-gray-500">
              Department Queue — {filteredRequests.length} ticket{filteredRequests.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          {loading && allRequests.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="gov-card p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="gov-card p-10 text-center text-sm text-gray-400 space-y-2">
              <FileText className="w-8 h-8 text-gray-200 mx-auto" />
              <p>No pending queue or suspicious evidence found.</p>
            </div>
          ) : (
            <div className="gov-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left section-label text-gray-500">Ref ID</th>
                      <th className="px-4 py-3 text-left section-label text-gray-500">Citizen</th>
                      <th className="px-4 py-3 text-left section-label text-gray-500 hidden sm:table-cell">Service</th>
                      <th className="px-4 py-3 text-left section-label text-gray-500">Priority</th>
                      <th className="px-4 py-3 text-left section-label text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map(req => {
                        const { slaStatus } = computeSlaStatus(req.createdAt);
                        const slaBadge = {
                          Escalated: 'text-red-700 bg-red-50 border-red-200',
                          Critical:  'text-orange-700 bg-orange-50 border-orange-200',
                          Warning:   'text-yellow-700 bg-yellow-50 border-yellow-200',
                          Safe:      'text-green-700 bg-green-50 border-green-200'
                        }[slaStatus] || 'text-gray-500 bg-gray-50 border-gray-200';
                        return (
                      <tr
                        key={req.requestId}
                        onClick={() => handleSelectRequest(req)}
                        className={`cursor-pointer transition ${selectedRequest?.requestId === req.requestId
                            ? 'bg-blue-50/40 border-l-2 border-l-[#2563EB]'
                            : 'hover:bg-gray-50'
                          }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-[#2563EB]">{req.requestId}</span>
                          {req.isEmergency && <span className="ml-1 text-red-600 font-black">🚨</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{req.citizenId?.name || 'Aadhaar User'}</div>
                          <div className="text-[10px] text-gray-400">+91 {req.citizenId?.mobile}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            {serviceIcon(req.serviceType)}
                            <span className="capitalize text-gray-700 truncate max-w-[100px]">{req.subService}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={priorityBadge(req.priority)}>{req.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={statusBadge(req.status)}>{req.status}</span>
                          <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${slaBadge}`}>
                            {slaStatus === 'Safe' ? '🟢' : slaStatus === 'Warning' ? '⚠️' : slaStatus === 'Critical' ? '🟠' : '🔴'} {slaStatus}
                          </span>
                        </td>
                      </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Action Panel (2 cols) ── */}
        <div className="lg:col-span-2 space-y-4">

          {selectedRequest ? (
            <>
              {/* Request summary card */}
              <div className="gov-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-gray-900">{selectedRequest.requestId}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={statusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
                        <span className={priorityBadge(selectedRequest.priority)}>{selectedRequest.priority}</span>
                        {selectedRequest.isEmergency && (
                          <span className="status-badge text-red-700 bg-red-50 border-red-200 flex items-center gap-1">🚨 Emergency</span>
                        )}
                        {(() => {
                          const { slaStatus } = computeSlaStatus(selectedRequest.createdAt);
                          const colors = { Escalated: 'text-red-700 bg-red-50 border-red-200', Critical: 'text-orange-700 bg-orange-50 border-orange-200', Warning: 'text-yellow-700 bg-yellow-50 border-yellow-200', Safe: 'text-green-700 bg-green-50 border-green-200' };
                          return <span className={`status-badge ${colors[slaStatus]}`}>{slaStatus === 'Escalated' ? '🔴' : slaStatus === 'Critical' ? '🟠' : slaStatus === 'Warning' ? '⚠️' : '🟢'} SLA: {slaStatus}</span>;
                        })()}
                      </div>
                    </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedRequest.priority === 'Critical' ? 'bg-red-50' :
                      selectedRequest.priority === 'High' ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                    {serviceIcon(selectedRequest.serviceType)}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">{selectedRequest.citizenId?.name || 'Aadhaar User'}</div>
                      <div className="text-gray-500">+91 {selectedRequest.citizenId?.mobile}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 leading-relaxed">{selectedRequest.description}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">{new Date(selectedRequest.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedRequest.assignedTeam && selectedRequest.assignedTeam !== 'Unassigned' && (
                    <div className="flex gap-2 items-center">
                      <Users className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-green-700 font-medium">{selectedRequest.assignedTeam}</span>
                    </div>
                  )}
                  {/* T2: Routing confidence */}
                  {selectedRequest.routingReason && (
                    <div className="flex gap-2 items-start">
                      <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-blue-700 font-bold block text-[10px]">
                          Smart Routing — {Math.round((selectedRequest.routingConfidence || 0.65) * 100)}% confidence
                        </span>
                        <span className="text-blue-500 text-[10px]">{selectedRequest.routingReason}</span>
                      </div>
                    </div>
                  )}
                  {/* T1: Priority reason */}
                  {selectedRequest.priorityReason && selectedRequest.priorityReason !== 'No urgency keywords detected — routine complaint' && (
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-amber-700 text-[10px] font-medium">{selectedRequest.priorityReason}</span>
                    </div>
                  )}
                  {/* T4: Emergency audit trail */}
                  {selectedRequest.isEmergency && selectedRequest.emergencySource && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start">
                      <span className="text-sm flex-shrink-0">🔍</span>
                      <div>
                        <span className="text-red-700 font-bold block text-[10px]">Emergency Audit Trail</span>
                        <span className="text-red-600 text-[10px] block">Source: {selectedRequest.emergencySource}</span>
                        {selectedRequest.emergencyTriggeredAt && (
                          <span className="text-red-500 text-[10px]">At: {new Date(selectedRequest.emergencyTriggeredAt).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Review Panel — with officer override actions */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="gov-card p-5 space-y-3">
                  <h4 className="font-black text-sm text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <FileCheck className="w-4 h-4 text-[#2563EB]" />
                    Evidence Review
                    {selectedRequest.documents.some(d => d.flagged) && (
                      <span className="status-badge badge-critical flex items-center gap-1 ml-auto">
                        <AlertTriangle className="w-3 h-3" /> Attention
                      </span>
                    )}
                  </h4>

                  <div className="space-y-3">
                    {selectedRequest.documents.map((doc, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          doc.flagged
                            ? 'bg-amber-50 border-amber-200'
                            : doc.verified
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Row 1: filename + status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-800 truncate">
                            <Hash className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <a 
                              href={doc.secureUrl || doc.path} 
                              target="_blank" 
                              rel="noreferrer"
                              className="truncate text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {doc.name}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {doc.flagged ? (
                              <span className="flex items-center gap-1 font-bold text-amber-700">
                                <AlertTriangle className="w-3 h-3" /> {doc.reason?.includes('Re-upload') ? 'Re-upload Req.' : doc.reason?.includes('Rejected') ? 'Rejected' : 'Suspicious'}
                              </span>
                            ) : doc.verified ? (
                              <span className="flex items-center gap-1 font-bold text-green-700">
                                <ShieldCheck className="w-3 h-3" /> {doc.reason?.includes('Approved by Officer') ? 'Officer Approved' : 'AI Verified'}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">Unverified</span>
                            )}
                          </div>
                        </div>

                        {/* Row 2: confidence + reason */}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">
                            Confidence:{' '}
                            <span className={`font-bold ${
                              doc.confidence >= 0.80 ? 'text-green-700' :
                              doc.confidence >= 0.55 ? 'text-amber-700' : 'text-red-700'
                            }`}>
                              {Math.round((doc.confidence || 0) * 100)}%
                            </span>
                          </span>
                          {doc.reason && (
                            <span className="text-gray-400 italic truncate max-w-[140px]">{doc.reason}</span>
                          )}
                        </div>

                        {/* Row 3: officer review audit */}
                        {doc.reviewedAt && (
                          <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1 pt-1 border-t border-gray-200/50">
                            <ShieldCheck className="w-3 h-3" />
                            Officer reviewed: {new Date(doc.reviewedAt).toLocaleString('en-IN')}
                          </div>
                        )}

                        {/* Row 4: action buttons */}
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => handleEvidenceAction(i, 'approve')}
                            disabled={evidenceSubmitting || (doc.verified && !doc.flagged)}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition
                              bg-green-50 border-green-200 text-green-700 hover:bg-green-100
                              disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleEvidenceAction(i, 'reject')}
                            disabled={evidenceSubmitting || (doc.flagged && doc.reason?.includes('Rejected'))}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition
                              bg-red-50 border-red-200 text-red-700 hover:bg-red-100
                              disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => handleEvidenceAction(i, 'request-reupload')}
                            disabled={evidenceSubmitting || doc.reason?.includes('Re-upload')}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition
                              bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100
                              disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ↻ Re-upload
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action form */}
              <div className="gov-card p-5">
                <h4 className="font-black text-sm text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Send className="w-4 h-4 text-[#2563EB]" />
                  Update Ticket Status
                </h4>

                {actionSuccess && (
                  <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Ticket updated successfully!
                  </div>
                )}

                <form onSubmit={handleActionSubmit} className="space-y-4">
                  {/* Status dropdown */}
                  <div>
                    <label className="section-label text-gray-600 block mb-2">Update Status</label>
                    <select
                      value={statusVal}
                      onChange={e => setStatusVal(e.target.value)}
                      className="gov-input"
                    >
                      <option value="Pending">Pending — Awaiting Review</option>
                      <option value="In-Progress">In-Progress — Field Work Active</option>
                      <option value="Approved">Approved — Application Cleared</option>
                      <option value="Rejected">Rejected — Not Actionable</option>
                      <option value="Completed">Completed — Issue Resolved</option>
                    </select>
                  </div>

                  {/* Field staff assignment */}
                  <div>
                    <label className="section-label text-gray-600 block mb-2">Assign Field Staff / Crew</label>
                    <select
                      value={assignedTeamVal}
                      onChange={e => setAssignedTeamVal(e.target.value)}
                      className="gov-input"
                    >
                      <option value="">— Select field crew —</option>
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Department: {currentOfficer?.department}</p>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="section-label text-gray-600 block mb-2">Official Remarks</label>
                    <textarea
                      rows={3}
                      placeholder="Add official dispatch notes or resolution remarks…"
                      value={remarksVal}
                      onChange={e => setRemarksVal(e.target.value)}
                      className="gov-input resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <Send className="w-4 h-4" /> Submit Update
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="gov-card p-10 text-center text-sm text-gray-400 flex flex-col items-center gap-3">
              <Eye className="w-9 h-9 text-gray-200" />
              <p>Click a ticket from the queue to open the action panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
