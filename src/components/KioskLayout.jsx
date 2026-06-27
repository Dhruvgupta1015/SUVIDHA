import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from './LanguageSelector';
import { AccessibilityPanel } from './AccessibilityPanel';
import { VoiceWidget } from './VoiceWidget';
import { 
  Home, 
  ArrowLeft, 
  Cpu, 
  Wifi, 
  Clock, 
  MapPin,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';

export const KioskLayout = ({ children }) => {
  const { t, language } = useLanguage();
  const { highContrast, voiceNav, speakElement } = useAccessibility();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      highContrast 
        ? 'bg-black text-yellow-400' 
        : 'bg-kiosk-dark text-slate-100'
    }`}>
      {/* Top Bilingual GOI Stripe */}
      <div className={`text-[10px] py-2 px-6 select-none font-bold flex justify-between items-center border-b ${
        highContrast 
          ? 'bg-black border-yellow-400 text-yellow-400' 
          : 'bg-kiosk-teal text-white border-white/10'
      }`}>
        <div className="flex gap-2">
          <span>GOVERNMENT OF INDIA</span>
          <span>•</span>
          <span>भारत सरकार</span>
        </div>
        <div className="flex gap-3">
          <span>Digital India Initiative</span>
          <span>•</span>
          <span>डिजिटल इंडिया</span>
        </div>
      </div>

      {/* 1. Kiosk Top Banner - Stats & Accessibility switches */}
      <header className={`px-6 py-4 border-b transition-all duration-300 ${
        highContrast 
          ? 'border-yellow-400 bg-black' 
          : 'border-kiosk-accent bg-kiosk-navy shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 flex items-center justify-center border rounded-xl select-none ${
              highContrast 
                ? 'border-yellow-400 bg-black' 
                : 'bg-white/5 border-kiosk-accent'
            }`}>
              <svg className={`w-8 h-8 ${highContrast ? 'text-yellow-400' : 'text-kiosk-teal'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="12"
                    y1="3"
                    x2="12"
                    y2="21"
                    transform={`rotate(${i * 15} 12 12)`}
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
            </div>
            <div>
              <Link 
                to="/" 
                className="font-outfit font-black text-2xl tracking-wide select-none flex items-center gap-1.5"
                onMouseEnter={speakElement}
              >
                <span>SUVIDHA</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                  highContrast ? 'bg-yellow-400 text-black border border-black' : 'bg-kiosk-teal/15 text-kiosk-teal border border-kiosk-teal/20'
                }`}>v2.0</span>
              </Link>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bilingual Citizen Service Portal | नागरिक सेवा पोर्टल</p>
            </div>
          </div>

          {/* Kiosk status display */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-kiosk-teal" />
              Indiranagar Kiosk (K-BLR-04)
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Edge NPU Connected
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Clock className="w-3.5 h-3.5 text-kiosk-teal" />
              {time}
            </span>
          </div>

          {/* System Control Widgets */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-300 kiosk-btn ${
                highContrast
                  ? 'border-yellow-400 text-yellow-400'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-kiosk-teal/30'
              }`}
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Light/Dark Theme"
              onMouseEnter={(e) => speakElement(e, `Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`)}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
            <LanguageSelector />
            <AccessibilityPanel />
          </div>
        </div>
      </header>

      {/* 2. Main content viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col justify-start relative">
        
        {/* Navigation control bar */}
        {!isHome && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => speakElement(e, "Go Back")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition kiosk-btn ${
                highContrast 
                  ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                  : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>

            <button
              onClick={() => navigate('/')}
              onMouseEnter={(e) => speakElement(e, "Go to Home Screen")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition kiosk-btn ${
                highContrast 
                  ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                  : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t('home')}</span>
            </button>
          </div>
        )}

        {/* Voice Navigation Warning Banner */}
        {voiceNav && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-pulse border ${
            highContrast
              ? 'bg-black border-yellow-400 text-yellow-400 font-bold'
              : 'bg-kiosk-teal/15 border-kiosk-teal/40 text-kiosk-teal'
          }`}>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-semibold">{t('voiceGuide')}</span>
          </div>
        )}

        {/* The active page content renders here */}
        <div className="flex-1 flex flex-col justify-start animate-fade-in">
          {children}
        </div>
      </main>

      {/* 3. Global Touch-Screen Kiosk Footer */}
      <footer className={`px-6 py-4 border-t text-center text-xs font-semibold text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'border-slate-800 bg-kiosk-dark/40'
      }`}>
        <p className="flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4 text-kiosk-teal" />
          <span>Need help? Touch any element on the screen or press the floating AI assistant bubble below.</span>
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/mobile" className="hover:underline hover:text-slate-300">Mobile Companion</Link>
          <span>•</span>
          <Link to="/admin" className="hover:underline hover:text-slate-300">Admin Login</Link>
          <span>•</span>
          <span>Helpline: 1912 / 100</span>
        </div>
      </footer>

      {/* Floating virtual AI assistant widget */}
      <VoiceWidget />
    </div>
  );
};

export default KioskLayout;
