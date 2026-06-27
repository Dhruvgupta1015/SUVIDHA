import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ShieldCheck, Smartphone, Mail, Lock, User as UserIcon,
  KeyRound, AlertTriangle, CheckCircle2, ArrowRight, Eye, EyeOff,
  Building2, Shield
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
  const [showPassword, setShowPassword] = useState(false);
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
      if (response.data?.demoOtp) { setDemoOtp(response.data.demoOtp); speak(`Your OTP is ${response.data.demoOtp}`); }
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
      setTimeout(() => navigate('/citizen'), 1400);
    } catch (err) {
      setLoading(false); setErrorMsg(err.response?.data?.message || 'OTP verification failed. Please retry.');
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Please enter email and password'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const response = await authAPI.staffLogin({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
      setLoading(false); setSuccess(true);
      setTimeout(() => navigate(user.role === 'admin' ? '/admin' : '/officer'), 1400);
    } catch (err) {
      setLoading(false); setErrorMsg(err.response?.data?.message || 'Invalid credentials. Please check email and password.');
    }
  };

  const handleQuickPrefill = (type) => {
    setErrorMsg('');
    if (type === 'admin') { setLoginType('staff'); setEmail('admin@suvidha.gov.in'); setPassword('admin123'); }
    else if (type === 'elec_officer') { setLoginType('staff'); setEmail('officer.elec@suvidha.gov.in'); setPassword('officer123'); }
    else if (type === 'water_officer') { setLoginType('staff'); setEmail('officer.water@suvidha.gov.in'); setPassword('officer123'); }
    else if (type === 'citizen_user') { setLoginType('citizen'); setMobile('9876543210'); setOtpSent(false); setOtpVal(''); }
  };

  const inputCls = "gov-input";

  const quickCredentials = [
    { label: 'Citizen User', sub: 'Mobile: 9876543210', key: 'citizen_user', icon: <UserIcon className="w-3.5 h-3.5 text-green-600" />, color: 'text-green-700' },
    { label: 'Electricity Officer', sub: 'officer.elec@…', key: 'elec_officer', icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />, color: 'text-blue-700' },
    { label: 'Water Officer', sub: 'officer.water@…', key: 'water_officer', icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />, color: 'text-blue-700' },
    { label: 'Super Admin', sub: 'admin@suvidha…', key: 'admin', icon: <Shield className="w-3.5 h-3.5 text-purple-600" />, color: 'text-purple-700' },
  ];

  return (
    <div className="flex items-start justify-center w-full py-6 px-4 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start w-full max-w-4xl">

        {/* ── Left: Login Form ── */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 animate-fade-up">

          {/* Header */}
          <div className="flex items-center gap-4 mb-7 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#1D4ED8]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Secure Portal Sign-In
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Access citizen services, officer desk, or admin console
              </p>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-4 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-black text-xl text-green-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Sign-In Successful!
                </h3>
                <p className="text-sm text-gray-500 mt-1">Loading your secure dashboard…</p>
              </div>
              <div className="flex gap-1 mt-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce-slow" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Tab switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  onClick={() => { setLoginType('citizen'); setErrorMsg(''); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                    loginType === 'citizen'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Citizen Login
                </button>
                <button
                  onClick={() => { setLoginType('staff'); setErrorMsg(''); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                    loginType === 'staff'
                      ? 'bg-[#1D4ED8] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Official Login
                </button>
              </div>

              {/* ── Citizen OTP Flow ── */}
              {loginType === 'citizen' ? (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="section-label block mb-2">Mobile Number</label>
                        <div className="flex rounded-xl border-2 border-gray-200 bg-gray-50 focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_3px_rgba(29,78,216,0.12)] overflow-hidden transition-all">
                          <span className="px-3.5 py-3 text-sm font-bold text-gray-500 border-r border-gray-200 flex items-center bg-gray-100">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 bg-transparent px-3.5 py-3 text-sm text-gray-900 font-medium outline-none"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">A 6-digit OTP will be sent to this number</p>
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                        {loading ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP…</span>
                        ) : (
                          <span className="flex items-center gap-2">Generate OTP <ArrowRight className="w-4 h-4" /></span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      {demoOtp && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>Demo OTP: <code className="font-mono font-black underline text-base">{demoOtp}</code> — use this to login</span>
                        </div>
                      )}

                      <div>
                        <label className="section-label block mb-2">OTP Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={otpVal}
                          onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                          className="gov-input text-center tracking-[0.5em] font-mono text-2xl font-bold"
                          required
                        />
                      </div>

                      {/* Optional registration details */}
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                        <span className="section-label text-blue-700 block">First time? Add your details (optional)</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Amit Kumar"
                              value={citizenName}
                              onChange={(e) => setCitizenName(e.target.value)}
                              className="gov-input text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Aadhaar (12-digit)</label>
                            <input
                              type="text"
                              maxLength={12}
                              placeholder="XXXXXXXXXXXX"
                              value={aadhaar}
                              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                              className="gov-input text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="btn-ghost flex-1 py-3"
                        >
                          ← Edit Number
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary flex-1 py-3 bg-green-600 hover:bg-green-700"
                          style={{ background: loading ? undefined : '#16A34A' }}
                        >
                          {loading ? (
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</span>
                          ) : (
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Verify & Login</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* ── Staff Email/Password Flow ── */
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="section-label block mb-2">Official Email ID</label>
                    <div className="flex rounded-xl border-2 border-gray-200 bg-gray-50 focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_3px_rgba(29,78,216,0.12)] overflow-hidden transition-all">
                      <span className="px-3.5 py-3 text-gray-400 flex items-center border-r border-gray-200 bg-gray-100">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="officer.dept@suvidha.gov.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-transparent px-3.5 py-3 text-sm text-gray-900 font-medium outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="section-label block mb-2">Password</label>
                    <div className="flex rounded-xl border-2 border-gray-200 bg-gray-50 focus-within:border-[#1D4ED8] focus-within:shadow-[0_0_0_3px_rgba(29,78,216,0.12)] overflow-hidden transition-all">
                      <span className="px-3.5 py-3 text-gray-400 flex items-center border-r border-gray-200 bg-gray-100">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 bg-transparent px-3.5 py-3 text-sm text-gray-900 font-mono font-medium outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="px-3 text-gray-400 hover:text-gray-700 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in…</span>
                    ) : (
                      <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Sign In as Staff <ArrowRight className="w-4 h-4" /></span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Developer Credentials Panel ── */}
        <div className="lg:col-span-2 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-[#1D4ED8]" />
              <h4 className="font-black text-sm text-gray-900 uppercase tracking-wider">Demo Credentials</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Click any role below to auto-fill credentials and test the multi-role workflow.
            </p>

            <div className="space-y-2">
              {quickCredentials.map(cred => (
                <button
                  key={cred.key}
                  onClick={() => handleQuickPrefill(cred.key)}
                  className="w-full px-3.5 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-[#1D4ED8] rounded-xl text-left text-xs font-semibold text-gray-700 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {cred.icon}
                    <span className="font-bold">{cred.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${cred.color}`}>{cred.sub}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-[#1D4ED8] transition" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Default passwords:</strong><br />
              Staff / Officer → <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-blue-700 font-mono">officer123</code>&nbsp;|&nbsp;
              Admin → <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-blue-700 font-mono">admin123</code>
            </div>
          </div>

          {/* Security notice */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Security Notice</span>
            </div>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />256-bit SSL encrypted connection</li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />Session expires after 30 min inactivity</li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />OTP valid for 5 minutes only</li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />Government ID required for Aadhaar-linked services</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;