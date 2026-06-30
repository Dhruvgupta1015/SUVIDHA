import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Search, CheckCircle2, Clock, Printer, AlertTriangle, Building2, RefreshCw,
  Calendar, MapPin, ShieldCheck, FileCheck, UploadCloud, Hash, X, Zap
} from 'lucide-react';
import { requestAPI, uploadAPI } from '../utils/api';
import { io } from 'socket.io-client';
import { computeSlaStatus } from '../utils/slaEngine';

const statusBadge = (s) => {
  const m = { Completed: 'badge-complete', 'In-Progress': 'badge-progress', Rejected: 'badge-rejected', Pending: 'badge-pending', Approved: 'badge-approved' };
  return `status-badge ${m[s] || 'badge-standard'}`;
};

export const ComplaintTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, highContrast } = useAccessibility();
  const reuploadRef = useRef(null);

  // Check if a ticket state was passed from home or submit
  const passedTicket = location.state?.refNumber || '';

  // Tracking States
  const [searchId, setSearchId] = useState(passedTicket || '');
  const [hasSearched, setHasSearched] = useState(!!passedTicket);
  const [searching, setSearching] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [socket, setSocket] = useState(null);

  // Re-upload state
  const [reuploadIndex, setReuploadIndex] = useState(null);
  const [reuploading, setReuploading] = useState(false);

  // Configure Socket connection with auto-reconnect for Render sleep/network blips
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      reconnection: true,          // auto-reconnect on disconnect
      reconnectionAttempts: 5,     // try up to 5 times
      reconnectionDelay: 2000,     // wait 2s between attempts
      reconnectionDelayMax: 10000, // cap delay at 10s
      timeout: 15000               // match axios timeout for cold starts
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Listen for real-time status updates broadcast from backend
  useEffect(() => {
    if (!socket || !ticketDetails) return;

    socket.emit('joinRequestRoom', ticketDetails.requestId);

    socket.on('statusUpdate', (data) => {
      if (data.requestId === ticketDetails.requestId) {
        speak(`Ticket status updated to ${data.status}`);
        setTicketDetails(prev => ({
          ...prev,
          status: data.status,
          assignedTeam: data.assignedTeam || prev.assignedTeam,
          remarks: data.remarks || prev.remarks,
          assignedDepartment: data.department || prev.assignedDepartment
        }));
      }
    });

    return () => {
      socket.off('statusUpdate');
    };
  }, [socket, ticketDetails]);

  // Initialize tracking details if passed in route state
  useEffect(() => {
    if (passedTicket) {
      loadTicketDetails(passedTicket);
    }
  }, [passedTicket]);

  const loadTicketDetails = async (id) => {
    setSearching(true);
    setErrorMsg('');
    try {
      const response = await requestAPI.getById(id);
      if (response.data && response.data.request) {
        setTicketDetails(response.data.request);
        setHasSearched(true);
        speak("Ticket details loaded successfully");
      } else {
        setErrorMsg('Ticket reference ID not found. Use a standard format like REQ-2026-982739');
        setTicketDetails(null);
      }
    } catch (err) {
      setErrorMsg('Ticket reference ID not found. Use a standard format like REQ-2026-982739');
      setTicketDetails(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    loadTicketDetails(searchId.trim());
  };

  const getStepIndex = (status) => {
    const map = {
      'Pending': 1,
      'In-Progress': 2,
      'Approved': 3,
      'Completed': 4,
      'Rejected': 4
    };
    return map[status] || 1;
  };

  // ── Re-upload handler ─────────────────────────────────────────────────────
  const handleReupload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || reuploadIndex === null || !ticketDetails) return;

    // Client-side 5MB guard
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 5 MB.');
      return;
    }

    setReuploading(true);
    setErrorMsg('');
    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadAPI.uploadDoc(formData);

      if (!uploadRes.data?.success) {
        setErrorMsg('File upload failed. Please try again.');
        return;
      }

      // Step 2: Re-upload to the complaint (re-scores with deterministic engine)
      const reuploadRes = await requestAPI.reuploadeEvidence(ticketDetails.requestId, {
        docIndex: reuploadIndex,
        name: uploadRes.data.file.name,
        path: uploadRes.data.file.path
      });

      if (reuploadRes.data?.success) {
        // Refresh ticket details from response
        if (reuploadRes.data.request) {
          setTicketDetails(reuploadRes.data.request);
        } else {
          await loadTicketDetails(ticketDetails.requestId);
        }
        speak('Evidence re-uploaded and re-scored');
      }
    } catch (err) {
      setErrorMsg(err.friendlyMessage || err.response?.data?.message || 'Re-upload failed.');
    } finally {
      setReuploading(false);
      setReuploadIndex(null);
      if (reuploadRef.current) reuploadRef.current.value = '';
    }
  };

  // ── Evidence status helper ────────────────────────────────────────────────
  const evidenceStatusLabel = (doc) => {
    if (doc.reason?.includes('Re-upload requested'))  return { text: 'Re-upload Required', icon: '🔄', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (doc.reason?.includes('Rejected by Officer'))  return { text: 'Rejected', icon: '❌', color: 'text-red-700 bg-red-50 border-red-200' };
    if (doc.flagged)                                   return { text: 'Suspicious', icon: '⚠️', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (doc.verified)                                  return { text: 'Verified', icon: '✅', color: 'text-green-700 bg-green-50 border-green-200' };
    return                                                    { text: 'Under Review', icon: '🕐', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-3xl mx-auto w-full py-4 text-left animate-fade-up">

      {/* Hidden re-upload input */}
      <input type="file" ref={reuploadRef} onChange={handleReupload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />

      {/* Search Header card */}
      <div className={`p-6 rounded-2xl border ${
        highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <Search className="w-5 h-5 text-[#2563EB]" />
          Track Your Application / Grievance
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Enter your 12-character Ticket ID (e.g. <span className="font-mono font-bold text-[#2563EB]">REQ-2026-982739</span>) to review real-time progress dispatches.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Request Ref ID (e.g. REQ-2026-XXXXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 gov-input font-bold"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="btn-primary px-6"
          >
            {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-700"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Ticket Details Timeline */}
      {ticketDetails && (
        <div className="gov-card p-6 space-y-6 animate-fade-in">

          {/* Header row — T7: Emergency + SLA badges */}
          <div className="flex justify-between items-start border-b border-gray-150 pb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-gray-900 font-mono">{ticketDetails.requestId}</span>
                <span className={statusBadge(ticketDetails.status)}>{ticketDetails.status}</span>
                {/* T7: Priority badge */}
                {ticketDetails.priority === 'Critical' && (
                  <span className="status-badge text-red-700 bg-red-50 border-red-200">⚡ Critical</span>
                )}
                {ticketDetails.priority === 'High' && (
                  <span className="status-badge text-orange-700 bg-orange-50 border-orange-200">⚠️ High</span>
                )}
                {/* T7: Emergency badge */}
                {ticketDetails.isEmergency && (
                  <span className="status-badge text-red-700 bg-red-50 border-red-300 font-black">🚨 Emergency</span>
                )}
                {/* T4: SLA status badge */}
                {(() => {
                  const { slaStatus, ageHours } = computeSlaStatus(ticketDetails.createdAt);
                  const colors = {
                    Escalated: 'text-red-700 bg-red-50 border-red-200',
                    Critical:  'text-orange-700 bg-orange-50 border-orange-200',
                    Warning:   'text-yellow-700 bg-yellow-50 border-yellow-200',
                    Safe:      'text-green-700 bg-green-50 border-green-200'
                  };
                  const icons = { Escalated: '🔴', Critical: '🟠', Warning: '⚠️', Safe: '🟢' };
                  if (slaStatus === 'Safe') return null; // don't clutter safe tickets
                  return (
                    <span className={`status-badge ${colors[slaStatus]}`}>
                      {icons[slaStatus]} SLA: {slaStatus} ({ageHours}h)
                    </span>
                  );
                })()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 capitalize font-medium">Category: <span className="font-bold text-gray-700">{ticketDetails.serviceType} ({ticketDetails.subService})</span></p>
              {/* AI routing info */}
              {ticketDetails.routingReason && (
                <p className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" />{ticketDetails.routingReason}
                </p>
              )}
            </div>
            <div className="text-right text-[10px] text-gray-400 font-mono">
              Filed: {new Date(ticketDetails.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* AI Priority reason — visible to citizen for transparency */}
          {ticketDetails.priorityReason && ticketDetails.priorityReason !== 'No urgency keywords detected — routine complaint' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <span className="text-base flex-shrink-0">⚡</span>
              <div>
                <span className="font-bold block">AI Priority Detection</span>
                <span className="opacity-80">{ticketDetails.priorityReason}</span>
              </div>
            </div>
          )}

          {/* T2: Smart Routing Confidence */}
          {ticketDetails.routingReason && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
              <span className="text-base flex-shrink-0"><Zap className="w-4 h-4 text-blue-500" /></span>
              <div>
                <span className="font-bold block">Smart Department Routing — {Math.round((ticketDetails.routingConfidence || 0.65) * 100)}% confidence</span>
                <span className="opacity-80">{ticketDetails.routingReason}</span>
              </div>
            </div>
          )}

          {/* T4: Emergency Audit Trail */}
          {ticketDetails.isEmergency && ticketDetails.emergencySource && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              <span className="text-base flex-shrink-0">🔍</span>
              <div>
                <span className="font-bold block">Emergency Audit Trail</span>
                <span className="opacity-80 block">Triggered by: <span className="font-bold">{ticketDetails.emergencySource}</span></span>
                {ticketDetails.emergencyTriggeredAt && (
                  <span className="opacity-70 block">At: {new Date(ticketDetails.emergencyTriggeredAt).toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
          )}

          {/* Description details */}
          <div className="space-y-1.5 text-xs">
            <span className="section-label text-gray-500 block">Description Details</span>
            <p className="p-3.5 bg-gray-50 rounded-xl text-gray-600 leading-relaxed border border-gray-100 italic">
              "{ticketDetails.description}"
            </p>
          </div>

          {/* ── Evidence Trust Status — T4 ── */}
          {ticketDetails.documents && ticketDetails.documents.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="section-label text-gray-500 block flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> Evidence Status
              </span>
              <div className="space-y-2">
                {ticketDetails.documents.map((doc, i) => {
                  const st = evidenceStatusLabel(doc);
                  const needsReupload = doc.flagged || doc.reason?.includes('Re-upload requested');
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${st.color}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold truncate">
                          <Hash className="w-3 h-3 opacity-50 flex-shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </div>
                        <span className="font-bold flex items-center gap-1 flex-shrink-0">
                          {st.icon} {st.text}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="opacity-70">
                          Confidence: <span className="font-bold">{Math.round((doc.confidence || 0) * 100)}%</span>
                        </span>
                        {doc.reviewedAt && (
                          <span className="text-[10px] flex items-center gap-1 opacity-60">
                            <ShieldCheck className="w-3 h-3" /> Officer reviewed
                          </span>
                        )}
                      </div>

                      {/* Re-upload button — only for flagged / re-upload requested */}
                      {needsReupload && (
                        <button
                          onClick={() => { setReuploadIndex(i); reuploadRef.current?.click(); }}
                          disabled={reuploading}
                          className="mt-2 w-full py-2 rounded-lg text-xs font-bold border-2 border-dashed
                            border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center gap-2 transition
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          {reuploading && reuploadIndex === i ? 'Re-uploading…' : 'Upload New Evidence'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vertical Timelines */}
          <div className="space-y-4 pt-1 text-xs">
            <span className="section-label text-gray-500 block">Application Status Timeline</span>

            <div className="relative border-l border-gray-200 ml-2 pl-5 space-y-6 text-xs">

              {/* Step 1: Submitted */}
              <div className="relative flex gap-3">
                <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                <div>
                  <h5 className="font-bold text-gray-800">Request Registered</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ticket submitted to the {ticketDetails.assignedDepartment} registry.</p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="relative flex gap-3">
                <span className={`absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  getStepIndex(ticketDetails.status) >= 2 ? 'bg-green-500' : 'bg-gray-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-gray-800">Department Processing Wing</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">{ticketDetails.assignedDepartment}</p>
                </div>
              </div>

              {/* Step 3: Team Assigned */}
              <div className="relative flex gap-3">
                <span className={`absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  ticketDetails.assignedTeam && ticketDetails.assignedTeam !== 'Unassigned' ? 'bg-green-500' : 'bg-gray-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-gray-800">Field Maintenance Crew Dispatch</h5>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    {ticketDetails.assignedTeam && ticketDetails.assignedTeam !== 'Unassigned'
                      ? `Crew Assigned: ${ticketDetails.assignedTeam}`
                      : 'Under dispatch allocation review'
                    }
                  </p>
                </div>
              </div>

              {/* Step 4: Remarks */}
              {ticketDetails.remarks && (
                <div className="relative flex gap-3">
                  <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl w-full">
                    <h5 className="font-bold text-[#2563EB]">Official Status Remarks</h5>
                    <p className="text-[10px] text-gray-700 font-bold mt-0.5">"{ticketDetails.remarks}"</p>
                  </div>
                </div>
              )}

              {/* Step 5: Resolution */}
              <div className="relative flex gap-3">
                <span className={`absolute -left-[26px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  ticketDetails.status === 'Completed' ? 'bg-green-500' :
                  ticketDetails.status === 'Rejected' ? 'bg-red-500' : 'bg-gray-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-gray-800">Resolution & Closure</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {ticketDetails.status === 'Completed' ? 'Grievance resolved and connection ticket closed.' :
                     ticketDetails.status === 'Rejected' ? 'Ticket rejected / closed.' :
                     'Pending final resolution logs'
                    }
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ComplaintTracking;
