import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { printReceipt, generateReceipt } from '../utils/receiptGenerator';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Home, 
  ArrowLeft, 
  Volume2, 
  Cpu, 
  Printer, 
  RefreshCw,
  HelpCircle,
  Building,
  FileSpreadsheet
} from 'lucide-react';

import { requestAPI } from '../utils/api';
import { io } from 'socket.io-client';

export const ComplaintTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Check if a ticket state was passed from submit page
  const passedTicket = location.state?.refNumber || '';
  const passedServiceName = location.state?.serviceName || '';
  const passedName = location.state?.citizenName || '';

  // Tracking States
  const [searchId, setSearchId] = useState(passedTicket || '');
  const [hasSearched, setHasSearched] = useState(!!passedTicket);
  const [searching, setSearching] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);

  // Active timeline step state (1 to 5) for simulation
  const [currentStep, setCurrentStep] = useState(3); 
  const [socket, setSocket] = useState(null);

  // Step definitions
  const steps = [
    { title: "Submitted", desc: "Request logged at Indiranagar kiosk" },
    { title: "Under Review", desc: "Validated by NNP Edge AI OCR validator" },
    { title: "Department Processing", desc: "Assigned to ward supervisor" },
    { title: "Approved / Rejected", desc: "Review complete by executive engineer" },
    { title: "Completed", desc: "Grievance resolved in municipal logs" }
  ];

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

    // Join room for this ticket
    socket.emit('joinRequestRoom', ticketDetails.id);

    // Listen for updates
    socket.on('statusUpdate', (data) => {
      if (data.requestId === ticketDetails.id) {
        console.log("[Socket] Received status update from backend:", data);
        speak(`Notification. Request status updated to ${data.status}`);
        
        const statusMap = {
          'Pending': 1,
          'In-Progress': 2,
          'Escalated': 3,
          'Approved': 4,
          'Rejected': 4,
          'Completed': 5
        };

        setCurrentStep(statusMap[data.status] || 3);
        setTicketDetails(prev => ({
          ...prev,
          statusText: `Active - Status is ${data.status}`,
          department: data.department || prev.department
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
    try {
      const response = await requestAPI.getById(id);
      const { request, complaint } = response.data;

      const statusMap = {
        'Pending': 1,
        'In-Progress': 2,
        'Escalated': 3,
        'Approved': 4,
        'Rejected': 4,
        'Completed': 5
      };

      setTicketDetails({
        id: request.requestId,
        serviceName: `${request.serviceType.toUpperCase()} - ${complaint?.complaintType || 'Grievance'}`,
        citizenName: request.citizenId?.name || 'Rohan Sharma',
        submissionDate: new Date(request.createdAt).toLocaleDateString(),
        sla: "48 Hours",
        department: request.assignedDepartment,
        statusText: `Active - Status is ${request.status}`
      });

      setCurrentStep(statusMap[request.status] || 3);
      setHasSearched(true);
      setSearching(false);
      speak("Ticket details loaded successfully from registry database");
    } catch (err) {
      setSearching(false);
      setHasSearched(true);
      setTicketDetails(null);
      console.error(err);
      speak("Grievance reference not found. Please review the search ID.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    loadTicketDetails(searchId.trim());
  };

  // Live Updates Simulation Handler
  const handleSimulateUpdate = () => {
    if (currentStep >= 5) {
      setCurrentStep(1);
      speak("Simulating status reset: Submitted.");
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      speak(`Simulating status update: ${steps[next - 1].title}.`);
    }
  };

  // Generate Receipt Simulation
  const handleGenerateReceipt = (e) => {
    speakElement(e, "Navigating to receipt acknowledgment screen");
    if (!ticketDetails) return;

    navigate('/receipt', {
      state: {
        ticketId: ticketDetails.id,
        serviceName: ticketDetails.serviceName,
        citizenName: ticketDetails.citizenName,
        submissionDate: ticketDetails.submissionDate,
        statusText: steps[currentStep - 1].title,
        sla: ticketDetails.sla,
        department: ticketDetails.department
      }
    });
  };

  const speakTrackingInstructions = () => {
    speak("Track Your Request Screen. Input your reference number in the box above to look up status. Below you will see a progress timeline from submitted to resolved, showing the active supervisor assigned.");
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Kiosk Top Banner */}
      <div className="pb-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/services')}
            onMouseEnter={(e) => speakElement(e, "Back to service selection")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
              highContrast 
                ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            onMouseEnter={(e) => speakElement(e, "Go to home screen")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
              highContrast 
                ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={speakTrackingInstructions}
            onMouseEnter={(e) => speakElement(e, "Narrate tracking instructions")}
            className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
          Track Your Request
        </h2>
        <p className="text-xs text-slate-400">Search your application status or monitor active pipeline steps</p>
      </div>

      {/* 3. Search Bar */}
      <div className={`p-6 rounded-3xl border ${
        highContrast ? 'bg-black border-yellow-400' : 'bg-kiosk-navy/40 border-white/5'
      }`}>
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-4" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Request Ref ID (e.g. REQ-2026-103984)"
              className="w-full bg-kiosk-dark/70 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold uppercase focus:outline-none focus:border-kiosk-teal placeholder-slate-600"
              required
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-8 py-3.5 bg-kiosk-teal hover:bg-opacity-95 text-kiosk-dark font-black rounded-2xl transition active:scale-95 shadow-kiosk-glow disabled:opacity-50 kiosk-btn"
          >
            {searching ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>

      {searching && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-kiosk-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400">Syncing database registers...</p>
        </div>
      )}

      {hasSearched && !searching && (
        ticketDetails ? (
          /* Track results view */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch flex-1">
            
            {/* Left Side: Stepper Progress timeline (Takes 3 Cols) */}
            <div className={`lg:col-span-3 p-8 rounded-[2.5rem] border shadow-kiosk-depth flex flex-col justify-start space-y-6 transition ${
              highContrast ? 'bg-black border-yellow-400' : 'bg-kiosk-navy/55 border-white/5'
            }`}>
              
              <h3 className="font-outfit font-black text-lg text-slate-200 border-b border-white/5 pb-3 select-none flex items-center justify-between">
                <span>Progress Stepper Timeline</span>
                <span className="text-[10px] text-kiosk-teal uppercase font-mono tracking-widest font-bold">Step {currentStep} of 5</span>
              </h3>

              {/* Steps render list */}
              <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700/60">
                {steps.map((st, idx) => {
                  const stepNumber = idx + 1;
                  const isDone = stepNumber < currentStep;
                  const isActive = stepNumber === currentStep;
                  const isPending = stepNumber > currentStep;
                  
                  return (
                    <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Node circle */}
                      <div className={`absolute -left-6.5 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-[0.5px] ${
                        isDone 
                          ? (highContrast ? 'border-yellow-400 bg-yellow-400' : 'border-emerald-500 bg-emerald-500 text-white')
                          : isActive
                            ? (highContrast ? 'border-yellow-400 bg-black animate-pulse' : 'border-kiosk-teal bg-kiosk-dark text-kiosk-teal animate-pulse shadow-kiosk-glow')
                            : 'border-slate-700 bg-kiosk-dark text-slate-600'
                      }`}>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-kiosk-dark font-black" />}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-kiosk-teal animate-ping" />}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className={`text-sm font-black ${
                          isDone ? 'text-emerald-400 font-bold' : isActive ? 'text-kiosk-teal font-black' : 'text-slate-500'
                        }`}>
                          {st.title}
                        </h4>
                        <p className="text-[10px] text-slate-400/80 leading-snug">{st.desc}</p>
                      </div>

                      {/* Status indicator pill */}
                      <div className={`text-[10px] px-2.5 py-1 rounded font-mono uppercase font-bold shrink-0 self-start sm:self-center ${
                        isDone 
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                          : isActive 
                            ? 'bg-kiosk-teal/15 border border-kiosk-teal/30 text-kiosk-teal animate-pulse' 
                            : 'bg-white/5 border border-white/5 text-slate-600'
                      }`}>
                        {isDone ? 'Done' : isActive ? 'Active' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Side: Status Metadata Card (Takes 2 Cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Telemetry info */}
              <div className={`p-6 rounded-[2rem] border shadow-kiosk-depth transition flex-1 flex flex-col justify-between ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5 text-slate-100'
              }`}>
                <div className="space-y-5">
                  <h3 className="font-outfit font-black text-base text-slate-200 flex items-center gap-1.5 border-b border-white/5 pb-2 select-none">
                    <FileSpreadsheet className="w-5 h-5 text-kiosk-teal" />
                    Tracking Reference
                  </h3>

                  <div className="text-xs space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Request ID:</span><span className="font-mono font-bold text-kiosk-teal">{ticketDetails.id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Citizen:</span><span className="font-semibold text-slate-200">{ticketDetails.citizenName}</span></div>
                    <div className="flex justify-between flex-col text-left pt-1.5"><span className="text-slate-400 pb-1">Service:</span><span className="font-semibold text-slate-200 bg-white/5 p-2 rounded-xl border border-white/5 text-[11px] leading-snug">{ticketDetails.serviceName}</span></div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-kiosk-teal" />
                      <div className="text-left text-xs">
                        <span className="text-slate-400 block text-[10px]">SLA Target Deadline</span>
                        <span className="font-bold text-slate-200">{ticketDetails.sla}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4.5 h-4.5 text-kiosk-teal" />
                      <div className="text-left text-xs">
                        <span className="text-slate-400 block text-[10px]">Assigned Department</span>
                        <span className="font-bold text-slate-200">{ticketDetails.department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Advice Callout */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-300 flex items-start gap-2.5 mt-4">
                  <Cpu className="w-4.5 h-4.5 text-kiosk-teal shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] uppercase text-kiosk-teal tracking-wide block">AI NNP Advice</span>
                    <p className="text-[10px] leading-relaxed text-slate-300">Local OCR confirmed identity proof. No further uploads required. Keep printed receipt copy for kiosk tracking.</p>
                  </div>
                </div>
              </div>

              {/* Simulation Controller Box */}
              <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-dark/40 border-white/5'
              }`}>
                <div className="text-xs text-left">
                  <span className="font-bold text-slate-400 block">Fleet Diagnostics</span>
                  <span className="text-[10px] text-slate-500">Test stage transitions</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateUpdate}
                  onMouseEnter={(e) => speakElement(e, "Simulate department update")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold border rounded-xl transition kiosk-btn ${
                    highContrast
                      ? 'bg-yellow-400 text-black border-yellow-400 hover:bg-black hover:text-yellow-400'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-kiosk-teal hover:border-kiosk-teal/30'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-kiosk-teal animate-spin-slow" />
                  <span>Advance Status</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* Ticket Search Failed */
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-outfit font-black text-xl text-rose-400">Request Not Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No complaint matching that ID was found in the Indiranagar register. Enter a valid reference number (at least 6 digits long).
            </p>
          </div>
        )
      )}

      {/* 4. Bottom Actions Console */}
      {hasSearched && ticketDetails && (
        <div className="p-6 rounded-[2rem] bg-kiosk-navy/15 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold text-center sm:text-left">
            <HelpCircle className="w-5 h-5 text-slate-500 font-bold" />
            <span>Generate local copy. Tap button to print a thermal receipt log.</span>
          </div>
          
          <button
            onClick={handleGenerateReceipt}
            onMouseEnter={(e) => speakElement(e, "Generate Receipt ticket")}
            className={`flex items-center justify-center gap-2.5 px-10 py-5 rounded-[2rem] text-sm font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 kiosk-btn w-full sm:w-auto ${
              highContrast
                ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
                : 'bg-kiosk-teal text-kiosk-dark border border-kiosk-teal shadow-kiosk-glow'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>GENERATE RECEIPT</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default ComplaintTracking;
