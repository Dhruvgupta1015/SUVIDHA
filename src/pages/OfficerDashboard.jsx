import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User as UserIcon, 
  ChevronRight, 
  Users, 
  Layers, 
  FileCheck,
  Eye,
  Send,
  HelpCircle
} from 'lucide-react';
import { requestAPI } from '../utils/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [currentOfficer, setCurrentOfficer] = useState(null);
  
  // Data State
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');

  // Action Panel Form State
  const [statusVal, setStatusVal] = useState('In-Progress');
  const [assignedTeamVal, setAssignedTeamVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);

  // Verification checks on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth?role=officer');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'officer') {
      navigate('/auth?role=officer');
      return;
    }
    setCurrentOfficer(user);
    fetchDepartmentRequests();
  }, [navigate]);

  const fetchDepartmentRequests = async () => {
    setLoading(true);
    try {
      const response = await requestAPI.departmentRequests();
      if (response.data && response.data.requests) {
        setAssignedRequests(response.data.requests);
        if (response.data.requests.length > 0) {
          // Default selection to first ticket
          setSelectedRequest(response.data.requests[0]);
          initActionForm(response.data.requests[0]);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load departmental tickets.');
    } finally {
      setLoading(false);
    }
  };

  const initActionForm = (req) => {
    if (!req) return;
    setStatusVal(req.status || 'In-Progress');
    setAssignedTeamVal(req.assignedTeam || '');
    setRemarksVal(req.remarks || '');
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    initActionForm(req);
    setErrorMsg('');
    setActionSuccess(false);
  };

  // Submit Action Decision
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setLoading(true);
    setErrorMsg('');
    setActionSuccess(false);

    try {
      const payload = {
        status: statusVal,
        assignedTeam: assignedTeamVal,
        remarks: remarksVal
      };

      const response = await requestAPI.updateStatus(selectedRequest.requestId, payload);
      if (response.data && response.data.success) {
        setActionSuccess(true);
        speak(`Ticket status updated to ${statusVal}`);
        
        // Refresh list
        const updatedRequests = assignedRequests.map(r => 
          r.requestId === selectedRequest.requestId 
            ? { ...r, status: statusVal, assignedTeam: assignedTeamVal, remarks: remarksVal }
            : r
        );
        setAssignedRequests(updatedRequests);
        setSelectedRequest({ ...selectedRequest, status: statusVal, assignedTeam: assignedTeamVal, remarks: remarksVal });
        
        setTimeout(() => {
          setActionSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit action update.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Teams mapping based on department
  const getDepartmentTeams = (dept) => {
    if (dept?.includes('Electricity')) {
      return ["BESCOM Maintenance Unit 2", "Grid Safety Wing C", "Substation Emergency Crew", "Line Inspection Team"];
    } else if (dept?.includes('Water')) {
      return ["BWSSB Leakage Squad 4", "Main Supply Grid Crew", "Emergency Piping Unit", "Reservoir Maintenance Wing"];
    } else if (dept?.includes('Gas')) {
      return ["GAIL Pipeline Inspect Unit 3", "Safety Audit Inspector Crew", "Emergency Gas Valve squad"], ["Meter Repair Crew A"];
    } else if (dept?.includes('Waste')) {
      return ["BBMP Trash Truck Route 3", "Drainage Sweeper Crew Delta", "Solid Waste Landfill Unit", "Public Health Sanitation Wing"];
    }
    return ["General Administration Crew 1", "Streetlight Repair Unit 5", "Nodal Cell Inspection Squad"];
  };

  // Filter requests
  const filteredRequests = assignedRequests.filter(req => {
    if (statusFilter === 'All') return true;
    return req.status === statusFilter;
  });

  // Calculate statistics
  const total = assignedRequests.length;
  const pending = assignedRequests.filter(r => r.status === 'Pending').length;
  const inProgress = assignedRequests.filter(r => r.status === 'In-Progress').length;
  const resolved = assignedRequests.filter(r => r.status === 'Completed').length;

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full text-left">
      
      {/* 1. Header */}
      {currentOfficer && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg"><Building className="w-5 h-5" /></span>
              <h2 className="text-lg md:text-xl font-bold font-sans">{currentOfficer.department} Dashboard</h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold">
              Officer Console • Logged in as: <span className="text-slate-200 font-bold">{currentOfficer.name}</span>
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            Gateway: National NPU Node Ward-84
          </div>
        </div>
      )}

      {/* 2. Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Assigned Tickets</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{total}</span>
          </div>
          <span className="p-2.5 bg-orange-50 dark:bg-blue-950/20 text-[#EA580C] dark:text-orange-400 rounded-xl"><Layers className="w-5 h-5" /></span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Pending Review</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pending}</span>
          </div>
          <span className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl"><Clock className="w-5 h-5" /></span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Active Field Work</span>
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{inProgress}</span>
          </div>
          <span className="p-2.5 bg-orange-50 dark:bg-blue-950/20 text-orange-500 rounded-xl"><Users className="w-5 h-5" /></span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Resolved Cases</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolved}</span>
          </div>
          <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-[#16A34A] rounded-xl"><CheckCircle2 className="w-5 h-5" /></span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Main Data View Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Column: Tickets Table (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header & Status Filter tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-widest">
              Department Grievances List ({filteredRequests.length})
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/50">
              {['All', 'Pending', 'In-Progress', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-white shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading && assignedRequests.length === 0 ? (
            <div className="text-xs text-slate-400 py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Loading department registry...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2 text-xs text-slate-400">
              <FileText className="w-8 h-8 text-slate-350 mx-auto" />
              <p>No civic tickets match the selected status filter.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-slate-700 dark:text-slate-350">
                <thead className="bg-slate-50 dark:bg-slate-850 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Ref ID</th>
                    <th className="px-4 py-3 text-left">Citizen Details</th>
                    <th className="px-4 py-3 text-left">Service Type</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.requestId}
                      onClick={() => handleSelectRequest(req)}
                      className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-850/50 ${
                        selectedRequest?.requestId === req.requestId 
                          ? 'bg-orange-50/20 dark:bg-slate-850/50 font-bold' 
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-extrabold text-[#EA580C] dark:text-orange-400">{req.requestId}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{req.citizenId?.name || 'Aadhaar User'}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">+91 {req.citizenId?.mobile}</div>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[120px] capitalize">{req.subService}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          req.priority === 'Critical' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300' :
                          req.priority === 'High' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>{req.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          req.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300' :
                          req.status === 'In-Progress' ? 'bg-orange-100 dark:bg-blue-900/40 text-[#EA580C] dark:text-orange-300' :
                          req.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300' :
                          'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                        }`}>{req.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Review and Action Drawer (2 cols) */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5 text-xs text-left shadow-sm">
              
              {/* Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-widest block mb-1">Ticket Redressal Desk</span>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold font-mono text-sm text-[#EA580C] dark:text-orange-400">{selectedRequest.requestId}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    selectedRequest.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300' :
                    selectedRequest.status === 'In-Progress' ? 'bg-orange-100 dark:bg-blue-900/40 text-[#EA580C] dark:text-orange-300' :
                    selectedRequest.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300' :
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                  }`}>{selectedRequest.status}</span>
                </div>
              </div>

              {/* Citizen Details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl space-y-2 border border-slate-200/50 dark:border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Citizen Name:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{selectedRequest.citizenId?.name || 'Aadhaar Verified'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">+91 {selectedRequest.citizenId?.mobile}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Service Category:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold capitalize">{selectedRequest.serviceType} ({selectedRequest.subService})</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grievance Description Address</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-slate-600 dark:text-slate-350 leading-relaxed italic border border-slate-200/50 dark:border-slate-800">
                  "{selectedRequest.description}"
                </p>
              </div>

              {/* Verified Scans */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Scans Wallet</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-orange-50 dark:bg-blue-950/20 text-[#EA580C] dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 px-3 py-1.5 rounded-lg font-bold">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{doc.name}</span>
                        <span className="text-[8px] bg-[#16A34A] text-white px-1 rounded ml-1">98% Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Action Form */}
              <form onSubmit={handleActionSubmit} className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatch Redressal Action</span>

                {actionSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Decision submitted successfully!</span>
                  </div>
                )}

                {/* Status Dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Update Ticket Status</label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                  >
                    <option value="Pending">Pending (Awaiting Action)</option>
                    <option value="In-Progress">In-Progress (Field Work Active)</option>
                    <option value="Approved">Approved (Documentation Verified)</option>
                    <option value="Completed">Completed (Resolution Closed)</option>
                    <option value="Rejected">Rejected (Incomplete Record)</option>
                  </select>
                </div>

                {/* Team Assignment */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Assign Field Crew Team</label>
                  <select
                    value={assignedTeamVal}
                    onChange={(e) => setAssignedTeamVal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg outline-none"
                  >
                    <option value="">Awaiting crew dispatch</option>
                    {getDepartmentTeams(currentOfficer.department).map((team, idx) => (
                      <option key={idx} value={team}>{team}</option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Official Decision Remarks / Rejection Reasons</label>
                  <textarea
                    rows={2}
                    placeholder="Enter official action comments or instructions..."
                    value={remarksVal}
                    onChange={(e) => setRemarksVal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-[#EA580C]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#EA580C] hover:bg-orange-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Redressal Action</span>
                </button>
              </form>

            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              Select a citizen request ticket from the table to process redressal actions.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default OfficerDashboard;
