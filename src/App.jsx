import React from 'react';
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

function App() {
  return (
    <ThemeProvider>
      <Router>
        <LanguageProvider>
          <AccessibilityProvider>
            <KioskLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/citizen" element={<CitizenDashboard />} />
                <Route path="/officer" element={<OfficerDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/track" element={<ComplaintTracking />} />
              </Routes>
            </KioskLayout>
          </AccessibilityProvider>
        </LanguageProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
