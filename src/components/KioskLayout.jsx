import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from './LanguageSelector';
import { AccessibilityPanel } from './AccessibilityPanel';
import { 
  Home, 
  ArrowLeft, 
  Wifi, 
  Clock, 
  MapPin,
  Shield, 
  PhoneCall, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export const KioskLayout = ({ children }) => {
  const { t, language } = useLanguage();
  const { highContrast, voiceNav, speakElement } = useAccessibility();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/');
  };

  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { to: '/citizen', label: 'Citizen Dashboard' },
    { to: '/officer', label: 'Officer Portal' },
    { to: '/admin', label: 'Admin Console' },
    { to: '/track', label: 'Track Request' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">

      {/* 1. National Banner Strip */}
      <div className="bg-[#EA580C] text-white text-[11px] py-1.5 px-4 border-b border-orange-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-semibold">
            <span className="font-extrabold tracking-widest uppercase">Government of India</span>
            <span className="opacity-40">|</span>
            <span className="font-bold">भारत सरकार</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-orange-200 text-[10px] font-semibold">
            <span>Digital India Initiative</span>
            <span className="opacity-40">|</span>
            <span>NIC Compliant</span>
          </div>
        </div>
      </div>

      {/* 2. Main Portal Header — White with Blue accent */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <RouterLink to="/" className="flex items-center gap-3 select-none group">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#EA580C] text-white border border-orange-700 flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                {[...Array(24)].map((_, i) => (
                  <line key={i} x1="12" y1="3" x2="12" y2="21"
                    transform={`rotate(${i * 7.5} 12 12)`} strokeWidth="0.4" />
                ))}
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-[#EA580C]">SUVIDHA</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-50 text-[#EA580C] border border-orange-200 font-mono">CIVIC</span>
              </div>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Unified Civic Services Portal • एकीकृत नागरिक सेवा
              </p>
            </div>
          </RouterLink>

          {/* Status + Tools */}
          <div className="flex items-center gap-3">
            {/* Status chips - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-gray-600">
              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                National Gateway
              </span>
              <span className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded border border-green-200 text-green-700">
                <Wifi className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                Server Online
              </span>
              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                {time}
              </span>
            </div>

            {/* Language + Accessibility */}
            <LanguageSelector />
            <AccessibilityPanel />

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Primary Navigation — White background with blue active state */}
      <nav className="bg-white border-b border-gray-200 shadow-sm px-4 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Desktop Nav Links */}
          <div className="hidden lg:flex gap-1">
            {navLinks.map(link => (
              <RouterLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive(link.to)
                    ? 'border-[#EA580C] text-[#EA580C] font-bold'
                    : 'border-transparent text-gray-600 hover:text-[#EA580C] hover:bg-orange-50'
                }`}
              >
                {link.icon}
                {link.label}
              </RouterLink>
            ))}
          </div>

          {/* Mobile current page label */}
          <div className="lg:hidden py-2 text-gray-600 text-xs font-semibold">
            {location.pathname === '/' ? 'Home' : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
          </div>

          {/* User / Sign-in CTA */}
          <div className="py-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-800">{currentUser.name}</span>
                  <span className="text-[9px] text-[#EA580C] uppercase font-black tracking-wider">
                    {currentUser.role === 'admin' ? 'Super Admin' : currentUser.role === 'officer' ? `${currentUser.department} Officer` : 'Verified Citizen'}
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
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-black transition shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Portal Sign-In</span>
              </RouterLink>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100 flex flex-col gap-1">
            {navLinks.map(link => (
              <RouterLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm font-semibold ${
                  isActive(link.to) ? 'bg-orange-50 text-[#EA580C]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.icon}
                {link.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
              </RouterLink>
            ))}
          </div>
        )}
      </nav>

      {/* 4. Main Content */}
      <main className="flex-1 w-full bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col justify-start">

          {/* Back button */}
          {!isHome && (
            <div className="mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* Voice Nav Banner */}
          {voiceNav && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 border bg-orange-50 border-orange-200 text-[#EA580C]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">Voice Accessibility Guide Activated</span>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* 5. Official Government Footer */}
      <footer className="bg-white border-t border-gray-200 text-gray-600">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#EA580C]" />
              <span className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">SUVIDHA National Registry</span>
            </div>
            <p className="leading-relaxed text-gray-500">
              An official Single Window Grievance Redressal and Citizen Service Delivery system, facilitating fast and transparent utility connections with SLA guarantees.
            </p>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">Official Links</span>
            <ul className="space-y-2 text-gray-500">
              <li><RouterLink to="/citizen" className="hover:underline hover:text-[#EA580C]">Apply for Utility Connection</RouterLink></li>
              <li><RouterLink to="/track" className="hover:underline hover:text-[#EA580C]">Track Application Status</RouterLink></li>
              <li><a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#EA580C]">National Portal of India</a></li>
              <li><a href="https://darpg.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#EA580C]">DARPG — Administrative Reforms</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">Helpdesk Support</span>
            <ul className="space-y-2 text-gray-500">
              <li className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-[#EA580C]" /> Toll Free: 1800-11-SUVIDHA / 1912</li>
              <li>Email: grievance-suvidha@nic.in</li>
              <li>NIC HQ, CGO Complex, Lodhi Road, New Delhi</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 py-3 text-center text-[10px] font-semibold bg-gray-50 text-gray-400">
          © 2026 National Informatics Centre (NIC) • Department of Administrative Reforms & Public Grievances (DARPG). All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default KioskLayout;
