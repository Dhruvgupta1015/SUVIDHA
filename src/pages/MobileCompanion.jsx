import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { requestAPI, authAPI } from '../utils/api';
import { 
  QrCode, 
  Smartphone, 
  Wifi, 
  Battery, 
  Send, 
  Bell, 
  Info, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';

export const MobileCompanion = () => {
  const { speakElement, speak, highContrast } = useAccessibility();

  // App screens in simulated phone: 'auth_phone' | 'auth_otp' | 'dashboard' | 'ticket_details'
  const [phoneScreen, setPhoneScreen] = useState('auth_phone');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpValue, setOtpValue] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  
  // Requests list loaded from database or mock fallback
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // Push notification states
  const [pushBanner, setPushBanner] = useState(null); // { title, msg } | null

  // Trigger simulated push notification
  const triggerPushNotification = (title, message) => {
    setPushBanner({ title, message });
    speak(`Companion notification: ${message}`);
    // Clear notification after 4s
    setTimeout(() => {
      setPushBanner(null);
    }, 4500);
  };

  // API Call: request login OTP inside simulated phone
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!mobileNumber.match(/^\d{10}$/)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    speak("Requesting login OTP");
    try {
      const response = await authAPI.requestOtp(mobileNumber);
      setPhoneScreen('auth_otp');
      speak("OTP code sent to mobile");
      if (response.data.demoOtp) {
        setOtpValue(response.data.demoOtp); // pre-fill for user ease
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP. Ensure backend is running.");
    }
  };

  // API Call: Verify OTP and fetch profile
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    speak("Verifying mobile credentials");
    try {
      const response = await authAPI.verifyOtp({
        mobile: mobileNumber,
        otp: otpValue,
        name: "Rohan Sharma"
      });

      const { user } = response.data;
      setUserProfile(user);
      setPhoneScreen('dashboard');
      speak(`Logged in successfully. Welcome back ${user.name}`);
      
      // Load user requests
      loadUserRequests();
      
      // Push notification trigger
      setTimeout(() => {
        triggerPushNotification("SUVIDHA Sync", "Mobile companion synched with Ward Dispatch databases.");
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Invalid OTP code. Try again.");
    }
  };

  // Fetch Requests from backend
  const loadUserRequests = async () => {
    setLoadingTickets(true);
    try {
      // For demo convenience, load all requests and filter by user mobile prefix
      // Fallback to mock data if empty
      const res = await requestAPI.getById('REQ-2026-583921').catch(() => null);
      
      const list = [];
      if (res && res.data?.request) {
        list.push({
          id: res.data.request.requestId,
          type: res.data.request.serviceType.toUpperCase(),
          status: res.data.request.status,
          date: new Date(res.data.request.createdAt).toLocaleDateString(),
          dept: res.data.request.assignedDepartment
        });
      }

      // Add a couple of mock tickets to make the dashboard look rich
      list.push({ id: "REQ-2026-103948", type: "WATER - Leakage", status: "In-Progress", date: "25/06/2026", dept: "BWSSB Ward 84" });
      list.push({ id: "REQ-2026-302948", type: "WASTE - Garbage", status: "Completed", date: "24/06/2026", dept: "BBMP Ward 84" });

      setMyTickets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTicketSelect = (t) => {
    setActiveTicket(t);
    setPhoneScreen('ticket_details');
    speak(`Opening tracking details for ${t.id}`);
  };

  const handleLogout = () => {
    setPhoneScreen('auth_phone');
    setUserProfile(null);
    setMyTickets([]);
    speak("Logged out of companion portal");
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* Kiosk page split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        
        {/* Left Side: QR & Sync Guide (3 cols) */}
        <div className={`lg:col-span-3 p-8 rounded-[2.5rem] border shadow-kiosk-depth flex flex-col justify-between space-y-6 transition ${
          highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5 text-slate-100'
        }`}>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-kiosk-glow">
                <Smartphone className="w-8 h-8 text-kiosk-teal animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
                  Mobile Companion Sync
                </h2>
                <p className="text-xs text-slate-400">Sync with your Personal Mobile Device to Track Tickets on-the-go</p>
              </div>
            </div>

            <div className="pt-6 space-y-5 text-xs text-slate-300">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-kiosk-teal flex items-center justify-center shrink-0 font-bold font-mono">1</div>
                <p className="leading-relaxed pt-1">Scan the companion QR code with your smartphone camera.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-kiosk-teal flex items-center justify-center shrink-0 font-bold font-mono">2</div>
                <p className="leading-relaxed pt-1">Verify OTP on your device to create a local wireless session sync.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-kiosk-teal flex items-center justify-center shrink-0 font-bold font-mono">3</div>
                <p className="leading-relaxed pt-1">Receive live status change push notifications directly in your browser bookmark.</p>
              </div>
            </div>
          </div>

          {/* QR Box & Link */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-kiosk-dark/35 border border-white/5 rounded-3xl">
            <div className="p-3.5 bg-white rounded-2xl shrink-0 flex items-center justify-center border-2 border-kiosk-teal/20">
              <svg className="w-24 h-24 text-black" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="20" height="20" fill="black" />
                <rect x="15" y="15" width="10" height="10" fill="white" />
                <rect x="70" y="10" width="20" height="20" fill="black" />
                <rect x="75" y="15" width="10" height="10" fill="white" />
                <rect x="10" y="70" width="20" height="20" fill="black" />
                <rect x="15" y="75" width="10" height="10" fill="white" />
                <rect x="40" y="20" width="10" height="15" fill="black" />
                <rect x="45" y="45" width="15" height="10" fill="black" />
                <rect x="70" y="40" width="15" height="15" fill="black" />
                <rect x="25" y="45" width="10" height="20" fill="black" />
                <rect x="45" y="70" width="20" height="15" fill="black" />
                <rect x="80" y="80" width="10" height="10" fill="black" />
              </svg>
            </div>
            <div className="text-left text-xs space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Sync Reference Link</span>
              <p className="font-extrabold text-kiosk-teal text-sm font-mono leading-none">https://suvidha.gov.in/sync</p>
              <p className="text-[10px] text-slate-400 pt-1 leading-normal">Or use the interactive smartphone simulator on the right to test mobile layouts directly on this kiosk console.</p>
            </div>
          </div>

        </div>

        {/* Right Side: Simulated Smartphone App Mockup (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-2">
          
          {/* Smartphone Bezel Bevel container */}
          <div className="w-[310px] h-[610px] bg-slate-950 border-[8px] border-slate-800 rounded-[2.8rem] shadow-kiosk-depth relative overflow-hidden flex flex-col justify-between ring-4 ring-white/5">
            
            {/* Phone Bezel Speaker notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-slate-800 rounded-full z-40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950 mr-1.5"></div>
              <div className="w-10 h-1 bg-slate-950 rounded-full"></div>
            </div>

            {/* Mobile Top Status Bar */}
            <div className="px-5 pt-7 pb-2 bg-kiosk-dark/90 flex items-center justify-between text-[10px] text-slate-400 font-semibold select-none z-30 shrink-0">
              <span>12:46 PM</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-kiosk-teal" />
                <Battery className="w-4 h-4 text-kiosk-teal" />
              </div>
            </div>

            {/* Push Notification Dropdown Banner Simulator */}
            {pushBanner && (
              <div className="absolute top-12 inset-x-3 bg-slate-900/95 border border-slate-700/85 rounded-2xl p-3 shadow-lg flex gap-2.5 items-start z-50 animate-bounce-slow">
                <div className="p-2 rounded-xl bg-kiosk-teal/15 text-kiosk-teal">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <h5 className="text-[10px] font-black text-slate-100">{pushBanner.title}</h5>
                  <p className="text-[9px] text-slate-400 leading-normal">{pushBanner.message}</p>
                </div>
                <button onClick={() => setPushBanner(null)} className="text-slate-500 hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Smartphone screen viewport */}
            <div className="flex-1 overflow-y-auto bg-kiosk-dark/65 flex flex-col justify-between relative">
              
              {/* Simulated Mobile Screens */}
              <div className="flex-1 flex flex-col p-4 justify-between">
                {phoneScreen === 'auth_phone' && (
                  /* Phone number enter screen */
                  <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                    <div className="space-y-1.5">
                      <h4 className="font-outfit font-black text-base text-slate-100">SUVIDHA Companion</h4>
                      <p className="text-[10px] text-slate-400">Track and sync municipal requests</p>
                    </div>

                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div className="text-left space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Mobile Number</label>
                        <input
                          type="tel"
                          maxLength="10"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 10-digit number"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-kiosk-teal font-mono font-bold text-center"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-kiosk-teal text-kiosk-dark font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-kiosk-glow cursor-pointer"
                      >
                        <span>SEND CODE</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

                {phoneScreen === 'auth_otp' && (
                  /* OTP validation screen */
                  <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                    <div className="space-y-1.5">
                      <h4 className="font-outfit font-black text-base text-slate-100">Verification Code</h4>
                      <p className="text-[10px] text-slate-400">Enter code sent to +91 {mobileNumber}</p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="text-left space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pl-1 text-center">SMS OTP Code</label>
                        <input
                          type="text"
                          maxLength="6"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-kiosk-teal font-mono font-black text-center tracking-widest"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPhoneScreen('auth_phone')}
                          className="flex-1 py-3 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/5 cursor-pointer"
                        >
                          Change Mobile
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-kiosk-teal text-kiosk-dark font-black rounded-xl text-[10px] shadow-kiosk-glow cursor-pointer"
                        >
                          VERIFY OTP
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {phoneScreen === 'dashboard' && (
                  /* Mobile Companion logged-in Dashboard */
                  <div className="flex-1 flex flex-col justify-start text-left space-y-5 animate-fade-in">
                    
                    {/* Welcome User bar */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 select-none">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Citizen Console</span>
                        <h4 className="text-xs font-bold text-slate-200">{userProfile?.name || 'Rohan Sharma'}</h4>
                      </div>
                      
                      <button onClick={handleLogout} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/25 border border-rose-500/20">
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col justify-start">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">My Civic Requests</span>
                      
                      {loadingTickets ? (
                        <div className="text-center py-6">
                          <div className="w-6 h-6 border-2 border-kiosk-teal border-t-transparent rounded-full animate-spin mx-auto mb-1.5"></div>
                          <span className="text-[10px] text-slate-500">Syncing database...</span>
                        </div>
                      ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[290px] pr-0.5">
                          {myTickets.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleTicketSelect(t)}
                              className="w-full p-3 bg-slate-900/80 hover:bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between text-left transition"
                            >
                              <div className="space-y-0.5 max-w-[80%]">
                                <span className="text-[10px] font-bold text-slate-200 truncate block">{t.type}</span>
                                <span className="text-[8px] text-slate-500 font-mono block">{t.id} • {t.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                  t.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-kiosk-teal/15 text-kiosk-teal border border-kiosk-teal/20'
                                }`}>
                                  {t.status}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {phoneScreen === 'ticket_details' && activeTicket && (
                  /* Mobile ticket detail & receipt view */
                  <div className="flex-1 flex flex-col justify-start text-left space-y-4 animate-fade-in">
                    
                    <button
                      onClick={() => setPhoneScreen('dashboard')}
                      className="flex items-center gap-1 text-[10px] font-bold text-kiosk-teal hover:underline self-start cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Dashboard</span>
                    </button>

                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-3.5 text-[10px]">
                      
                      <div className="border-b border-white/5 pb-2">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Request Reference</span>
                        <h4 className="font-mono font-black text-xs text-kiosk-teal">{activeTicket.id}</h4>
                        <p className="text-[8px] text-slate-400 mt-0.5">{activeTicket.type}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Date Logged:</span><span className="font-semibold">{activeTicket.date}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Current Status:</span><span className="font-bold text-emerald-400">{activeTicket.status}</span></div>
                        <div className="flex justify-between flex-col gap-0.5"><span className="text-slate-400">Nodal Department:</span><span className="font-medium text-slate-300">{activeTicket.dept}</span></div>
                      </div>

                      <div className="p-2.5 bg-kiosk-teal/10 border border-kiosk-teal/30 rounded-xl flex items-start gap-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-kiosk-teal shrink-0 mt-0.5" />
                        <p className="text-[8px] leading-relaxed text-slate-300">Aadhaar scan matched via Edge OCR validation. Ticket queued for supervisor field inspection.</p>
                      </div>

                    </div>

                    {/* Simulators */}
                    <button
                      onClick={() => triggerPushNotification("SUVIDHA update", `Grievance status changed: ${activeTicket.id} is In-Progress.`)}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black hover:bg-white/10 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-kiosk-teal animate-pulse" />
                      <span>Simulate Status Push Alert</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Home indicator bar */}
              <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mb-2 shrink-0 select-none"></div>

            </div>

          </div>

          {/* Diagnostics warning */}
          <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-500 font-bold select-none">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Interactive phone container simulator</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default MobileCompanion;
