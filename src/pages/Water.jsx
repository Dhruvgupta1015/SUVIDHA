import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { verifyDocumentOCR } from '../utils/qualcommEdgeAI';
import { generateReceipt, printReceipt } from '../utils/receiptGenerator';
import { Droplet, Upload, CheckCircle, Printer, AlertTriangle } from 'lucide-react';

export const Water = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Form State (supporting state pre-population for edits)
  const [consumerNo, setConsumerNo] = useState(location.state?.requestDetails?.consumerId || '');
  const [complaintType, setComplaintType] = useState(location.state?.serviceDetails?.subService || 'No Water Supply');
  const [description, setDescription] = useState(location.state?.requestDetails?.description || '');
  
  const [file, setFile] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setVerifyingDoc(true);
    speak("Edge AI Layer verifying uploaded document");

    const result = await verifyDocumentOCR(uploadedFile, 'bill');
    setVerifyingDoc(false);
    setDocResult(result);
    if (result.success) {
      speak("Document verified successfully");
    } else {
      speak("Document verification failed: " + result.reason);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consumerNo || !description) {
      speak("Please fill in all required fields");
      return;
    }
    
    speak("Opening review summary");
    navigate('/submit', {
      state: {
        formPath: '/water',
        citizenDetails: {
          name: "Rohan Sharma",
          mobile: "98765 43210",
          aadhaar: "XXXX-XXXX-8942"
        },
        serviceDetails: {
          category: "Water Services",
          subService: complaintType
        },
        uploadedDocs: location.state?.uploadedDocs || null,
        requestDetails: {
          consumerId: consumerNo,
          description: description,
          suggestedCategory: "Water Main Leakage",
          sla: "48 Hours"
        }
      }
    });
  };

  const handlePrint = () => {
    if (submittedReceipt) printReceipt(submittedReceipt);
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <div className={`p-8 rounded-3xl border shadow-kiosk-depth transition-all duration-300 ${
        highContrast 
          ? 'bg-black border-yellow-400 text-yellow-400' 
          : 'bg-kiosk-navy/55 border-white/5 backdrop-blur-md text-slate-100'
      }`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-kiosk-glow">
            <Droplet className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
              {t('water')}
            </h2>
            <p className="text-xs text-slate-400">Department of Water Supply & Sewerage Board</p>
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
              <button onClick={handlePrint} className="px-6 py-3.5 bg-kiosk-teal hover:bg-opacity-95 transition kiosk-btn font-extrabold rounded-2xl text-kiosk-dark flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <span>{t('receiptPrint')}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">RR / Connection ID *</label>
                  <input
                    type="text"
                    value={consumerNo}
                    onChange={(e) => setConsumerNo(e.target.value)}
                    placeholder="Enter Connection/RR Number"
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
                    <option>No Water Supply</option>
                    <option>Water Main Leakage</option>
                    <option>Contaminated Water Supply</option>
                    <option>Sewage Overflow</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Explain the Issue *</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain details of the water issue here..."
                    className="w-full bg-kiosk-dark/70 border border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-kiosk-teal resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-300 block mb-2">{t('docUploadTitle')}</label>
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-3xl bg-kiosk-dark/40 hover:border-kiosk-teal/40 transition-colors relative overflow-hidden group">
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  
                  {verifyingDoc ? (
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-kiosk-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-kiosk-teal font-bold">{t('scanProgress')}</p>
                    </div>
                  ) : docResult ? (
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-400">Verified locally on Edge</h4>
                      <span className="text-[10px] text-kiosk-teal underline block hover:text-slate-300">Tap to upload another file</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-3.5">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">{t('dropFiles')}</p>
                    </div>
                  )}
                </div>
              </div>
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

export default Water;
