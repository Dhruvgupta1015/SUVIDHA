import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { 
  Zap, 
  Droplet, 
  Flame, 
  Trash2, 
  FileText, 
  Search, 
  ArrowLeft, 
  Home, 
  Volume2,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export const ServiceDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();
  const { setIsChatOpen, startListening } = useVoiceAssistant();

  // The 6 requested services and their sub-services
  const serviceCards = [
    {
      id: "electricity",
      title: "Electricity Services",
      icon: Zap,
      path: "/electricity",
      color: "from-amber-400 to-yellow-600 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-400/50",
      bullets: ["New Connection", "Bill Complaint", "Power Issue"]
    },
    {
      id: "water",
      title: "Water Services",
      icon: Droplet,
      path: "/water",
      color: "from-blue-400 to-sky-600 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-400/50",
      bullets: ["New Water Connection", "Leakage Complaint", "Water Supply Issue"]
    },
    {
      id: "gas",
      title: "Gas Services",
      icon: Flame,
      path: "/gas",
      color: "from-orange-500 to-red-600 bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-orange-400/50",
      bullets: ["New Gas Connection", "Gas Complaint", "Maintenance Request"]
    },
    {
      id: "waste",
      title: "Waste Management",
      icon: Trash2,
      path: "/waste",
      color: "from-emerald-400 to-teal-600 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50",
      bullets: ["Garbage Collection Issue", "Sanitation Complaint"]
    },
    {
      id: "complaints",
      title: "General Complaint",
      icon: FileText,
      path: "/complaints",
      color: "from-indigo-400 to-violet-600 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-400/50",
      bullets: ["Civic issue", "Road issue", "Streetlight issue"]
    },
    {
      id: "track",
      title: "Track Application",
      icon: Search,
      path: "/track",
      color: "from-rose-400 to-rose-600 bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-400/50",
      bullets: ["Check Complaint Status", "Enter Reference ID"]
    }
  ];

  const handleCardSelect = (svc, e) => {
    speakElement(e, `Opening AI Guidance for ${svc.title}`);
    if (svc.id === 'track') {
      navigate(svc.path);
    } else {
      navigate('/ai-assistant', { 
        state: { 
          serviceId: svc.id, 
          title: svc.title, 
          formPath: svc.path 
        } 
      });
    }
  };

  const speakScreenGuide = () => {
    speak("Select your service screen. Choose any of the six public utilities cards on the screen, or ask the AI assistant for help.");
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 max-w-6xl mx-auto w-full space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/auth')}
            onMouseEnter={(e) => speakElement(e, "Back to Citizen Verification")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
              highContrast 
                ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Auth</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            onMouseEnter={(e) => speakElement(e, "Go to welcome page")}
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
            onClick={speakScreenGuide}
            onMouseEnter={(e) => speakElement(e, "Speak description of this screen")}
            className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
            aria-label="Screen guidance narration"
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-center py-2 space-y-1">
        <h2 className="text-3xl md:text-4xl font-outfit font-black tracking-wide text-slate-100 flex items-center justify-center gap-2" onMouseEnter={speakElement}>
          <ClipboardList className="w-8 h-8 text-kiosk-teal animate-pulse" />
          Select Your Service
        </h2>
        <p className="text-xs text-slate-400">Touch a service category card below to proceed with your application</p>
      </div>

      {/* 3. 6 Service Cards Touch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 py-4 w-full">
        {serviceCards.map((svc) => {
          const Icon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={(e) => handleCardSelect(svc, e)}
              onMouseEnter={(e) => speakElement(e, `${svc.title}. Includes: ${svc.bullets.join(', ')}.`)}
              className={`p-6 rounded-[2rem] border-2 text-left flex flex-col justify-between items-start transition-all duration-200 hover:scale-[1.02] shadow-kiosk-depth kiosk-btn group relative overflow-hidden ${
                highContrast
                  ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                  : 'bg-kiosk-navy/40 border-slate-800 hover:border-kiosk-teal/40'
              }`}
            >
              <div className="w-full">
                {/* Icon Circle */}
                <div className={`p-3.5 rounded-2xl border mb-5 inline-flex items-center justify-center ${
                  highContrast 
                    ? 'border-yellow-400 bg-black' 
                    : `bg-gradient-to-br ${svc.color} shadow-md border-white/10`
                }`}>
                  <Icon className="w-6.5 h-6.5" />
                </div>

                {/* Card Title */}
                <h3 className="font-outfit font-black text-xl mb-3 tracking-wide group-hover:text-kiosk-teal transition-colors">
                  {svc.title}
                </h3>

                {/* Sub-services bullet list */}
                <ul className="space-y-1.5 mb-6 text-xs text-slate-400 font-medium">
                  {svc.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-kiosk-teal opacity-60"></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Touch trigger indicator */}
              <div className="w-full pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-bold group-hover:text-kiosk-teal transition-colors mt-auto">
                <span>Select Module</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Help desk callout banner */}
      <div className="p-5 rounded-2xl bg-kiosk-dark/65 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-semibold text-center sm:text-left">
          Cannot find what you are looking for? Tap the microphone button or AI assistant floating trigger.
        </p>
        <button
          onClick={() => {
            setIsChatOpen(true);
            speak("Opening AI Voice Assistant");
            setTimeout(() => startListening(), 400);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition kiosk-btn ${
            highContrast
              ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
              : 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal shadow-kiosk-glow hover:bg-opacity-95'
          }`}
        >
          <span>Ask AI Assistant</span>
        </button>
      </div>

    </div>
  );
};

export default ServiceDashboard;
