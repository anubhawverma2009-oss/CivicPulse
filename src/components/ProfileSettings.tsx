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
    <div className="bg-[#0B1329] border border-brand-primary/20 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden animate-fadeIn text-text-primary">
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

      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-brand-primary/10 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              National ID & Profile Customization
              <Sparkles className="w-4.5 h-4.5 text-brand-warning animate-pulse" />
            </h2>
            <p className="text-xs text-text-muted">Perform secure scans, change identity proof documents, and manage local ward regions.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-bg-secondary hover:bg-slate-800 text-text-secondary hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" /> Save Credentials
          </button>
        </div>
      </div>

      {/* Strict Limit Warning Header */}
      <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-brand-warning uppercase tracking-wide flex items-center gap-2">
            Verification Rules & Strict Limits
            <span className="text-[10px] bg-brand-warning text-black px-1.5 py-0.2 rounded font-black">IMPORTANT NOTE</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            - Username changes are limited to <strong className="text-white">one (1) max</strong>.
            <br />
            - Document replacements and deletions are limited to a maximum of <strong className="text-brand-warning">three (3) times total</strong>. Currently used: <strong className="text-white">{docChangeCount}/3</strong>.
            <br />
            - <strong className="text-white">Each document replacement requires an official professional reason statement</strong>. Changing documents is tracked for regional accountability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column - Forms */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Profile Icon / Avatar Editor */}
          <div className="bg-bg-secondary/40 p-4 rounded-xl border border-brand-primary/10 space-y-4">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-primary" /> Profile Icon / Avatar
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Main Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-primary p-1 bg-bg-secondary flex items-center justify-center shadow-lg">
                  {editPhotoURL ? (
                    <img 
                      src={editPhotoURL} 
                      referrerPolicy="no-referrer" 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <span className="text-white font-extrabold text-xl uppercase select-none">
                      {editName ? editName.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>
                
                {/* Floating file upload trigger over preview */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
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
              <div className="flex-1 space-y-3 w-full">
                <div className="text-[11px] font-semibold text-text-secondary">Select Preset Avatar:</div>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditPhotoURL(preset.url)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        editPhotoURL === preset.url
                          ? "bg-brand-primary/20 border-brand-primary text-white"
                          : "bg-bg-secondary/60 border-brand-primary/5 text-text-muted hover:text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      {preset.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* File Upload Button */}
                  <label className="px-3 py-1.5 bg-bg-secondary hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all border border-brand-primary/10 cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto select-none">
                    <Camera className="w-3.5 h-3.5" />
                    Upload Image File
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                  </label>

                  {/* Toggle Custom URL Input */}
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className="px-3 py-1.5 bg-bg-secondary hover:bg-slate-800 text-text-secondary hover:text-white rounded-lg text-[11px] font-bold transition-all border border-brand-primary/10 w-full sm:w-auto"
                  >
                    {showCustomUrlInput ? "Hide URL Input" : "Custom Image URL"}
                  </button>
                </div>

                {showCustomUrlInput && (
                  <div className="animate-fadeIn">
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
                      className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Account Role Toggle */}
          <div className="bg-bg-secondary/40 p-4 rounded-xl border border-brand-primary/10 space-y-3">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-primary" /> 1. Select Profile Identity Type
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentRole("citizen");
                }}
                className={`p-3 rounded-xl border transition-all text-left space-y-1 cursor-pointer ${
                  currentRole === "citizen"
                    ? "bg-brand-primary/15 border-brand-primary text-white shadow-md ring-1 ring-brand-primary/20"
                    : "bg-bg-secondary border-brand-primary/5 hover:border-brand-primary/20 text-text-muted hover:text-white"
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Citizen Identity</span>
                  {currentRole === "citizen" && <CheckCircle className="w-4 h-4 text-brand-primary" />}
                </div>
                <p className="text-[10px] leading-tight opacity-80">Report local ward issues, vote on local resolution polls, and build community stats.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentRole("authority");
                }}
                className={`p-3 rounded-xl border transition-all text-left space-y-1 cursor-pointer ${
                  currentRole === "authority"
                    ? "bg-brand-primary/15 border-brand-primary text-white shadow-md ring-1 ring-brand-primary/20"
                    : "bg-bg-secondary border-brand-primary/5 hover:border-brand-primary/20 text-text-muted hover:text-white"
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Official Authority</span>
                  {currentRole === "authority" && <CheckCircle className="w-4 h-4 text-brand-primary" />}
                </div>
                <p className="text-[10px] leading-tight opacity-80">Verify local issues, authorize city worker crew dispatches, log professional work.</p>
              </button>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="bg-bg-secondary/20 p-4 rounded-xl border border-brand-primary/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">2. Profile Metadata</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Enter full legal name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 flex items-center justify-between">
                  <span>Unique Username Prefix</span>
                  {hasChangedUsernameOnce && (
                    <span className="text-[9px] text-brand-critical font-semibold uppercase tracking-wider flex items-center gap-0.5">
                      🔒 Changed once (Locked)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-text-muted">@</span>
                  <input
                    type="text"
                    disabled={hasChangedUsernameOnce}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className={`w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg pl-7 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary font-mono ${
                      hasChangedUsernameOnce ? "opacity-60 bg-bg-tertiary cursor-not-allowed border-brand-critical/10" : ""
                    }`}
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            {/* GPS Location & custom text option */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1 flex items-center justify-between">
                  <span>GPS Tracked Location</span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-[10px] text-brand-primary hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching GPS...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3" /> Detect coordinates
                      </>
                    )}
                  </button>
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg pl-3 pr-10 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Assi Ghat, Varanasi"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="absolute right-2.5 top-2.5 text-text-muted hover:text-white"
                  >
                    <Navigation className="w-4 h-4 text-brand-primary" />
                  </button>
                </div>
                {gpsStatus && (
                  <p className="text-[10px] text-brand-primary font-mono mt-1 animate-pulse">{gpsStatus}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase">
                    Community Bio / Statement
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditBio("The world's largest social media company is going to have a global CEO.")}
                    className="text-[10px] text-brand-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    title="Insert preset bio statement"
                  >
                    ✨ Use Global Statement
                  </button>
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary resize-none"
                  placeholder="e.g. The world's largest social media company is going to have a global CEO."
                />
              </div>
            </div>

            {/* Authority Custom designation details */}
            {currentRole === "authority" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-primary/5 pt-3 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Department Division
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Authority Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-[#0E1528] border border-brand-primary/15 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Change History Logs for Transparency */}
          {user.docChangeHistory && user.docChangeHistory.length > 0 && (
            <div className="bg-bg-secondary/10 p-4 rounded-xl border border-brand-primary/5 space-y-2">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Document Replacement Audit Trails ({user.docChangeHistory.length})
              </h4>
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {user.docChangeHistory.map((item, idx) => (
                  <div key={idx} className="bg-black/40 p-2 rounded text-[10px] space-y-0.5 border border-white/5">
                    <div className="flex justify-between font-mono text-text-muted">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span className="text-brand-warning">Limit: {idx + 1}/3</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Reason stated: </span>
                      <span className="text-white font-medium italic">"{item.reason}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right column - Scanner & Verification Sequence */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0E1528] p-4 rounded-xl border border-brand-primary/15 space-y-4">
            
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-brand-warning animate-pulse" /> Identity Proof verification
              </h3>
              <span className="text-[10px] font-mono text-brand-primary font-bold">Max 3 Deletes</span>
            </div>

            {/* Step 1: Select identity document first */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1.5">
                  {currentRole === "citizen" ? "Select National Identity First" : "Select Government Proof Type"}
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
                  className="w-full bg-[#0B1329] border border-brand-primary/20 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
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
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Enter Custom Document Name
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
                    className="w-full bg-[#0B1329] border border-brand-primary/20 rounded-lg px-3 py-2.2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Driving License, Passport"
                  />
                </div>
              )}

              {/* Regions contained inside the document */}
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Region / Ward Contained inside document
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-[#0B1329] border border-brand-primary/20 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                >
                  {REGIONAL_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {selectedZone === "Custom Zone (Add manually)" && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Type Custom Region / Ward Address
                  </label>
                  <input
                    type="text"
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    className="w-full bg-[#0B1329] border border-brand-primary/20 rounded-lg px-3 py-2.2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. Chetganj Ward, Varanasi"
                  />
                </div>
              )}
            </div>

            {/* Error alerts */}
            {verificationError && (
              <div className="bg-brand-critical/10 border border-brand-critical/20 rounded-lg p-3 text-[11px] text-brand-critical space-y-1 animate-fadeIn">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5 text-brand-critical" /> verification failed
                </p>
                <p>{verificationError}</p>
              </div>
            )}

            {/* Document Replacement Reason Form */}
            {showReasonForm && (
              <div className="bg-brand-warning/10 border border-brand-warning/20 p-4 rounded-xl space-y-3 animate-fadeIn">
                <h4 className="text-xs font-bold text-brand-warning uppercase flex items-center gap-1.5">
                  <Info className="w-4.5 h-4.5 text-brand-warning" /> Provide Replacement Reason
                </h4>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  You are performing action: <strong className="text-white font-mono uppercase">{pendingAction}</strong>. 
                  Changing verified documents is tracked for regional safety. Limit remaining: <strong className="text-white">{3 - docChangeCount} more</strong>.
                </p>
                
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Enter detailed reason (e.g., Previous Aadhaar card expired, wrong address correction, PAN card update)..."
                  className="w-full bg-black/60 border border-brand-warning/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-warning resize-none h-20"
                />

                <div className="flex justify-end gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReasonForm(false);
                      setPendingAction(null);
                      setChangeReason("");
                    }}
                    className="px-3 py-1 bg-bg-secondary hover:bg-slate-800 text-text-secondary hover:text-white rounded"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDocDeleteOrChange}
                    className="px-3 py-1 bg-brand-warning text-black font-bold rounded hover:bg-brand-warning/90 transition-all"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            )}

            {/* Active scanner view */}
            {isScanning ? (
              <div className="relative bg-black rounded-xl p-4 border border-brand-success/30 overflow-hidden h-64 flex flex-col justify-between shadow-2xl">
                {/* Simulated Moving Laser */}
                <div className="absolute left-0 w-full h-1.5 bg-brand-success shadow-[0_0_20px_#10B981] scanner-laser-line z-10" />

                <div className="z-20 flex justify-between items-start">
                  <span className="text-[10px] text-brand-success font-mono uppercase tracking-widest flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-success" /> OCR Scan In Progress
                  </span>
                  <span className="text-xs text-white font-mono font-bold bg-brand-success/20 px-2 py-0.5 rounded">
                    {scanProgress}%
                  </span>
                </div>

                {/* Simulated active logs terminal */}
                <div className="z-20 bg-black/70 p-2.5 rounded border border-white/5 font-mono text-[9px] text-brand-success h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight animate-fadeIn">{log}</div>
                  ))}
                </div>

                {/* Lower scanner bar indicator */}
                <div className="z-20 w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-success h-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : isDocumentVerified && scannedFile ? (
              /* Verified View with option to Delete or Replace up to 3 times */
              <div className="bg-brand-success/10 border border-brand-success/20 rounded-xl p-4 space-y-4 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-brand-success shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-brand-success uppercase tracking-wider">
                      Identity Document Verified
                    </h4>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Verified Doc: <strong className="text-white font-mono">{scannedFile}</strong>
                    </p>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Assigned Ward Region: <strong className="text-white">
                        {selectedZone === "Custom Zone (Add manually)" ? (customZone || "Custom Ward") : selectedZone}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-primary/10 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInitiateDocDeleteOrChange("delete")}
                    className="flex-1 py-2 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Document ({3 - docChangeCount} Left)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateDocDeleteOrChange("replace")}
                    className="flex-1 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Replace Doc ({3 - docChangeCount} Left)
                  </button>
                </div>

                <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1">
                  <span>REGISTRY: IN-VAR-003</span>
                  <span>CONFIDENCE: 99.8%</span>
                </div>
              </div>
            ) : (
              /* Ready for scanning upload */
              <div className="border-2 border-dashed border-brand-primary/25 hover:border-brand-primary/45 bg-bg-secondary/25 p-6 rounded-xl text-center space-y-4 transition-colors">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-full mx-auto flex items-center justify-center text-brand-primary">
                  {currentRole === "citizen" ? <FileSpreadsheet className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">
                    {currentRole === "citizen" ? `Awaiting ${selectedDocType} Scan` : `Awaiting ${selectedAuthorityProofType} Proof`}
                  </h4>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Instantly sweep the credential layout to confirm details and update verified badge status.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  <label className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-brand-primary to-blue-600 text-white font-bold text-xs rounded-lg shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 select-none">
                    <Camera className="w-4 h-4" />
                    Upload & Scan Document
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
                    className="w-full sm:w-auto px-3.5 py-2 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    Simulate Wrong Doc
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
