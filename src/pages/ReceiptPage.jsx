import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { printReceipt } from '../utils/receiptGenerator';
import { 
  ArrowLeft, 
  Home, 
  Volume2, 
  Printer, 
  Download, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Building,
  Info
} from 'lucide-react';

export const ReceiptPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Get receipt data from routing state
  const receiptData = location.state || {
    ticketId: 'REQ-2026-482910',
    serviceName: 'Electricity Board Grievance',
    citizenName: 'Rohan Sharma',
    submissionDate: new Date().toLocaleDateString(),
    statusText: 'Department Processing',
    sla: '28/06/2026',
    department: 'Municipal Utility Nodal Office'
  };

  // UI simulation states
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mobileModal, setMobileModal] = useState(false);
  const [mobileNum, setMobileNum] = useState('9876543210');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  
  // Countdown Timer state
  const [countdown, setCountdown] = useState(30);

  // Auto Reset Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          speak("Session complete. Returning to home screen.");
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const resetCountdown = () => {
    setCountdown(30);
  };

  const handlePrint = (e) => {
    resetCountdown();
    speakElement(e, "Printing receipt ticket");
    
    // Call receipt helper
    printReceipt({
      receiptId: receiptData.ticketId,
      timestamp: receiptData.submissionDate,
      kioskId: "K-BLR-04",
      location: "Indiranagar Metro Station Kiosk, Bangalore",
      serviceName: receiptData.serviceName,
      refNumber: receiptData.ticketId,
      citizenName: receiptData.citizenName,
      details: {
        "Request ID": receiptData.ticketId,
        "Current Status": receiptData.statusText,
        "SLA Target": receiptData.sla,
        "Department": receiptData.department
      },
      status: receiptData.statusText,
      footerMessage: "Thank you for using SUVIDHA. Keep this receipt for tracking. Helpline: 1800-425-XXXX"
    });
  };

  const handleDownloadPdf = (e) => {
    resetCountdown();
    speakElement(e, "Downloading PDF receipt");
    setDownloading(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      speak("PDF downloaded locally successfully.");
      setTimeout(() => setDownloadSuccess(false), 2000);
    }, 1200);
  };

  const handleSendMobile = (e) => {
    e.preventDefault();
    resetCountdown();
    if (!mobileNum.match(/^\d{10}$/)) {
      speak("Please enter a valid ten digit mobile number");
      return;
    }

    setSendingSms(true);
    setSmsSuccess(false);
    speak("Sending SMS receipt link");

    setTimeout(() => {
      setSendingSms(false);
      setSmsSuccess(true);
      speak("SMS receipt sent successfully.");
      setTimeout(() => {
        setSmsSuccess(false);
        setMobileModal(false);
      }, 1500);
    }, 1200);
  };

  const handleReturnHome = (e) => {
    speakElement(e, "Returning to main menu and clearing kiosk session");
    navigate('/');
  };

  const speakReceiptGuide = () => {
    speak("Receipt generated successfully. You can tap print receipt to download a thermal copy, download a PDF, or enter your phone number to get it sent via text.");
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="pb-4 border-b border-white/5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => speakElement(e, "Back to tracking status")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
            highContrast 
              ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
              : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Timeout Countdown */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <Clock className="w-4 h-4 text-kiosk-teal animate-pulse" />
            <span>Kiosk Auto-Reset: <b className="text-slate-100">{countdown}s</b></span>
          </div>

          <button
            onClick={speakReceiptGuide}
            onMouseEnter={(e) => speakElement(e, "Read receipt details")}
            className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
          Service Request Receipt
        </h2>
        <p className="text-xs text-slate-400">Save the acknowledgment slip below for future reference</p>
      </div>

      {/* 3. Official Government Receipt Acknowledgment Card */}
      <div className="flex justify-center py-2 select-none">
        <div className={`w-full max-w-lg p-8 rounded-3xl shadow-kiosk-depth border-2 border-dashed relative overflow-hidden transition ${
          highContrast
            ? 'bg-black border-yellow-400 text-yellow-400'
            : 'bg-white text-slate-800 border-slate-300'
        }`}>
          {/* Decorative receipt notch accents */}
          <div className="absolute -left-4 top-1/2 w-8 h-8 rounded-full bg-kiosk-dark border border-white/5"></div>
          <div className="absolute -right-4 top-1/2 w-8 h-8 rounded-full bg-kiosk-dark border border-white/5"></div>

          {/* Receipt Header */}
          <div className="text-center pb-6 border-b border-dashed border-slate-300/80 space-y-1">
            <h3 className="font-outfit font-black text-xl tracking-wider text-slate-800 uppercase">SUVIDHA HELPDESK</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Government of Karnataka • NIC Portal</p>
            <p className="text-[9px] text-slate-400">Indiranagar Station • Kiosk ID K-BLR-04</p>
          </div>

          {/* Receipt Content Body */}
          <div className="py-6 space-y-5 text-xs">
            {/* Request Summary table */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono"><span className="text-slate-400">RECEIPT NUMBER:</span><span className="font-bold text-slate-800">{receiptData.ticketId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">SUBMISSION DATE:</span><span className="font-semibold text-slate-800">{receiptData.submissionDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">CITIZEN NAME:</span><span className="font-semibold text-slate-800">{receiptData.citizenName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">MOBILE NUMBER:</span><span className="font-semibold text-slate-800">+91 98765 XXXXX</span></div>
            </div>

            {/* Service & Dept Details */}
            <div className="border-t border-b border-dashed border-slate-300/80 py-4 space-y-2.5">
              <div className="flex justify-between"><span className="text-slate-400">Category:</span><span className="font-bold text-slate-800">{receiptData.serviceName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Active Stage:</span><span className="font-bold text-emerald-600">{receiptData.statusText}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Assigned Wing:</span><span className="font-semibold text-slate-700">{receiptData.department}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">SLA Target Time:</span><span className="font-semibold text-slate-700">{receiptData.sla}</span></div>
            </div>

            {/* QR Code Section & Notice */}
            <div className="flex items-center gap-5 pt-3">
              <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <svg className="w-16 h-16 text-black" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="20" height="20" fill="black" />
                  <rect x="15" y="15" width="10" height="10" fill="white" />
                  <rect x="70" y="10" width="20" height="20" fill="black" />
                  <rect x="75" y="15" width="10" height="10" fill="white" />
                  <rect x="10" y="70" width="20" height="20" fill="black" />
                  <rect x="15" y="75" width="10" height="10" fill="white" />
                  {/* Random pixels */}
                  <rect x="40" y="20" width="10" height="15" fill="black" />
                  <rect x="45" y="45" width="15" height="10" fill="black" />
                  <rect x="70" y="40" width="15" height="15" fill="black" />
                  <rect x="25" y="45" width="10" height="20" fill="black" />
                  <rect x="45" y="70" width="20" height="15" fill="black" />
                  <rect x="80" y="80" width="10" height="10" fill="black" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Notice
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">Scan QR code using mobile phone to sync progress tracking updates directly to your browser bookmarks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Receipt Actions toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 w-full">
        {/* Print Receipt */}
        <button
          onClick={handlePrint}
          onMouseEnter={(e) => speakElement(e, "Print receipt copy")}
          className={`px-5 py-4.5 rounded-2xl font-black text-xs border flex flex-col items-center justify-center gap-2 kiosk-btn shadow ${
            highContrast
              ? 'bg-yellow-400 text-black border-yellow-400 hover:bg-black hover:text-yellow-400'
              : 'bg-kiosk-teal text-kiosk-dark border-kiosk-teal shadow-kiosk-glow'
          }`}
        >
          <Printer className="w-5 h-5" />
          <span>Print Receipt</span>
        </button>

        {/* Download PDF */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          onMouseEnter={(e) => speakElement(e, "Download PDF")}
          className={`px-5 py-4.5 rounded-2xl font-black text-xs border flex flex-col items-center justify-center gap-2 kiosk-btn shadow ${
            highContrast
              ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black'
              : 'bg-kiosk-accent/60 text-slate-200 border-white/10 hover:bg-kiosk-accent'
          }`}
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : 'text-kiosk-teal'}`} />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </>
          )}
        </button>

        {/* Send to Mobile */}
        <button
          onClick={() => { resetCountdown(); setMobileModal(true); }}
          onMouseEnter={(e) => speakElement(e, "Send receipt link to mobile number")}
          className={`px-5 py-4.5 rounded-2xl font-black text-xs border flex flex-col items-center justify-center gap-2 kiosk-btn shadow ${
            highContrast
              ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black'
              : 'bg-kiosk-accent/60 text-slate-200 border-white/10 hover:bg-kiosk-accent'
          }`}
        >
          <Smartphone className="w-5 h-5 text-kiosk-teal" />
          <span>Send to Mobile</span>
        </button>

        {/* Return Home */}
        <button
          onClick={handleReturnHome}
          onMouseEnter={(e) => speakElement(e, "Return to main homepage")}
          className={`px-5 py-4.5 rounded-2xl font-black text-xs border flex flex-col items-center justify-center gap-2 kiosk-btn shadow ${
            highContrast
              ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Return Home</span>
        </button>
      </div>

      {/* 5. Mobile SMS Modal Dialog */}
      {mobileModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-kiosk-navy border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-kiosk-depth">
            <h3 className="font-outfit font-black text-lg text-slate-100 text-center">Send SMS Receipt</h3>
            
            <form onSubmit={handleSendMobile} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recipient Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm font-bold text-slate-500">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    value={mobileNum}
                    onChange={(e) => setMobileNum(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 bg-kiosk-dark border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-kiosk-teal font-bold"
                    required
                  />
                </div>
              </div>

              {smsSuccess ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center justify-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Sent successfully!
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileModal(false)}
                    className="flex-1 py-3 border border-white/10 rounded-xl text-xs hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingSms}
                    className="flex-1 py-3 bg-kiosk-teal text-kiosk-dark font-black rounded-xl text-xs shadow-kiosk-glow disabled:opacity-50"
                  >
                    {sendingSms ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceiptPage;
