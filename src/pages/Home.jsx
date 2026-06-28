import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Users, ShieldCheck, Building2, Search, Phone, FileCheck,
  Activity, Clock, MapPin, CheckCircle2, Zap, Droplet, Flame, Trash2,
  FileText, AlertCircle, ChevronDown, ChevronUp, Star, TrendingUp,
  Award, Globe, Layers, UserCheck, BarChart2, Shield, Download, Bell,
  UserRound, Smartphone, Upload, BadgeCheck, MapPinned, CheckCheck
} from 'lucide-react';
import { requestAPI } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

/* ── Animated Counter Hook ── */
const useCountUp = (target, duration = 2000, startOnMount = true) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(startOnMount);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
};

/* ── Stat Card ── */
const StatCard = ({ label, value, suffix = '', prefix = '', icon: Icon, color }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="gov-card p-6 text-center flex flex-col items-center gap-3">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {prefix}{count.toLocaleString('en-IN')}{suffix}
        </div>
        <div className="text-sm text-gray-500 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
};

/* ── FAQ Item ── */
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="gov-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
      >
        <span className="font-semibold text-[#0F172A] text-sm leading-relaxed">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-fade-in">
          {a}
        </div>
      )}
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();

  const [searchId, setSearchId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeStepPopup, setActiveStepPopup] = useState(null);
  const [activeWhyPopup, setActiveWhyPopup] = useState(null);
  const [activeArchPopup, setActiveArchPopup] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.step-popup-trigger') && !e.target.closest('.step-popup-content')) {
        setActiveStepPopup(null);
      }
      if (!e.target.closest('.why-popup-trigger')) {
        setActiveWhyPopup(null);
      }
      if (!e.target.closest('.arch-popup-trigger')) {
        setActiveArchPopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearching(true); setTrackError(''); setTrackResult(null);
    try {
      const response = await requestAPI.getById(searchId.trim());
      setSearching(false);
      if (response.data?.request) setTrackResult(response.data.request);
      else setTrackError('Ticket ID not found. Format: REQ-2026-XXXXXX');
    } catch {
      setSearching(false);
      setTrackError('Ticket ID not found. Format: REQ-2026-XXXXXX');
    }
  };

  const services = [
    { icon: <Zap className="w-5 h-5 text-[#2563EB]" />, iconBg: 'bg-blue-50', desc: 'New meter connections, power outage complaints, meter repair requests.', id: 'electricity', title: 'Electricity Connection', hi: 'बिजली कनेक्शन', sla: '48 Hrs' },
    { icon: <Droplet className="w-5 h-5 text-cyan-600" />, iconBg: 'bg-cyan-50', desc: 'Pipe leaks, municipal water supply lines, pressure issues.', id: 'water', title: 'Water Supply', hi: 'पानी कनेक्शन', sla: '24 Hrs' },
    { icon: <Flame className="w-5 h-5 text-orange-600" />, iconBg: 'bg-orange-50', desc: 'PNG meter repairs, gas line inspection, pressure complaints.', id: 'gas', title: 'PNG Gas Connection', hi: 'पीएनजी गैस', sla: '48 Hrs' },
    { icon: <Trash2 className="w-5 h-5 text-green-600" />, iconBg: 'bg-green-50', desc: 'Garbage collection, debris removal, sewage blockage complaints.', id: 'waste', title: 'Waste Management', hi: 'कचरा प्रबंधन', sla: '24 Hrs' },
    { icon: <FileText className="w-5 h-5 text-purple-600" />, iconBg: 'bg-purple-50', desc: 'Streetlights, potholes, stray animals, and other civic issues.', id: 'general', title: 'General Complaints', hi: 'सामान्य शिकायतें', sla: '72 Hrs' },
  ];

  const steps = [
    { n: '01', title: 'Register / Login', desc: 'Securely login via mobile OTP. New users register in under 60 seconds.', icon: <><UserRound className="w-5 h-5 text-white" /><Smartphone className="w-5 h-5 text-white" /></>, popup: ['Mobile OTP verification', 'Aadhaar-linked onboarding', 'Secure citizen registration', 'Account creation process'] },
    { n: '02', title: 'Submit Application', desc: 'Select service category, describe the issue, set priority, and upload documents.', icon: <><FileText className="w-5 h-5 text-white" /><Upload className="w-5 h-5 text-white" /></>, popup: ['Select department', 'Upload required documents', 'Set issue priority', 'Submit grievance/application'] },
    { n: '03', title: 'Officer Verification', desc: 'Department officers review, assign field crews, and log official dispatch notes.', icon: <BadgeCheck className="w-5 h-5 text-white" />, popup: ['Department review', 'Field officer assignment', 'Verification checks', 'Approval workflow'] },
    { n: '04', title: 'Track & Resolve', desc: 'Real-time status updates via SMS & portal. Download digital receipts on closure.', icon: <><MapPinned className="w-5 h-5 text-white" /><CheckCheck className="w-5 h-5 text-white" /></>, popup: ['Live status updates', 'WebSocket notifications', 'Resolution timeline', 'Final closure receipt'] },
  ];

  const whyPoints = [
    { icon: <ShieldCheck className="w-5 h-5 text-[#2563EB]" />, title: '100% Verified', desc: 'Aadhaar-linked identity verification for all registered citizens.', proofTitle: 'Trust verification proof', proofs: ['Aadhaar verification workflow', 'Mobile OTP validation', 'Citizen identity authentication', 'Secure registration proof'] },
    { icon: <Clock className="w-5 h-5 text-[#2563EB]" />, title: 'SLA Guaranteed', desc: 'All requests are bound by time-mandate SLA with automatic escalation.', proofTitle: 'Service commitment proof', proofs: ['Time-bound service resolution', 'Auto escalation system', 'Deadline enforcement', 'Department accountability'] },
    { icon: <Activity className="w-5 h-5 text-[#2563EB]" />, title: 'Real-Time Tracking', desc: 'Live WebSocket updates keep you informed at every stage.', proofTitle: 'Transparency proof', proofs: ['WebSocket live updates', 'Status checkpoints', 'Push notifications', 'Real-time progress logs'] },
    { icon: <Layers className="w-5 h-5 text-[#2563EB]" />, title: 'Multi-Department', desc: 'Electricity, Water, Gas, Waste & General — all on one platform.', proofTitle: 'Coverage proof', proofs: ['Electricity', 'Water', 'Gas', 'Waste Management', 'Civic Complaints'] },
    { icon: <Globe className="w-5 h-5 text-[#2563EB]" />, title: '12 Languages', desc: 'Available in Hindi, English, and 10 other regional languages.', proofTitle: 'Accessibility proof', proofs: [
      { label: 'Hindi', code: 'hi' },
      { label: 'English', code: 'en' },
      { label: 'Kannada', code: 'kn' },
      { label: 'Tamil', code: 'ta' },
      { label: 'Telugu', code: 'te' },
      { label: 'Bengali', code: 'bn' },
      { label: 'Marathi', code: 'mr' },
      { label: 'Gujarati', code: 'gu' },
      { label: 'Punjabi', code: 'pa' },
      { label: 'Malayalam', code: 'ml' },
      { label: 'Urdu', code: 'ur' },
      { label: 'Odia', code: 'or' }
    ] },
    { icon: <Award className="w-5 h-5 text-[#2563EB]" />, title: 'ISO 27001', desc: 'Certified data security and privacy standards compliant.', proofTitle: 'Security proof', proofs: ['End-to-end encryption', 'Secure data storage', 'Audit logs', 'Compliance monitoring', 'Privacy-first architecture'] },
  ];

  const faqs = [
    {
      q: 'How do I register as a citizen on SUVIDHA?',
      a: 'Click "Citizen Portal" and enter your 10-digit mobile number. An OTP will be sent. Verify and optionally link your Aadhaar and name during first login. No separate registration form is needed.'
    },
    {
      q: 'What documents do I need to submit a service request?',
      a: 'Most requests require a valid ID proof (Aadhaar, Voter ID) and address proof. Additional documents vary by service — electricity connections may require property papers; water connections may need society NOC.'
    },
    {
      q: 'How long does it take for a request to be resolved?',
      a: 'Each service has a defined SLA: Water complaints — 24 hours, Electricity/Gas — 48 hours, General complaints — 72 hours. If the SLA is breached, the request is automatically escalated to senior officers.'
    },
    {
      q: 'Can I track my complaint without logging in?',
      a: 'Yes! Use the "Track Request" feature on this page or navigate to /track. Enter your Request ID (format: REQ-2026-XXXXXX) to see the current status without signing in.'
    },
    {
      q: 'What is the Qualcomm Snapdragon AI integration in SUVIDHA?',
      a: 'SUVIDHA leverages Snapdragon-powered edge AI for offline voice assistance at kiosks, document scanning via on-device OCR, and real-time language translation — enabling Citizen ↔ Officer ↔ Admin cloud sync in the Multiverse architecture.'
    },
    {
      q: 'How do officers get assigned to my complaint?',
      a: 'Your complaint is automatically routed to the department matching the service type (e.g., Water Department for pipe leaks). The departmental officer then assigns a field crew and updates the status in real time.'
    },
    {
      q: 'Is my Aadhaar data safe on this platform?',
      a: 'Yes. SUVIDHA is NIC-compliant and ISO 27001 certified. Aadhaar data is stored in masked format (XXXX-XXXX-YYYY) and is never shared with third parties. All data transfers use 256-bit SSL encryption.'
    },
  ];

  const archModules = [
    {
      label: 'Citizen Intelligence Layer',
      icon: <Users className="w-4 h-4" />,
      sub: 'Voice • OCR • Auth • AI Intake',
      sections: [
        { title: 'INPUT LAYER:', items: ['Voice Complaint Submission', 'Text Complaint Submission', 'OCR Document Upload', 'Aadhaar Authentication'] },
        { title: 'PROCESSING:', items: ['Language Detection', 'AI Intent Classification', 'Priority Detection'] },
        { title: 'OUTPUT:', items: ['Complaint ID Generation', 'Department Routing', 'Tracking Initialization'] }
      ],
      purpose: 'Citizen enters → system understands → system routes'
    },
    {
      label: 'Governance Execution Engine',
      icon: <Building2 className="w-4 h-4" />,
      sub: 'Routing • SLA • Verification',
      sections: [
        { title: 'INPUT:', items: ['Complaint Queue', 'Priority Score', 'Citizen Metadata'] },
        { title: 'EXECUTION:', items: ['Officer Assignment', 'Department Mapping', 'SLA Timer Start', 'Escalation Rules'] },
        { title: 'OUTPUT:', items: ['Verification Workflow', 'Resolution Tasks', 'Status Updates'] }
      ],
      purpose: 'System processes → governance executes'
    },
    {
      label: 'Administrative Command Center',
      icon: <Shield className="w-4 h-4" />,
      sub: 'Analytics • Monitoring • Control',
      sections: [
        { title: 'MONITORING:', items: ['Complaint Heatmaps', 'Officer Efficiency', 'Pending Cases', 'SLA Violations'] },
        { title: 'CONTROL:', items: ['Manual Escalation', 'Department Redistribution', 'Emergency Override'] },
        { title: 'OUTPUT:', items: ['Reports', 'Analytics', 'Risk Flags'] }
      ],
      purpose: 'Admin supervises and controls system health'
    },
    {
      label: 'Snapdragon Edge AI Core',
      icon: <Star className="w-4 h-4" />,
      sub: 'Offline AI • OCR • Voice',
      sections: [
        { title: 'LOCAL PROCESSING:', items: ['Offline OCR', 'Voice Recognition', 'Local Intent Parsing', 'Edge Translation'] },
        { title: 'OPTIMIZATION:', items: ['Low Latency Inference', 'Battery Efficient AI', 'Cached Requests'] },
        { title: 'SYNC:', items: ['Push to cloud when online'] }
      ],
      purpose: 'Offline-first intelligence powered by Snapdragon'
    },
    {
      label: 'Real-Time Civic Mesh',
      icon: <Activity className="w-4 h-4" />,
      sub: 'WebSocket • Events • Sync',
      sections: [
        { title: 'CONNECTIONS:', items: ['Citizens', 'Officers', 'Admin', 'Cloud'] },
        { title: 'STREAMING:', items: ['Live Status Updates', 'Emergency Broadcasts', 'WebSocket Events', 'Location Events'] },
        { title: 'SYNC:', items: ['Device-to-cloud', 'Multi-user continuity'] }
      ],
      purpose: 'Everything stays connected in real-time'
    }
  ];

  const statusColors = {
    Completed: 'badge-complete',
    'In-Progress': 'badge-progress',
    Rejected: 'badge-rejected',
    Pending: 'badge-pending',
  };

  return (
    <div className="flex flex-col gap-0 -mt-2">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="hero-gradient rounded-2xl p-8 md:p-14 text-white text-center mb-8 relative overflow-hidden animate-fade-up">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 text-blue-100 mb-6">
            <FileCheck className="w-3 h-3" />
            Official Grievance & Service Delivery Portal
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-5 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Government Citizen Services<br />
            <span className="text-blue-100">&amp; Grievance Registry</span>
          </h1>

          <p className="text-blue-50/90 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Apply for municipal utility connections, upload documents to the verification registry, and track your applications under time-bound SLA regulations — all in one secure portal.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <button
              onClick={() => navigate('/auth?role=citizen')}
              className="flex items-center gap-2 px-7 py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition hover:scale-105 active:scale-95"
            >
              <Users className="w-4 h-4" />
              Citizen Portal — नागरिक लॉग-इन
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth?role=officer')}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Officer Portal
            </button>
          </div>

          {/* Live stats bar */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { val: '98.2', suffix: '%', label: 'SLA Compliance' },
              { val: '2.4L+', suffix: '', label: 'Requests Resolved' },
              { val: '4.8', suffix: '/5', label: 'Citizen Rating' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {s.val}{s.suffix}
                </div>
                <div className="text-[11px] text-blue-200 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          QUICK TRACK GRIEVANCE
      ══════════════════════════════════════ */}
      <section className="max-w-2xl mx-auto w-full mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="gov-card p-6">
          <h3 className="section-label flex items-center gap-2 mb-4 text-slate-700">
            <Search className="w-4 h-4 text-[#2563EB]" />
            Track Grievance Status · शिकायत की स्थिति जांचें
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
            <input
              type="text"
              placeholder="Enter Request ID (e.g. REQ-2026-982739)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="gov-input flex-1"
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-primary px-5 py-2.5 whitespace-nowrap"
            >
              {searching ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching</span>
              ) : 'Track'}
            </button>
          </form>

          {trackResult && (
            <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50 text-sm space-y-3 animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-blue-100">
                <span className="font-bold text-gray-900">{trackResult.requestId}</span>
                <span className={`status-badge ${statusColors[trackResult.status] || 'badge-standard'}`}>
                  {trackResult.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Citizen: <strong className="text-gray-900">{trackResult.citizenId?.name || 'Aadhaar User'}</strong></div>
                <div>Service: <strong className="text-gray-900 capitalize">{trackResult.serviceType}</strong></div>
                <div>Department: <strong className="text-gray-900">{trackResult.assignedDepartment}</strong></div>
                <div>Team: <strong className="text-gray-900">{trackResult.assignedTeam || 'Unassigned'}</strong></div>
              </div>
              {trackResult.remarks && (
                <div className="text-xs text-gray-600 pt-2 border-t border-blue-100">
                  Officer Remarks: <em className="text-gray-800 font-medium">"{trackResult.remarks}"</em>
                </div>
              )}
            </div>
          )}

          {trackError && (
            <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {trackError}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          SERVICES SECTION
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Available Services</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Citizen Utility Service Counters
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Select a service to register a new connection request or lodge a grievance.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(svc => (
            <div key={svc.id} className="gov-card p-5 flex flex-col gap-4 group cursor-pointer hover:border-[#2563EB]" onClick={() => navigate('/auth?role=citizen')}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${svc.iconBg} flex items-center justify-center`}>
                  {svc.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  SLA: {svc.sla}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-[#0F172A] text-sm">{svc.title}</h4>
                <span className="text-[10px] text-slate-400 font-medium">{svc.hi}</span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{svc.desc}</p>
              </div>
              <Link
                to="/auth?role=citizen"
                className="w-full text-center py-2.5 bg-blue-50 hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-blue-200 hover:border-[#2563EB] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                onClick={e => e.stopPropagation()}
              >
                Apply for Service <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Simple Process</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            How It Works · यह कैसे कार्य करता है
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div 
              key={step.n} 
              className="gov-card p-5 relative overflow-visible step-popup-container cursor-pointer step-popup-trigger"
              onClick={() => setActiveStepPopup(activeStepPopup === step.n ? null : step.n)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-slate-300 opacity-30 absolute top-3 right-4 pointer-events-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {step.n}
                </span>
              </div>
              <h5 className="font-bold text-[#0F172A] text-sm mb-2">{step.title}</h5>
              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 z-10 pointer-events-none">
                  <ArrowRight className="w-5 h-5 text-blue-300" />
                </div>
              )}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeStepPopup === step.n 
                    ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-slate-200' 
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'
                }`}
              >
                <h6 className="text-sm font-semibold text-slate-900 mb-2">Workflow Details</h6>
                <ul className="space-y-2">
                  {step.popup.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY CHOOSE SUVIDHA
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Our Advantages</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Why Choose SUVIDHA
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Designed to match the standards of DigiLocker, UMANG, and Passport Seva.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {whyPoints.map(pt => (
            <div 
              key={pt.title} 
              className="gov-card p-5 relative overflow-visible cursor-pointer why-popup-trigger transition-all hover:shadow-md"
              onClick={() => setActiveWhyPopup(activeWhyPopup === pt.title ? null : pt.title)}
            >
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  {pt.icon}
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm mb-1">{pt.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{pt.desc}</p>
                </div>
              </div>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeWhyPopup === pt.title 
                    ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-slate-200' 
                    : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'
                }`}
              >
                <h6 className="text-sm font-semibold text-slate-900 mb-2">{pt.proofTitle}</h6>
                <ul className="space-y-2">
                  {pt.proofs.map((item, i) => {
                    const isLang = typeof item === 'object';
                    const text = isLang ? item.label : item;
                    const isActive = isLang && language === item.code;
                    return (
                      <li 
                        key={i} 
                        className={`flex items-start gap-2 text-xs leading-snug ${isLang ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''} ${isActive ? 'font-semibold text-blue-700' : 'text-slate-600'}`}
                        onClick={isLang ? (e) => { e.stopPropagation(); changeLanguage(item.code); } : undefined}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                        {text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          LIVE STATISTICS
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Impact So Far</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Live Statistics · प्रणाली आँकड़े
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time platform metrics from the National SUVIDHA Registry.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Requests Resolved" value={241389} suffix="+" icon={CheckCircle2} color="bg-green-50 text-green-600" />
          <StatCard label="Active Officers" value={847} icon={UserCheck} color="bg-blue-50 text-[#2563EB]" />
          <StatCard label="Departments Served" value={5} icon={Building2} color="bg-purple-50 text-purple-600" />
          <StatCard label="Citizen Satisfaction" value={96} suffix="%" icon={Star} color="bg-amber-50 text-amber-600" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          PORTAL ACCESS CARDS
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.35s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Multi-Role Access</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Official Portal Access · आधिकारिक पोर्टल
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Three distinct portals — Citizen ↔ Officer ↔ Admin — forming the SUVIDHA Multiverse.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Citizen Portal */}
          <div className="gov-card p-6 flex flex-col gap-5 border-t-4 border-t-green-500">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Citizen Portal</h4>
                  <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold uppercase tracking-wide">नागरिक</span>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />Login via mobile OTP</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />Apply for utility connections</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />Upload & manage documents</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />Track requests in real time</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />Download digital receipts</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/auth?role=citizen')}
              className="w-full py-2.5 border-2 border-green-500 text-green-700 hover:bg-green-600 hover:text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Citizen Sign-In
            </button>
          </div>

          {/* Officer Portal */}
          <div className="gov-card p-6 flex flex-col gap-5 border-t-4 border-t-[#2563EB]">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Officer Desk</h4>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold uppercase tracking-wide">अधिकारी</span>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />Department request management</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />Approve / reject / assign requests</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />Assign field staff crews</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />Update complaint status</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />SLA monitoring & alerts</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/auth?role=officer')}
              className="w-full py-2.5 border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Officer Sign-In
            </button>
          </div>

          {/* Admin Portal */}
          <div className="gov-card p-6 flex flex-col gap-5 border-t-4 border-t-purple-500">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Admin Console</h4>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold uppercase tracking-wide">प्रशासक</span>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />Analytics & system monitoring</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />Create & manage officers</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />Service configuration</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />SLA violation alerts</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />Real-time WebSocket telemetry</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/auth?role=admin')}
              className="w-full py-2.5 border-2 border-purple-500 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Sign-In
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          QUALCOMM / HACKATHON SECTION
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="rounded-xl p-7 text-white overflow-hidden relative" style={{ background: 'linear-gradient(to right, #1E3A8A, #1D4ED8)', border: 'none' }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold mb-4" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#BFDBFE' }}>
                <Star className="w-3 h-3" />
                Qualcomm Snapdragon Multiverse Hackathon 2026
              </div>
              <h3 className="text-xl font-black mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#FFFFFF' }}>
                The SUVIDHA Multiverse Architecture
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Built for the Snapdragon Multiverse Hackathon — SUVIDHA implements a multi-role, real-time, AI-assisted civic helpdesk system. Edge AI on Snapdragon devices powers offline voice assistance and on-device document OCR.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {archModules.map((u, i) => (
                <div 
                  key={u.label} 
                  className={`rounded-xl p-3.5 text-sm cursor-pointer hover:bg-white/10 transition-colors arch-popup-trigger relative overflow-visible ${i === 4 ? 'col-span-2' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                  onClick={() => setActiveArchPopup(activeArchPopup === u.label ? null : u.label)}
                >
                  <div className="flex items-center gap-2 mb-1" style={{ color: '#BFDBFE' }}>
                    {u.icon}
                    <span className="font-bold text-xs" style={{ color: '#FFFFFF' }}>{u.label}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#93C5FD' }}>{u.sub}</span>

                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      activeArchPopup === u.label 
                        ? 'max-h-[800px] opacity-100 border-t border-white/20 mt-3 pt-3' 
                        : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'
                    }`}
                  >
                    <div className="space-y-3">
                      {u.sections.map(sec => (
                        <div key={sec.title}>
                          <div className="text-white font-semibold text-[10px] mb-1">{sec.title}</div>
                          <ul className="space-y-1">
                            {sec.items.map((item, idx) => (
                              <li key={idx} className="text-white/80 text-xs flex items-start gap-1.5 leading-snug">
                                <span className="text-white/40 mt-0.5">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="text-white/60 italic text-xs mt-2 border-t border-white/10 pt-2">
                        {u.purpose}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════ */}
      <section className="mb-12 animate-fade-up" style={{ animationDelay: '0.45s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Common Questions</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Frequently Asked Questions
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTACT / HELPDESK
      ══════════════════════════════════════ */}
      <section className="mb-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
        <div className="mb-6">
          <p className="section-label text-[#2563EB] mb-1">Get Help</p>
          <h2 className="text-2xl font-black text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Contact & Helpdesk · संपर्क एवं सहायता
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Phone className="w-5 h-5 text-[#2563EB]" />,
              bg: 'bg-blue-50 border-blue-100',
              title: 'National Helpline',
              body: (
                <><strong className="text-gray-900 text-sm">1912 / 1800-11-0011</strong><br />Available 24×7 in 12 regional languages.</>
              ),
              href: 'tel:1912'
            },
            {
              icon: <Building2 className="w-5 h-5 text-green-600" />,
              bg: 'bg-green-50 border-green-100',
              title: 'Central Secretariat',
              body: 'SUVIDHA Bhavan, CGO Complex, Lodhi Road, New Delhi – 110003',
              href: 'https://maps.google.com/?q=CGO+Complex+Lodhi+Road+New+Delhi',
              target: '_blank'
            },
            {
              icon: <CheckCircle2 className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-50 border-purple-100',
              title: 'Online Support',
              body: (
                <><strong className="text-gray-900">grievance-suvidha@nic.in</strong><br />Response guaranteed within 4 business hours.</>
              ),
              href: 'mailto:grievance-suvidha@nic.in'
            }
          ].map(c => (
            <a 
              key={c.title} 
              href={c.href}
              target={c.target || '_self'}
              rel={c.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="gov-card p-5 space-y-3 block cursor-pointer hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl ${c.bg} border flex items-center justify-center`}>{c.icon}</div>
              <h4 className="font-bold text-gray-900 text-sm">{c.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{c.body}</p>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
