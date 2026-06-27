import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KioskLayout from './components/KioskLayout';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintTracking from './pages/ComplaintTracking';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

/**
 * Decode a JWT payload (without verifying signature — verification happens on backend).
 * Used only to check client-side expiry and role consistency.
 */
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Validates the locally cached token on every app mount.
 * Clears storage and redirects to /auth if:
 *  - Token is missing or malformed
 *  - Token has expired (exp < now)
 *  - Role in token doesn't match role in stored user object
 */
function validateTokenOnMount() {
  const token   = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) return; // No session — nothing to validate

  const payload = decodeJwt(token);
  if (!payload) {
    // Malformed token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return;
  }

  // Check JWT expiry (exp is in seconds)
  const nowSecs = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSecs) {
    console.warn('[SUVIDHA] Session token expired — clearing credentials.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return;
  }

  // Cross-check role consistency — prevent localStorage role injection
  try {
    const storedUser = JSON.parse(userStr);
    if (payload.role && storedUser.role && payload.role !== storedUser.role) {
      console.warn('[SUVIDHA] Role mismatch detected between JWT and stored user — clearing session.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

function App() {
  // Run token validation once on every full app mount
  useEffect(() => {
    validateTokenOnMount();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <LanguageProvider>
          <AccessibilityProvider>
            <KioskLayout>
              <Routes>
                <Route path="/"        element={<Home />} />
                <Route path="/auth"    element={<Auth />} />
                <Route path="/citizen" element={<CitizenDashboard />} />
                <Route path="/officer" element={<OfficerDashboard />} />
                <Route path="/admin"   element={<AdminDashboard />} />
                <Route path="/track"   element={<ComplaintTracking />} />
              </Routes>
            </KioskLayout>
          </AccessibilityProvider>
        </LanguageProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
