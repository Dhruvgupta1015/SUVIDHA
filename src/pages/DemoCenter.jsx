import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Play, 
  RotateCcw, 
  Cpu, 
  Database, 
  Smartphone, 
  Building, 
  UserCheck, 
  Volume2, 
  Home, 
  Terminal, 
  CheckCircle2, 
  Bell 
} from 'lucide-react';

export const DemoCenter = () => {
  const navigate = useNavigate();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Demo Simulation states
  const [activeStep, setActiveStep] = useState(0); // 0: Idle, 1: Auth, 2: Scan, 3: Llama, 4: DB, 5: Admin, 6: Mobile, 7: Print
  const [simulating, setSimulating] = useState(false);
  
  // Real-time telemetry values
  const [npuLogs, setNpuLogs] = useState([]);
  const [dbLogs, setDbLogs] = useState([]);
  const [adminRequestsCount, setAdminRequestsCount] = useState(6);
  const [phoneNotification, setPhoneNotification] = useState(null);
  
  // Mock active ticket state
  const [demoTicketId, setDemoTicketId] = useState("REQ-2026-XXXX");

  const stepsInfo = [
    { id: 1, title: "Kiosk Authentication & NPU Voice", desc: "Citizen speaks 'Electricity Services', processed locally on Hexagon NPU." },
    { id: 2, title: "On-Device Document Vision OCR Scan", desc: "Citizen scans Aadhaar. Snapdragon NPU checks biometric spoof filters." },
    { id: 3, title: "Llama Auto-Categorization", desc: "Int4 quantized Llama LLM parses the description to resolve category and urgency." },
    { id: 4, title: "Database Registry & Sockets", desc: "Ticket logged in MongoDB. Sockets emit a new request signal to Administrative consoles." },
    { id: 5, title: "Admin Nodal Dispatch Action", desc: "Admin reviews the request table and taps Approve. Sockets broadcast statusUpdate." },
    { id: 6, title: "Mobile Companion Push Sync", desc: "Simulated smartphone catches socket updates and displays an iOS/Android push notification." },
    { id: 7, title: "Thermal Receipt Acknowledgment", desc: "Kiosk displays final acknowledgment slip and triggers receipt printer simulation." }
  ];

  // Helper to add log entries
  const addNpuLog = (text) => setNpuLogs(prev => [`[NPU] ${text}`, ...prev.slice(0, 10)]);
  const addDbLog = (text) => setDbLogs(prev => [`[REST/DB] ${text}`, ...prev.slice(0, 10)]);

  // Simulation execution loop
  useEffect(() => {
    if (!simulating) return;

    let timeout;
    
    if (activeStep === 1) {
      speak("Step 1. Kiosk voice control. Speaking, electricity services.");
      addNpuLog("Activated Speech-to-Text Hexagon model (Whisper-Base-Int8)");
      addNpuLog("NPU STT Confidence: 98% | Latency: 11ms");
      addDbLog("GET /api/auth/login - OTP generated for +91 9876543210");
      
      timeout = setTimeout(() => setActiveStep(2), 4000);
    } else if (activeStep === 2) {
      speak("Step 2. Document Camera vision scan. Processing Aadhaar card.");
      addNpuLog("Activated Snapdragon Vision Core: MobileNetV4-OCR model");
      addNpuLog("NPU Vision: Biometrics Anti-Spoof matching OK | Latency: 14ms");
      addDbLog("POST /api/upload/docs - Scanned Aadhaar file binary uploaded to local Multer folder");
      
      timeout = setTimeout(() => setActiveStep(3), 4000);
    } else if (activeStep === 3) {
      speak("Step 3. Quantized LLM complaint categorization running.");
      addNpuLog("Activated Int4 quantized Llama-3-2B-Instruct on Hexagon Tensor NPU");
      addNpuLog("Auto Category resolved: POWER GRID OUTAGE | Urgency: HIGH | Latency: 8ms");
      
      timeout = setTimeout(() => setActiveStep(4), 4000);
    } else if (activeStep === 4) {
      speak("Step 4. Database registration. Writing ticket documents to MongoDB.");
      const generatedId = `REQ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setDemoTicketId(generatedId);
      addDbLog(`POST /api/requests/create - Document successfully written to MongoDB collection`);
      addDbLog(`MongoDB generated document ID: ${generatedId}`);
      addDbLog(`Socket.io emitted event: newRequest to all active namespaces`);
      setAdminRequestsCount(prev => prev + 1);
      
      timeout = setTimeout(() => setActiveStep(5), 4500);
    } else if (activeStep === 5) {
      speak("Step 5. Administrative control action. Admin approves ticket.");
      addDbLog(`PUT /api/admin/approve - Status updated to Approved in MongoDB`);
      addDbLog(`Socket.io emitted event: statusUpdate to room ${demoTicketId}`);
      
      timeout = setTimeout(() => setActiveStep(6), 4000);
    } else if (activeStep === 6) {
      speak("Step 6. Mobile push sync alert.");
      setPhoneNotification({
        title: "SUVIDHA Update",
        body: `Grievance status changed to Approved. Nodal wing assigned.`
      });
      
      timeout = setTimeout(() => setActiveStep(7), 4000);
    } else if (activeStep === 7) {
      speak("Step 7. Kiosk prints acknowledgment slip. Demo completed successfully.");
      addNpuLog("NPU CPU/GPU cores returned to low-power sleep mode");
      setSimulating(false);
    }

    return () => clearTimeout(timeout);
  }, [simulating, activeStep]);

  const startDemo = () => {
    setNpuLogs([]);
    setDbLogs([]);
    setPhoneNotification(null);
    setDemoTicketId("REQ-2026-XXXX");
    setActiveStep(1);
    setSimulating(true);
    speak("Starting automated SUVIDHA Snapdragon Multiverse demo simulation.");
  };

  const resetDemo = () => {
    setSimulating(false);
    setActiveStep(0);
    setNpuLogs([]);
    setDbLogs([]);
    setPhoneNotification(null);
    setDemoTicketId("REQ-2026-XXXX");
    speak("Demo simulation reset.");
  };

  return (
    <div className="flex-1 flex flex-col justify-start max-w-6xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-kiosk-teal/15 border border-kiosk-teal/30 text-kiosk-teal animate-pulse">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-outfit font-black tracking-wide">Snapdragon Multiverse Demo Console</h2>
            <p className="text-[10px] text-slate-400">Live Architecture Telemetry & Workflow Simulator</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-700 bg-kiosk-navy hover:bg-kiosk-accent transition kiosk-btn`}
          >
            <Home className="w-4 h-4" />
            <span>Kiosk Home</span>
          </button>
        </div>
      </div>

      {/* 2. Simulation Controller Header Card */}
      <div className="p-6 rounded-3xl bg-kiosk-navy/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-left space-y-1 max-w-md">
          <span className="text-[9px] text-kiosk-teal uppercase tracking-widest font-mono font-bold">In-Browser Test Bench</span>
          <h3 className="font-outfit font-extrabold text-lg text-slate-200">Interactive Multiverse Walkthrough</h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Click start below to run a fully automated mock transaction walkthrough that maps the active flow from citizen scan cards to database inserts, socket updates, and push logs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={startDemo}
            disabled={simulating}
            className="px-6 py-3.5 bg-kiosk-teal hover:bg-opacity-95 text-kiosk-dark font-black rounded-2xl transition flex items-center gap-2 shadow-kiosk-glow disabled:opacity-50 kiosk-btn text-xs uppercase"
          >
            <Play className="w-4.5 h-4.5 fill-kiosk-dark" />
            <span>Start Simulation</span>
          </button>

          <button
            onClick={resetDemo}
            className="px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 transition kiosk-btn flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3. Grid representation of the 5 layers */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch flex-1 py-2 w-full">
        
        {/* Layer 1: Kiosk view */}
        <div className="p-5 rounded-2xl border border-white/5 bg-kiosk-navy/20 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest block">System Node 01</span>
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 1 || activeStep === 2 || activeStep === 3 || activeStep === 7 ? 'bg-kiosk-teal animate-ping' : 'bg-slate-600'}`}></span>
              Kiosk Screen
            </h4>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-4 bg-kiosk-dark/40 border border-white/5 rounded-2xl text-center select-none h-[180px]">
            {activeStep === 0 && <span className="text-[10px] text-slate-500">Kiosk Idle</span>}
            {activeStep === 1 && <div className="space-y-1 animate-pulse"><p className="text-[10px] text-kiosk-teal font-extrabold">Listening Command</p><p className="text-[8px] text-slate-400">"Electricity services"</p></div>}
            {activeStep === 2 && <div className="space-y-1 animate-pulse"><p className="text-[10px] text-amber-400 font-extrabold">Scanner Active</p><div className="w-12 h-1 bg-amber-400 mx-auto animate-bounce"></div></div>}
            {activeStep === 3 && <div className="space-y-1"><p className="text-[10px] text-emerald-400 font-bold">NPU OCR Match</p><p className="text-[8px] text-slate-400">Aadhaar verified</p></div>}
            {activeStep === 4 && <div className="space-y-1"><p className="text-[10px] text-kiosk-teal font-extrabold">Submitting...</p></div>}
            {activeStep > 4 && <div className="space-y-1"><CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 animate-bounce" /><p className="text-[9px] text-slate-300 font-semibold">Slip Printed</p></div>}
          </div>

          <span className="text-[8px] text-slate-500 block leading-tight">Mock viewport showing front-facing client interfaces.</span>
        </div>

        {/* Layer 2: Qualcomm Edge AI NPU */}
        <div className="p-5 rounded-2xl border border-white/5 bg-kiosk-navy/20 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest block">Qualcomm HVX Core</span>
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 1 || activeStep === 2 || activeStep === 3 ? 'bg-kiosk-teal animate-ping' : 'bg-slate-600'}`}></span>
              Edge AI Telemetry
            </h4>
          </div>

          <div className="flex-1 bg-black/80 rounded-2xl p-3 font-mono text-[8px] text-emerald-400 overflow-y-auto max-h-[180px] h-[180px] text-left select-none space-y-1 border border-white/5">
            {npuLogs.length === 0 ? <span className="text-slate-600">No active model triggers</span> : npuLogs.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          <span className="text-[8px] text-slate-500 block leading-tight">Simulated Hexagon v79 Int4/Int8 hardware cores performance benchmarks.</span>
        </div>

        {/* Layer 3: Backend REST & Mongoose */}
        <div className="p-5 rounded-2xl border border-white/5 bg-kiosk-navy/20 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest block">Express Server Logs</span>
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 1 || activeStep === 2 || activeStep === 4 || activeStep === 5 ? 'bg-kiosk-teal animate-ping' : 'bg-slate-600'}`}></span>
              Backend API
            </h4>
          </div>

          <div className="flex-1 bg-black/80 rounded-2xl p-3 font-mono text-[8px] text-slate-300 overflow-y-auto max-h-[180px] h-[180px] text-left select-none space-y-1 border border-white/5">
            {dbLogs.length === 0 ? <span className="text-slate-600">Listening to port 5000...</span> : dbLogs.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          <span className="text-[8px] text-slate-500 block leading-tight">Monitors live API request pipelines and MongoDB transaction commits.</span>
        </div>

        {/* Layer 4: Admin Dashboard */}
        <div className="p-5 rounded-2xl border border-white/5 bg-kiosk-navy/20 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest block">Municipal Registry</span>
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 4 || activeStep === 5 ? 'bg-kiosk-teal animate-ping' : 'bg-slate-600'}`}></span>
              Admin Portal
            </h4>
          </div>

          <div className="flex-1 flex flex-col justify-between p-3.5 bg-kiosk-dark/45 border border-white/5 rounded-2xl text-left select-none h-[180px] text-xs">
            <div className="space-y-1 pb-2 border-b border-white/5">
              <span className="text-[8px] text-slate-500 block">TICKET DATABASE COUNT</span>
              <span className="font-bold font-outfit text-base text-slate-100">{adminRequestsCount} Registered</span>
            </div>
            
            <div className="space-y-1 flex-1 flex flex-col justify-center text-center">
              {activeStep < 4 ? <span className="text-[9px] text-slate-500">Awaiting new kiosk dispatch...</span> :
               activeStep === 4 ? <span className="text-[9px] text-amber-400 font-bold animate-pulse">Socket Alert: New ticket logged!</span> :
               <span className="text-[9px] text-emerald-400 font-bold">Ticket Approved by Official</span>}
            </div>
          </div>

          <span className="text-[8px] text-slate-500 block leading-tight">Monitors administrative response loops and socket broadcasts.</span>
        </div>

        {/* Layer 5: Mobile Companion */}
        <div className="p-5 rounded-2xl border border-white/5 bg-kiosk-navy/20 flex flex-col justify-between text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest block">Smartphone Synced</span>
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 6 ? 'bg-kiosk-teal animate-ping' : 'bg-slate-600'}`}></span>
              Companion App
            </h4>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 relative overflow-hidden select-none h-[180px] flex flex-col justify-between text-center">
            {/* Battery wifi status mock */}
            <div className="flex justify-between items-center text-[7px] text-slate-500">
              <span>LTE</span>
              <div className="flex gap-1"><Wifi className="w-2.5 h-2.5" /><Battery className="w-3 h-3" /></div>
            </div>

            {/* Mobile Notification Mock banner */}
            {activeStep === 6 && phoneNotification && (
              <div className="absolute top-5 inset-x-1.5 bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-[7px] text-left flex gap-1 z-35 animate-bounce">
                <Bell className="w-3 h-3 text-kiosk-teal shrink-0" />
                <div>
                  <h6 className="font-bold text-slate-100">{phoneNotification.title}</h6>
                  <p className="text-slate-400 leading-normal">{phoneNotification.body}</p>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center text-[8px] space-y-1">
              <Smartphone className="w-5 h-5 text-slate-500 mx-auto" />
              {activeStep < 6 ? <span className="text-slate-600">Smartphone idle</span> :
               activeStep === 6 ? <span className="text-kiosk-teal font-extrabold animate-pulse">Sync Push alert caught</span> :
               <span className="text-slate-300">Sync: Connected ({demoTicketId})</span>}
            </div>
          </div>

          <span className="text-[8px] text-slate-500 block leading-tight">Monitors smartphone push notifications and companion bookmarks.</span>
        </div>

      </div>

      {/* 4. Active Workflow stepper timeline */}
      <div className={`p-6 rounded-3xl border transition ${
        highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/40 border-white/5'
      }`}>
        <h4 className="font-outfit font-black text-sm text-slate-200 border-b border-white/5 pb-2 mb-4 select-none">
          Demo Flow Active Progress Timeline
        </h4>

        <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 text-xs select-none">
          {stepsInfo.map((st) => {
            const isActive = activeStep === st.id;
            const isCompleted = activeStep > st.id;
            return (
              <div
                key={st.id}
                className={`flex-1 p-3.5 rounded-2xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-kiosk-teal/15 border-kiosk-teal text-kiosk-teal shadow-kiosk-glow scale-[1.02]' 
                    : isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                      : 'bg-kiosk-dark/40 border-white/5 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 pb-1 border-b border-white/5 mb-1.5">
                  <span className={`w-4 h-4 rounded-full font-mono text-[8px] font-bold flex items-center justify-center border ${
                    isActive ? 'border-kiosk-teal bg-kiosk-teal text-kiosk-dark' :
                    isCompleted ? 'border-emerald-500 bg-emerald-500 text-kiosk-dark' : 'border-slate-700 text-slate-500'
                  }`}>
                    {st.id}
                  </span>
                  <span className="font-bold truncate text-[10px]">{st.title}</span>
                </div>
                <p className="text-[9px] leading-relaxed text-slate-400">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DemoCenter;
