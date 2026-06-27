import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  AlertTriangle,
  Building,
  RefreshCw
} from 'lucide-react';
import { requestAPI } from '../utils/api';
import { io } from 'socket.io-client';

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
        setErrorMsg('Ticket reference ID not found.');
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
    <div className="flex-1 flex flex-col space-y-6 max-w-3xl mx-auto w-full py-4 text-left">
      
      {/* Search Header card */}
      <div className={`p-6 rounded-2xl border ${
        highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
      }`}>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-[#EA580C]" />
          Track Your Application / Grievance
        </h2>
        <p className="text-xs text-slate-505 dark:text-slate-400 mb-4">
          Enter your 12-character Ticket ID (e.g. <span className="font-mono font-bold">REQ-2026-982739</span>) to review real-time progress dispatches.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Request Ref ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#EA580C] text-slate-800 dark:text-slate-100 font-bold"
            required
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 bg-[#EA580C] text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition flex items-center gap-1"
          >
            {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Ticket Details Timeline */}
      {ticketDetails && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 shadow-sm">
          
          {/* Header row */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">{ticketDetails.requestId}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  ticketDetails.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300' :
                  ticketDetails.status === 'In-Progress' ? 'bg-orange-100 dark:bg-blue-900/40 text-[#EA580C] dark:text-orange-300' :
                  ticketDetails.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-300' :
                  'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                }`}>{ticketDetails.status}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Category: <span className="capitalize font-bold text-slate-500">{ticketDetails.serviceType} ({ticketDetails.subService})</span></p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              Filed: {new Date(ticketDetails.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Description details */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description Details</span>
            <p className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-slate-650 dark:text-slate-350 leading-relaxed border border-slate-200/50 dark:border-slate-800">
              "{ticketDetails.description}"
            </p>
          </div>

          {/* Vertical Timelines */}
          <div className="space-y-4 pt-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application Status Timeline</span>

            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 pl-5 space-y-6 text-xs">
              
              {/* Step 1: Submitted */}
              <div className="relative">
                <span className="absolute -left-[24px] top-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white dark:border-slate-900"></span>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Request Registered</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ticket submitted to the {ticketDetails.assignedDepartment} registry.</p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="relative">
                <span className={`absolute -left-[24px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  getStepIndex(ticketDetails.status) >= 2 ? 'bg-[#16A34A]' : 'bg-slate-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Department Processing Wing</h5>
                  <p className="text-[10px] text-slate-405 mt-0.5">{ticketDetails.assignedDepartment}</p>
                </div>
              </div>

              {/* Step 3: Team Assigned */}
              <div className="relative">
                <span className={`absolute -left-[24px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  ticketDetails.assignedTeam && ticketDetails.assignedTeam !== 'Unassigned' ? 'bg-[#16A34A]' : 'bg-slate-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Field Maintenance Crew Dispatch</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {ticketDetails.assignedTeam && ticketDetails.assignedTeam !== 'Unassigned' 
                      ? `Crew Assigned: ${ticketDetails.assignedTeam}` 
                      : 'Under dispatch allocation review'
                    }
                  </p>
                </div>
              </div>

              {/* Step 4: Remarks */}
              {ticketDetails.remarks && (
                <div className="relative">
                  <span className="absolute -left-[24px] top-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white dark:border-slate-900"></span>
                  <div className="p-3 bg-orange-50/50 dark:bg-slate-850 border border-orange-100/50 dark:border-orange-900/10 rounded-xl">
                    <h5 className="font-bold text-[#EA580C] dark:text-orange-400">Official remarks Comments</h5>
                    <p className="text-[10px] text-slate-650 dark:text-slate-350 font-bold mt-0.5">"{ticketDetails.remarks}"</p>
                  </div>
                </div>
              )}

              {/* Step 5: Resolution */}
              <div className="relative">
                <span className={`absolute -left-[24px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  ticketDetails.status === 'Completed' ? 'bg-[#16A34A]' :
                  ticketDetails.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-300'
                }`}></span>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white">Resolution & Closure</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
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
