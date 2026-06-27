import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  ShieldCheck, 
  Fingerprint, 
  Smartphone, 
  ArrowLeft, 
  Volume2, 
  Clock, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

import { authAPI } from '../utils/api';

export const Auth = () => {
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();
  const navigate = useNavigate();

  // Authentication State
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'aadhaar'
  const [mobileNum, setMobileNum] = useState('');
  const [aadhaarNum, setAadhaarNum] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [activeInput, setActiveInput] = useState('mobile'); // 'mobile' | 'otp' | 'aadhaar'
  
  // UX State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionTime, setSessionTime] = useState(120); // 120 seconds countdown
  const [errorMsg, setErrorMsg] = useState('');

  // Voice Guidance Instruction Speak
  const triggerVoiceGuidance = () => {
    let guideText = "";
    if (success) {
      guideText = "Verification successful. Redirecting you to the kiosk homepage.";
    } else if (otpSent) {
      guideText = "A six digit code has been sent to your mobile. Please enter the OTP using the on screen numeric keypad.";
    } else if (authMethod === 'otp') {
      guideText = "Please tap the input box and use the numeric keypad on the right to enter your ten digit mobile number. Then click Generate OTP.";
    } else {
      guideText = "Please tap the Aadhaar input box and enter your twelve digit Aadhaar Virtual ID number using the keypad on the right.";
    }
    speak(guideText);
  };

  // Reset Session timer on user interactions
  const resetTimer = () => {
    setSessionTime(120);
    setErrorMsg('');
  };

  // Countdown timer effect
  useEffect(() => {
    if (success) return;
    const interval = setInterval(() => {
      setSessionTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          speak("Session expired due to inactivity. Returning to home screen.");
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, navigate]);

  // Sync active input when changing tabs
  const handleTabChange = (method) => {
    resetTimer();
    setAuthMethod(method);
    setOtpSent(false);
    setOtpVal('');
    if (method === 'otp') {
      setActiveInput('mobile');
    } else {
      setActiveInput('aadhaar');
    }
  };

  // Numeric Keypad touch parser
  const handleKeyPress = (key) => {
    resetTimer();
    
    if (activeInput === 'mobile') {
      if (key === '⌫') {
        setMobileNum(prev => prev.slice(0, -1));
      } else if (key === 'Clear') {
        setMobileNum('');
      } else if (mobileNum.length < 10 && /^\d$/.test(key)) {
        setMobileNum(prev => prev + key);
      }
    } else if (activeInput === 'otp') {
      if (key === '⌫') {
        setOtpVal(prev => prev.slice(0, -1));
      } else if (key === 'Clear') {
        setOtpVal('');
      } else if (otpVal.length < 6 && /^\d$/.test(key)) {
        setOtpVal(prev => prev + key);
      }
    } else if (activeInput === 'aadhaar') {
      if (key === '⌫') {
        setAadhaarNum(prev => prev.slice(0, -1));
      } else if (key === 'Clear') {
        setAadhaarNum('');
      } else if (aadhaarNum.length < 12 && /^\d$/.test(key)) {
        setAadhaarNum(prev => prev + key);
      }
    }
  };

  // Submit Mobile Number -> Send OTP
  const handleGetOtp = async (e) => {
    e.preventDefault();
    resetTimer();
    if (mobileNum.length !== 10) {
      speak("Invalid number. Please enter exactly ten digits.");
      setErrorMsg("Mobile number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    speak("Sending OTP verification code");
    try {
      const response = await authAPI.requestOtp(mobileNum);
      setLoading(false);
      setOtpSent(true);
      setActiveInput('otp');
      speak("OTP sent successfully. Please check your phone.");
      if (response.data.demoOtp) {
        console.log(`[Demo helper] Generated OTP is: ${response.data.demoOtp}`);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || "Failed to contact auth server");
      speak("Failed to generate OTP. Try again.");
    }
  };

  // Submit Verification OTP or Aadhaar
  const handleVerify = async (e) => {
    e.preventDefault();
    resetTimer();

    if (authMethod === 'otp' && otpVal.length !== 6) {
      speak("Please enter the complete six digit OTP.");
      setErrorMsg("OTP must be 6 digits");
      return;
    }
    if (authMethod === 'aadhaar' && aadhaarNum.length !== 12) {
      speak("Please enter a valid twelve digit Aadhaar ID.");
      setErrorMsg("Aadhaar must be 12 digits");
      return;
    }

    setLoading(true);
    speak("Verifying credentials");
    try {
      let response;
      if (authMethod === 'otp') {
        response = await authAPI.verifyOtp({
          mobile: mobileNum,
          otp: otpVal,
          name: "Rohan Sharma"
        });
      } else {
        response = await authAPI.verifyOtp({
          mobile: "9876543210",
          otp: "123456",
          name: "Aadhaar Verified Citizen",
          aadhaar: aadhaarNum
        });
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setLoading(false);
      setSuccess(true);
      speak("Verification successful. Logging in.");
      setTimeout(() => {
        navigate('/services');
      }, 1500);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || "Verification code failed");
      speak("Verification failed");
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Header Navigation & Telemetry row */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <button
          onClick={() => navigate('/')}
          onMouseEnter={(e) => speakElement(e, "Back to home screen")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
            highContrast 
              ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
              : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Home</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Timeout Timer */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <Clock className={`w-4 h-4 ${sessionTime < 30 ? 'text-rose-500 animate-pulse' : 'text-kiosk-teal'}`} />
            <span>Kiosk Idle Reset: <b className="text-slate-100">{sessionTime}s</b></span>
          </div>

          {/* Voice help */}
          <button
            onClick={triggerVoiceGuidance}
            onMouseEnter={(e) => speakElement(e, "Speak screen instructions")}
            className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
            aria-label="Speak screen instructions"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main content split viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch flex-1">
        
        {/* Left Side: Authentication Active Form Box (Takes 3 cols) */}
        <div className={`lg:col-span-3 p-8 md:p-10 rounded-[2.5rem] border shadow-kiosk-depth flex flex-col justify-between transition ${
          highContrast 
            ? 'bg-black border-yellow-400 text-yellow-400' 
            : 'bg-kiosk-navy/55 border-white/5 backdrop-blur-md text-slate-100'
        }`}>
          
          <div>
            {/* Form Header Title */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-3 bg-kiosk-teal/10 border border-kiosk-teal/30 rounded-2xl text-kiosk-teal shadow-kiosk-glow">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
                  Citizen Verification
                </h2>
                <p className="text-xs text-slate-400">Identify yourself to securely file grievances or check histories</p>
              </div>
            </div>

            {/* Error Message banner */}
            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-2xl mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              /* Success Anim View */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 shadow-lg animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-outfit font-black text-2xl text-emerald-400">Profile Verified successfully</h3>
                <p className="text-xs text-slate-400">Loading secure helpdesk session context...</p>
              </div>
            ) : (
              /* Verification choices */
              <div className="space-y-6">
                
                {/* Method switcher tabs */}
                {!otpSent && (
                  <div className="grid grid-cols-2 gap-2.5 p-2 bg-kiosk-dark/60 border border-white/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => handleTabChange('otp')}
                      className={`py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 kiosk-btn ${
                        authMethod === 'otp'
                          ? 'bg-kiosk-teal text-kiosk-dark font-black shadow-kiosk-glow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile OTP Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange('aadhaar')}
                      className={`py-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 kiosk-btn ${
                        authMethod === 'aadhaar'
                          ? 'bg-kiosk-teal text-kiosk-dark font-black shadow-kiosk-glow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Fingerprint className="w-4 h-4" />
                      Aadhaar Virtual ID
                    </button>
                  </div>
                )}

                {/* Form fields selection */}
                {authMethod === 'otp' ? (
                  /* Option 1: Mobile Form */
                  <div className="space-y-5">
                    {/* Mobile Input box */}
                    <div 
                      onClick={() => { resetTimer(); setActiveInput('mobile'); }}
                      className={`space-y-2 p-4 rounded-2xl border-2 transition cursor-pointer ${
                        activeInput === 'mobile' 
                          ? 'border-kiosk-teal bg-kiosk-dark/50' 
                          : 'border-white/5 bg-kiosk-dark/20 hover:border-slate-800'
                      }`}
                    >
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Citizen Mobile Number</label>
                      <div className="flex items-center text-lg font-bold font-mono">
                        <span className="text-slate-500 mr-2">+91</span>
                        <input
                          type="text"
                          value={mobileNum}
                          readOnly
                          placeholder="Tap keypad to enter 10 digit number"
                          className="bg-transparent border-none outline-none p-0 text-slate-100 placeholder-slate-600 text-lg w-full font-bold select-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* OTP verification box - shown after OTP send trigger */}
                    {otpSent && (
                      <div 
                        onClick={() => { resetTimer(); setActiveInput('otp'); }}
                        className={`space-y-2 p-4 rounded-2xl border-2 transition cursor-pointer ${
                          activeInput === 'otp' 
                            ? 'border-kiosk-teal bg-kiosk-dark/50' 
                            : 'border-white/5 bg-kiosk-dark/20 hover:border-slate-800'
                        }`}
                      >
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enter 6-Digit OTP Code</label>
                        <input
                          type="text"
                          value={otpVal}
                          readOnly
                          placeholder="------"
                          className="bg-transparent border-none outline-none p-0 text-slate-100 placeholder-slate-600 text-xl font-bold tracking-[0.6em] w-full text-center select-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option 2: Aadhaar ID Form */
                  <div className="space-y-5">
                    <div 
                      onClick={() => { resetTimer(); setActiveInput('aadhaar'); }}
                      className={`space-y-2 p-4 rounded-2xl border-2 transition cursor-pointer ${
                        activeInput === 'aadhaar' 
                          ? 'border-kiosk-teal bg-kiosk-dark/50' 
                          : 'border-white/5 bg-kiosk-dark/20 hover:border-slate-800'
                      }`}
                    >
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">12-Digit Aadhaar Virtual ID</label>
                      <input
                        type="text"
                        value={aadhaarNum}
                        readOnly
                        placeholder="Tap keypad to enter Aadhaar number"
                        className="bg-transparent border-none outline-none p-0 text-slate-100 placeholder-slate-600 text-lg tracking-widest w-full font-bold select-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Trigger submit Buttons */}
          {!success && (
            <div className="border-t border-white/5 pt-6 mt-8 flex justify-end gap-3.5">
              {authMethod === 'otp' && !otpSent ? (
                <button
                  onClick={handleGetOtp}
                  disabled={loading || mobileNum.length !== 10}
                  className="px-10 py-5 bg-kiosk-teal hover:bg-opacity-95 font-black text-base rounded-[1.5rem] text-kiosk-dark transition shadow-kiosk-glow disabled:opacity-50 kiosk-btn w-full md:w-auto"
                >
                  {loading ? 'Sending...' : 'Generate Mobile OTP'}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {otpSent && (
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtpVal('');
                        setActiveInput('mobile');
                      }}
                      className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 kiosk-btn"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-enter Mobile
                    </button>
                  )}
                  <button
                    onClick={handleVerify}
                    disabled={loading || (authMethod === 'otp' ? otpVal.length !== 6 : aadhaarNum.length !== 12)}
                    className="px-10 py-5 bg-kiosk-teal hover:bg-opacity-95 font-black text-base rounded-[1.5rem] text-kiosk-dark transition shadow-kiosk-glow disabled:opacity-50 kiosk-btn flex-1 md:flex-none text-center"
                  >
                    {loading ? 'Verifying...' : 'Verify & Log In'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Virtual Kiosk touchscreen Keypad (Takes 2 cols) */}
        {!success && (
          <div className={`lg:col-span-2 p-6 rounded-[2.5rem] border shadow-kiosk-depth flex flex-col justify-center items-center transition ${
            highContrast 
              ? 'bg-black border-yellow-400' 
              : 'bg-kiosk-dark/45 border-white/5 backdrop-blur-md'
          }`}>
            <div className="w-full text-center mb-4 select-none">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Kiosk Touch Pad</span>
              <p className="text-xs text-slate-300 mt-0.5">Tap keys to enter numbers</p>
            </div>

            {/* Keypad Layout Grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyPress(k)}
                  className={`h-16 rounded-2xl text-xl font-bold flex items-center justify-center active:scale-95 transition-all kiosk-btn border ${
                    highContrast
                      ? 'border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-black'
                      : k === 'Clear' || k === '⌫'
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 text-sm font-semibold'
                        : 'bg-kiosk-navy border-slate-700/60 text-slate-100 hover:bg-kiosk-accent hover:border-kiosk-teal/40'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
};

export default Auth;
