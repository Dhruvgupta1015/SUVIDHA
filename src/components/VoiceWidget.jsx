import React, { useState, useEffect, useRef } from 'react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mic, 
  MicOff, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Cpu, 
  Volume2 
} from 'lucide-react';

export const VoiceWidget = () => {
  const {
    isListening,
    transcript,
    messages,
    isProcessing,
    startListening,
    stopListening,
    handleVoiceInput,
    clearChat,
    speak,
    isChatOpen,
    setIsChatOpen
  } = useVoiceAssistant();

  const { highContrast, speakElement } = useAccessibility();
  const { t } = useLanguage();

  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleVoiceInput(textInput);
    setTextInput('');
  };

  const handleMicToggle = (e) => {
    speakElement(e, isListening ? "Stop listening" : "Start voice assistant");
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* 1. Chat Drawer */}
      {isChatOpen && (
        <div className={`w-[360px] md:w-[400px] h-[500px] mb-4 rounded-3xl shadow-kiosk-depth flex flex-col border overflow-hidden transition-all duration-300 ${
          highContrast 
            ? 'bg-black border-yellow-400 text-yellow-400' 
            : 'bg-kiosk-navy/95 backdrop-blur-xl border-slate-700/80 text-slate-100'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-kiosk-dark/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-kiosk-teal/10 flex items-center justify-center border border-kiosk-teal/30">
                <Cpu className="w-5 h-5 text-kiosk-teal" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-sm tracking-wider text-glow-teal">{t('aiAssistant')}</h4>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Qualcomm Edge NPU Core Active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                className="text-[10px] opacity-60 hover:opacity-100 px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-kiosk-accent border border-white/20' 
                    : 'bg-kiosk-dark border border-kiosk-teal/30'
                }`}>
                  {msg.sender === 'user' ? (
                    <span className="text-[10px] font-bold">U</span>
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-kiosk-teal" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-kiosk-teal text-kiosk-dark font-semibold'
                      : (highContrast ? 'bg-black border border-yellow-400' : 'bg-kiosk-accent/60 text-slate-200')
                  }`}>
                    {msg.text}
                  </div>
                  {msg.sender === 'assistant' && (
                    <button 
                      onClick={() => speak(msg.text)}
                      className="text-[10px] opacity-40 hover:opacity-100 flex items-center gap-1 mt-0.5"
                    >
                      <Volume2 className="w-3 h-3" /> Speak
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-kiosk-dark border border-kiosk-teal/30 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-kiosk-teal animate-spin-slow" />
                </div>
                <div className="bg-kiosk-accent/40 text-slate-400 p-3 rounded-2xl text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-kiosk-teal animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-kiosk-teal animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-kiosk-teal animate-bounce delay-200"></span>
                  <span>Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Transcript overlay when listening */}
          {isListening && (
            <div className="p-3 bg-kiosk-teal/15 border-t border-kiosk-teal/30 text-xs text-kiosk-teal font-semibold animate-pulse flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 animate-bounce" />
                {transcript || t('listening')}
              </span>
              <button 
                onClick={stopListening}
                className="text-[10px] px-2 py-0.5 rounded bg-kiosk-teal/20 hover:bg-kiosk-teal/30 border border-kiosk-teal/40"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Panel */}
          <form onSubmit={handleSubmit} className="p-3 bg-kiosk-dark/60 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('speakNow')}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-kiosk-teal/50"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-kiosk-accent hover:bg-kiosk-accent/80 border border-white/10 rounded-xl transition text-kiosk-teal font-bold active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. Floating Action Controls */}
      <div className="flex items-center gap-3">
        {/* Toggle Speech Assistant Panel */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          onMouseEnter={speakElement}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-kiosk-depth border transition-all duration-300 kiosk-btn ${
            isChatOpen
              ? 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal shadow-kiosk-glow'
              : 'bg-kiosk-accent text-slate-100 hover:bg-slate-700 border-white/10'
          }`}
          aria-label="Open virtual helpdesk chat assistant"
        >
          <Bot className="w-6 h-6" />
        </button>

        {/* Mic Activation Ring */}
        <button
          onClick={handleMicToggle}
          onMouseEnter={speakElement}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-kiosk-depth border transition-all duration-300 kiosk-btn relative ${
            isListening
              ? 'bg-rose-500 border-rose-400 text-white voice-active-pulse'
              : 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal shadow-kiosk-glow hover:bg-opacity-90'
          }`}
          aria-label="Activate voice command system"
        >
          {isListening ? (
            <MicOff className="w-7 h-7" />
          ) : (
            <Mic className="w-7 h-7" />
          )}

          {/* Glowing ring when active */}
          {isListening && (
            <span className="absolute -inset-1 rounded-full border border-rose-400 opacity-60 animate-ping"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceWidget;
