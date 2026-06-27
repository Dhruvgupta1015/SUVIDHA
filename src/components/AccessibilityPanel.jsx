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
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-[#1D4ED8] transition-all"
        aria-label="Accessibility options"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('accessibilityMode')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#1D4ED8]" />
              Accessibility Tools
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-700 underline"
            >
              Done
            </button>
          </div>

          <div className="space-y-4">
            {/* Text Scale */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-[#EA580C]" /> Text Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['normal', 'large', 'extra'].map(scale => (
                  <button
                    key={scale}
                    onClick={(e) => handleTextScaleChange(scale, e)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition capitalize ${
                      textScale === scale
                        ? 'bg-[#EA580C] text-white border-[#EA580C]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300 hover:text-[#EA580C]'
                    }`}
                  >
                    {scale === 'extra' ? 'X-Large' : scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {[
              { label: 'High Contrast', icon: <Eye className="w-4 h-4 text-[#EA580C]" />, value: highContrast, toggle: handleContrastToggle },
              { label: 'Screen Reader', icon: screenReader ? <Volume2 className="w-4 h-4 text-[#EA580C]" /> : <VolumeX className="w-4 h-4 text-gray-400" />, value: screenReader, toggle: handleReaderToggle },
              { label: 'Voice Navigation', icon: <Mic className="w-4 h-4 text-[#EA580C]" />, value: voiceNav, toggle: handleVoiceNavToggle },
            ].map(({ label, icon, value, toggle }) => (
              <div key={label} className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">{icon}{label}</span>
                <button
                  onClick={toggle}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${value ? 'bg-[#EA580C]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
