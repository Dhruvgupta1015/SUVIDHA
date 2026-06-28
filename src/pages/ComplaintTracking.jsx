import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Search, CheckCircle2, Clock, Printer, AlertTriangle, Building2, RefreshCw, Calendar, MapPin
} from 'lucide-react';
import { requestAPI } from '../utils/api';
import { io } from 'socket.io-client';

const statusBadge = (s) => {
  const m = { Completed: 'badge-complete', 'In-Progress': 'badge-progress', Rejected: 'badge-rejected', Pending: 'badge-pending', Approved: 'badge-approved' };
  return `status-badge ${m[s] || 'badge-standard'}`;
};

export const ComplaintTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, highContrast } = useAccessibility();

  // Check if a ticket state was passed from home or submit
  const passedTicket = location.state?.refNumber || '';

  // Tracking States
  const [searchId, setSearchId] = useState(passedTicket || '');
  const [hasSearched, setHasSearched] = useState(!!passedTicket);
  const [searching, setSearching] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [socket, setSocket] = useState(null);

  // Configure Socket connection loops
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
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

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-3xl mx-auto w-full py-4 text-left animate-fade-up">
      
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
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Ticket Details Timeline */}
      {ticketDetails && (
        <div className="gov-card p-6 space-y-6 animate-fade-in">
          
          {/* Header row */}
          <div className="flex justify-between items-start border-b border-gray-150 pb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-gray-900 font-mono">{ticketDetails.requestId}</span>
                <span className={statusBadge(ticketDetails.status)}>{ticketDetails.status}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 capitalize font-medium">Category: <span className="font-bold text-gray-700">{ticketDetails.serviceType} ({ticketDetails.subService})</span></p>
            </div>
            <div className="text-right text-[10px] text-gray-400 font-mono">
              Filed: {new Date(ticketDetails.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* Description details */}
          <div className="space-y-1.5 text-xs">
            <span className="section-label text-gray-500 block">Description Details</span>
            <p className="p-3.5 bg-gray-50 rounded-xl text-gray-600 leading-relaxed border border-gray-100 italic">
              "{ticketDetails.description}"
            </p>
          </div>

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
