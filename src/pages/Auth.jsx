import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ShieldCheck, Smartphone, Mail, Lock, User as UserIcon,
  KeyRound, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { authAPI } from '../utils/api';

export const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'citizen';

  const { t } = useLanguage();
  const { speak } = useAccessibility();

  const [loginType, setLoginType] = useState(roleParam === 'citizen' ? 'citizen' : 'staff');
  const [mobile, setMobile] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [citizenName, setCitizenName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (roleParam === 'citizen') {
      setLoginType('citizen');
    } else {
      setLoginType('staff');
      setEmail(roleParam === 'admin' ? 'admin@suvidha.gov.in' : 'officer.elec@suvidha.gov.in');
      setPassword(roleParam === 'admin' ? 'admin123' : 'officer123');
    }
    setErrorMsg('');
  }, [roleParam]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) { setErrorMsg('Please enter a valid 10-digit mobile number'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const response = await authAPI.requestOtp(mobile);
      setLoading(false); setOtpSent(true);
      if (response.data?.demoOtp) { setDemoOtp(response.data.demoOtp); speak(`OTP: ${response.data.demoOtp}`); }
    } catch {
      setLoading(false); setOtpSent(true); setDemoOtp('123456');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpVal)) { setErrorMsg('Please enter a 6-digit OTP'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const response = await authAPI.verifyOtp({ mobile, otp: otpVal, name: citizenName || undefined, aadhaar: aadhaar || undefined });
      const { token, user } = response.data;
      localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
      setLoading(false); setSuccess(true);
      setTimeout(() => navigate('/citizen'), 1200);
    } catch (err) {
      setLoading(false); setErrorMsg(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Enter email and password'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const response = await authAPI.staffLogin({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
      setLoading(false); setSuccess(true);
      setTimeout(() => navigate(user.role === 'admin' ? '/admin' : '/officer'), 1200);
    } catch (err) {
      setLoading(false); setErrorMsg(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleQuickPrefill = (type) => {
    setErrorMsg('');
    if (type === 'admin') { setLoginType('staff'); setEmail('admin@suvidha.gov.in'); setPassword('admin123'); }
    else if (type === 'elec_officer') { setLoginType('staff'); setEmail('officer.elec@suvidha.gov.in'); setPassword('officer123'); }
    else if (type === 'water_officer') { setLoginType('staff'); setEmail('officer.water@suvidha.gov.in'); setPassword('officer123'); }
    else if (type === 'citizen_user') { setLoginType('citizen'); setMobile('9876543210'); setOtpSent(false); setOtpVal(''); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] placeholder-gray-400";

  return (
    <div className="flex items-center justify-center max-w-4xl mx-auto w-full py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start w-full">

        {/* ── Left: Login Form ── */}
        <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Portal Sign-In</h2>
              <p className="text-xs text-gray-500">Access secure citizen services and dashboards</p>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-green-700">Sign-In Successful</h3>
              <p className="text-xs text-gray-500">Loading your secure session…</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tab switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  onClick={() => { setLoginType('citizen'); setErrorMsg(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${loginType === 'citizen' ? 'bg-[#EA580C] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Smartphone className="w-4 h-4" /> Citizen
                </button>
                <button
                  onClick={() => { setLoginType('staff'); setErrorMsg(''); }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${loginType === 'staff' ? 'bg-[#EA580C] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <UserIcon className="w-4 h-4" /> Official Login
                </button>
              </div>

              {loginType === 'citizen' ? (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mobile Number</label>
                        <div className="flex rounded-lg border border-gray-300 bg-gray-50 focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] overflow-hidden">
                          <span className="px-3 py-2.5 text-xs font-bold text-gray-500 border-r border-gray-300 flex items-center">+91</span>
                          <input type="tel" maxLength={10} placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 font-medium outline-none" required />
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-sm font-bold transition disabled:opacity-60">
                        {loading ? 'Sending OTP…' : 'Generate OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      {demoOtp && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-bold">
                          Demo OTP: <span className="font-mono underline">{demoOtp}</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">OTP Code</label>
                        <input type="text" maxLength={6} placeholder="6-digit OTP" value={otpVal} onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                          className={`${inputClass} text-center tracking-widest font-mono`} required />
                      </div>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">First-time? Add details (optional)</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Full Name</label>
                            <input type="text" placeholder="Amit Kumar" value={citizenName} onChange={(e) => setCitizenName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs font-medium text-gray-900 focus:outline-none focus:border-[#EA580C]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Aadhaar (12-digit)</label>
                            <input type="text" maxLength={12} placeholder="982138294819" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs font-medium text-gray-900 focus:outline-none focus:border-[#EA580C]" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setOtpSent(false)}
                          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                          Edit Number
                        </button>
                        <button type="submit" disabled={loading}
                          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-60">
                          {loading ? 'Verifying…' : 'Verify & Log In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Official Email</label>
                    <div className="flex rounded-lg border border-gray-300 bg-gray-50 focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] overflow-hidden">
                      <span className="px-3 py-2.5 text-gray-400 flex items-center border-r border-gray-200"><Mail className="w-4 h-4" /></span>
                      <input type="email" placeholder="officer.dept@suvidha.gov.in" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 font-medium outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="flex rounded-lg border border-gray-300 bg-gray-50 focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] overflow-hidden">
                      <span className="px-3 py-2.5 text-gray-400 flex items-center border-r border-gray-200"><Lock className="w-4 h-4" /></span>
                      <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 font-mono font-medium outline-none" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-sm font-bold transition disabled:opacity-60">
                    {loading ? 'Logging in…' : 'Sign In as Staff'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Demo Credentials ── */}
        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <KeyRound className="w-4 h-4 text-[#EA580C]" />
              Developer Credentials
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">Pre-fill mock government credentials to test role workflows.</p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Citizen (OTP)', sub: '9876543210', key: 'citizen_user' },
              { label: 'Electricity Officer', sub: 'officer.elec@…', key: 'elec_officer' },
              { label: 'Water Officer', sub: 'officer.water@…', key: 'water_officer' },
              { label: 'Super Admin', sub: 'admin@suvidha…', key: 'admin' },
            ].map(cred => (
              <button
                key={cred.key}
                onClick={() => handleQuickPrefill(cred.key)}
                className="w-full px-3 py-2.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-[#EA580C] rounded-lg text-left text-xs font-bold text-gray-700 transition flex justify-between items-center"
              >
                <span>{cred.label}</span>
                <span className="text-[10px] text-[#EA580C] font-semibold">{cred.sub}</span>
              </button>
            ))}
          </div>

          <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-[10px] text-gray-600 leading-relaxed font-medium">
            <b className="text-gray-900">Default passwords:</b> Staff → <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[#EA580C] font-mono">officer123</code> &nbsp;|&nbsp; Admin → <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-[#EA580C] font-mono">admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;