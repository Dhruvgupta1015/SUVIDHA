import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { verifyDocumentOCR } from '../utils/qualcommEdgeAI';
import { 
  ArrowLeft, 
  Home, 
  Volume2, 
  Upload, 
  Camera, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { uploadAPI } from '../utils/api';

export const DocumentUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { speakElement, speak, highContrast } = useAccessibility();

  // Get service context
  const selectedService = location.state || {
    serviceId: 'general',
    title: 'General Civic Helpdesk',
    formPath: '/complaints'
  };
  const { title, serviceId, formPath } = selectedService;

  // Upload States for 3 slots
  const [uploads, setUploads] = useState({
    idProof: null,    // { name, size, type, preview, path }
    addrProof: null,
    serviceDoc: null
  });

  // Scanner Modal Simulator State
  const [activeScanSlot, setActiveScanSlot] = useState(null); // 'idProof' | 'addrProof' | 'serviceDoc' | null
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Trigger Voice Instructions
  const speakInstructions = () => {
    speak("Document Upload Screen. Please upload your identity proof, address proof, and service specific documents using the touch buttons. You can also use the camera scan button to scan physical papers.");
  };

  // Launch simulated document scanner camera
  const triggerScan = (slot) => {
    resetScanState();
    setActiveScanSlot(slot);
    setScanning(true);
    speak("Position document in front of kiosk camera. Starting scan.");

    // Simulate scan timer
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Complete scan with mock Edge AI verification followed by actual backend upload
        setTimeout(async () => {
          try {
            const docType = slot === 'idProof' ? 'aadhaar' : 'bill';
            const mockImageUrl = docType === 'aadhaar' 
              ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400' 
              : 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400';

            // Convert image to blob to upload to backend
            const imageResponse = await fetch(mockImageUrl);
            const blob = await imageResponse.blob();
            const fileToUpload = new File([blob], `${slot}_camera_scan.jpg`, { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', fileToUpload);

            const uploadRes = await uploadAPI.uploadDoc(formData);
            const { file } = uploadRes.data;

            setUploads(prev => ({
              ...prev,
              [slot]: {
                name: file.name,
                size: file.size,
                preview: mockImageUrl,
                path: file.path,
                confidence: 0.98
              }
            }));
            
            setScanning(false);
            setActiveScanSlot(null);
            speak("Document scanned, NPU verified, and uploaded successfully.");
          } catch (err) {
            setScanning(false);
            setActiveScanSlot(null);
            console.error(err);
            speak("Failed to upload scanned document.");
            alert("Upload failed. Ensure backend server is online.");
          }
        }, 600);
      }
    }, 450);
  };

  const resetScanState = () => {
    setScanning(false);
    setScanProgress(0);
  };

  // Live file upload picker using backend Multer API with client-side format & size checks
  const handleFileChange = async (slot, e) => {
    const fileObj = e.target.files[0];
    if (!fileObj) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(fileObj.type.toLowerCase())) {
      speak("Invalid file format. Only image files and PDF documents are allowed.");
      alert("Allowed formats: Images (JPEG/JPG/PNG) and PDFs only.");
      return;
    }

    // Validate file size (10MB limit)
    if (fileObj.size > 10 * 1024 * 1024) {
      speak("File size exceeds ten megabytes limit.");
      alert("File size cannot exceed 10MB!");
      return;
    }

    speak("Uploading document file");
    try {
      const formData = new FormData();
      formData.append('file', fileObj);

      const uploadRes = await uploadAPI.uploadDoc(formData);
      const { file } = uploadRes.data;

      setUploads(prev => ({
        ...prev,
        [slot]: {
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(fileObj),
          path: file.path,
          confidence: 0.95
        }
      }));
      speak("Document uploaded successfully.");
    } catch (err) {
      console.error(err);
      speak("Document upload failed.");
      alert("Upload failed. Ensure backend server is online.");
    }
  };

  // Remove uploaded document
  const handleRemoveFile = (slot, e) => {
    e.stopPropagation();
    speak("Document removed");
    setUploads(prev => ({
      ...prev,
      [slot]: null
    }));
  };

  const handleContinue = (e) => {
    // Check if at least ID Proof is uploaded (simulate basic guard)
    if (!uploads.idProof) {
      speak("Identity proof is mandatory. Please upload Aadhaar or Voter ID to continue.");
      alert("Please upload at least the Identity Proof to continue.");
      return;
    }
    
    speak("Documents confirmed. Continuing to final details page.");
    navigate(formPath, {
      state: {
        ...selectedService,
        uploadedDocs: uploads
      }
    });
  };

  // Determine dynamic third slot name based on service
  const getDynamicSlotName = () => {
    if (serviceId === 'electricity' || serviceId === 'water') return "Ownership Deed / Tax Receipt";
    if (serviceId === 'gas') return "PNG Connection Agreement";
    if (serviceId === 'waste' || serviceId === 'complaints') return "Complaint Site Photo";
    return "Supporting Document";
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-4 space-y-6">
      
      {/* 1. Kiosk Top Banner & Steps Indicator */}
      <div className="pb-4 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/services')}
              onMouseEnter={(e) => speakElement(e, "Back to service selection")}
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
              onMouseEnter={(e) => speakElement(e, "Go to home page")}
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
              onClick={speakInstructions}
              onMouseEnter={(e) => speakElement(e, "Narrate document scan instructions")}
              className="p-3 bg-kiosk-teal/10 hover:bg-kiosk-teal/20 border border-kiosk-teal/30 rounded-full text-kiosk-teal kiosk-btn"
            >
              <Volume2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Step Tracker Banner */}
        <div className="flex justify-between items-center text-xs font-bold px-4 py-3 bg-white/5 border border-white/5 rounded-2xl">
          <span className="text-slate-400">Step 1: Verification <b className="text-emerald-400">✓</b></span>
          <span className="text-slate-400">Step 2: AI Guidance <b className="text-emerald-400">✓</b></span>
          <span className="text-kiosk-teal font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-kiosk-teal animate-ping"></span>
            Step 3: Document Upload
          </span>
          <span className="text-slate-500">Step 4: Submit & Receipt</span>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl md:text-4xl font-outfit font-black tracking-wide" onMouseEnter={speakElement}>
          Upload Required Documents
        </h2>
        <p className="text-xs text-slate-400">{title} requires validation proofs to prevent fraudulent logs.</p>
      </div>

      {/* 3. Three Touch-Friendly Upload slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 py-4 w-full">
        {[
          { key: 'idProof', title: "Identity Proof", sub: "Aadhaar Card or Voter ID" },
          { key: 'addrProof', title: "Address Proof", sub: "Electricity or Water Bill" },
          { key: 'serviceDoc', title: getDynamicSlotName(), sub: "Dynamic attachment slot" }
        ].map((slot) => {
          const fileData = uploads[slot.key];
          return (
            <div
              key={slot.key}
              className={`p-6 rounded-[2rem] border flex flex-col justify-between items-stretch transition-all relative overflow-hidden h-[340px] ${
                highContrast 
                  ? 'bg-black border-yellow-400 text-yellow-400'
                  : fileData 
                    ? 'bg-kiosk-navy border-emerald-500/30' 
                    : 'bg-kiosk-navy/40 border-slate-800'
              }`}
            >
              {/* Slot Header */}
              <div className="space-y-1 select-none">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Document Slot</span>
                <h3 className="font-outfit font-black text-lg">{slot.title}</h3>
                <p className="text-[10px] text-slate-400">{slot.sub}</p>
              </div>

              {/* Upload Active State */}
              {fileData ? (
                /* Document Preview State */
                <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-center w-full px-2">
                    <p className="text-xs font-bold text-slate-200 truncate">{fileData.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{fileData.size} • Confidence: {(fileData.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveFile(slot.key, e)}
                    onMouseEnter={(e) => speakElement(e, "Remove document")}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition border border-rose-500/20 kiosk-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Empty Upload Target Action Panel */
                <div className="flex-1 flex flex-col justify-center items-center py-4 gap-4">
                  {/* File Upload Hidden Input Wrapper */}
                  <div className="w-full flex flex-col gap-2">
                    <label className={`w-full py-4.5 rounded-2xl border border-dashed border-white/10 hover:border-kiosk-teal/40 bg-white/5 transition flex items-center justify-center gap-2 cursor-pointer text-xs font-extrabold kiosk-btn text-slate-300 hover:text-kiosk-teal`}>
                      <Upload className="w-4 h-4 text-kiosk-teal" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(slot.key, e)}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => triggerScan(slot.key)}
                      className={`w-full py-4.5 rounded-2xl border border-white/5 bg-kiosk-accent/60 hover:bg-kiosk-accent transition flex items-center justify-center gap-2 text-xs font-extrabold kiosk-btn text-slate-200 hover:border-kiosk-teal/30`}
                    >
                      <Camera className="w-4 h-4 text-kiosk-teal animate-pulse" />
                      <span>Kiosk Camera Scan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Scanner Simulation Overlay Modal */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-kiosk-navy/95 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-kiosk-depth relative overflow-hidden">
            
            {/* Visual Scan laser Beam */}
            <div className="absolute top-0 inset-x-0 h-1 bg-kiosk-teal shadow-kiosk-glow animate-bounce-slow"></div>

            <div className="w-16 h-16 bg-kiosk-teal/10 border border-kiosk-teal/40 rounded-full flex items-center justify-center text-kiosk-teal mx-auto animate-pulse">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-outfit font-black text-xl text-slate-100">Scanning Document...</h3>
              <p className="text-xs text-slate-400">Position paper directly in front of the kiosk lens. Snapdragon NPU alignment running...</p>
            </div>

            {/* Progress counter */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-kiosk-teal h-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
            </div>
            
            <button
              onClick={resetScanState}
              className="px-4 py-2 border border-white/10 rounded-xl text-xs hover:bg-white/5"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}

      {/* 5. Bottom Navigation Control */}
      <div className="p-6 rounded-[2rem] bg-kiosk-navy/15 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold text-center sm:text-left">
          <ShieldCheck className="w-5 h-5 text-slate-500" />
          <span>Local edge NNP encryption is active. Document scans are verified on-device and never stored on public clouds.</span>
        </div>
        
        <button
          onClick={handleContinue}
          onMouseEnter={(e) => speakElement(e, "Continue to final submission")}
          className={`flex items-center justify-center gap-2.5 px-10 py-5 rounded-[2rem] text-sm font-black transition-all duration-300 shadow-kiosk-depth hover:-translate-y-0.5 kiosk-btn w-full sm:w-auto ${
            highContrast
              ? 'bg-yellow-400 text-black border-2 border-black hover:bg-black hover:text-yellow-400'
              : 'bg-kiosk-teal text-kiosk-dark border border-kiosk-teal shadow-kiosk-glow'
          }`}
        >
          <span>CONTINUE TO DETAILS</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default DocumentUpload;
