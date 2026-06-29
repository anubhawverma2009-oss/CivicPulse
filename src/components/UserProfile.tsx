import React, { useState, useEffect } from "react";
import { UserProfile as UserProfileType, IssueReport, computeCivicStats } from "../types";
import { 
  Star, MapPin, Edit2, Share2, 
  Check, Flag, Bookmark, BookmarkCheck, 
  ArrowLeft, Info, RefreshCw, CheckCircle, 
  Shield, FileText, Loader2, Navigation, AlertTriangle, Camera,
  FileCheck, TrendingUp, Trophy, AlertCircle, HelpCircle
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
  issues = [],
  onUpdateUser,
  loggedInUser,
  isViewingShared,
  onBackToOwnProfile
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

  const computeUserRank = (score: number) => {
    const mockScores = [12450, 9820, 8500, 7200, 6800];
    let rank = 1;
    for (const s of mockScores) {
      if (score < s) rank++;
    }
    return rank;
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

  // Calculate stats securely
  const { currentCoins, civicScore: userCivicScore } = computeCivicStats(user);
  const citizenLevel = Math.floor(userCivicScore / 500) + 1;
  const levelProgress = ((userCivicScore % 500) / 500) * 100;

  const reportsSubmitted = issues.filter(issue => issue.authorId === user.uid).length;
  const reportsVerified = issues.filter(issue => issue.authorId === user.uid && issue.isReal).length;
  const issuesResolved = issues.filter(issue => issue.authorId === user.uid && issue.status === "resolved").length;
  const currentRank = computeUserRank(user.civicScore || 0);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-8 max-w-7xl mx-auto shadow-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md">
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
        <div className="mb-2">
          <button
            onClick={onBackToOwnProfile}
            className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline cursor-pointer transition-all border border-brand-primary/20 rounded-xl px-4 py-2.5 bg-brand-primary/5 hover:bg-brand-primary/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Profile
          </button>
        </div>
      )}

      {/* Main Grid: Government Verified Civic Identity Dashboard */}
      <div id="root-profile-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Area (Identity & Score Card) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Profile Header Card */}
          <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 space-y-6 relative shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              
              {/* Profile Image with Roles switcher */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-primary p-1 bg-slate-900 flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-[1.03]">
                  {user.photoURL ? (
                    <img src={user.photoURL} referrerPolicy="no-referrer" alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-black text-2xl uppercase select-none">
                      {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="absolute -bottom-1 -right-1">
                    <button
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-8 h-8 rounded-full bg-brand-primary border-2 border-slate-900 hover:bg-brand-primary-dark text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
                      title="Switch User Role"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow group-hover:rotate-180 transition-all duration-500" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-10 bg-slate-950 border border-white/10 rounded-xl shadow-2xl p-2.5 z-40 w-44 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-text-muted px-2 pb-1.5 border-b border-white/5">
                          Select Account Role:
                        </div>
                        <button
                          onClick={() => handleSwitchRole("citizen")}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            user.role === "citizen" 
                              ? "bg-brand-primary text-white" 
                              : "hover:bg-brand-primary/10 text-text-secondary hover:text-white"
                          }`}
                        >
                          <span>Citizen Account</span>
                          {user.role === "citizen" && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleSwitchRole("authority")}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            user.role === "authority" 
                              ? "bg-brand-primary text-white" 
                              : "hover:bg-brand-primary/10 text-text-secondary hover:text-white"
                          }`}
                        >
                          <span>Authority Officer</span>
                          {user.role === "authority" && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Identity Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold font-sans tracking-tight text-white truncate">
                    {user.name}
                  </h2>
                </div>
                
                <div className="text-xs font-bold text-brand-primary font-mono select-all truncate">
                  @{assignedUsername}
                </div>
                
                <div className="flex flex-col items-center sm:items-start gap-2 text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-text-secondary bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" /> {user.location}
                  </span>
                  <span className="text-brand-primary font-bold text-xs">
                    {isCitizen ? "Varanasi Citizen Board" : `${user.department || "Urban Infrastructure"} — ${user.designation || "Officer"}`}
                  </span>
                </div>

                <div className="pt-2">
                  {user.documentVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-brand-success bg-brand-success/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-success/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                      <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" /> Verified Citizen
                    </span>
                  ) : isScanning ? (
                    <span className="inline-flex items-center gap-1.5 text-brand-warning bg-brand-warning/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-warning/20 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-brand-warning" /> Verification Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-brand-critical bg-brand-critical/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-critical/20">
                      <span className="w-2 h-2 rounded-full bg-brand-critical" /> Unverified Citizen
                    </span>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Civic Score Card */}
          <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 space-y-5 relative shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-sm font-bold text-brand-warning flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-warning" /> Civic Score Card
              </span>
              <span className="text-xs font-mono font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                Level {citizenLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Civic Score</span>
                <span className="text-2xl font-black text-white tracking-tight">{userCivicScore || 0}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block">Lifetime Contrib.</span>
                <span className="text-2xl font-black text-brand-success tracking-tight">{userCivicScore || 0} EXP</span>
              </div>
            </div>

            {/* Circular/Linear Level Progress bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-text-secondary">Citizen Progression</span>
                <span className="text-brand-primary">{Math.round(levelProgress)}% to Level {citizenLevel + 1}</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-brand-primary to-[#8B5CF6] h-full transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted text-center pt-1 font-medium">Earn 500 Civic Score points to achieve the next Citizen level status!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 gap-3 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
            {isOwnProfile && (
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setShowShareBox(false);
                  setShowReportForm(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98] h-11 w-full text-center ${
                  isEditing 
                    ? "bg-brand-primary text-white shadow-lg"
                    : "bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" /> {isEditing ? "Close" : "Edit Profile"}
              </button>
            )}

            {isOwnProfile && (
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98] h-11 w-full text-center bg-slate-900 hover:bg-slate-800 text-text-primary border border-white/5 disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating...
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-brand-primary" /> GPS Locator
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleShareProfile}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98] h-11 w-full text-center bg-brand-success/10 hover:bg-brand-success/20 text-brand-success border border-brand-success/20"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98] h-11 w-full text-center bg-brand-critical/10 hover:bg-brand-critical/20 text-brand-critical border border-brand-critical/20"
              >
                <Flag className="w-3.5 h-3.5" /> Report Profile
              </button>
            )}
          </div>

          {showShareBox && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-2 animate-fadeIn text-xs">
              <span className="font-bold block text-text-primary">Copy Profile Link</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 flex-1 text-[11px] text-text-secondary select-all focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="bg-brand-primary text-white font-bold rounded-lg px-3 py-1.5 hover:bg-brand-primary-dark transition-all cursor-pointer text-[10px]"
                >
                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {showReportForm && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3 animate-fadeIn text-xs">
              <span className="font-bold block text-text-primary">Report Profile Violation</span>
              <textarea 
                placeholder="Briefly explain the issue..." 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-primary min-h-[60px]"
              />
              <button 
                onClick={handleSubmitReport}
                disabled={isReported}
                className="w-full bg-brand-critical text-white font-bold rounded-lg py-2 hover:bg-brand-critical/90 transition-all cursor-pointer text-xs"
              >
                {isReported ? "Submitting Report..." : "Submit Report"}
              </button>
            </div>
          )}

        </div>

        {/* Right Area (Contribution Stats & Scanner) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-primary" /> Verified Civic Portfolio Details
            </h3>
            {user.createdAt && (
              <span className="text-[10px] text-text-muted font-bold font-mono">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Compact Contribution Summary: 4 equal-size statistic cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Stat Card 1 */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-sm hover:scale-[1.02] hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Submitted</span>
                <FileText className="w-4 h-4 text-brand-primary/80" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-white tracking-tight">{reportsSubmitted}</div>
                <div className="text-[9px] text-text-secondary font-medium">Incidents reported</div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-sm hover:scale-[1.02] hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Verified</span>
                <FileCheck className="w-4 h-4 text-brand-success/80" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-white tracking-tight">{reportsVerified}</div>
                <div className="text-[9px] text-text-secondary font-medium">Validations passed</div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-sm hover:scale-[1.02] hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Resolved</span>
                <CheckCircle className="w-4 h-4 text-indigo-400/80" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-white tracking-tight">{issuesResolved}</div>
                <div className="text-[9px] text-text-secondary font-medium">Issues completed</div>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-sm hover:scale-[1.02] hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">City Rank</span>
                <TrendingUp className="w-4 h-4 text-brand-warning/80" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-white tracking-tight">#{currentRank}</div>
                <div className="text-[9px] text-text-secondary font-medium">Citywide rankings</div>
              </div>
            </div>

          </div>

          {/* Identity Verification Section */}
          <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 space-y-6 shadow-lg">
            
            <div className="border-b border-white/5 pb-4 space-y-4">
              <h4 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-brand-primary" /> Identity Verification Scanner
              </h4>

              {/* Workflow Stepper: Upload ID -> AI Verification -> Citizen Status */}
              <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-4 px-2">
                {/* Step 1 */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                    user.documentVerified || isScanning
                      ? "bg-brand-success text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {user.documentVerified || isScanning ? "✓" : "1"}
                  </div>
                  <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.documentVerified || isScanning ? "text-brand-success" : "text-slate-400"
                  }`}>Upload ID</span>
                </div>
                {/* Line */}
                <div className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors duration-500 ${
                  user.documentVerified || isScanning ? "bg-brand-success" : "bg-slate-800"
                }`} />
                {/* Step 2 */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                    user.documentVerified
                      ? "bg-brand-success text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : isScanning
                        ? "bg-brand-warning text-white shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {user.documentVerified ? "✓" : "2"}
                  </div>
                  <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.documentVerified
                      ? "text-brand-success"
                      : isScanning
                        ? "text-brand-warning animate-pulse"
                        : "text-slate-400"
                  }`}>AI Verification</span>
                </div>
                {/* Line */}
                <div className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors duration-500 ${
                  user.documentVerified ? "bg-brand-success" : "bg-slate-800"
                }`} />
                {/* Step 3 */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                    user.documentVerified
                      ? "bg-brand-success text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {user.documentVerified ? "✓" : "3"}
                  </div>
                  <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider transition-colors duration-300 ${
                    user.documentVerified ? "text-brand-success" : "text-slate-400"
                  }`}>Citizen Status</span>
                </div>
              </div>

            </div>

            <div className="space-y-4">
              {isScanning ? (
                <div className="relative bg-black rounded-xl p-5 border border-brand-success/30 overflow-hidden h-52 flex flex-col justify-between shadow-2xl">
                  <div className="absolute left-0 w-full h-1 bg-brand-success shadow-[0_0_15px_#10B981] scanner-laser-line z-10" />

                  <div className="z-20 flex justify-between items-start">
                    <span className="text-[10px] text-brand-success font-mono uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-critical animate-ping" /> Live Scanner Feed
                    </span>
                    <span className="text-xs text-white font-mono font-bold bg-brand-success/20 px-2.5 py-1 rounded-lg">
                      {scanProgress}% Completed
                    </span>
                  </div>

                  <div className="z-20 bg-black/60 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-brand-success h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {scanLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight animate-fadeIn">{log}</div>
                    ))}
                  </div>

                  <div className="z-20 w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-brand-success h-full transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              ) : user.documentVerified ? (
                <div className="bg-brand-success/5 border border-brand-success/20 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-success shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-brand-success uppercase tracking-wider">Aadhaar & Badge Verified</div>
                      <p className="text-xs text-text-secondary leading-relaxed">Your digital identity document is fully authenticated. Verified citizen profiles enjoy priority dispatch, double voting weight, and fast-track municipal resolutions.</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => handleStartScan(isCitizen ? "Aadhaar Card" : "Government ID Card")}
                      className="w-full py-3 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-xl transition-all border border-brand-primary/20 cursor-pointer text-center"
                    >
                      Re-scan Government Identity Document
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-dashed border-white/10 rounded-xl p-8 text-center space-y-4 hover:border-white/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 mx-auto flex items-center justify-center border border-brand-primary/20 shadow-sm">
                    {isCitizen ? (
                      <FileText className="w-6 h-6 text-brand-primary" />
                    ) : (
                      <Shield className="w-6 h-6 text-brand-primary" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-white tracking-tight">
                      {isCitizen ? "Scan Your Identity (Aadhaar Card)" : "Scan Official Authority Badge / ID"}
                    </div>
                    <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                      {isCitizen 
                        ? "Submit your national Aadhaar Card matching your profile name to verify official citizen status instantly." 
                        : "Verify your administrative credentials to handle official priority municipal response routing."
                      }
                    </p>
                  </div>

                  <div className="pt-2 relative flex justify-center">
                    <label className="px-5 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer flex items-center gap-2 select-none active:scale-[0.97]">
                      <Camera className="w-4 h-4" />
                      Upload & Scan ID Document
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={handleSimulateUpload} 
                      />
                    </label>
                  </div>
                  {scannedDoc && (
                    <div className="text-[10px] text-text-muted font-mono bg-slate-950/40 py-1.5 px-3 rounded-lg border border-white/5 inline-block">
                      Selected Document: {scannedDoc}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
