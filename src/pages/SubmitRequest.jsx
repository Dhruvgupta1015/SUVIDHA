import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { generateReceipt, printReceipt } from '../utils/receiptGenerator';
import { 
  ArrowLeft, 
  Home, 
  Volume2, 
  User, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  FileCode, 
  Edit3, 
  Printer, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

import { requestAPI } from '../utils/api';

export const SubmitRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Get data state passed from the form page
  const pageState = location.state || {
    formPath: '/electricity',
    citizenDetails: { name: 'Rohan Sharma', mobile: '98765 43210', aadhaar: 'XXXX-XXXX-8942' },
    serviceDetails: { category: 'Electricity Services', subService: 'Power Cut' },
    uploadedDocs: null,
    requestDetails: { consumerId: '1028394819', description: 'Power cut since morning in Indiranagar.', suggestedCategory: 'Grid Fault Outage', sla: '24 Hours' }
  };

  const { citizenDetails, serviceDetails, uploadedDocs, requestDetails, formPath } = pageState;

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  const handleEdit = (e) => {
    speakElement(e, "Returning to edit form fields");
    navigate(formPath, { state: pageState });
  };

  const handleFinalSubmit = async (e) => {
    if (submitting) return; // Prevent duplicate triggers on double-tap
    setSubmitting(true);
    speak("Submitting civic request to database nodal queue");

    // Map frontend service category to backend enum format
    let serviceType = 'general';
    const cat = serviceDetails.category.toLowerCase();
    if (cat.includes('electricity')) serviceType = 'electricity';
    else if (cat.includes('water')) serviceType = 'water';
    else if (cat.includes('gas')) serviceType = 'gas';
    else if (cat.includes('waste')) serviceType = 'waste';

    // Map documents to backend format
    const documentsArray = [];
    if (uploadedDocs) {
      if (uploadedDocs.idProof) {
        documentsArray.push({
          name: 'Identity Proof',
          path: uploadedDocs.idProof.path,
          verified: true,
          confidence: uploadedDocs.idProof.confidence || 1.0
        });
      }
      if (uploadedDocs.addrProof) {
        documentsArray.push({
          name: 'Address Proof',
          path: uploadedDocs.addrProof.path,
          verified: true,
          confidence: uploadedDocs.addrProof.confidence || 1.0
        });
      }
      if (uploadedDocs.serviceDoc) {
        documentsArray.push({
          name: 'Service Document',
          path: uploadedDocs.serviceDoc.path,
          verified: true,
          confidence: uploadedDocs.serviceDoc.confidence || 1.0
        });
      }
    }

    try {
      const response = await requestAPI.create({
        serviceType,
        subService: serviceDetails.subService,
        description: requestDetails.description,
        documents: documentsArray,
        priority: 'Standard'
      });

      const reqId = response.data.requestId;

      // Build receipt from backend response values
      const rec = generateReceipt({
        serviceName: `${serviceDetails.category} - ${serviceDetails.subService}`,
        refNumber: reqId,
        citizenName: citizenDetails.name,
        details: {
          "Reference ID": reqId,
          "Citizen Mobile": citizenDetails.mobile,
          "Service category": serviceDetails.category,
          "Service Type": serviceDetails.subService,
          "Consumer ID / Connection": requestDetails.consumerId || 'N/A',
          "Description": requestDetails.description,
          "Edge NPU OCR Verify": documentsArray.length > 0 ? "PASS" : "NONE",
          "Estimated Resolution SLA": requestDetails.sla || '48 Hours'
        },
        status: "Submitted - Queued for Ward Nodal AE Dispatch"
      });

      setSuccessReceipt(rec);
      setSubmittedId(reqId);
      setSubmitting(false);
      speak(`Request submitted successfully. Your request reference number is ${reqId}.`);
    } catch (err) {
      setSubmitting(false);
      console.error(err);
      speak("Failed to register request in municipal log database.");
      alert("Submission failed. Ensure backend is running.");
    }
  };

  const handlePrint = () => {
    if (successReceipt) {
      printReceipt(successReceipt);
    }
  };

  const handleGoToTracking = (e) => {
    speakElement(e, "Redirecting to tracking console");
    navigate('/track', {
      state: {
        refNumber: submittedId,
        serviceName: `${serviceDetails.category} - ${serviceDetails.subService}`,
        citizenName: citizenDetails.name
      }
    });
  };

  const speakSummaryInstructions = () => {
    speak("Review and Submit Screen. Please review your citizen name, mobile number, selected service category, uploaded files, and explanation details. Tap edit to modify, or tap final submit to register your complaint.");
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Kiosk Top Banner & Steps */}
      <div className="pb-4 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => speakElement(e, "Back to form page")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
                highContrast 
                  ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                  : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => navigate('/')}
              onMouseEnter={(e) => speakElement(e, "Go to home screen")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition kiosk-btn ${
                highContrast 
                  ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                  : 'bg-kiosk-navy hover:bg-kiosk-accent border-slate-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={speakSummaryInstructions}
              onMouseEnter={(e) => speakElement(e, "Narrate summary instructions")}
              className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
            >
              <Volume2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Steps tracker */}
        <div className="flex justify-between items-center text-xs font-bold px-4 py-3 bg-white/5 border border-white/5 rounded-2xl select-none">
          <span className="text-slate-400">Step 1: Verification <b className="text-emerald-400">✓</b></span>
          <span className="text-slate-400">Step 2: AI Guidance <b className="text-emerald-400">✓</b></span>
          <span className="text-slate-400">Step 3: Document Upload <b className="text-emerald-400">✓</b></span>
          <span className="text-kiosk-teal font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-kiosk-teal animate-ping"></span>
            Step 4: Review & Submit
          </span>
        </div>
      </div>

      {submittedId ? (
        /* Final Success Receipt Screen */
        <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-kiosk-depth text-center space-y-6 transition ${
          highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-kiosk-navy/55 border-white/5 text-slate-100'
        }`}>
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-outfit font-black tracking-wide text-emerald-400">Grievance Registered Successfully</h2>
            <p className="text-sm text-slate-400">Your tracking ID is: <b className="text-slate-100 font-mono text-base bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">{submittedId}</b></p>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Please print the receipt below. You can also scan the tracking QR code on the next screen to sync status updates to your mobile.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <button
              onClick={handlePrint}
              onMouseEnter={(e) => speakElement(e, "Print ticket receipt")}
              className="px-8 py-4.5 bg-kiosk-teal hover:bg-opacity-95 text-kiosk-dark font-black rounded-2xl transition shadow-kiosk-glow flex items-center gap-2 kiosk-btn"
            >
              <Printer className="w-5 h-5" />
              <span>Print Receipt Ticket</span>
            </button>

            <button
              onClick={handleGoToTracking}
              onMouseEnter={(e) => speakElement(e, "Open complaint tracking console")}
              className="px-8 py-4.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 rounded-2xl transition kiosk-btn"
            >
              Go to Tracking screen
            </button>
          </div>
        </div>
      ) : (
        /* Review Screen Summary Panel */
        <div className="space-y-6 flex-1 flex flex-col justify-start">
          
          <div className="text-center py-1">
            <h2 className="text-3xl font-outfit font-black tracking-wide">Review & Submit</h2>
            <p className="text-xs text-slate-400">Please review your submission details before dispatching the ticket</p>
          </div>

          {/* Grid Layout of summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1">
            
            {/* Left Box: Citizen & Service summary */}
            <div className={`p-6 md:p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition ${
              highContrast ? 'bg-black border-yellow-400' : 'bg-kiosk-navy/40 border-white/5'
            }`}>
              
              <div className="space-y-5">
                {/* 1. Citizen Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <User className="w-4 h-4 text-kiosk-teal" />
                    Citizen Identity
                  </h4>
                  <div className="text-xs space-y-1 bg-kiosk-dark/45 p-4 rounded-2xl border border-white/5">
                    <p><span className="text-slate-400 font-medium">Full Name:</span> <b className="text-slate-200">{citizenDetails.name}</b></p>
                    <p><span className="text-slate-400 font-medium">Mobile Contact:</span> <b className="text-slate-200">{citizenDetails.mobile}</b></p>
                    <p><span className="text-slate-400 font-medium">Aadhaar (Masked):</span> <b className="text-slate-200">{citizenDetails.aadhaar}</b></p>
                  </div>
                </div>

                {/* 2. Service category */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <ShieldCheck className="w-4 h-4 text-kiosk-teal" />
                    Requested Service
                  </h4>
                  <div className="text-xs space-y-1 bg-kiosk-dark/45 p-4 rounded-2xl border border-white/5">
                    <p><span className="text-slate-400 font-medium">Department:</span> <b className="text-slate-200">{serviceDetails.category}</b></p>
                    <p><span className="text-slate-400 font-medium">Application Focus:</span> <b className="text-slate-200">{serviceDetails.subService}</b></p>
                    <p><span className="text-slate-400 font-medium">Identifier Ref:</span> <b className="text-slate-200">{requestDetails.consumerId || 'N/A'}</b></p>
                  </div>
                </div>
              </div>

              {/* SLA Banner */}
              <div className="p-4 bg-kiosk-teal/10 border border-kiosk-teal/30 rounded-2xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-kiosk-teal shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-kiosk-teal">Estimated SLA Target Time</p>
                  <p className="text-slate-400 text-[10px]">Expected resolution within {requestDetails.sla || '48 hours'} (Municipal Code).</p>
                </div>
              </div>

            </div>

            {/* Right Box: Files and Description */}
            <div className={`p-6 md:p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition ${
              highContrast ? 'bg-black border-yellow-400' : 'bg-kiosk-navy/40 border-white/5'
            }`}>
              
              <div className="space-y-5 flex-1 flex flex-col justify-start">
                
                {/* 3. Description text */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <FileText className="w-4 h-4 text-kiosk-teal" />
                    Issue Summary
                  </h4>
                  <div className="p-4 bg-kiosk-dark/45 rounded-2xl border border-white/5 text-xs text-slate-300 leading-relaxed min-h-[80px]">
                    {requestDetails.description}
                  </div>
                  <span className="text-[10px] text-kiosk-teal font-semibold">AI Auto Category recommendation: {requestDetails.suggestedCategory}</span>
                </div>

                {/* 4. Uploaded files checklist */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <FileCode className="w-4 h-4 text-kiosk-teal" />
                    Uploaded Documents
                  </h4>

                  <div className="flex-1 overflow-y-auto max-h-[140px] space-y-2">
                    {uploadedDocs ? (
                      Object.entries(uploadedDocs).map(([key, file]) => {
                        if (!file) return null;
                        return (
                          <div key={key} className="p-3 bg-kiosk-dark/45 border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-slate-300 truncate font-semibold">{file.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{file.size}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center text-xs text-slate-500 font-bold select-none">
                        No files uploaded
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom console controls */}
          <div className="p-6 rounded-3xl bg-kiosk-navy/15 border border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleEdit}
              onMouseEnter={(e) => speakElement(e, "Edit details")}
              className={`flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-xs font-extrabold border transition kiosk-btn w-full sm:w-auto ${
                highContrast
                  ? 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <Edit3 className="w-4.5 h-4.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              onMouseEnter={(e) => speakElement(e, "Final Submit complaint details")}
              className={`flex items-center justify-center gap-2.5 px-10 py-5 rounded-[1.8rem] text-sm font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 kiosk-btn w-full sm:w-auto ${
                highContrast
                  ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
                  : 'bg-kiosk-teal text-kiosk-dark border border-kiosk-teal shadow-kiosk-glow'
              }`}
            >
              <span>{submitting ? 'Registering...' : 'FINAL SUBMIT REQUEST'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default SubmitRequest;
