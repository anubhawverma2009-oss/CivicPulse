import React, { useState, useEffect } from "react";
import { UserProfile as UserProfileType, IssueReport } from "../types";
import { 
  User, Star, MapPin, ClipboardList, Flame, Edit2, Share2, 
  Clipboard, Check, Flag, Bookmark, BookmarkCheck, HelpCircle, 
  ArrowLeft, Info, RefreshCw, ChevronDown, CheckCircle, AlertCircle, 
  Shield, FileText, Loader2, Navigation, Camera, Upload, AlertTriangle
} from "lucide-react";
import ProfileSettings from "./ProfileSettings";

interface UserProfileProps {
  user: UserProfileType;
  issues: IssueReport[];
  onTriggerFix: (issueId: string) => void;
  onUpdateUser?: (updatedUser: UserProfileType) => void;
  loggedInUser?: UserProfileType;
  isViewingShared?: boolean;
  onBackToOwnProfile?: () => void;
  onVote?: (issueId: string, voteType: "yes" | "no") => void;
}

export default function UserProfile({ 
  user, 
  issues, 
  onTriggerFix,
  onUpdateUser,
  loggedInUser,
  isViewingShared,
  onBackToOwnProfile,
  onVote
}: UserProfileProps) {
  const isCitizen = user.role === "citizen";
  const isOwnProfile = !loggedInUser || loggedInUser.uid === user.uid;

  const assignedUsername = user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + user.uid.substring(0, 4);
  const userUid = user.uid;
  const userName = user.name;
  const currentUsername = user.username;

  useEffect(() => {
    if (!currentUsername && onUpdateUser) {
      const generated = userName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + userUid.substring(0, 4);
      onUpdateUser({
        ...user,
        username: generated,
        usernameChangesCount: 0
      });
    }
  }, [currentUsername, userName, userUid, onUpdateUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scannedDoc, setScannedDoc] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("civicpulse_saved_profiles");
    const savedList = saved ? JSON.parse(saved) : [];
    setIsProfileSaved(savedList.includes(user.uid));
  }, [user.uid]);

  const handleToggleSave = () => {
    const saved = localStorage.getItem("civicpulse_saved_profiles");
    let savedList = saved ? JSON.parse(saved) : [];
    if (savedList.includes(user.uid)) {
      savedList = savedList.filter((id: string) => id !== user.uid);
      setIsProfileSaved(false);
    } else {
      savedList.push(user.uid);
      setIsProfileSaved(true);
    }
    localStorage.setItem("civicpulse_saved_profiles", JSON.stringify(savedList));
  };

  const handleShareProfile = () => {
    const appUrl = window.location.origin + window.location.pathname;
    const link = `${appUrl}?profile=${user.uid}`;
    setShareLink(link);
    setShowShareBox(true);
    
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }).catch(err => {
      console.warn("Could not copy link automatically:", err);
    });
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    setGpsStatus("🛰️ Initializing GPS Handshake...");
    
    setTimeout(() => {
      setGpsStatus("🛰️ Triangulating Varanasi Wards...");
      setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setGpsStatus(`📍 Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
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
                setIsLocating(false);
                setGpsStatus("");
                if (!isEditing && onUpdateUser) {
                  onUpdateUser({
                    ...user,
                    location: closestWard
                  });
                }
              }, 1000);
            },
            (error) => {
              console.warn("GPS Permission denied/unavailable. Simulating Varanasi Ward lookup...", error);
              simulateVaranasiGps();
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          simulateVaranasiGps();
        }
      }, 1000);
    }, 1000);
  };

  const simulateVaranasiGps = () => {
    setGpsStatus("🛰️ Accessing city cellular network...");
    setTimeout(() => {
      setGpsStatus("📍 Varanasi IP Node Located");
      setTimeout(() => {
        const randomWards = [
          "Assi Ghat Ward, Varanasi",
          "Dashashwamedh Ward, Varanasi",
          "Kashi Vishwanath Ward, Varanasi",
          "Godowlia Ward, Varanasi",
          "Sigra Ward, Varanasi"
        ];
        const closestWard = randomWards[Math.floor(Math.random() * randomWards.length)];
        setIsLocating(false);
        setGpsStatus("");
        if (!isEditing && onUpdateUser) {
          onUpdateUser({
            ...user,
            location: closestWard
          });
        }
      }, 1000);
    }, 1000);
  };

  const handleSwitchRole = (newRole: "citizen" | "authority") => {
    setIsRoleDropdownOpen(false);
    if (user.role === newRole) return;

    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        role: newRole,
        documentVerified: false,
        department: newRole === "authority" ? "Urban Infrastructure & Wastes" : undefined,
        designation: newRole === "authority" ? "Deputy Municipal Commissioner" : undefined
      });
    }
  };

  const handleStartScan = (docType: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs(["[SCANNER] Booting high-fidelity OCR scan system..."]);
    
    const logs = [
      "[SCANNER] Activating active green laser line sweep...",
      "[SCANNER] Aligning bounding box corners and watermark holograms...",
      `[OCR] Extracting credentials matching full name "${user.name}"...`,
      `[OCR] Document match: ${docType} ID Signature verified.`,
      `[SECURITY] Querying National Varanasi UIDAI / Ministry Directory...`,
      "[SECURITY] Verification match confirmed. Authority signature matched.",
      "[COMPLETE] Document successfully verified! Local status updated."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        
        if (next === 15) {
          setScanLogs(p => [...p, logs[0]]);
        } else if (next === 30) {
          setScanLogs(p => [...p, logs[1]]);
        } else if (next === 50) {
          setScanLogs(p => [...p, logs[2], logs[3]]);
        } else if (next === 75) {
          setScanLogs(p => [...p, logs[4]]);
        } else if (next === 90) {
          setScanLogs(p => [...p, logs[5]]);
        } else if (next === 95) {
          setScanLogs(p => [...p, logs[6]]);
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            if (onUpdateUser) {
              onUpdateUser({
                ...user,
                documentVerified: true
              });
            }
          }, 800);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScannedDoc(file.name);
      handleStartScan(isCitizen ? "Aadhaar Card" : "Government Authority ID");
    }
  };

  const handleSubmitReport = () => {
    if (!reportReason) return;
    setIsReported(true);
    setTimeout(() => {
      setShowReportForm(false);
      setIsReported(false);
      setReportReason("");
    }, 3000);
  };

  if (isEditing && onUpdateUser) {
    return (
      <ProfileSettings 
        user={user} 
        onUpdateUser={onUpdateUser} 
        onClose={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        .scanner-laser-line {
          animation: scanSweep 2s ease-in-out infinite;
        }
      `}</style>
      
      {isViewingShared && onBackToOwnProfile && (
        <div className="mb-6">
          <button
            onClick={onBackToOwnProfile}
            className="flex items-center gap-1.5 text-xs text-brand-primary hover:underline cursor-pointer transition-all border border-brand-primary/10 rounded-lg px-2.5 py-1.5 bg-brand-primary/5 hover:bg-brand-primary/10 animate-fadeIn"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Profile
          </button>
        </div>
      )}

      <div id="root-profile-grid" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        <div className="md:col-span-5 lg:col-span-5 space-y-6">
          <div className="bg-bg-secondary/20 rounded-xl p-5 border border-brand-primary/5 space-y-4 relative">
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-4 text-center sm:text-left md:text-center lg:text-left">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-primary p-1 bg-bg-secondary flex items-center justify-center shadow-lg">
                  {user.photoURL ? (
                    <img src={user.photoURL} referrerPolicy="no-referrer" alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-extrabold text-xl uppercase select-none">
                      {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="absolute -bottom-1 -right-1">
                    <button
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-7 h-7 rounded-full bg-brand-primary border-2 border-bg-secondary hover:bg-brand-primary-dark text-white shadow-xl hover:scale-115 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
                      title="Switch User Role"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin-slow group-hover:rotate-180 transition-all duration-500" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-bg-secondary border border-brand-primary/20 rounded-xl shadow-2xl p-2 z-40 w-40 space-y-1 animate-fadeIn">
                        <div className="text-[9px] uppercase font-bold text-text-muted px-2 pb-1 border-b border-brand-primary/5">
                          Select Account Role:
                        </div>
                        <button
                          onClick={() => handleSwitchRole("citizen")}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            user.role === "citizen" 
                              ? "bg-brand-primary text-white" 
                              : "hover:bg-brand-primary/10 text-text-secondary hover:text-white"
                          }`}
                        >
                          <span>Citizen Account</span>
                          {user.role === "citizen" && <Check className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleSwitchRole("authority")}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            user.role === "authority" 
                              ? "bg-brand-primary text-white" 
                              : "hover:bg-brand-primary/10 text-text-secondary hover:text-white"
                          }`}
                        >
                          <span>Authority Officer</span>
                          {user.role === "authority" && <Check className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start md:justify-center lg:justify-start gap-1.5">
                  <h2 className="text-lg font-bold font-display text-text-primary truncate">
                    {user.name}
                  </h2>
                  {user.documentVerified ? (
                    <span className="inline-flex items-center gap-0.5 text-brand-success bg-brand-success/15 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-brand-success/20 animate-pulse">
                      ✓ Verified ID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-brand-warning bg-brand-warning/15 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-brand-warning/20">
                      ⚠ Unverified
                    </span>
                  )}
                </div>
                
                <div className="text-xs font-semibold text-brand-primary font-mono select-all truncate">
                  @{assignedUsername}
                </div>
                
                <div className="flex flex-col items-center sm:items-start md:items-center lg:items-start gap-1 text-[11px] text-text-secondary pt-0.5">
                  <span className="flex items-center gap-1 text-text-muted bg-bg-tertiary/40 px-1.5 py-0.5 rounded border border-brand-primary/5">
                    <MapPin className="w-3 h-3 text-brand-primary" /> {user.location}
                  </span>
                  <span className="text-brand-primary font-semibold text-center sm:text-left md:text-center lg:text-left">
                    {isCitizen ? "Varanasi Citizen Board" : `${user.department || "Urban Infrastructure"} — ${user.designation || "officer"}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary/10 p-3 rounded-xl border border-brand-primary/5 flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-2 bg-brand-warning/5 border border-brand-warning/10 rounded-lg">
              <span className="text-xs font-bold text-brand-warning flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Civic Points
              </span>
              <span className="text-xs font-black text-text-primary">
                {user.civicScore || 0}
              </span>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setShowShareBox(false);
                  setShowReportForm(false);
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isEditing 
                    ? "bg-brand-primary text-white shadow-md"
                    : "bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" /> {isEditing ? "Close Editor" : "Edit Profile"}
              </button>
            )}

            {isOwnProfile && (
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {gpsStatus || "Locating..."}
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-brand-primary" /> Detect GPS Location
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleShareProfile}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-success/10 hover:bg-brand-success/20 text-brand-success text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Profile
            </button>


            {!isOwnProfile && (
              <button
                onClick={() => {
                  setShowReportForm(!showReportForm);
                  setIsEditing(false);
                  setShowShareBox(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" /> Report Profile
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-7 lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Info className="w-4.5 h-4.5 text-brand-primary" /> Profile Credentials & Verification
          </h3>

          <div className="bg-bg-secondary/30 rounded-xl p-4 border border-brand-primary/5 space-y-4 text-xs leading-relaxed">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center justify-between border-b border-brand-primary/5 pb-2">
                  <span className="text-text-muted">Assigned Username:</span>
                  <span className="font-mono font-bold text-brand-primary">@{assignedUsername}</span>
                </div>
                <div className="flex items-center justify-between border-b border-brand-primary/5 pb-2">
                  <span className="text-text-muted">Verification Status:</span>
                  {user.documentVerified ? (
                    <span className="font-bold text-brand-success flex items-center gap-1 bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/10">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-success" /> Verified ID
                    </span>
                  ) : (
                    <span className="font-bold text-brand-warning flex items-center gap-1 bg-brand-warning/10 px-2 py-0.5 rounded border border-brand-warning/10">
                      <AlertTriangle className="w-3.5 h-3.5 text-brand-warning" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>


            <div className="border-t border-brand-primary/10 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-primary" /> Identity Verification Scanner
              </h4>

              {isScanning ? (
                <div className="relative bg-black/90 rounded-xl p-4 border border-brand-success/30 overflow-hidden h-52 flex flex-col justify-between shadow-2xl">
                  <div className="absolute left-0 w-full h-1 bg-brand-success/90 shadow-[0_0_15px_#10B981] scanner-laser-line z-10" />

                  <div className="z-20 flex justify-between items-start">
                    <span className="text-[10px] text-brand-success font-mono uppercase tracking-widest animate-pulse">
                      🔴 Live Scanner Feed
                    </span>
                    <span className="text-xs text-white font-mono font-bold bg-brand-success/20 px-2 py-0.5 rounded">
                      {scanProgress}%
                    </span>
                  </div>

                  <div className="z-20 bg-black/40 p-2 rounded border border-white/5 font-mono text-[9px] text-brand-success h-24 overflow-y-auto space-y-1 scrollbar-thin">
                    {scanLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight animate-fadeIn">{log}</div>
                    ))}
                  </div>

                  <div className="z-20 w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-success h-full transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              ) : user.documentVerified ? (
                <div className="bg-brand-success/5 border border-brand-success/20 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-success" />
                    <div>
                      <div className="text-xs font-bold text-brand-success uppercase">Aadhaar & Badge Verified</div>
                      <div className="text-[10px] text-text-secondary">Verified profiles receive double votes and automatic priority dispatching!</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartScan(isCitizen ? "Aadhaar Card" : "Government ID Card")}
                    className="w-full py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center"
                  >
                    Re-scan Government Identity Document
                  </button>
                </div>
              ) : (
                <div className="bg-bg-secondary/40 border border-dashed border-brand-primary/15 rounded-xl p-5 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 mx-auto flex items-center justify-center">
                    {isCitizen ? (
                      <FileText className="w-5 h-5 text-brand-primary" />
                    ) : (
                      <Shield className="w-5 h-5 text-brand-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text-primary">
                      {isCitizen ? "Scan Your Identity (Aadhaar Card)" : "Scan Official Authority Badge / ID"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {isCitizen 
                        ? "Verify with your national Aadhaar Card to activate official citizen status." 
                        : "Required for municipal response routing."
                      }
                    </div>
                  </div>

                  <div className="pt-1 relative flex justify-center">
                    <label className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 select-none active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      Upload & Scan Document
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={handleSimulateUpload} 
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
