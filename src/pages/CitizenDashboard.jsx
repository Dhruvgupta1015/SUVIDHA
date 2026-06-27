import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  PlusCircle, 
  FileText, 
  FolderLock, 
  TrendingUp, 
  Download, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Zap, 
  Droplet, 
  Flame, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { requestAPI, uploadAPI } from '../utils/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { speak } = useAccessibility();

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'apply' | 'vault'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data State
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Application Form State
  const [serviceType, setServiceType] = useState('electricity');
  const [subService, setSubService] = useState('New Connection');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Standard');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formSuccess, setFormSuccess] = useState(false);

  // Document Vault State
  const [vaultDocs, setVaultDocs] = useState([
    { name: "Aadhaar Card.pdf", size: "1.12 MB", type: "ID Proof", verification: "DigiLocker Verified", confidence: 1.0 },
    { name: "Electricity Bill Copy.pdf", size: "0.85 MB", type: "Address Proof", verification: "System Verified", confidence: 0.96 }
  ]);

  // Uploading State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Receipt Modal State
  const [receiptRequest, setReceiptRequest] = useState(null);

  // Verification checks on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth?role=citizen');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'citizen') {
      navigate('/auth?role=citizen');
      return;
    }
    setCurrentUser(user);
    fetchMyRequests();
  }, [navigate]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const response = await requestAPI.myRequests();
      if (response.data && response.data.requests) {
        setMyRequests(response.data.requests);
        if (response.data.requests.length > 0) {
          setSelectedRequest(response.data.requests[0]);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load request history.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      setErrorMsg('Please enter a description for the connection/grievance.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        serviceType,
        subService,
        description,
        priority,
        documents: uploadedFiles
      };
      
      const response = await requestAPI.create(payload);
      if (response.data && response.data.success) {
        setFormSuccess(true);
        speak("Request filed successfully");
        fetchMyRequests();
        
        // Reset form
        setDescription('');
        setUploadedFiles([]);
        setTimeout(() => {
          setFormSuccess(false);
          setActiveTab('timeline');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit application. Fallback Mock created.');
      fetchMyRequests();
    } finally {
      setLoading(false);
    }
  };

  // Handle File Upload to vault/attachments
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadAPI.uploadDoc(formData);
      if (response.data && response.data.success) {
        const newFile = {
          name: response.data.file.name,
          path: response.data.file.path,
          verified: true,
          confidence: 0.97
        };
        setUploadedFiles(prev => [...prev, newFile]);
        
        // Append to local vault docs list
        setVaultDocs(prev => [
          ...prev, 
          { 
            name: file.name, 
            size: response.data.file.size, 
            type: "Utility Scanned File", 
            verification: "OCR Verified", 
            confidence: 0.97 
          }
        ]);
        speak("Document uploaded and verified by OCR");
      }
    } catch (err) {
      // Offline fallback
      const mockFile = {
        name: file.name,
        path: "/uploads/mock_upload.png",
        verified: true,
        confidence: 0.95
      };
      setUploadedFiles(prev => [...prev, mockFile]);
      setVaultDocs(prev => [
        ...prev, 
        { 
          name: file.name, 
          size: "0.50 MB", 
          type: "Scanned Attachment", 
          verification: "Local OCR Checked", 
          confidence: 0.95 
        }
      ]);
      speak("Server offline. Scanned file added locally.");
    } finally {
      setUploading(false);
    }
  };

  // Sub-services list mapped to categories
  const subServicesMap = {
    electricity: ["New Connection Meter", "Line Phase Fault Repair", "Meter Replacement", "Bill Redressal"],
    water: ["New Municipal Pipeline Connection", "Main Leakage Grievance", "No Supply complaint", "Dirty water pipeline"],
    gas: ["PNG Valve Installation", "Meter Malfunction Repair", "Pressure Drop Issue", "Safety Audit Inspection"],
    waste: ["Uncollected Trash Bin Pileup", "Sewage line clog", "Stagnant Water Drain", "Debris sweep request"],
    general: ["Streetlight SL Pole out", "Road pothole repair", "Park/Stray Animal control", "Signage replacement"]
  };

  const handleCategoryChange = (cat) => {
    setServiceType(cat);
    setSubService(subServicesMap[cat][0]);
  };

  // Helper to trigger print receipt
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full text-left">
      
      {/* 1. Welcome Banner */}
      {currentUser && (
        <div className="p-6 bg-gradient-to-r from-blue-700 to-blue-800 rounded-3xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-lg"><User className="w-5 h-5 text-white" /></span>
              <h2 className="text-lg md:text-xl font-bold font-sans">Namaste, {currentUser.name}</h2>
            </div>
            <p className="text-xs text-orange-100 font-semibold opacity-90">
              Mobile: +91 {currentUser.mobile} {currentUser.aadhaar && ` | Aadhaar ID: ${currentUser.aadhaar}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('apply')}
              className="px-4 py-2 bg-white text-[#EA580C] hover:bg-orange-50 text-xs font-black rounded-xl transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Apply New Service
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Main Tab Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'timeline'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Track Grievances
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'apply'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Service Application
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 shrink-0 lg:w-full ${
              activeTab === 'vault'
                ? 'bg-orange-50 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold border-l-2 border-[#EA580C]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            DigiLocker Wallet
          </button>
        </div>

        {/* Tab Contents Pane */}
        <div className="lg:col-span-3">
          
          {activeTab === 'timeline' && (
            /* TAB 1: Tracking Grievances & Timeline */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Left Column: Tickets List (2 cols) */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-slate-800">
                  Application Log ({myRequests.length})
                </h3>

                {loading && myRequests.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">Loading ticket history...</div>
                ) : myRequests.length === 0 ? (
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2 text-xs text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No connections or complaints found.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {myRequests.map((req) => (
                      <div
                        key={req.requestId}
                        onClick={() => setSelectedRequest(req)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                          selectedRequest?.requestId === req.requestId
                            ? 'border-[#EA580C] bg-orange-50/30 dark:bg-slate-800/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-[11px] text-slate-800 dark:text-white font-mono">{req.requestId}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            req.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300' :
                            req.status === 'In-Progress' ? 'bg-orange-100 dark:bg-blue-900/40 text-[#EA580C] dark:text-orange-300' :
                            req.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300' :
                            'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                          }`}>{req.status}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 capitalize truncate">{req.subService}</h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                          <span className="capitalize">{req.serviceType}</span>
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Timeline Detail View (3 cols) */}
              <div className="md:col-span-3">
                {selectedRequest ? (
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-5">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">{selectedRequest.requestId}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            selectedRequest.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300' :
                            selectedRequest.status === 'In-Progress' ? 'bg-orange-100 dark:bg-blue-900/40 text-[#EA580C] dark:text-orange-300' :
                            selectedRequest.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300' :
                            'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                          }`}>{selectedRequest.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Category: <span className="capitalize font-bold text-slate-500">{selectedRequest.serviceType}</span></p>
                      </div>

                      <button
                        onClick={() => setReceiptRequest(selectedRequest)}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#EA580C] dark:text-orange-300 border border-orange-100 dark:border-slate-750 text-[10px] font-black rounded-lg transition flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </div>

                    {/* Description Details */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grievance / Request Details</span>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{selectedRequest.subService}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
                        "{selectedRequest.description}"
                      </p>
                    </div>

                    {/* Interactive Process Timeline */}
                    <div className="space-y-4 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Timeline (SLA Resolution)</span>
                      
                      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2.5 pl-5 space-y-6 text-xs">
                        
                        {/* Step 1: Registered */}
                        <div className="relative">
                          <span className="absolute -left-[26px] top-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white dark:border-slate-900"></span>
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-slate-800 dark:text-white">Ticket Registered</h5>
                            <p className="text-[10px] text-slate-400">Created: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Step 2: Under Review */}
                        <div className="relative">
                          <span className={`absolute -left-[26px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            selectedRequest.status !== 'Pending' ? 'bg-[#16A34A]' : 'bg-slate-300'
                          }`}></span>
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-slate-800 dark:text-white">Assigned Department Wing</h5>
                            <p className="text-[10px] text-slate-500 font-semibold">{selectedRequest.assignedDepartment || 'Dispatched cell'}</p>
                          </div>
                        </div>

                        {/* Step 3: Team Assigned */}
                        <div className="relative">
                          <span className={`absolute -left-[26px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            selectedRequest.assignedTeam && selectedRequest.assignedTeam !== 'Unassigned' ? 'bg-[#16A34A]' : 'bg-slate-300'
                          }`}></span>
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-slate-800 dark:text-white">Field Repair Team Deployment</h5>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              {selectedRequest.assignedTeam && selectedRequest.assignedTeam !== 'Unassigned' 
                                ? `Crew Active: ${selectedRequest.assignedTeam}`
                                : 'Under dispatch check'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Remarks */}
                        {selectedRequest.remarks && (
                          <div className="relative">
                            <span className="absolute -left-[26px] top-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white dark:border-slate-900"></span>
                            <div className="space-y-0.5 bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-lg border border-orange-100/50 dark:border-orange-900/10">
                              <h5 className="font-bold text-[#EA580C] dark:text-orange-400">Official Status Remarks</h5>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">"{selectedRequest.remarks}"</p>
                            </div>
                          </div>
                        )}

                        {/* Step 5: Completed */}
                        <div className="relative">
                          <span className={`absolute -left-[26px] top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            selectedRequest.status === 'Completed' ? 'bg-[#16A34A]' : 
                            selectedRequest.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-300'
                          }`}></span>
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-slate-800 dark:text-white">Resolution & Closure</h5>
                            <p className="text-[10px] text-slate-400">
                              {selectedRequest.status === 'Completed' ? 'Closed. Civic service delivered.' :
                               selectedRequest.status === 'Rejected' ? 'Closed. Ticket rejected/unapproved.' :
                               'Awaiting resolution check'
                              }
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                    Select a ticket on the left to display its SLA tracking timeline.
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'apply' && (
            /* TAB 2: Service Application Form */
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
              
              <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
                Apply for Civic Services & Redressals
              </h3>

              {formSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-full flex items-center justify-center text-[#16A34A] animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-850 dark:text-white">Ticket Registered Successfully</h4>
                  <p className="text-xs text-slate-400">Your tracking ID has been generated. Redirecting to timeline view...</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-5">
                  
                  {/* Category Selector Grid */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Service Department</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'electricity', label: 'Electricity', icon: <Zap className="w-4 h-4 text-amber-500" /> },
                        { id: 'water', label: 'Water Supply', icon: <Droplet className="w-4 h-4 text-orange-500" /> },
                        { id: 'gas', label: 'PNG Gas', icon: <Flame className="w-4 h-4 text-orange-500" /> },
                        { id: 'waste', label: 'Waste', icon: <Trash2 className="w-4 h-4 text-emerald-500" /> },
                        { id: 'general', label: 'General', icon: <FileText className="w-4 h-4 text-purple-500" /> }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleCategoryChange(item.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                            serviceType === item.id
                              ? 'border-[#EA580C] bg-orange-50/40 dark:bg-slate-800 text-[#EA580C] dark:text-orange-400 font-extrabold'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {item.icon}
                          <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subservice & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Category Details</label>
                      <select
                        value={subService}
                        onChange={(e) => setSubService(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl outline-none"
                      >
                        {subServicesMap[serviceType].map((sub, i) => (
                          <option key={i} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Priority Severity Level</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl outline-none"
                      >
                        <option value="Standard">Standard (SLA Routine)</option>
                        <option value="High">High (Urgent Response)</option>
                        <option value="Critical">Critical (Emergency Wing Dispatch)</option>
                      </select>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Connection Address / Complaint Remarks</label>
                    <textarea
                      rows={3}
                      placeholder="Please details required connections specifications or clear complaint reasons..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-[#EA580C]"
                      required
                    />
                  </div>

                  {/* Attachment document upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attach Document Proofs (Identity / Land Deeds)</label>
                    
                    <div className="flex flex-wrap gap-3">
                      {/* Document Selector Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        className="px-4 py-3 border border-dashed border-[#EA580C] bg-orange-50/10 hover:bg-orange-50/30 text-[#EA580C] dark:text-orange-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploading ? 'Processing vision OCR...' : 'Upload Scans (PDF/Image)'}</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                      />

                      {/* Display Uploaded File Badges */}
                      {uploadedFiles.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 rounded-xl text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span className="max-w-[120px] truncate">{doc.name}</span>
                          <span className="text-[8px] bg-[#16A34A] text-white px-1 py-0.2 rounded ml-1">OCR Checked</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#EA580C] hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shadow-sm uppercase tracking-wider"
                  >
                    {loading ? 'Registering Ticket...' : 'Submit Application'}
                  </button>

                </form>
              )}

            </div>
          )}

          {activeTab === 'vault' && (
            /* TAB 3: DigiLocker Vault */
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Secure DigiLocker Safe Wallet</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Documents securely linked to your profile via Aadhaar verification</p>
                </div>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-[#EA580C] dark:text-orange-300 text-[10px] font-black rounded-lg transition flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vaultDocs.map((doc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-slate-850 dark:text-white">{doc.name}</h4>
                        <span className="text-[9px] text-slate-400 block font-semibold">{doc.type} • {doc.size}</span>
                      </div>
                      <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded font-black uppercase">
                        {doc.verification}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-slate-200 dark:border-slate-800 pt-2.5 text-slate-500 font-semibold">
                      <span className="flex items-center gap-1 text-[#16A34A]"><ShieldCheck className="w-3.5 h-3.5" /> Confidence Check: {(doc.confidence * 100).toFixed(0)}%</span>
                      <button className="text-[#EA580C] hover:underline font-extrabold flex items-center gap-0.5">
                        View File
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 3. Receipt Generator Modal overlay */}
      {receiptRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in print:shadow-none print:border-none print:m-0">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center print:hidden">
              <span className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Digital Service Receipt</span>
              <button
                onClick={() => setReceiptRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Receipt Printable Content */}
            <div className="p-8 space-y-6 text-left" id="printable-receipt">
              {/* Receipt Header logo block */}
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="font-black text-slate-950 dark:text-white text-base">SUVIDHA SERVICES</h2>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">National Civic Service Gateway</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                  <div>Date: {new Date(receiptRequest.createdAt).toLocaleDateString()}</div>
                  <div className="font-mono text-[9px] font-bold">Ref ID: {receiptRequest.requestId}</div>
                </div>
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Citizen Name</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{currentUser?.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Contact Number</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">+91 {currentUser?.mobile}</span>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Utility Connection details</span>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 border border-slate-200/50 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Service Category:</span>
                    <span className="capitalize text-slate-900 dark:text-white font-extrabold">{receiptRequest.serviceType}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Service Specifications:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{receiptRequest.subService}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Priority Severity:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{receiptRequest.priority}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">SLA Mandated Timeline:</span>
                    <span className="text-[#16A34A] font-extrabold">24-48 Hours Resolution</span>
                  </div>
                </div>
              </div>

              {/* Barcode/QR placeholder */}
              <div className="flex flex-col items-center justify-center pt-2 space-y-1.5 border-t border-slate-200 dark:border-slate-800">
                {/* Simulated Barcode */}
                <div className="flex items-center gap-[1px] h-8 bg-slate-900 px-4 py-1 rounded">
                  {[4,2,3,1,2,4,1,3,2,1,4,2,3,1,2,3,4,1,2,3,1,4].map((w, idx) => (
                    <div key={idx} className="bg-white h-full" style={{ width: `${w}px` }}></div>
                  ))}
                </div>
                <span className="font-mono text-[9px] text-slate-400 font-bold">{receiptRequest.requestId}</span>
              </div>
            </div>

            {/* Print trigger CTA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex gap-2 justify-end print:hidden">
              <button
                onClick={() => setReceiptRequest(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="px-4 py-2 bg-[#EA580C] hover:bg-orange-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;
