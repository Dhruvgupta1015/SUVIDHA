import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Globe } from 'lucide-react';

export const LanguageSelector = () => {
  const { language, changeLanguage, languages } = useLanguage();
  const { speakElement } = useAccessibility();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
      <Globe className="w-3.5 h-3.5 text-[#EA580C] hidden sm:block ml-1" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            onMouseEnter={(e) => speakElement(e, `Change language to ${lang.name}`)}
            className={`px-2 py-1 rounded text-xs font-bold transition-all duration-150 ${
              language === lang.code
                ? 'bg-[#EA580C] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label={`Change language to ${lang.name}`}
          >
            {lang.nativeName}
            <span className="text-[8px] opacity-75 ml-0.5">({lang.code.toUpperCase()})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
