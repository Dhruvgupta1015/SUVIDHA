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

  /* ─── Auth guard ─── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { navigate('/auth?role=officer'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'officer') { navigate('/auth?role=officer'); return; }
    setCurrentOfficer(user);
    fetchRequests();
  }, [navigate]);

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
      console.error('[Officer Update Error]', err);

      setErrorMsg(
        err.response?.data?.message ||
        'Failed to update ticket.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  /* ─── Filtering + Sorting ─── */
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
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
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
          <button
            onClick={() => fetchRequests(true)}
            className="btn-ghost text-xs px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
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
            <div className="gov-card p-10 text-center text-xs text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-[#2563EB] rounded-full animate-spin mx-auto mb-2" />
              Loading department registry…
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="gov-card p-10 text-center text-sm text-gray-400 space-y-2">
              <FileText className="w-8 h-8 text-gray-200 mx-auto" />
              <p>No tickets match the current filters.</p>
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
                    {filteredRequests.map(req => (
                      <tr
                        key={req.requestId}
                        onClick={() => handleSelectRequest(req)}
                        className={`cursor-pointer transition ${selectedRequest?.requestId === req.requestId
                            ? 'bg-blue-50/40 border-l-2 border-l-[#2563EB]'
                            : 'hover:bg-gray-50'
                          }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#2563EB]">{req.requestId}</td>
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
                        <td className="px-4 py-3"><span className={priorityBadge(req.priority)}>{req.priority}</span></td>
                        <td className="px-4 py-3"><span className={statusBadge(req.status)}>{req.status}</span></td>
                      </tr>
                    ))}
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
                </div>
              </div>

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
