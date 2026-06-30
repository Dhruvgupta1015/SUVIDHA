import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, Volume2, VolumeX, Type, Mic, Settings, Activity } from 'lucide-react';

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

  const handleTextScaleChange = (scale, e) => {
    setTextScale(scale);
    speakElement(e, `Text size set to ${scale}`);
  };

  const handleContrastToggle = () => setHighContrast(!highContrast);
  const handleReaderToggle = () => {
    const next = !screenReader;
    setScreenReader(next);
    if (next && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Screen reader enabled.');
      window.speechSynthesis.speak(u);
    }
  };
  const handleVoiceNavToggle = () => setVoiceNav(!voiceNav);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition-all"
        aria-label="Accessibility options"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('accessibilityMode')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 z-[99999] text-slate-900">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Accessibility Tools
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              Done
            </button>
          </div>

          <div className="space-y-5">
            {/* Text Scale */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-600" /> Text Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['normal', 'large', 'extra'].map(scale => (
                  <button
                    key={scale}
                    onClick={(e) => handleTextScaleChange(scale, e)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                      textScale === scale
                        ? 'bg-blue-900 text-white border-[#1E3A8A] shadow-md ring-2 ring-blue-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {scale === 'extra' ? 'X-Large' : scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1 pt-1">
              {[
                { label: 'High Contrast', icon: <Eye className="w-4 h-4 text-blue-600" />, value: highContrast, toggle: handleContrastToggle },
                { label: 'Screen Reader', icon: screenReader ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />, value: screenReader, toggle: handleReaderToggle },
                { label: 'Voice Navigation', icon: <Mic className="w-4 h-4 text-blue-600" />, value: voiceNav, toggle: handleVoiceNavToggle },
              ].map(({ label, icon, value, toggle }) => (
                <div key={label} className="flex items-center justify-between py-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2.5">{icon}{label}</span>
                  <button
                    onClick={toggle}
                    className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center shadow-inner ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
