import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { VoiceAssistantProvider } from './context/VoiceAssistantContext';
import KioskLayout from './components/KioskLayout';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import ServiceDashboard from './pages/ServiceDashboard';
import AIAssistant from './pages/AIAssistant';
import DocumentUpload from './pages/DocumentUpload';
import SubmitRequest from './pages/SubmitRequest';
import ComplaintTracking from './pages/ComplaintTracking';
import ReceiptPage from './pages/ReceiptPage';
import AdminDashboard from './pages/AdminDashboard';
import MobileCompanion from './pages/MobileCompanion';
import DemoCenter from './pages/DemoCenter';
import MultiverseVisualizer from './pages/MultiverseVisualizer';
import Presentation from './pages/Presentation';
import Electricity from './pages/Electricity';
import Water from './pages/Water';
import Gas from './pages/Gas';
import Waste from './pages/Waste';
import ComplaintRegister from './pages/ComplaintRegister';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AccessibilityProvider>
          <VoiceAssistantProvider>
            <KioskLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/services" element={<ServiceDashboard />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/upload" element={<DocumentUpload />} />
                <Route path="/submit" element={<SubmitRequest />} />
                <Route path="/track" element={<ComplaintTracking />} />
                <Route path="/receipt" element={<ReceiptPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/mobile" element={<MobileCompanion />} />
                <Route path="/demo" element={<DemoCenter />} />
                <Route path="/multiverse" element={<MultiverseVisualizer />} />
                <Route path="/presentation" element={<Presentation />} />
                <Route path="/electricity" element={<Electricity />} />
                <Route path="/water" element={<Water />} />
                <Route path="/gas" element={<Gas />} />
                <Route path="/waste" element={<Waste />} />
                <Route path="/complaints" element={<ComplaintRegister />} />
              </Routes>
            </KioskLayout>
          </VoiceAssistantProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
