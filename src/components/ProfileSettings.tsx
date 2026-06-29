import React, { useState, useEffect } from "react";
import { UserProfile as UserProfileType } from "../types";
import { 
  Shield, Loader2, Navigation, 
  Camera, CheckCircle, AlertTriangle, RefreshCw, Info,
  ArrowLeft, Save, Sparkles, Trash2,
  FileSpreadsheet, ClipboardCheck, AlertCircle
} from "lucide-react";

interface ProfileSettingsProps {
  user: UserProfileType;
  onUpdateUser: (updatedUser: UserProfileType) => void;
  onClose: () => void;
}

// Preset configurations for professional representation
const CITIZEN_DOC_OPTIONS = [
  "Aadhaar Card",
  "PAN Card",
  "Voter ID Card",
  "Custom Identity"
];

const AUTHORITY_PROOF_OPTIONS = [
  "Municipal Commissioner Seal",
  "Regional Ward Officer ID",
  "Urban Development Certificate",
  "Custom Certificate Proof"
];

const REGIONAL_ZONES = [
  "Varanasi South Zone",
  "Varanasi North Zone",
  "Assi Ghat Zone",
  "Dashashwamedh Zone",
  "Custom Zone (Add manually)"
];

const AVATAR_PRESETS = [
  { name: "Sarnath", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Sarnath" },
  { name: "Ganga", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ganga" },
  { name: "Kashi", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Kashi" },
  { name: "Assi", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Assi" },
  { name: "Varuna", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Varuna" },
];

export default function ProfileSettings({ user, onUpdateUser, onClose }: ProfileSettingsProps) {
  // Input form states
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(user.username || "");
  const [editBio, setEditBio] = useState(user.bio || "");
  const [editLocation, setEditLocation] = useState(user.location);
  const [currentRole, setCurrentRole] = useState<"citizen" | "authority">(user.role);
  const [editPhotoURL, setEditPhotoURL] = useState(user.photoURL || "");
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customPhotoURL, setCustomPhotoURL] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Identity select states (for citizen)
  const [selectedDocType, setSelectedDocType] = useState<string>(user.docType || "Aadhaar Card");
  const [customDocType, setCustomDocType] = useState<string>(user.customDocType || "");

  // Authority select states (for officer)
  const [selectedAuthorityProofType, setSelectedAuthorityProofType] = useState<string>(user.authorityProofType || "Municipal Commissioner Seal");
  const [customAuthorityProofType, setCustomAuthorityProofType] = useState<string>(user.customAuthorityProofType || "");
  const [department, setDepartment] = useState(user.department || "Urban Infrastructure & Wastes");
  const [designation, setDesignation] = useState(user.designation || "Deputy Municipal Commissioner");

  // Document region / zone options
  const [selectedZone, setSelectedZone] = useState<string>(user.docWardsRegion || "Assi Ghat Zone");
  const [customZone, setCustomZone] = useState<string>(user.customDocWardsRegion || "");

  // Tracking change counts (max 3)
  const [docChangeCount, setDocChangeCount] = useState<number>(user.docChangeCount || 0);
  const [changeReason, setChangeReason] = useState<string>("");
  const [showReasonForm, setShowReasonForm] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"delete" | "replace" | null>(null);

  // GPS Location states
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scannedFile, setScannedFile] = useState<string | null>(null);
  
  // Real-time verification checks
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isDocumentVerified, setIsDocumentVerified] = useState<boolean>(user.documentVerified || false);

  const hasChangedUsernameOnce = (user.usernameChangesCount || 0) >= 1;

  // Track if current document is considered "scanned"
  useEffect(() => {
    if (user.docType) {
      setSelectedDocType(CITIZEN_DOC_OPTIONS.includes(user.docType) ? user.docType : "Custom Identity");
      if (!CITIZEN_DOC_OPTIONS.includes(user.docType)) {
        setCustomDocType(user.docType);
      }
    }
    if (user.authorityProofType) {
      setSelectedAuthorityProofType(AUTHORITY_PROOF_OPTIONS.includes(user.authorityProofType) ? user.authorityProofType : "Custom Certificate Proof");
      if (!AUTHORITY_PROOF_OPTIONS.includes(user.authorityProofType)) {
        setCustomAuthorityProofType(user.authorityProofType);
      }
    }
    if (user.docWardsRegion) {
      setSelectedZone(REGIONAL_ZONES.includes(user.docWardsRegion) ? user.docWardsRegion : "Custom Zone (Add manually)");
      if (!REGIONAL_ZONES.includes(user.docWardsRegion)) {
        setCustomZone(user.docWardsRegion);
      }
    }
  }, [user]);

  // Handle GPS Ward detection
  const handleDetectLocation = () => {
    setIsLocating(true);
    setGpsStatus("🛰️ Accessing GPS Satellites...");
    
    setTimeout(() => {
      setGpsStatus("🛰️ Accessing Varanasi grid systems...");
      setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setGpsStatus(`📍 Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              
              setTimeout(() => {
                const randomWards = [
                  "Assi Ghat Ward, Varanasi",
                  "Dashashwamedh Ward, Varanasi",
                  "Kashi Vishwanath Ward, Varanasi",
                  "Godowlia Ward, Varanasi",
                  "Sigra Ward, Varanasi",
                  "Lanka Ward, Varanasi"
                ];
                const closestWard = randomWards[Math.floor(Math.random() * randomWards.length)];
                setEditLocation(closestWard);
                setIsLocating(false);
                setGpsStatus("");
              }, 800);
            },
            () => {
              simulateVaranasiGps();
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          simulateVaranasiGps();
        }
      }, 800);
    }, 800);
  };

  const simulateVaranasiGps = () => {
    setGpsStatus("🛰️ Accessing regional cellular antennas...");
    setTimeout(() => {
      const randomWards = [
        "Assi Ghat Ward, Varanasi",
        "Dashashwamedh Ward, Varanasi",
        "Kashi Vishwanath Ward, Varanasi",
        "Sigra Ward, Varanasi"
      ];
      const closestWard = randomWards[Math.floor(Math.random() * randomWards.length)];
      setEditLocation(closestWard);
      setIsLocating(false);
      setGpsStatus("");
    }, 1000);
  };

  // Perform document analysis & verification scan
  const handleStartScan = (fileSelected: string, docName: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setVerificationError(null);
    setScanLogs(["[SCANNER] OCR scanning engine rebooting..."]);

    const finalZoneName = selectedZone === "Custom Zone (Add manually)" ? (customZone || "Custom Region") : selectedZone;

    const logs = [
      `[SCANNER] Sweeping document file "${fileSelected}" with green laser...`,
      `[OCR] Parsing fields matching profile name: "${editName}"...`,
      `[LOCATION] Stated Region verified: "${finalZoneName}"`,
      "[SECURITY] Validating watermarks & holographic stamps...",
      "[REGISTRY] Contacting Varanasi UIDAI Database Node for citizen status...",
      "[AI VERIFY] Cryptographic certificate hash sum matches registry.",
      "[COMPLETE] Scan matches credentials! ID document fully authenticated."
    ];

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 10;
        
        if (next === 20) setScanLogs(p => [...p, logs[0]]);
        if (next === 40) setScanLogs(p => [...p, logs[1], logs[2]]);
        if (next === 60) setScanLogs(p => [...p, logs[3]]);
        if (next === 80) setScanLogs(p => [...p, logs[4]]);
        if (next === 90) setScanLogs(p => [...p, logs[5]]);
        if (next === 100) {
          setScanLogs(p => [...p, logs[6]]);
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setIsDocumentVerified(true);
            setScannedFile(fileSelected);
          }, 600);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  // Simulated Document Upload File Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const selectedDoc = currentRole === "citizen" ? selectedDocType : selectedAuthorityProofType;
      
      // Professional consideration: Block scanning if name contains "wrong" or file is obviously invalid
      if (file.name.toLowerCase().includes("wrong") || file.name.toLowerCase().includes("invalid")) {
        setVerificationError("❌ Security Threat Detected: Wrong document uploaded. System rejected the verification handshake.");
        setScannedFile(null);
        setIsDocumentVerified(false);
        return;
      }
      
      handleStartScan(file.name, selectedDoc);
    }
  };

  // Rejection simulation (Wrong document check)
  const handleForceReject = () => {
    setVerificationError("❌ Verification Failed: Document rejected. Information mismatched. Please upload a correct document.");
    setScannedFile(null);
    setIsDocumentVerified(false);
  };

  // Check the maximum of three deletes/replacements limit
  const handleInitiateDocDeleteOrChange = (actionType: "delete" | "replace") => {
    if (docChangeCount >= 3) {
      alert("Strict Limit Reached: You have already deleted or changed your document three times. Further edits are locked.");
      return;
    }
    setPendingAction(actionType);
    setShowReasonForm(true);
  };

  const handleConfirmDocDeleteOrChange = () => {
    if (!changeReason.trim()) {
      alert("Please provide a professional reason for changing or deleting this document.");
      return;
    }

    const nextCount = docChangeCount + 1;
    setDocChangeCount(nextCount);

    // Record to history list
    const previousDoc = scannedFile || "None";
    const historyItem = {
      date: new Date().toISOString(),
      reason: changeReason,
      previousDoc: previousDoc,
      newDoc: pendingAction === "delete" ? "Deleted" : "Replaced"
    };

    const updatedHistory = user.docChangeHistory ? [...user.docChangeHistory, historyItem] : [historyItem];

    setScannedFile(null);
    setIsDocumentVerified(false);
    setVerificationError(null);
    setShowReasonForm(false);
    setChangeReason("");
    setPendingAction(null);

    // Instantly sync
    onUpdateUser({
      ...user,
      docChangeCount: nextCount,
      docChangeHistory: updatedHistory,
      documentVerified: false,
      docType: undefined,
      authorityProofType: undefined
    });
  };

  const handleSaveAll = () => {
    if (!editName.trim()) {
      alert("Name cannot be empty!");
      return;
    }

    const currentUsernameClean = (user.username || "").trim();
    const editUsernameClean = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const isUsernameChanging = editUsernameClean !== currentUsernameClean;
    const currentChangesCount = user.usernameChangesCount || 0;

    if (isUsernameChanging && currentChangesCount >= 1) {
      alert("The username can only be changed once! This action is strictly locked.");
      return;
    }

    const nextChangesCount = isUsernameChanging ? currentChangesCount + 1 : currentChangesCount;

    // Determine final values
    const finalDocType = currentRole === "citizen" 
      ? (selectedDocType === "Custom Identity" ? customDocType : selectedDocType)
      : undefined;

    const finalAuthorityProofType = currentRole === "authority"
      ? (selectedAuthorityProofType === "Custom Certificate Proof" ? customAuthorityProofType : selectedAuthorityProofType)
      : undefined;

    const finalZone = selectedZone === "Custom Zone (Add manually)" ? customZone : selectedZone;

    onUpdateUser({
      ...user,
      name: editName,
      username: editUsernameClean,
      usernameChangesCount: nextChangesCount,
      bio: editBio,
      photoURL: editPhotoURL,
      location: editLocation,
      role: currentRole,
      department: currentRole === "authority" ? department : undefined,
      designation: currentRole === "authority" ? designation : undefined,
      documentVerified: isDocumentVerified,
      docType: finalDocType,
      customDocType: selectedDocType === "Custom Identity" ? customDocType : undefined,
      authorityProofType: finalAuthorityProofType,
      customAuthorityProofType: selectedAuthorityProofType === "Custom Certificate Proof" ? customAuthorityProofType : undefined,
      docWardsRegion: finalZone,
      customDocWardsRegion: selectedZone === "Custom Zone (Add manually)" ? customZone : undefined,
      docChangeCount: docChangeCount
    });

    onClose();
  };

  return (
    <div className="bg-[#0B0E14] border border-white/10 rounded-[24px] p-6 space-y-6 shadow-2xl relative overflow-hidden animate-fadeIn text-text-primary">
      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        .scanner-laser-line {
          animation: scanSweep 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative gradient blur overlay */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Block & Sticky Action Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/5 py-4 px-6 -mx-6 -mt-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-900 rounded-xl text-text-muted hover:text-white transition-all cursor-pointer active:scale-95 border border-transparent hover:border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold font-display text-white flex items-center gap-2 tracking-tight">
              National ID & Profile Customization
              <Sparkles className="w-4.5 h-4.5 text-brand-warning animate-pulse" />
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Perform secure scans, authenticate national documents, and manage local ward regions.</p>
          </div>
        </div>
        
        {/* Actions bar always visible */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onClose}
            className="flex-1 md:flex-initial h-10 px-5 bg-slate-950/40 hover:bg-slate-900 border border-white/5 text-text-secondary hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 md:flex-initial h-10 flex items-center justify-center gap-2 px-5 bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-brand-primary/20 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Credentials
          </button>
        </div>
      </div>

      {/* Strict Limit Warning Header - Compact Security Notification (~40% reduced height) */}
      <div className="bg-brand-warning/5 border border-brand-warning/15 rounded-2xl p-4 flex items-start gap-3.5 text-text-secondary max-w-full">
        <Shield className="w-5 h-5 text-brand-warning shrink-0 mt-0.5" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <div className="font-extrabold text-brand-warning uppercase tracking-wider text-[9px] mb-0.5 flex items-center gap-1.5">
            Security Clearance & Audit Rules
            <span className="text-[8px] bg-brand-warning/20 text-brand-warning px-1.5 py-0.5 rounded font-black border border-brand-warning/20">REGISTRY CODE IN-VAR-003</span>
          </div>
          <p className="text-text-muted">
            Username changes are strictly limited to <strong className="text-white">one (1) maximum</strong>. Document replacements are limited to a maximum of <strong className="text-brand-warning">three (3) times total</strong> (currently used: <strong className="text-white">{docChangeCount}/3</strong>). Action histories are archived under regional transparency protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column - Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Profile Icon / Avatar Editor */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-6 shadow-md hover:border-white/10 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-primary" /> Profile Icon / Avatar
              </label>
              <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                Digital ID Photo
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Main Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-primary p-1 bg-slate-900 flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-brand-primary/20">
                  {editPhotoURL ? (
                    <img 
                      src={editPhotoURL} 
                      referrerPolicy="no-referrer" 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover rounded-xl" 
                    />
                  ) : (
                    <span className="text-white font-black text-2xl uppercase select-none">
                      {editName ? editName.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>
                
                {/* Floating file upload trigger over preview */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                  />
                </label>
              </div>
              
              {/* Presets and URL inputs */}
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Select Preset Avatar</h4>
                  <p className="text-[11px] text-text-muted">Or upload a custom digital identity face scan file</p>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditPhotoURL(preset.url)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                        editPhotoURL === preset.url
                          ? "bg-brand-primary/20 border-brand-primary text-white shadow-sm"
                          : "bg-slate-950/40 border-white/5 text-text-muted hover:text-white hover:border-white/15"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      {preset.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* File Upload Button */}
                  <label className="h-10 px-4 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] flex-1">
                    <Camera className="w-4 h-4" />
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                  </label>

                  {/* Remove image secondary button */}
                  {editPhotoURL && (
                    <button
                      type="button"
                      onClick={() => setEditPhotoURL("")}
                      className="h-10 px-4 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical hover:text-brand-critical border border-brand-critical/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] flex-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Image
                    </button>
                  )}

                  {/* Toggle Custom URL Input */}
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className="h-10 px-4 bg-slate-950/40 hover:bg-slate-900 border border-white/5 text-text-secondary hover:text-white rounded-xl text-xs font-bold transition-all flex-1"
                  >
                    {showCustomUrlInput ? "Hide Custom URL" : "Custom Image URL"}
                  </button>
                </div>

                {showCustomUrlInput && (
                  <div className="animate-fadeIn mt-3">
                    <input
                      type="text"
                      placeholder="Paste image URL (e.g. https://example.com/avatar.png)"
                      value={customPhotoURL}
                      onChange={(e) => {
                        setCustomPhotoURL(e.target.value);
                        if (e.target.value.trim()) {
                          setEditPhotoURL(e.target.value.trim());
                        }
                      }}
                      className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Account Role Toggle */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 shadow-md hover:border-white/10 transition-all duration-300">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-primary" /> 1. Select Profile Identity Type
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentRole("citizen");
                }}
                className={`p-5 rounded-2xl border transition-all text-left space-y-2 cursor-pointer relative overflow-hidden group active:scale-[0.98] ${
                  currentRole === "citizen"
                    ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-brand-primary/5"
                    : "bg-slate-950 border-white/5 hover:border-white/15 text-text-muted hover:text-white"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Citizen Identity</span>
                  {currentRole === "citizen" && <CheckCircle className="w-4 h-4 text-brand-primary" />}
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  Report civic incidents in your local ward, participate in active resolution votes, and earn civic points.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentRole("authority");
                }}
                className={`p-5 rounded-2xl border transition-all text-left space-y-2 cursor-pointer relative overflow-hidden group active:scale-[0.98] ${
                  currentRole === "authority"
                    ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-brand-primary/5"
                    : "bg-slate-950 border-white/5 hover:border-white/15 text-text-muted hover:text-white"
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Municipal Authority</span>
                  {currentRole === "authority" && <CheckCircle className="w-4 h-4 text-brand-primary" />}
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  Verify community reports, dispatch repair teams, and authorize administrative resolutions.
                </p>
              </button>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-6 shadow-md hover:border-white/10 transition-all duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary">
                2. Profile Metadata
              </h3>
              <span className="text-[10px] text-text-muted font-bold font-mono">
                Government Registry Sync
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    Full legal name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    placeholder="Enter full legal name"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                      Unique Username
                    </label>
                    {hasChangedUsernameOnce && (
                      <span className="text-[9px] text-brand-critical font-bold uppercase tracking-wider flex items-center gap-1">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-xs text-text-muted font-mono select-none">@</span>
                    <input
                      type="text"
                      disabled={hasChangedUsernameOnce}
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className={`w-full h-10 bg-slate-950 border border-white/10 rounded-xl pl-8 pr-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono ${
                        hasChangedUsernameOnce ? "opacity-50 bg-slate-950/80 cursor-not-allowed border-brand-critical/10" : ""
                      }`}
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              {/* GPS Location & custom text option */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    GPS Tracked Ward Location
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-[10px] text-brand-primary hover:text-blue-400 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3" /> Auto-Detect
                      </>
                    )}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl pl-4 pr-10 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    placeholder="e.g. Assi Ghat Ward, Varanasi"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="absolute right-3.5 top-3 text-text-muted hover:text-white transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-brand-primary hover:scale-110 active:scale-95 transition-all" />
                  </button>
                </div>
                {gpsStatus && (
                  <p className="text-[10px] text-brand-primary font-mono mt-1 animate-pulse">{gpsStatus}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    Community Statement / Bio
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditBio("The world's largest social media company is going to have a global CEO.")}
                    className="text-[10px] text-brand-primary hover:text-blue-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Insert preset bio statement"
                  >
                    ✨ Use Global Preset
                  </button>
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
                  placeholder="Introduce your civic goals to the local community..."
                />
              </div>

              {/* Authority Custom designation details */}
              {currentRole === "authority" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                      Department Division
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                      Authority Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column - Scanner & Verification Sequence */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-6 shadow-md hover:border-white/10 transition-all duration-300">
            
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-warning animate-pulse" /> Identity Verification
              </h3>
              <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                Safety Registry
              </span>
            </div>

            {/* Step 1: Select identity document first */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                  {currentRole === "citizen" ? "Identity Document" : "Official Proof Document"}
                </label>
                <select
                  value={currentRole === "citizen" ? selectedDocType : selectedAuthorityProofType}
                  onChange={(e) => {
                    if (currentRole === "citizen") {
                      setSelectedDocType(e.target.value);
                    } else {
                      setSelectedAuthorityProofType(e.target.value);
                    }
                  }}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  {currentRole === "citizen" ? (
                    CITIZEN_DOC_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))
                  ) : (
                    AUTHORITY_PROOF_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Custom Input field if Custom chosen */}
              {((currentRole === "citizen" && selectedDocType === "Custom Identity") ||
                (currentRole === "authority" && selectedAuthorityProofType === "Custom Certificate Proof")) && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    Custom Document Name
                  </label>
                  <input
                    type="text"
                    value={currentRole === "citizen" ? customDocType : customAuthorityProofType}
                    onChange={(e) => {
                      if (currentRole === "citizen") {
                        setCustomDocType(e.target.value);
                      } else {
                        setCustomAuthorityProofType(e.target.value);
                      }
                    }}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    placeholder="e.g. Passport, Driving License"
                  />
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Regions contained inside the document */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                  Registry Ward / Region
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                >
                  {REGIONAL_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {selectedZone === "Custom Zone (Add manually)" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-[10px] font-black text-text-secondary uppercase tracking-wider">
                    Custom Region / Ward Name
                  </label>
                  <input
                    type="text"
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Chetganj Ward, Varanasi"
                  />
                </div>
              )}
            </div>

            {/* Error alerts */}
            {verificationError && (
              <div className="bg-brand-critical/10 border border-brand-critical/20 rounded-xl p-4 text-[11px] text-brand-critical space-y-1 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-brand-critical" /> verification failed
                </p>
                <p className="text-text-secondary leading-relaxed">{verificationError}</p>
              </div>
            )}

            {/* Document Replacement Reason Form */}
            {showReasonForm && (
              <div className="bg-brand-warning/10 border border-brand-warning/20 p-5 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-brand-warning shrink-0" />
                  <h4 className="text-xs font-black text-brand-warning uppercase tracking-wider">
                    Document Swap Justification
                  </h4>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Action trigger: <strong className="text-white uppercase font-mono">{pendingAction}</strong>. 
                  Security limit remains: <strong className="text-white font-mono">{3 - docChangeCount} adjustments left</strong>.
                </p>
                
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="State formal administrative reason (e.g., mismatch corrections, regional renewal)..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/20 transition-all h-24 resize-none"
                />

                <div className="flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReasonForm(false);
                      setPendingAction(null);
                      setChangeReason("");
                    }}
                    className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-text-secondary hover:text-white rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDocDeleteOrChange}
                    className="h-9 px-4 bg-brand-warning hover:bg-amber-600 text-black font-extrabold rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Active scanner view */}
            {isScanning ? (
              <div className="relative bg-black rounded-2xl p-5 border border-brand-success/30 overflow-hidden h-64 flex flex-col justify-between shadow-2xl">
                {/* Simulated Moving Laser */}
                <div className="absolute left-0 w-full h-1 bg-brand-success shadow-[0_0_20px_#10B981] scanner-laser-line z-10" />

                <div className="z-20 flex justify-between items-start">
                  <span className="text-[10px] text-brand-success font-mono uppercase tracking-widest flex items-center gap-2 font-black">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-success" /> Scanning Live Bio-Metrics
                  </span>
                  <span className="text-xs text-white font-mono font-bold bg-brand-success/20 px-2.5 py-1 rounded-lg">
                    {scanProgress}% Ready
                  </span>
                </div>

                {/* Simulated active logs terminal */}
                <div className="z-20 bg-slate-950/90 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-brand-success h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight animate-fadeIn">{log}</div>
                  ))}
                </div>

                {/* Lower scanner bar indicator */}
                <div className="z-20 w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-brand-success h-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : isDocumentVerified && scannedFile ? (
              /* Verified View with option to Delete or Replace up to 3 times */
              <div className="bg-brand-success/5 border border-brand-success/20 rounded-2xl p-5 space-y-5 animate-fadeIn">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-brand-success shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-brand-success bg-brand-success/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-success/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" /> Government Verified
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-text-muted leading-normal">
                        Credentials verified successfully using matching biometric databases.
                      </div>
                      <div className="text-[11px] text-white font-mono bg-slate-950/40 p-2 rounded-lg border border-white/5 select-all">
                        File: {scannedFile}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleInitiateDocDeleteOrChange("delete")}
                    className="h-10 px-4 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] border border-brand-critical/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({3 - docChangeCount} left)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateDocDeleteOrChange("replace")}
                    className="h-10 px-4 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] border border-brand-primary/20"
                  >
                    <RefreshCw className="w-4 h-4" /> Replace ({3 - docChangeCount} left)
                  </button>
                </div>

                <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1">
                  <span>REGISTRY DATABASE: ACTIVE</span>
                  <span>HANDSHAKE SECURE</span>
                </div>
              </div>
            ) : (
              /* Ready for scanning upload */
              <div className="border border-dashed border-white/10 hover:border-brand-primary/30 bg-slate-950/40 p-8 rounded-2xl text-center space-y-4 transition-all duration-300">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-full mx-auto flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner">
                  {currentRole === "citizen" ? <FileSpreadsheet className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {currentRole === "citizen" ? `Awaiting ${selectedDocType} Scan` : `Awaiting ${selectedAuthorityProofType} Proof`}
                  </h4>
                  <p className="text-[11px] text-text-muted leading-relaxed max-w-xs mx-auto">
                    Scan your legal biometric identity to confirm citizen safety status instantly.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 pt-2">
                  <label className="h-10 px-4 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] flex-1">
                    <Camera className="w-4 h-4" />
                    Upload & Scan ID
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                  
                  {/* Option to test rejection / wrong document failure */}
                  <button
                    type="button"
                    onClick={handleForceReject}
                    className="h-10 px-4 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical font-bold rounded-xl text-xs transition-all cursor-pointer border border-brand-critical/25 active:scale-[0.98] flex-1"
                  >
                    Mismatched Scan
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Audit Trail list if populated */}
          {user.docChangeHistory && user.docChangeHistory.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4 shadow-md hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Government Replacement Registry Logs
                </h4>
                <span className="text-[10px] font-mono font-semibold text-text-muted">
                  Archived Audit ({user.docChangeHistory.length})
                </span>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {user.docChangeHistory.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl space-y-2 border border-white/5 animate-fadeIn">
                    <div className="flex justify-between font-mono text-[9px] text-text-muted">
                      <span>{new Date(item.date).toLocaleString()}</span>
                      <span className="text-brand-warning font-black">Adjust #{idx + 1}</span>
                    </div>
                    <div className="text-[10px] text-text-secondary leading-relaxed">
                      <span className="text-text-muted font-bold">Reason stated:</span>{" "}
                      <span className="text-white italic font-medium">"{item.reason}"</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-text-muted pt-1 border-t border-white/5">
                      <span>Prev: {item.previousDoc}</span>
                      <span>New: {item.newDoc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
