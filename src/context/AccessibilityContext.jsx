import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [textScale, setTextScale] = useState('normal'); // 'normal', 'large', 'extra'
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [voiceNav, setVoiceNav] = useState(false);

  // Implement a local text-to-speech engine wrapper (using window.speechSynthesis)
  const speak = (text) => {
    if (!screenReader || !window.speechSynthesis) return;
    
    // Cancel current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Auto-detect speech language or default to English
    utterance.rate = 0.9; // Slightly slower for readability
    window.speechSynthesis.speak(utterance);
  };

  // Speak element content on hover / focus
  const speakElement = (e, customText) => {
    if (!screenReader) return;
    const textToSpeak = customText || e.currentTarget.innerText || e.currentTarget.getAttribute('aria-label') || '';
    if (textToSpeak) {
      speak(textToSpeak);
    }
  };

  // Sync classes to HTML document root
  useEffect(() => {
    const rootClass = document.documentElement.classList;
    
    // High contrast sync
    if (highContrast) {
      rootClass.add('high-contrast');
    } else {
      rootClass.remove('high-contrast');
    }

    // Text scale sync
    rootClass.remove('text-scale-normal', 'text-scale-large', 'text-scale-extra');
    rootClass.add(`text-scale-${textScale}`);
  }, [highContrast, textScale]);

  return (
    <AccessibilityContext.Provider value={{
      textScale,
      setTextScale,
      highContrast,
      setHighContrast,
      screenReader,
      setScreenReader,
      voiceNav,
      setVoiceNav,
      speak,
      speakElement
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
