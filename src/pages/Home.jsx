import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ArrowRight, Users, ShieldCheck, Building, Search, Phone, FileCheck,
  Activity, Clock, MapPin, CheckCircle2, Zap, Droplet, Flame, Trash2, FileText, AlertCircle
} from 'lucide-react';
import { requestAPI } from '../utils/api';

export const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { speakElement, speak } = useAccessibility();

  const [searchId, setSearchId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearching(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const response = await requestAPI.getById(searchId.trim());
      setSearching(false);
      if (response.data && response.data.request) {
        setTrackResult(response.data.request);
      } else {
        setTrackError('Ticket ID not found. Use format: REQ-2026-XXXXXX');
      }
    } catch {
      setSearching(false);
      setTrackError('Ticket ID not found. Use format: REQ-2026-XXXXXX');
    }
  };

  const services = [
    { id: 'electricity', title: 'Electricity Connection', hi: 'बिजली कनेक्शन', sla: '48 Hrs', icon: <Zap className="w-5 h-5 text-[#EA580C]" />, desc: 'Apply for residential/commercial new meters or report power failures.' },
    { id: 'water', title: 'Water Connection', hi: 'पानी कनेक्शन', sla: '24 Hrs', icon: <Droplet className="w-5 h-5 text-[#EA580C]" />, desc: 'Register pipe leaks or apply for municipal water supply lines.' },
    { id: 'gas', title: 'PNG Gas Connection', hi: 'पीएनजी गैस', sla: '48 Hrs', icon: <Flame className="w-5 h-5 text-[#EA580C]" />, desc: 'Inspect PNG gas lines, repair meters, or register pressure issues.' },
    { id: 'waste', title: 'Waste Management', hi: 'कचरा प्रबंधन', sla: '24 Hrs', icon: <Trash2 className="w-5 h-5 text-[#EA580C]" />, desc: 'Report missed trash bins, debris pileups, or sewage clogs.' },
    { id: 'general', title: 'General Complaints', hi: 'सामान्य शिकायतें', sla: '72 Hrs', icon: <FileText className="w-5 h-5 text-[#EA580C]" />, desc: 'Submit streetlight failures, potholes, or stray animal reports.' },
  ];

  const steps = [
    { n: '01', title: 'Sign In Securely', desc: 'Login via mobile OTP. Documents upload directly to verification registry.' },
    { n: '02', title: 'Submit Application', desc: 'Select category, describe issue, set priority, and attach documents.' },
    { n: '03', title: 'Officer Verification', desc: 'Officers verify, assign field crews, and add official dispatch logs.' },
    { n: '04', title: 'SLA Resolution', desc: 'Get closure notification and download digital verification receipts.' },
  ];

  const statusColors = {
    Completed: 'bg-green-100 text-green-700',
    'In-Progress': 'bg-orange-100 text-orange-700',
    Rejected: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="flex flex-col gap-12 pb-8">

      {/* ── Hero ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 md:p-14 shadow-sm text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#EA580C] border border-orange-200 mb-6">
          <FileCheck className="w-3 h-3" />
          Official Grievance & Service Delivery Portal
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4 leading-tight" onMouseEnter={speakElement}>
          Government Citizen Services<br />& Grievance Registry
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8">
          Apply for municipal utility connections, upload documents to the verification registry, and track your application under time-bound SLA regulations.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/auth?role=citizen')}
            className="flex items-center gap-2 px-6 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm rounded-lg shadow transition"
          >
            Citizen Portal Sign-In / नागरिक लॉग-इन
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/auth?role=officer')}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#EA580C] text-[#EA580C] font-bold text-sm rounded-lg hover:bg-orange-50 transition"
          >
            Officer Portal
          </button>
        </div>
      </section>

      {/* ── Track Grievance ── */}
      <section className="max-w-2xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#EA580C]" />
            Track Grievance Status • शिकायत की स्थिति जांचें
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Request ID (e.g. REQ-2026-982739)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]"
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-sm font-bold transition disabled:opacity-60"
            >
              {searching ? 'Searching...' : 'Track'}
            </button>
          </form>

          {trackResult && (
            <div className="mt-4 p-4 rounded-lg border border-orange-100 bg-orange-50 text-sm space-y-2">
              <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                <span className="font-bold text-gray-900">Ticket: {trackResult.requestId}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${statusColors[trackResult.status] || 'bg-gray-100 text-gray-600'}`}>
                  {trackResult.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-medium">
                <div>Citizen: <span className="text-gray-900 font-bold">{trackResult.citizenId?.name || 'Aadhaar User'}</span></div>
                <div>Service: <span className="text-gray-900 font-bold capitalize">{trackResult.serviceType}</span></div>
                <div>Department: <span className="text-gray-900 font-bold">{trackResult.assignedDepartment}</span></div>
                <div>Team: <span className="text-gray-900 font-bold">{trackResult.assignedTeam || 'Unassigned'}</span></div>
              </div>
              {trackResult.remarks && (
                <div className="text-xs text-gray-600 pt-2 border-t border-orange-100">
                  Remarks: <span className="italic font-bold text-gray-800">"{trackResult.remarks}"</span>
                </div>
              )}
            </div>
          )}

          {trackError && (
            <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {trackError}
            </div>
          )}
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2">
            Citizen Utility Service Counters • नागरिक सेवा पटल
          </h2>
          <p className="text-xs text-gray-500 mt-1">Click any service to register a new connection request or lodge a grievance.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#EA580C] hover:shadow-md transition flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  {svc.icon}
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  SLA: {svc.sla}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{svc.title}</h4>
                <span className="text-[10px] text-gray-400 font-semibold">{svc.hi}</span>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{svc.desc}</p>
              </div>
              <Link
                to="/auth?role=citizen"
                className="w-full text-center py-2 bg-orange-50 hover:bg-[#EA580C] hover:text-white text-[#EA580C] border border-orange-200 hover:border-[#EA580C] rounded-lg text-xs font-bold transition"
              >
                Apply Service
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section>
        <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2 mb-5">
          How It Works • यह कैसे कार्य करता है
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(step => (
            <div key={step.n} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-black text-xs mb-3">
                {step.n}
              </div>
              <h5 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h5>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, title: '100% Secure', sub: 'Aadhaar Verified' },
          { icon: <Clock className="w-6 h-6 text-[#EA580C]" />, title: 'Time Bound', sub: 'SLA Mandate' },
          { icon: <Activity className="w-6 h-6 text-[#EA580C]" />, title: 'Real-Time', sub: 'WebSocket Track' },
          { icon: <Phone className="w-6 h-6 text-[#EA580C]" />, title: '1912 Toll Free', sub: '24/7 Redressal' },
        ].map(b => (
          <div key={b.title} className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="flex justify-center mb-2">{b.icon}</div>
            <div className="font-black text-gray-900 text-base">{b.title}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">{b.sub}</div>
          </div>
        ))}
      </section>

      {/* ── Staff Gateways ── */}
      <section>
        <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2 mb-5">
          Official Staff Gateways • आधिकारिक पोर्टल पहुंच
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 text-[#EA580C]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Department Officer Desk</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Login to check assigned civic utility files, verify documents, add remarks, and assign maintenance crews.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth?role=officer')}
              className="w-full py-2.5 border-2 border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C] hover:text-white rounded-lg text-sm font-bold transition"
            >
              Sign-In as Officer
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Super Administrator Console</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Manage analytics, create officers, configure services, and audit system WebSocket logs.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth?role=admin')}
              className="w-full py-2.5 border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition"
            >
              Sign-In as Admin
            </button>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section>
        <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2 mb-5">
          Contact & Helpdesk • संपर्क एवं सहायता
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Phone className="w-5 h-5 text-[#EA580C]" />,
              bg: 'bg-orange-50',
              title: 'National Helpline',
              body: <><b className="text-gray-900">1912 / 1800-11-0011</b><br />Available 24×7 in 12 regional languages.</>
            },
            {
              icon: <Building className="w-5 h-5 text-green-600" />,
              bg: 'bg-green-50',
              title: 'Central Secretariat',
              body: 'SUVIDHA Bhavan, CGO Complex, Lodhi Road, New Delhi – 110003'
            },
            {
              icon: <CheckCircle2 className="w-5 h-5 text-purple-600" />,
              bg: 'bg-purple-50',
              title: 'Online Support',
              body: <><b className="text-gray-900">support@suvidha.gov.in</b><br />Response guaranteed within 4 business hours.</>
            }
          ].map(c => (
            <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>{c.icon}</div>
              <h4 className="font-bold text-gray-900 text-sm">{c.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
