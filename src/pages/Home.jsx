import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { 
  Zap, 
  Droplet, 
  Flame, 
  FileText, 
  Play, 
  Mic, 
  ChevronRight,
  Bot,
  HelpCircle,
  Clock
} from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();
  const { setIsChatOpen, startListening } = useVoiceAssistant();

  // Clear session variables on mount to protect user privacy on public terminal
  useEffect(() => {
    localStorage.clear();
    console.log("[Kiosk Security] Local storage session caches cleared");
  }, []);

  // Highlight state for cards
  const [activeCard, setActiveCard] = useState(null);

  // The 4 requested service cards
  const services = [
    {
      id: "electricity",
      title: "Electricity Services",
      subtitle: "Department of Power Distribution",
      path: "/electricity",
      icon: Zap,
      color: "from-amber-400 to-yellow-600 bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-400/50",
      description: "Pay bills, report power outages, or report meter issues."
    },
    {
      id: "water",
      title: "Water Services",
      subtitle: "Water Supply & Sewerage Board",
      path: "/water",
      icon: Droplet,
      color: "from-blue-400 to-sky-600 bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-400/50",
      description: "Report leakages, check water bills, or raise supply issues."
    },
    {
      id: "gas",
      title: "Gas Services",
      subtitle: "Piped Natural Gas (PNG) Grid",
      path: "/gas",
      icon: Flame,
      color: "from-orange-500 to-red-600 bg-orange-500/10 border-orange-500/20 text-orange-400 hover:border-orange-400/50",
      description: "Report gas leakages, check billing, or apply for repairs."
    },
    {
      id: "complaints",
      title: "Complaint Services",
      subtitle: "Public Grievance Redressal Cell",
      path: "/complaints",
      icon: FileText,
      color: "from-indigo-400 to-violet-600 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-400/50",
      description: "Register general complaints about potholes, streetlights, etc."
    }
  ];

  const handleCardClick = (path, titleText, e) => {
    speakElement(e, `Opening ${titleText}`);
    navigate(path);
  };

  const handleStartService = (e) => {
    speakElement(e, "Starting general citizen verification. Redirecting to OTP Login.");
    navigate('/auth');
  };

  const handleTalkToAI = (e) => {
    speakElement(e, "Opening AI Voice Assistant.");
    setIsChatOpen(true);
    setTimeout(() => {
      startListening();
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 max-w-6xl mx-auto w-full">
      
      {/* 1. Kiosk Welcome Hero Unit */}
      <div className="text-center py-6 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-kiosk-teal select-none">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Kiosk Indiranagar metro station is fully online</span>
        </div>
        <h1 
          className="font-outfit font-black text-5xl md:text-7xl tracking-tight leading-none bg-gradient-to-r from-slate-100 via-white to-kiosk-teal bg-clip-text text-transparent py-1 select-none"
          onMouseEnter={speakElement}
        >
          Welcome to SUVIDHA
        </h1>
        <p 
          className="text-base md:text-lg text-slate-400 font-medium max-w-3xl mx-auto tracking-wide select-none"
          onMouseEnter={speakElement}
        >
          Smart Urban Virtual Interactive Digital Helpdesk Assistant
        </p>
      </div>

      {/* 2. Large Touch-Screen Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 w-full">
        {services.map((svc) => {
          const SvcIcon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={(e) => handleCardClick(svc.path, svc.title, e)}
              onMouseEnter={(e) => {
                setActiveCard(svc.id);
                speakElement(e, `${svc.title}. ${svc.subtitle}. ${svc.description}`);
              }}
              onMouseLeave={() => setActiveCard(null)}
              className={`flex items-start text-left p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 shadow-kiosk-depth hover:scale-[1.01] kiosk-btn relative overflow-hidden group ${
                highContrast 
                  ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black' 
                  : `bg-kiosk-navy/40 border-slate-800 hover:border-kiosk-teal/40`
              }`}
            >
              {/* Background Glow Ring */}
              {!highContrast && activeCard === svc.id && (
                <div className="absolute -inset-px rounded-[2rem] border border-kiosk-teal/30 bg-kiosk-teal/5 pointer-events-none" />
              )}

              {/* Service Icon Panel */}
              <div className={`p-4 rounded-2xl mr-5 flex items-center justify-center shrink-0 border ${
                highContrast 
                  ? 'border-yellow-400 bg-black' 
                  : `bg-gradient-to-br ${svc.color} shadow-md border-white/10`
              }`}>
                <SvcIcon className="w-8 h-8" />
              </div>

              {/* Card content text */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit font-black text-xl tracking-wide group-hover:text-kiosk-teal transition-colors">
                    {svc.title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-kiosk-teal transform group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">{svc.subtitle}</p>
                <p className="text-xs text-slate-300/80 leading-relaxed pr-2 font-medium">{svc.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Bottom Big Actions Console */}
      <div className="flex flex-col sm:flex-row gap-5 items-center justify-center py-6 border-t border-white/5 bg-kiosk-navy/15 rounded-3xl p-6 md:p-8">
        
        {/* Start Service Big Button */}
        <button
          onClick={handleStartService}
          onMouseEnter={(e) => speakElement(e, "Start Service. Press to log in and access civic portals.")}
          className={`flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] text-lg font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 kiosk-btn w-full sm:w-auto shrink-0 ${
            highContrast
              ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
              : 'bg-kiosk-teal text-kiosk-dark border border-kiosk-teal shadow-kiosk-glow hover:bg-opacity-95'
          }`}
        >
          <Play className="w-6 h-6 fill-current" />
          <span>START SERVICE</span>
        </button>

        {/* Talk to AI Voice Button */}
        <button
          onClick={handleTalkToAI}
          onMouseEnter={(e) => speakElement(e, "Talk to AI Assistant. Activate local voice guidance.")}
          className={`flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] text-lg font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 border kiosk-btn w-full sm:w-auto ${
            highContrast
              ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black'
              : 'bg-kiosk-accent/60 text-slate-200 border-white/10 hover:bg-kiosk-accent hover:border-kiosk-teal/40'
          }`}
        >
          <Mic className="w-6 h-6 text-kiosk-teal animate-pulse" />
          <span>TALK TO AI ASSISTANT</span>
        </button>
      </div>

      {/* Bottom Info Banner */}
      <div className="text-center text-[10px] text-slate-500 py-2 flex items-center justify-center gap-1.5 font-bold">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>Kiosk Indiranagar Station. Secure local encryption is active. Qualcomm Hexagon NPU.</span>
      </div>

    </div>
  );
};

export default Home;
