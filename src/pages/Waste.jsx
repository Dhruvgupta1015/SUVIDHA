import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { generateReceipt, printReceipt } from '../utils/receiptGenerator';
import { Trash2, CheckCircle, Printer } from 'lucide-react';

export const Waste = () => {
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  const [wardNo, setWardNo] = useState('');
  const [complaintType, setComplaintType] = useState('Garbage Dump Clearance');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wardNo || !description) {
      speak("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    speak("Submitting municipal waste complaint");

    setTimeout(() => {
      const refNumber = `WM-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const rec = generateReceipt({
        serviceName: "Municipal Solid Waste Grievance",
        refNumber,
        citizenName: "Rohan Sharma",
        details: {
          "Ward Number": wardNo,
          "Grievance Category": complaintType,
          "Description": description
        },
        status: "Registered - Assigned to Ward Supervisor"
      });
      setSubmitting(false);
      setSubmittedReceipt(rec);
      speak("Waste grievance registered successfully.");
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-4">
      <div className={`p-8 rounded-3xl border shadow-kiosk-depth transition-all duration-300 ${
        highContrast 
          ? 'bg-black border-yellow-400 text-yellow-400' 
          : 'bg-kiosk-navy/55 border-white/5 backdrop-blur-md text-slate-100'
      }`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-kiosk-glow">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
              {t('waste')}
            </h2>
            <p className="text-xs text-slate-400">Municipal Solid Waste & Cleanliness Bureau</p>
          </div>
        </div>

        {submittedReceipt ? (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-outfit font-extrabold text-2xl text-emerald-400">Grievance Registered</h3>
              <p className="text-sm text-slate-400">Ticket Reference: <b className="text-slate-200">{submittedReceipt.refNumber}</b></p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button onClick={() => printReceipt(submittedReceipt)} className="px-6 py-3.5 bg-kiosk-teal hover:bg-opacity-95 transition kiosk-btn font-extrabold rounded-2xl text-kiosk-dark flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <span>{t('receiptPrint')}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Ward Number / Locality ID *</label>
              <input
                type="text"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                placeholder="Enter Ward Number (e.g., Ward 84, Indiranagar)"
                className="w-full bg-kiosk-dark/70 border border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-kiosk-teal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Category of Complaint *</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full bg-kiosk-dark/70 border border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-kiosk-teal text-slate-200"
              >
                <option>Garbage Dump Clearance</option>
                <option>Dead Animal Removal</option>
                <option>Lack of Street Sweeping</option>
                <option>Drainage Blockage / Overflow</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Explain the Issue *</label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide location details or landmarks where waste has piled up..."
                className="w-full bg-kiosk-dark/70 border border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-kiosk-teal resize-none"
                required
              />
            </div>

            <div className="border-t border-white/5 pt-6 flex justify-end">
              <button type="submit" disabled={submitting} className="px-8 py-4 bg-kiosk-teal hover:bg-opacity-95 transition kiosk-btn font-extrabold rounded-2xl text-kiosk-dark disabled:opacity-50">
                {submitting ? 'Registering...' : 'Register Complaint'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Waste;
