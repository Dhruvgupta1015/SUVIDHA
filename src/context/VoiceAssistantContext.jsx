import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { parseVoiceCommand } from '../utils/voiceCommands';

const VoiceAssistantContext = createContext();

export const VoiceAssistantProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Namaste! I am SUVIDHA AI. How can I help you today?', time: new Date() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const recognitionRef = useRef(null);
  
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      
      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleVoiceInput(text);
      };

      recognitionRef.current = rec;
    }
  }, [language]); // Reinitialize if language changes (to adapt locale later if needed)

  // Speak AI responses
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate lang profile
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'kn') utterance.lang = 'kn-IN';
    else if (language === 'ta') utterance.lang = 'ta-IN';
    else if (language === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-IN';
    
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      // Set language locale on the recognition engine
      if (language === 'hi') recognitionRef.current.lang = 'hi-IN';
      else if (language === 'kn') recognitionRef.current.lang = 'kn-IN';
      else if (language === 'ta') recognitionRef.current.lang = 'ta-IN';
      else if (language === 'te') recognitionRef.current.lang = 'te-IN';
      else recognitionRef.current.lang = 'en-IN';

      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition already started:', err);
      }
    } else {
      // Graceful fallback for non-supported browsers (simulated keyboard type-in fallback)
      console.warn('Speech recognition not supported in this browser.');
      const simulatedText = prompt("Speech recognition not supported. Type voice query:");
      if (simulatedText) handleVoiceInput(simulatedText);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    // 1. Check for routing or language commands locally (Edge AI layer)
    const commandResult = parseVoiceCommand(text, language);
    
    setTimeout(() => {
      let responseText = '';
      
      if (commandResult.action === 'ROUTE') {
        responseText = `${t('navigatingTo')} ${t(commandResult.params.route)}`;
        navigate(commandResult.params.path);
      } else if (commandResult.action === 'LANGUAGE') {
        changeLanguage(commandResult.params.code);
        responseText = `Language changed to ${commandResult.params.name}`;
      } else {
        // Natural language query - Edge AI mock responder
        responseText = getMockAIResponse(text);
      }

      // Add assistant message
      const assistantMsg = { sender: 'assistant', text: responseText, time: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      setIsProcessing(false);
      speak(responseText);
    }, 1200);
  };

  // Simulated Local Edge LLM responses
  const getMockAIResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('bill') || q.includes('payment') || q.includes('भुगतान')) {
      return "To pay your bills, please select the Electricity, Water, or Gas option on the screen. I can guide you through the process.";
    }
    if (q.includes('complaint') || q.includes('शिकायत')) {
      return "To register a grievance, please select 'Grievance Redressal' or say 'Register complaint'. You will need your mobile number.";
    }
    if (q.includes('aadhaar') || q.includes('आधार')) {
      return "You can use Aadhaar authentication by entering your 12-digit Aadhaar Virtual ID or choosing Mobile OTP.";
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
      return "Hello! Welcome to the civic helpdesk. You can ask me to navigate to modules, or register complaints.";
    }
    return "I understood your query: '" + query + "'. You can select any service on the kiosk dashboard, or upload documents for processing.";
  };

  const clearChat = () => {
    setMessages([
      { sender: 'assistant', text: 'Chat reset. How can I help you?', time: new Date() }
    ]);
  };

  return (
    <VoiceAssistantContext.Provider value={{
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
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};
