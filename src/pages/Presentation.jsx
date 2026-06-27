import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  Database, 
  Terminal, 
  Smartphone, 
  MonitorPlay, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Home,
  FileText
} from 'lucide-react';

export const Presentation = () => {
  const navigate = useNavigate();
  const { speak, highContrast } = useAccessibility();

  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "SUVIDHA",
      subtitle: "Next-Gen Intelligent Civic Kiosk",
      icon: Cpu,
      content: (
        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-base text-slate-300 leading-relaxed font-outfit">
            SUVIDHA is a smart city kiosk portal designed to bridge the digital literacy divide. It offers direct, touch-friendly, and voice-assisted access to municipal utility services without requiring complex technical skills.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <h5 className="font-bold text-kiosk-teal text-sm">Edge AI Guided</h5>
              <p className="text-[10px] text-slate-400">On-device NPU voice assistance guides the citizen step-by-step.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <h5 className="font-bold text-kiosk-teal text-sm">Qualcomm Powered</h5>
              <p className="text-[10px] text-slate-400">Speech translation and document OCR verified in milliseconds.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Problem",
      subtitle: "Navigating Public Bureaucracy",
      icon: AlertTriangle,
      content: (
        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-base text-slate-300 leading-relaxed font-outfit">
            Millions of citizens struggle to access digital government registries due to complex web portals, language barriers, and manual document validation queues.
          </p>
          <div className="space-y-3 pt-2">
            <div className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
              <p className="text-xs text-slate-300 font-medium">Digital Literacy Gap: Inability to navigate standard online application forms.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
              <p className="text-xs text-slate-300 font-medium">Validation Bottlenecks: Hours wasted in queues for manual identity card verification.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
              <p className="text-xs text-slate-300 font-medium">Manual Routing Overhead: Grievances categorized and routed manually by nodal departments.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Solution Architecture",
      subtitle: "The Snapdragon Multiverse Network",
      icon: Terminal,
      content: (
        <div className="space-y-4 text-left max-w-3xl mx-auto">
          <p className="text-xs text-slate-300 leading-relaxed text-center pb-2">
            A fully synchronized multi-device ecosystem powered by on-device edge intelligence:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between items-center h-28">
              <MonitorPlay className="w-5 h-5 text-kiosk-teal" />
              <span className="text-[10px] font-bold text-slate-200">1. Citizen Kiosk</span>
              <span className="text-[8px] text-slate-500">Touch Interface</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between items-center h-28">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-200">2. Qualcomm Edge</span>
              <span className="text-[8px] text-slate-500">On-Device NPU</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between items-center h-28">
              <Terminal className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] font-bold text-slate-200">3. Express API</span>
              <span className="text-[8px] text-slate-500">Gateway Layer</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between items-center h-28">
              <Database className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-200">4. MongoDB Store</span>
              <span className="text-[8px] text-slate-500">Cloud Collection</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between items-center h-28">
              <Smartphone className="w-5 h-5 text-pink-400" />
              <span className="text-[10px] font-bold text-slate-200">5. Mobile Sync</span>
              <span className="text-[8px] text-slate-500">Live Sockets</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Core Innovation",
      subtitle: "Four Pillars of Excellence",
      icon: CheckCircle2,
      content: (
        <div className="grid grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <h5 className="font-bold text-kiosk-teal text-xs">Edge Vision OCR</h5>
            <p className="text-[9px] text-slate-400">MobileNet vision models extract document metadata locally with 98% OCR accuracy.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <h5 className="font-bold text-kiosk-teal text-xs">Quantized Llama LLM</h5>
            <p className="text-[9px] text-slate-400">Int4 quantized local models auto-categorize complaints and estimate SLAs in 8ms.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <h5 className="font-bold text-kiosk-teal text-xs">Biometric Spoof Checks</h5>
            <p className="text-[9px] text-slate-400">On-device anti-spoofing algorithms evaluate risk factors prior to server commits.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
            <h5 className="font-bold text-kiosk-teal text-xs">Real-Time Sync</h5>
            <p className="text-[9px] text-slate-400">Socket.io emits events instantly, updating mobile companions and admin dashboards.</p>
          </div>
        </div>
      )
    },
    {
      title: "Qualcomm Fit",
      subtitle: "Why Snapdragon On-Device AI?",
      icon: Cpu,
      content: (
        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-base text-slate-300 leading-relaxed font-outfit">
            Moving machine learning models from the cloud to the kiosk edge ensures lower latencies, complete data privacy, and significant hardware acceleration.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-3.5 bg-kiosk-dark/45 border border-white/5 rounded-2xl">
              <h6 className="font-bold text-xs text-kiosk-teal">Hexagon v79</h6>
              <p className="text-[8px] text-slate-500 mt-1">Accelerated Int4/Int8 operations.</p>
            </div>
            <div className="p-3.5 bg-kiosk-dark/45 border border-white/5 rounded-2xl">
              <h6 className="font-bold text-xs text-kiosk-teal">Zero Cloud Bills</h6>
              <p className="text-[8px] text-slate-500 mt-1">Saves server bandwidth costs.</p>
            </div>
            <div className="p-3.5 bg-kiosk-dark/45 border border-white/5 rounded-2xl">
              <h6 className="font-bold text-xs text-kiosk-teal">Privacy First</h6>
              <p className="text-[8px] text-slate-500 mt-1">Aadhaar scans parsed on-device.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Interactive Demo",
      subtitle: "Launch System Modules",
      icon: MonitorPlay,
      content: (
        <div className="space-y-6 text-center max-w-xl mx-auto">
          <p className="text-xs text-slate-400">
            Launch any of the live modules compiled inside the SUVIDHA application to experience the prototype:
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="py-3 bg-kiosk-teal text-kiosk-dark font-black rounded-xl text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-kiosk-glow cursor-pointer"
            >
              <Home className="w-4 h-4 fill-kiosk-dark" />
              <span>LAUNCH CITIZEN KIOSK</span>
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="py-3 bg-white/5 border border-white/10 text-slate-200 font-bold rounded-xl text-xs hover:bg-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-200" />
              <span>LAUNCH DEMO CENTER</span>
            </button>
            <button
              onClick={() => navigate('/multiverse')}
              className="py-3 bg-white/5 border border-white/10 text-slate-200 font-bold rounded-xl text-xs hover:bg-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>LAUNCH LIVE MAP</span>
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="py-3 bg-white/5 border border-white/10 text-slate-200 font-bold rounded-xl text-xs hover:bg-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Building className="w-4 h-4" />
              <span>LAUNCH ADMIN PORTAL</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      setActiveSlide(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide]);

  const currentSlide = slides[activeSlide];

  return (
    <div className="flex-1 flex flex-col justify-start max-w-4xl mx-auto w-full py-4 space-y-6 select-none">
      
      {/* Top Slide Menu */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-kiosk-teal/15 border border-kiosk-teal/30 text-kiosk-teal">
            <currentSlide.icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-outfit font-black tracking-wide">{currentSlide.title}</h2>
            <p className="text-[10px] text-slate-400">{currentSlide.subtitle}</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500">
          Slide {activeSlide + 1} of {slides.length}
        </span>
      </div>

      {/* Slide Screen Area */}
      <div className="p-8 rounded-[2.5rem] bg-kiosk-navy/40 border border-white/5 shadow-kiosk-depth min-h-[300px] flex flex-col justify-center items-center relative transition-all duration-300">
        
        {/* Actual Slide content */}
        <div className="w-full flex flex-col justify-center text-center space-y-6">
          {currentSlide.content}
        </div>

      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between">
        
        <button
          onClick={handlePrev}
          disabled={activeSlide === 0}
          className="px-5 py-3 border border-white/10 text-slate-300 font-bold rounded-2xl hover:bg-white/5 transition flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREVIOUS</span>
        </button>

        {/* Slide Indicator circles */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                activeSlide === idx ? 'bg-kiosk-teal w-6 shadow-kiosk-glow' : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={activeSlide === slides.length - 1}
          className="px-5 py-3 bg-kiosk-teal text-kiosk-dark font-black rounded-2xl hover:opacity-90 transition flex items-center gap-1 shadow-kiosk-glow cursor-pointer disabled:opacity-30 disabled:hover:opacity-100 disabled:shadow-none"
        >
          <span>NEXT</span>
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};

export default Presentation;
