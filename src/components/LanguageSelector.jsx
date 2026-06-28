import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Globe, ChevronDown } from 'lucide-react';

export const LanguageSelector = () => {
  const { language, changeLanguage, languages } = useLanguage();
  const { speakElement } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => speakElement(e, `Current language is ${activeLang.name}. Click to change.`)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex-shrink-0"
        aria-label="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
        <span className="text-xs font-bold text-slate-700 hidden lg:inline">{activeLang.nativeName}</span>
        <span className="text-xs font-bold text-slate-700 lg:hidden">{activeLang.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 shadow-lg rounded-xl z-50 w-44 overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => speakElement(e, `Change language to ${lang.name}`)}
                className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer hover:bg-slate-50 ${
                  language === lang.code ? 'text-blue-700 bg-blue-50' : 'text-slate-600'
                }`}
              >
                {lang.nativeName} ({lang.name})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
