import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { verifyDocumentOCR } from '../utils/qualcommEdgeAI';
import { generateReceipt, printReceipt } from '../utils/receiptGenerator';
import { Zap, Upload, CheckCircle, FileText, Printer, AlertTriangle } from 'lucide-react';

export const Electricity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Form State (supporting state pre-population for edits)
  const [consumerNo, setConsumerNo] = useState(location.state?.requestDetails?.consumerId || '');
  const [complaintType, setComplaintType] = useState(location.state?.serviceDetails?.subService || 'Power Cut');
  const [description, setDescription] = useState(location.state?.requestDetails?.description || '');
  
  // Doc Upload State
  const [file, setFile] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(false);
  const [docResult, setDocResult] = useState(null);

  // Status State
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
      speak("Document verified successfully on-device");
    } else {
      speak("Document verification failed. " + result.reason);
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
        formPath: '/electricity',
        citizenDetails: {
          name: "Rohan Sharma",
          mobile: "98765 43210",
          aadhaar: "XXXX-XXXX-8942"
        },
        serviceDetails: {
          category: "Electricity Services",
          subService: complaintType
        },
        uploadedDocs: location.state?.uploadedDocs || null,
        requestDetails: {
          consumerId: consumerNo,
          description: description,
          suggestedCategory: "Power Grid Outage",
          sla: "24 Hours"
        }
      }
    });
  };

  const handlePrint = () => {
    if (submittedReceipt) {
      printReceipt(submittedReceipt);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <div className={`p-8 rounded-3xl border shadow-kiosk-depth transition-all duration-300 ${
        highContrast 
          ? 'bg-black border-yellow-400 text-yellow-400' 
          : 'bg-kiosk-navy/55 border-white/5 backdrop-blur-md text-slate-100'
      }`}>
        
        {/* Banner */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-kiosk-glow">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
              {t('electricity')}
            </h2>
            <p className="text-xs text-slate-400">Department of Power Distribution • Kiosk Grievance Portal</p>
          </div>
        </div>

        {submittedReceipt ? (
          /* Submission Receipt Display */
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-outfit font-extrabold text-2xl text-emerald-400">Grievance Registered Successfully</h3>
              <p className="text-sm text-slate-400">Ticket Reference: <b className="text-slate-200">{submittedReceipt.refNumber}</b></p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-kiosk-dark/70 border border-white/5 text-left space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Kiosk ID:</span><span>{submittedReceipt.kioskId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Citizen:</span><span>{submittedReceipt.citizenName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Category:</span><span>{submittedReceipt.details["Grievance Category"]}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">NPU OCR:</span><span className="text-emerald-400 font-bold">{submittedReceipt.details["NPU OCR Verified ID"]}</span></div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={handlePrint}
                className="px-6 py-3.5 bg-kiosk-teal hover:bg-opacity-95 transition kiosk-btn font-extrabold rounded-2xl text-kiosk-dark flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                <span>{t('receiptPrint')}</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedReceipt(null);
                  setConsumerNo('');
                  setDescription('');
                  setFile(null);
                  setDocResult(null);
                }}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 transition border border-white/10 kiosk-btn font-bold rounded-2xl text-slate-300"
              >
                File New Complaint
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Form Details */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Consumer Account Number *</label>
                  <input
                    type="text"
                    maxLength="10"
                    value={consumerNo}
                    onChange={(e) => setConsumerNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-Digit Consumer Number"
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
                    <option>Power Cut</option>
                    <option>Meter Reading Fault</option>
                    <option>Voltage Fluctuations</option>
                    <option>Bill Dispute</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Explain the Issue *</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain details of the complaint here..."
                    className="w-full bg-kiosk-dark/70 border border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-kiosk-teal resize-none"
                    required
                  />
                </div>
              </div>

              {/* Right Column: Local Edge AI Document Verification */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-300 block mb-2">{t('docUploadTitle')}</label>
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-3xl bg-kiosk-dark/40 hover:border-kiosk-teal/40 transition-colors relative overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  
                  {verifyingDoc ? (
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-kiosk-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-kiosk-teal font-bold">{t('scanProgress')}</p>
                    </div>
                  ) : docResult ? (
                    <div className="text-center space-y-4 w-full px-2">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        docResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {docResult.success ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                      </div>
                      
                      <div>
                        <h4 className={`text-sm font-bold ${docResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {docResult.success ? 'Verification Passed' : 'Verification Failed'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Confidence Score: {(docResult.confidence * 100).toFixed(0)}%</p>
                      </div>

                      {docResult.success && (
                        <div className="p-3 bg-white/5 rounded-xl text-[10px] text-left space-y-1 border border-white/5 max-w-[240px] mx-auto">
                          <p><span className="text-slate-400">Name:</span> {docResult.extractedData.name}</p>
                          <p><span className="text-slate-400">Consumer:</span> {docResult.extractedData.consumerNo || 'Matching OCR ID'}</p>
                          <p className="text-[8px] text-slate-500 pt-1 font-mono text-center">Snapshot Snapdragon NPU OCR</p>
                        </div>
                      )}
                      
                      {!docResult.success && (
                        <p className="text-[10px] text-rose-400/80 px-2 leading-relaxed">{docResult.reason}</p>
                      )}

                      <span className="text-[10px] text-kiosk-teal underline block hover:text-slate-300">Tap to upload another file</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-3.5">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-kiosk-teal transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{t('dropFiles')}</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Upload utility bill or identity proof for instant Edge verification.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-kiosk-teal hover:bg-opacity-95 transition kiosk-btn font-extrabold rounded-2xl text-kiosk-dark disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Complaint'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Electricity;
