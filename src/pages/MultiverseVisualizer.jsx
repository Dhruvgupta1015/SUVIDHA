import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Cpu, 
  Database, 
  Smartphone, 
  Terminal, 
  Activity, 
  Play, 
  RotateCcw, 
  ArrowLeft,
  Building,
  MonitorPlay,
  HeartPulse
} from 'lucide-react';

export const MultiverseVisualizer = () => {
  const navigate = useNavigate();
  const { speak, highContrast } = useAccessibility();

  // Visualization States
  const [pipelineState, setPipelineState] = useState('idle'); // 'idle' | 'kiosk' | 'edge' | 'backend' | 'mongodb' | 'admin' | 'mobile' | 'done'
  const [telemetryLogs, setTelemetryLogs] = useState([
    { source: 'SYS', msg: 'Qualcomm Snapdragon Multiverse visualizer online.', time: '13:01:23', type: 'system' }
  ]);
  const [activeJson, setActiveJson] = useState({ info: 'Select or start pipeline to inspect payloads' });
  const [pulseActive, setPulseActive] = useState(false);

  const addLog = (source, msg, type = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    setTelemetryLogs(prev => [{ source, msg, time, type }, ...prev.slice(0, 15)]);
  };

  // Automated animation pipeline
  useEffect(() => {
    if (pipelineState === 'idle') return;

    let timeout;
    setPulseActive(true);

    if (pipelineState === 'kiosk') {
      speak("Citizen initiates request at kiosk console");
      addLog('KIOSK', 'Citizen selected "Electricity Connection" -> Triggering Local Speech-to-Text Input', 'kiosk');
      setActiveJson({
        event: 'user_voice_input',
        locale: 'hi',
        rawText: 'मुझे नया बिजली कनेक्शन चाहिए'
      });
      timeout = setTimeout(() => setPipelineState('edge'), 3000);
    } 
    else if (pipelineState === 'edge') {
      speak("Edge AI processes biometrics and intent on Snapdragon NPU");
      addLog('EDGE_AI', 'Qualcomm Hexagon DSP activated. Executing Whisper STT and Int4 Quantized LLM', 'edge');
      addLog('EDGE_AI', 'OCR document verification validation completed (Confidence: 98.4%)', 'edge');
      setActiveJson({
        npuCore: 'Hexagon v79',
        latency: '8.4ms',
        models: {
          audio: 'Whisper-Base-Int8',
          categorizer: 'Llama-3-2B-Int4'
        },
        ocrExtract: { name: 'Rohan Sharma', verified: true }
      });
      timeout = setTimeout(() => setPipelineState('backend'), 3000);
    }
    else if (pipelineState === 'backend') {
      speak("Express backend opens API gateway router");
      addLog('BACKEND', 'POST /api/requests/create - Authenticating JWT Session & handling Multer uploads', 'backend');
      addLog('BACKEND', 'Gateway authorized token signature successfully', 'backend');
      setActiveJson({
        route: '/api/requests/create',
        method: 'POST',
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1Ni...' },
        files: ['aadhaar_scan.png']
      });
      timeout = setTimeout(() => setPipelineState('mongodb'), 3000);
    }
    else if (pipelineState === 'mongodb') {
      speak("Writing records to MongoDB atlas cluster");
      addLog('MONGODB', 'Inserting Document collections (Users, Requests, Complaints)', 'mongodb');
      addLog('MONGODB', 'Write concern Acknowledged - Index updated', 'mongodb');
      setActiveJson({
        collection: 'requests',
        operation: 'insertOne',
        document: {
          requestId: 'REQ-2026-982739',
          citizenId: '60d5ec49f812cd23048b4567',
          status: 'Pending',
          createdAt: new Date().toISOString()
        }
      });
      timeout = setTimeout(() => setPipelineState('admin'), 3000);
    }
    else if (pipelineState === 'admin') {
      speak("Admin dashboard updates automatically via Web Sockets");
      addLog('ADMIN', 'Socket.io broadcasted "newRequest" event to dashboard listeners', 'admin');
      addLog('ADMIN', 'Dashboard state synchronized. Department task queued.', 'admin');
      setActiveJson({
        socketEvent: 'newRequest',
        payload: {
          id: 'REQ-2026-982739',
          assignedDepartment: 'BESCOM Sub-division',
          priority: 'Standard'
        }
      });
      timeout = setTimeout(() => setPipelineState('mobile'), 3000);
    }
    else if (pipelineState === 'mobile') {
      speak("Smartphone companion receives push notification updates");
      addLog('MOBILE', 'Citizen device caught status update from socket room registration', 'mobile');
      addLog('MOBILE', 'Push notification banner fired: "Grievance status updated"', 'mobile');
      setActiveJson({
        notification: {
          title: 'SUVIDHA Sync',
          body: 'Your ticket REQ-2026-982739 has been successfully logged.',
          sound: 'ping.wav'
        }
      });
      timeout = setTimeout(() => {
        setPipelineState('done');
        setPulseActive(false);
        speak("Snapdragon Multiverse data flow completed successfully.");
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [pipelineState]);

  const triggerPipeline = () => {
    setTelemetryLogs([]);
    setPipelineState('kiosk');
  };

  const resetPipeline = () => {
    setPipelineState('idle');
    setPulseActive(false);
    setTelemetryLogs([{ source: 'SYS', msg: 'Visualizer reset.', time: new Date().toTimeString().split(' ')[0], type: 'system' }]);
    setActiveJson({ info: 'Select or start pipeline to inspect payloads' });
  };

  // Node styles helpers
  const getNodeClass = (nodeName) => {
    const activeStyles = "ring-4 ring-kiosk-teal border-kiosk-teal shadow-kiosk-glow bg-kiosk-teal/15 text-kiosk-teal";
    const passedStyles = "border-emerald-500/80 bg-emerald-500/5 text-emerald-400";
    const idleStyles = "border-white/5 bg-kiosk-dark/45 text-slate-500 hover:border-white/10";
    
    if (pipelineState === nodeName) return activeStyles;
    
    const statesOrder = ['kiosk', 'edge', 'backend', 'mongodb', 'admin', 'mobile', 'done'];
    const currentIndex = statesOrder.indexOf(pipelineState);
    const nodeIndex = statesOrder.indexOf(nodeName);
    
    if (currentIndex > nodeIndex) return passedStyles;
    return idleStyles;
  };

  return (
    <div className="flex-1 flex flex-col justify-start max-w-6xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-kiosk-glow">
            <HeartPulse className="w-6 h-6 text-kiosk-teal" />
          </div>
          <div>
            <h2 className="text-xl font-outfit font-black tracking-wide">Live Multiverse Visualization</h2>
            <p className="text-[10px] text-slate-400">Qualcomm Snapdragon Hardware Sync Pipelines</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/demo')}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-kiosk-teal transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Demo Console</span>
        </button>
      </div>

      {/* 2. Visual Layout Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch flex-1">
        
        {/* Left Column: Visual Map (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-kiosk-navy/40 border border-white/5 flex flex-col justify-between relative overflow-hidden h-[440px] select-none">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Network Topology</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={triggerPipeline} 
                disabled={pipelineState !== 'idle' && pipelineState !== 'done'}
                className="px-4 py-2 bg-kiosk-teal text-kiosk-dark text-[10px] font-black rounded-xl hover:opacity-90 flex items-center gap-1 shadow-kiosk-glow cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-kiosk-dark" />
                <span>START PULSE</span>
              </button>
              <button 
                onClick={resetPipeline}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Central Qualcomm Chip Visualizer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-kiosk-dark/90 border border-kiosk-teal/30 rounded-3xl z-20 flex flex-col items-center justify-center text-center shadow-kiosk-depth">
            <Cpu className={`w-8 h-8 ${pulseActive ? 'text-kiosk-teal animate-spin-slow' : 'text-slate-600'}`} />
            <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-wider font-mono">Snapdragon</span>
            <span className="text-[6px] font-black text-kiosk-teal tracking-widest font-mono">NPU core</span>
          </div>

          {/* SVG Connector Lines Mapping orbiting Nodes */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            {/* Kiosk to Edge */}
            <path d="M 120, 110 L 260, 220" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />
            {/* Edge to Backend */}
            <path d="M 260, 220 L 420, 110" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />
            {/* Backend to MongoDB */}
            <path d="M 420, 110 L 420, 310" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />
            {/* MongoDB to Admin */}
            <path d="M 420, 310 L 260, 220" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />
            {/* Admin to Mobile */}
            <path d="M 260, 220 L 120, 310" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />
            {/* Mobile to Kiosk */}
            <path d="M 120, 310 L 120, 110" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="2" fill="none" />

            {/* Glowing animated line overlays based on pipeline state */}
            {pipelineState === 'kiosk' && (
              <path d="M 120, 110 L 260, 220" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
            {pipelineState === 'edge' && (
              <path d="M 260, 220 L 420, 110" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
            {pipelineState === 'backend' && (
              <path d="M 420, 110 L 420, 310" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
            {pipelineState === 'mongodb' && (
              <path d="M 420, 310 L 260, 220" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
            {pipelineState === 'admin' && (
              <path d="M 260, 220 L 120, 310" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
            {pipelineState === 'mobile' && (
              <path d="M 120, 310 L 120, 110" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="8 4" className="animate-dash" />
            )}
          </svg>

          {/* System Nodes Ring */}
          <div className="flex-1 grid grid-cols-3 grid-rows-2 items-center justify-between gap-y-24 relative z-20">
            {/* Top Left: Kiosk Screen */}
            <div className={`w-28 h-20 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 ${getNodeClass('kiosk')}`}>
              <span className="text-[7px] font-bold font-mono tracking-widest block uppercase text-slate-400">Node 01</span>
              <div className="flex items-center gap-1.5 justify-center">
                <MonitorPlay className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black font-outfit">Citizen Kiosk</span>
              </div>
            </div>

            {/* Top Middle: Edge AI */}
            <div className="flex justify-center items-center">
              {/* Central offset filler */}
            </div>

            {/* Top Right: Backend REST */}
            <div className={`w-28 h-20 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 ml-auto ${getNodeClass('backend')}`}>
              <span className="text-[7px] font-bold font-mono tracking-widest block uppercase text-slate-400">Node 02</span>
              <div className="flex items-center gap-1.5 justify-center">
                <Terminal className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black font-outfit">REST Gateway</span>
              </div>
            </div>

            {/* Bottom Left: Synced Phone */}
            <div className={`w-28 h-20 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 ${getNodeClass('mobile')}`}>
              <span className="text-[7px] font-bold font-mono tracking-widest block uppercase text-slate-400">Node 05</span>
              <div className="flex items-center gap-1.5 justify-center">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black font-outfit">Companion UI</span>
              </div>
            </div>

            {/* Bottom Middle: Admin controls */}
            <div className={`w-28 h-20 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 mx-auto ${getNodeClass('admin')}`}>
              <span className="text-[7px] font-bold font-mono tracking-widest block uppercase text-slate-400">Node 04</span>
              <div className="flex items-center gap-1.5 justify-center">
                <Building className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black font-outfit">Admin Panel</span>
              </div>
            </div>

            {/* Bottom Right: MongoDB */}
            <div className={`w-28 h-20 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-300 ml-auto ${getNodeClass('mongodb')}`}>
              <span className="text-[7px] font-bold font-mono tracking-widest block uppercase text-slate-400">Node 03</span>
              <div className="flex items-center gap-1.5 justify-center">
                <Database className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black font-outfit">MongoDB Atlas</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Code Payloads & Logs (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4 items-stretch">
          
          {/* JSON Payload Inspector */}
          <div className="p-5 rounded-3xl bg-kiosk-navy/40 border border-white/5 text-left space-y-3 flex-1 flex flex-col">
            <span className="text-[9px] text-kiosk-teal uppercase tracking-widest font-mono font-bold block select-none">Active payload synchronizer</span>
            <div className="flex-1 bg-black/80 rounded-2xl p-3.5 font-mono text-[9px] text-cyan-400 overflow-y-auto max-h-[170px] select-all border border-white/5">
              {JSON.stringify(activeJson, null, 2)}
            </div>
          </div>

          {/* Scrolling System Logs */}
          <div className="p-5 rounded-3xl bg-kiosk-navy/40 border border-white/5 text-left space-y-3 h-[200px] flex flex-col">
            <div className="flex items-center gap-1.5 select-none">
              <Activity className="w-4 h-4 text-kiosk-teal" />
              <span className="text-[9px] text-slate-300 uppercase tracking-widest font-mono font-bold block">Telemetry Logs Feed</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[8px] pr-1 select-none">
              {telemetryLogs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600">[{l.time}]</span>
                  <span className={`font-bold ${
                    l.type === 'kiosk' ? 'text-cyan-400' :
                    l.type === 'edge' ? 'text-amber-400' :
                    l.type === 'backend' ? 'text-purple-400' :
                    l.type === 'mongodb' ? 'text-emerald-400' :
                    l.type === 'admin' ? 'text-pink-400' : 'text-slate-500'
                  }`}>{l.source}:</span>
                  <span className="text-slate-300">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default MultiverseVisualizer;
