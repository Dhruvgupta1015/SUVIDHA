import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Globe } from 'lucide-react';

export const LanguageSelector = () => {
  const { language, changeLanguage, languages } = useLanguage();
  const { speakElement } = useAccessibility();

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl glassmorphism-dark">
      <Globe className="w-5 h-5 text-kiosk-teal hidden sm:block" />
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            onMouseEnter={(e) => speakElement(e, `Change language to ${lang.name}`)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 border ${
              language === lang.code
                ? 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal shadow-kiosk-glow font-bold'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
            }`}
            aria-label={`Change language to ${lang.name}`}
          >
            <span className="mr-1">{lang.nativeName}</span>
            <span className="text-[10px] opacity-60">({lang.code.toUpperCase()})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
