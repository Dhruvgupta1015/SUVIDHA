import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Eye, 
  Volume2, 
  VolumeX, 
  Type, 
  Mic, 
  Settings, 
  Activity 
} from 'lucide-react';

export const AccessibilityPanel = () => {
  const { 
    textScale, 
    setTextScale, 
    highContrast, 
    setHighContrast, 
    screenReader, 
    setScreenReader, 
    voiceNav, 
    setVoiceNav,
    speakElement
  } = useAccessibility();
  
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = (e) => {
    speakElement(e, isOpen ? "Close accessibility panel" : "Open accessibility panel");
    setIsOpen(!isOpen);
  };

  const handleTextScaleChange = (scale, e) => {
    setTextScale(scale);
    speakElement(e, `Text size set to ${scale}`);
  };

  const handleContrastToggle = (e) => {
    setHighContrast(!highContrast);
    speakElement(e, `High contrast mode turned ${!highContrast ? 'on' : 'off'}`);
  };

  const handleReaderToggle = (e) => {
    const nextVal = !screenReader;
    setScreenReader(nextVal);
    // Directly speak to test
    if (nextVal) {
      setTimeout(() => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance("Screen reader voice assistance enabled.");
          window.speechSynthesis.speak(u);
        }
      }, 100);
    }
  };

  const handleVoiceNavToggle = (e) => {
    setVoiceNav(!voiceNav);
    speakElement(e, `Voice command routing turned ${!voiceNav ? 'on' : 'off'}`);
  };

  return (
    <div className="relative z-50">
      {/* Floating Panel Toggle button */}
      <button
        onClick={togglePanel}
        onMouseEnter={speakElement}
        className={`flex items-center gap-2 px-5 py-3 rounded-full text-base font-bold transition-all duration-300 shadow-kiosk-depth kiosk-btn ${
          highContrast 
            ? 'bg-yellow-400 text-black border-2 border-black font-black' 
            : 'bg-kiosk-accent text-slate-100 hover:bg-slate-700 border border-white/10'
        }`}
        aria-label="Accessibility options"
      >
        <Settings className="w-5 h-5 text-kiosk-teal animate-spin-slow" />
        <span>{t('accessibilityMode')}</span>
      </button>

      {/* Panel Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-3 p-6 w-80 rounded-2xl shadow-kiosk-depth border transition-all duration-300 ${
          highContrast 
            ? 'bg-black text-yellow-400 border-yellow-400' 
            : 'bg-kiosk-navy/95 backdrop-blur-xl border-slate-700 text-slate-100'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-kiosk-teal" />
              Accessibility Tools
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs opacity-75 hover:opacity-100 underline px-2 py-1"
            >
              Done
            </button>
          </div>

          <div className="space-y-5">
            {/* 1. Text Scale */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80 flex items-center gap-1.5">
                <Type className="w-4 h-4" />
                {t('textScale')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['normal', 'large', 'extra'].map((scale) => (
                  <button
                    key={scale}
                    onClick={(e) => handleTextScaleChange(scale, e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 capitalize ${
                      textScale === scale
                        ? (highContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal')
                        : (highContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                    }`}
                  >
                    {scale === 'extra' ? 'X-Large' : scale}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. High Contrast */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-kiosk-teal" />
                {t('highContrast')}
              </span>
              <button
                onClick={handleContrastToggle}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${
                  highContrast ? 'bg-yellow-400' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  highContrast ? 'translate-x-6 bg-black' : 'bg-white'
                }`} />
              </button>
            </div>

            {/* 3. Screen Reader (TTS) */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                {screenReader ? <Volume2 className="w-4 h-4 text-kiosk-teal" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                {t('screenReader')}
              </span>
              <button
                onClick={handleReaderToggle}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${
                  screenReader ? 'bg-kiosk-teal' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  screenReader ? 'translate-x-6 bg-kiosk-dark' : 'bg-white'
                }`} />
              </button>
            </div>

            {/* 4. Voice Navigation */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Mic className="w-4 h-4 text-kiosk-teal" />
                {t('voiceNav')}
              </span>
              <button
                onClick={handleVoiceNavToggle}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-200 ${
                  voiceNav ? 'bg-kiosk-teal' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  voiceNav ? 'translate-x-6 bg-kiosk-dark' : 'bg-white'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
