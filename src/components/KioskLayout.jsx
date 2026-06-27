import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { LanguageSelector } from './LanguageSelector';
import { AccessibilityPanel } from './AccessibilityPanel';
import {
  Home,
  ArrowLeft,
  Wifi,
  Clock,
  Shield,
  PhoneCall,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronRight,
  Bell,
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

/* ─── Session timeout: 30 min inactivity ─── */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const KioskLayout = ({ children }) => {
  const { t, language } = useLanguage();
  const { highContrast, voiceNav } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const sessionTimer = useRef(null);
  const warningTimer = useRef(null);
  const notifRef = useRef(null);

  /* ─── Clock ─── */
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ─── Read user from localStorage on route change ─── */
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    setCurrentUser(userStr ? JSON.parse(userStr) : null);
  }, [location.pathname]);

  /* ─── Session timeout logic ─── */
  const resetSessionTimer = () => {
    clearTimeout(sessionTimer.current);
    clearTimeout(warningTimer.current);
    setSessionWarning(false);
    if (localStorage.getItem('token')) {
      // Warn 2 minutes before timeout
      warningTimer.current = setTimeout(() => setSessionWarning(true), SESSION_TIMEOUT_MS - 2 * 60 * 1000);
      sessionTimer.current = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetSessionTimer));
    resetSessionTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetSessionTimer));
      clearTimeout(sessionTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [location.pathname]);

  /* ─── Close notifications on outside click ─── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearTimeout(sessionTimer.current);
    clearTimeout(warningTimer.current);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setSessionWarning(false);
    navigate('/');
  };

  const isHome = location.pathname === '/';

  /* ─── Role-aware navigation ─── */
  const getNavLinks = () => {
    const base = [{ to: '/', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> }];
    if (!currentUser) {
      return [...base, { to: '/track', label: 'Track Request' }];
    }
    if (currentUser.role === 'citizen') {
      return [...base, { to: '/citizen', label: 'My Dashboard' }, { to: '/track', label: 'Track Request' }];
    }
    if (currentUser.role === 'officer') {
      return [...base, { to: '/officer', label: 'Officer Desk' }, { to: '/track', label: 'Track Request' }];
    }
    if (currentUser.role === 'admin') {
      return [...base, { to: '/admin', label: 'Admin Console' }, { to: '/officer', label: 'Officer Portal' }, { to: '/track', label: 'Track Request' }];
    }
    return base;
  };

  const navLinks = getNavLinks();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  /* ─── Role display ─── */
  const getRoleLabel = (user) => {
    if (!user) return '';
    if (user.role === 'admin') return 'Super Administrator';
    if (user.role === 'officer') return `${user.department || 'Dept'} Officer`;
    return 'Verified Citizen';
  };

  const getRoleColor = (user) => {
    if (!user) return '';
    if (user.role === 'admin') return 'text-[#1D4ED8] bg-blue-50 border-blue-200';
    if (user.role === 'officer') return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  /* ─── Mock notifications based on role ─── */
  const getNotifications = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'citizen') return [
      { id: 1, text: 'Your request REQ-2026-982739 is In-Progress', time: '2 hrs ago', type: 'info', read: false },
      { id: 2, text: 'Document verification completed', time: '1 day ago', type: 'success', read: true },
    ];
    if (currentUser.role === 'officer') return [
      { id: 1, text: '3 new requests assigned to your department', time: '30 min ago', type: 'warn', read: false },
      { id: 2, text: 'SLA deadline approaching: REQ-2026-784019', time: '1 hr ago', type: 'error', read: false },
    ];
    if (currentUser.role === 'admin') return [
      { id: 1, text: 'System health: All services online', time: '5 min ago', type: 'success', read: false },
      { id: 2, text: '2 SLA violations detected this week', time: '1 hr ago', type: 'warn', read: false },
      { id: 3, text: 'New officer account created', time: '3 hrs ago', type: 'info', read: true },
    ];
    return [];
  };

  const notifications = getNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const notifIconColor = { info: 'text-blue-600', success: 'text-green-600', warn: 'text-amber-600', error: 'text-red-600' };
  const NotifIcon = { info: AlertCircle, success: CheckCircle2, warn: AlertCircle, error: AlertCircle };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-gray-900">

      {/* ══ 1. National Government Banner ══ */}
      <div className="bg-[#1E3A8A] text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-semibold">
            <span className="font-black tracking-widest uppercase text-blue-100">Government of India</span>
            <span className="opacity-30">|</span>
            <span className="font-bold text-blue-200">भारत सरकार</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-blue-300 text-[10px] font-semibold">
            <span>Digital India Initiative</span>
            <span className="opacity-30">|</span>
            <span>NIC Compliant</span>
            <span className="opacity-30">|</span>
            <span>ISO 27001 Certified</span>
          </div>
        </div>
      </div>

      {/* ══ 2. Main Portal Header ══ */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <RouterLink to="/" className="flex items-center gap-3 select-none group flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1D4ED8] text-white flex-shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-[#1D4ED8]" style={{ fontFamily: 'Outfit, sans-serif' }}>SUVIDHA</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 font-mono">CIVIC</span>
              </div>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Unified Civic Services Portal · एकीकृत नागरिक सेवा
              </p>
            </div>
          </RouterLink>

          {/* Status chips — desktop only */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-gray-600 flex-1 justify-center">
            <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              Server Online
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <Wifi className="w-3 h-3 text-[#1D4ED8]" />
              National Gateway
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 font-mono">
              <Clock className="w-3 h-3 text-[#1D4ED8]" />
              {time}
            </span>
          </div>

          {/* Right tools */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <AccessibilityPanel />

            {/* Notification Bell — only when logged in */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(prev => !prev)}
                  className="relative p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1D4ED8] transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 animate-fade-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {notifications.map(n => {
                        const Icon = NotifIcon[n.type] || AlertCircle;
                        return (
                          <div key={n.id} className={`flex gap-3 px-4 py-3 text-sm ${!n.read ? 'bg-blue-50/40' : ''}`}>
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${notifIconColor[n.type]}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-xs font-medium leading-relaxed">{n.text}</p>
                              <p className="text-gray-400 text-[10px] mt-0.5">{n.time}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ══ 3. Primary Navigation ══ */}
      <nav className="bg-white border-b border-gray-200 px-4 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Desktop nav links */}
          <div className="hidden lg:flex gap-0.5">
            {navLinks.map(link => (
              <RouterLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  isActive(link.to)
                    ? 'border-[#1D4ED8] text-[#1D4ED8] font-bold'
                    : 'border-transparent text-gray-600 hover:text-[#1D4ED8] hover:bg-blue-50/50'
                }`}
              >
                {link.icon}
                {link.label}
              </RouterLink>
            ))}
          </div>

          {/* Mobile breadcrumb */}
          <div className="lg:hidden py-2.5 text-gray-600 text-xs font-semibold">
            {location.pathname === '/' ? 'Home' :
              location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
          </div>

          {/* User badge or sign-in CTA */}
          <div className="py-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-800">{currentUser.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleColor(currentUser)}`}>
                    {getRoleLabel(currentUser)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <RouterLink
                to="/auth"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-black transition shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Portal Sign-In</span>
              </RouterLink>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-3 border-t border-gray-100 flex flex-col gap-1 mt-1 animate-fade-in">
            {navLinks.map(link => (
              <RouterLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive(link.to) ? 'bg-blue-50 text-[#1D4ED8]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.icon}
                {link.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              </RouterLink>
            ))}
            {currentUser && (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition mt-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ══ 4. Main Content ══ */}
      <main className="flex-1 w-full bg-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col">

          {/* Back button */}
          {!isHome && (
            <div className="mb-5">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* Voice nav banner */}
          {voiceNav && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 border bg-blue-50 border-blue-200 text-[#1D4ED8]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold">Voice Accessibility Guide Activated</span>
            </div>
          )}

          {/* Session warning modal */}
          {sessionWarning && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-105 animate-fade-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600 animate-bounce-slow" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Inactivity Warning</h4>
                    <p className="text-[10px] text-gray-400">Session Security Control</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 leading-relaxed mb-6 space-y-2">
                  <p>For your security, you are about to be automatically logged out due to inactivity.</p>
                  <p className="font-bold text-gray-900 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    Your session will expire in less than 2 minutes.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={resetSessionTimer}
                    className="btn-primary flex-1 py-2.5 text-xs font-bold"
                  >
                    Keep Session Active
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost flex-1 py-2.5 text-xs font-bold text-red-650 border-red-200 hover:bg-red-50"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col page-enter">
            {children}
          </div>
        </div>
      </main>

      {/* ══ 5. Official Footer ══ */}
      <footer className="bg-white border-t border-gray-200 text-gray-600">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">

          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-gray-900 uppercase tracking-wider text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>SUVIDHA National Registry</span>
            </div>
            <p className="leading-relaxed text-gray-500 max-w-sm">
              An official Single Window Grievance Redressal and Citizen Service Delivery system, facilitating fast and transparent utility connections with SLA guarantees across India.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                ISO 27001 Certified
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">NIC Compliant</span>
              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full">WCAG 2.1 AA</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">Quick Access</span>
            <ul className="space-y-2.5 text-gray-500">
              <li><RouterLink to="/citizen" className="hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />Citizen Services</RouterLink></li>
              <li><RouterLink to="/track" className="hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />Track Application</RouterLink></li>
              <li><a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />National Portal of India</a></li>
              <li><a href="https://darpg.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />DARPG — Admin Reforms</a></li>
              <li><a href="https://digilocker.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5"><ChevronRight className="w-3 h-3" />DigiLocker</a></li>
            </ul>
          </div>

          {/* Helpdesk */}
          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">Helpdesk Support</span>
            <ul className="space-y-2.5 text-gray-500">
              <li className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#1D4ED8] flex-shrink-0" />
                <span>Toll Free: <strong className="text-gray-700">1912</strong> / 1800-11-0011</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1D4ED8] flex-shrink-0" />
                <span>24×7 in 12 languages</span>
              </li>
              <li className="text-gray-500">grievance-suvidha@nic.in</li>
              <li className="text-gray-500">NIC HQ, CGO Complex,<br />Lodhi Road, New Delhi – 110003</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 py-3 text-center text-[10px] font-semibold bg-gray-50 text-gray-400">
          © 2026 National Informatics Centre (NIC) · Department of Administrative Reforms & Public Grievances (DARPG). All Rights Reserved. &nbsp;|&nbsp; v2.0-CIVIC
        </div>
      </footer>

    </div>
  );
};

export default KioskLayout;
