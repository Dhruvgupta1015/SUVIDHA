import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useVoiceAssistant } from '../context/VoiceAssistantContext';
import { 
  ArrowLeft, 
  Home, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  Cpu, 
  FileText,
  HelpCircle,
  Play
} from 'lucide-react';
import { analyzeCitizenRequest } from '../utils/qualcommEdgeAI';

export const AIAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Get current selected service metadata
  const selectedService = location.state || {
    serviceId: 'general',
    title: 'General Civic Helpdesk',
    formPath: '/complaints'
  };

  const { title, serviceId, formPath } = selectedService;

  // AI Chat States
  const [messages, setMessages] = useState([
    { 
      sender: 'assistant', 
      text: `Hello, I am SUVIDHA AI Assistant for ${title}. How can I help you today?`, 
      time: new Date() 
    }
  ]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto Scroll Chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Voice recognition configuration for screen-mic
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      
      rec.onstart = () => {
        setIsListening(true);
        setSpeechTranscript('');
      };
      rec.onend = () => {
        setIsListening(false);
      };
      rec.onerror = () => {
        setIsListening(false);
      };
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setSpeechTranscript(text);
        handleSendQuery(text);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const handleMicToggle = (e) => {
    speakElement(e, isListening ? "Stop voice guidance" : "Start speaking voice query");
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        const sim = prompt("Speech Recognition not supported. Type voice query:");
        if (sim) handleSendQuery(sim);
      }
    }
  };

  const handleSendQuery = (text) => {
    if (!text.trim()) return;

    // User Message
    setMessages(prev => [...prev, { sender: 'user', text, time: new Date() }]);
    setIsProcessing(true);
    speak(text);

    setTimeout(() => {
      // Access edge AI analysis results
      const analysis = analyzeCitizenRequest(text, language);
      setIsProcessing(false);
      
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: analysis.generatedAnswer, 
        time: new Date(),
        // Pass meta info to render visual recommendation card
        meta: {
          intent: analysis.intentLabel,
          service: analysis.recommendedService,
          route: analysis.routePath,
          department: analysis.targetDepartment,
          docs: analysis.predictedDocuments
        }
      }]);
      speak(analysis.generatedAnswer);
    }, 1200);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleSendQuery(textInput);
    setTextInput('');
  };

  const handleProceed = (e) => {
    speakElement(e, `Proceeding to Document Upload for ${title}`);
    navigate('/upload', { 
      state: { 
        serviceId, 
        title, 
        formPath 
      } 
    });
  };

  // Quick Suggestion actions list
  const suggestions = [
    "Required documents",
    "Apply for new connection",
    "Register complaint",
    "Service eligibility",
    "Track application"
  ];

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/services')}
            onMouseEnter={(e) => speakElement(e, "Back to service selection")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
              highContrast 
                ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </button>
          <button
            onClick={() => navigate('/')}
            onMouseEnter={(e) => speakElement(e, "Go to home screen")}
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

        {/* Selected Service tag */}
        <span className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 ${
          highContrast 
            ? 'border-yellow-400 bg-black text-yellow-400' 
            : 'bg-kiosk-teal/10 border-kiosk-teal/30 text-kiosk-teal'
        }`}>
          <span className="w-2 h-2 rounded-full bg-kiosk-teal animate-pulse"></span>
          AI Mode: {title}
        </span>
      </div>

      {/* 2. Chat and Suggestions box wrapper */}
      <div className={`flex-1 flex flex-col min-h-[400px] rounded-[2.5rem] border shadow-kiosk-depth overflow-hidden transition-all duration-300 ${
        highContrast 
          ? 'bg-black border-yellow-400 text-yellow-400' 
          : 'bg-kiosk-navy/55 border-white/5 backdrop-blur-md text-slate-100'
      }`}>
        
        {/* Chat window Header */}
        <div className="p-4 border-b border-white/5 bg-kiosk-dark/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-kiosk-teal" />
            <span className="text-xs font-extrabold uppercase tracking-wider">SUVIDHA AI Assistant Chat</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Snapdragon local NNP enabled</span>
        </div>

        {/* Chat Message Lists */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[320px]">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex gap-3 max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.sender === 'user' 
                  ? 'bg-kiosk-accent border-white/10' 
                  : 'bg-kiosk-dark border-kiosk-teal/30 text-kiosk-teal'
              }`}>
                {msg.sender === 'user' ? 'U' : <Cpu className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-3xl text-sm leading-relaxed text-left whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-kiosk-teal text-kiosk-dark font-semibold'
                  : 'bg-kiosk-dark/40 text-slate-200'
              }`}>
                {msg.text}

                {msg.meta && msg.meta.intent !== "general_help" && (
                  <div className="mt-4 p-4 bg-kiosk-dark/85 rounded-2xl border border-white/5 space-y-3 text-xs w-[250px] sm:w-[320px] transition-all">
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px]">
                      <span className="text-slate-500">Detected Intent:</span>
                      <span className="font-extrabold text-kiosk-teal">{msg.meta.intent}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px]">
                      <span className="text-slate-500">Service:</span>
                      <span className="font-bold text-slate-300">{msg.meta.service}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px]">
                      <span className="text-slate-500">Auto-Route Nodal Hub:</span>
                      <span className="font-bold text-slate-300">{msg.meta.department}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] block">Predicted Documents Needed:</span>
                      <div className="flex flex-col gap-1 pt-1">
                        {msg.meta.docs.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[9px] text-slate-300">
                            <span className="w-1 h-1 rounded-full bg-kiosk-teal"></span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(msg.meta.route, { 
                        state: { 
                          serviceId: msg.meta.route.replace('/', ''), 
                          title: msg.meta.service, 
                          formPath: msg.meta.route 
                        } 
                      })}
                      className="w-full py-2.5 bg-kiosk-teal hover:bg-opacity-95 text-kiosk-dark font-black rounded-xl text-[10px] text-center uppercase tracking-wider shadow-kiosk-glow cursor-pointer mt-2"
                    >
                      Launch Application Portal
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-kiosk-dark border border-kiosk-teal/30 flex items-center justify-center shrink-0 text-kiosk-teal">
                <Cpu className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="bg-kiosk-dark/20 text-slate-400 p-4 rounded-3xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-kiosk-teal animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-kiosk-teal animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-kiosk-teal animate-bounce delay-200"></span>
                <span>AI is compiling answers...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick action chips */}
        <div className="p-4 bg-kiosk-dark/20 border-t border-white/5">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2.5">Suggested Questions:</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(sug)}
                onMouseEnter={(e) => speakElement(e, `Ask: ${sug}`)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border kiosk-btn ${
                  highContrast
                    ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-kiosk-teal/30'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar Overlay */}
        {isListening && (
          <div className="p-3.5 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 animate-bounce" />
              {speechTranscript || 'Listening to your vocal query...'}
            </span>
            <button 
              onClick={() => setIsListening(false)}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-[10px]"
            >
              Stop Mic
            </button>
          </div>
        )}

        {/* Form controls */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-white/5 bg-kiosk-dark/40 flex gap-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-kiosk-dark/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-kiosk-teal"
          />

          {/* Voice Mic Trigger */}
          <button
            type="button"
            onClick={handleMicToggle}
            className={`p-3.5 rounded-2xl flex items-center justify-center border transition kiosk-btn ${
              isListening
                ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
                : 'bg-kiosk-accent text-slate-200 border-white/10 hover:bg-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send text trigger */}
          <button
            type="submit"
            className="px-5 bg-kiosk-teal hover:bg-opacity-95 rounded-2xl text-kiosk-dark font-black flex items-center justify-center transition active:scale-95 shadow-kiosk-glow"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>

      {/* 3. Bottom proceeds button */}
      <div className="flex justify-between items-center bg-kiosk-navy/15 rounded-3xl p-6 border border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>If you are ready to file the application, proceed to the form on the right.</span>
        </div>
        
        <button
          onClick={handleProceed}
          onMouseEnter={(e) => speakElement(e, "Proceed to form page")}
          className={`flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-[1.8rem] text-sm font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 kiosk-btn ${
            highContrast
              ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
              : 'bg-kiosk-teal text-kiosk-dark border border-kiosk-teal shadow-kiosk-glow'
          }`}
        >
          <span>PROCEED TO FORM</span>
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>

    </div>
  );
};

export default AIAssistant;
