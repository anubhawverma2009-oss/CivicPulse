import React, { useState, useEffect } from "react";
import { UserProfile, IssueReport, Comment, ResolutionResponse, PeerEvidence } from "./types";
import AuthScreen from "./components/AuthScreen";
import CivicPulseLogo from "./components/CivicPulseLogo";
import IssueFeed from "./components/IssueFeed";
import Leaderboard from "./components/Leaderboard";
import DrishtiBot from "./components/DrishtiBot";
import UserProfileView from "./components/UserProfile";
import ProfileTabs from "./components/ProfileTabs";
import CreateIssueModal from "./components/CreateIssueModal";
import GeoMap from "./components/GeoMap";
import RewardsShop from "./components/RewardsShop";
import { INITIAL_ISSUES } from "./lib/data";
import { CivicAuth, CivicDatabase } from "./firebase/config";
import { 
  Building, LogOut, Sparkles, MessageSquare, AlertTriangle, User, PlusCircle, 
  MapPin, HelpCircle, Bell, Volume2, ShieldCheck, CheckCircle, Compass, Gift,
  MoreHorizontal, RotateCw, Check, ChevronDown, Menu, X, Search, Map, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { findClosestLocation, detectLocationByIP, detectLocationByGPS } from "./utils/location";

export default function App() {
  // Authentication & State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (CivicAuth.isFirebaseConfigured && CivicAuth.isFirebaseConfigured()) {
      // In real Firebase mode, do not pre-load from localStorage synchronously
      // to avoid triggering unauthenticated Firestore queries during auth restoration.
      return null;
    }
    const saved = localStorage.getItem("civicpulse_firebase_current");
    return saved ? JSON.parse(saved) : null;
  });

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [currentView, setCurrentView] = useState<"feed" | "leaderboard" | "chatbot" | "profile" | "map" | "rewards" | "report">("feed");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isRefreshingHeaderLoc, setIsRefreshingHeaderLoc] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showHeaderActions, setShowHeaderActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deep linking and shared profile states
  const [sharedProfileId, setSharedProfileId] = useState<string | null>(null);
  const [sharedProfile, setSharedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get("profile");
    if (profileId) {
      setSharedProfileId(profileId);
    }
  }, []);

  useEffect(() => {
    if (currentUser && sharedProfileId) {
      CivicAuth.getUserById(sharedProfileId).then((prof) => {
        if (prof) {
          setSharedProfile(prof);
          setCurrentView("profile");
          showToast(`✨ Loaded shared profile: ${prof.name}`);
        }
      });
    }
  }, [currentUser, sharedProfileId]);

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    if (currentUser && updatedUser.uid === currentUser.uid) {
      setCurrentUser(updatedUser);
      localStorage.setItem("civicpulse_firebase_current", JSON.stringify(updatedUser));
    }
    if (sharedProfile && updatedUser.uid === sharedProfile.uid) {
      setSharedProfile(updatedUser);
    }
    try {
      await CivicAuth.updateProfile(updatedUser.uid, updatedUser);
      showToast("👤 Profile details updated and synchronized!");
    } catch (e) {
      console.warn("Could not sync profile update to DB:", e);
      showToast("👤 Profile details updated!");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateUserLocation = async (newLocation: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, location: newLocation };
    setCurrentUser(updatedUser);
    localStorage.setItem("civicpulse_firebase_current", JSON.stringify(updatedUser));
    
    try {
      await CivicAuth.updateProfile(currentUser.uid, { location: newLocation });
      showToast(`📍 Relocated in real-time to: ${newLocation}`);
    } catch (e) {
      console.warn("Could not sync locality to DB:", e);
      showToast(`📍 Location updated: ${newLocation}`);
    }
  };

  const handleRefreshHeaderLocation = async () => {
    if (!currentUser) return;
    setIsRefreshingHeaderLoc(true);
    try {
      // 1. Try real-time GPS coords
      const gpsLoc = await detectLocationByGPS(3500);
      if (gpsLoc) {
        const closest = findClosestLocation(gpsLoc.lat, gpsLoc.lng);
        await updateUserLocation(closest);
        return;
      }

      // 2. Secondary fast IP lookup
      const ipLoc = await detectLocationByIP();
      if (ipLoc) {
        const closest = findClosestLocation(ipLoc.lat, ipLoc.lng);
        await updateUserLocation(closest);
        return;
      }

      showToast(`Re-synchronization offline. Current Pin: ${currentUser.location}`);
    } catch (err) {
      console.warn("Header locate-me recheck error:", err);
      showToast(`Detection failed. Current Pin: ${currentUser.location}`);
    } finally {
      setIsRefreshingHeaderLoc(false);
    }
  };

  // Synchronize database state with real-time listeners and seed database if empty
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribeAuth = CivicAuth.onAuthChanged((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIssues([]);
      return;
    }

    // Seed database if empty (relevant for real cloud Firestore mode)
    CivicDatabase.seedDatabaseIfEmpty();

    // Subscribe to real-time issues feed updates
    const unsubscribeIssues = CivicDatabase.subscribeIssues((updatedIssues) => {
      setIssues(updatedIssues);
    });

    return () => {
      unsubscribeIssues();
    };
  }, [currentUser]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Namaste ${user.name}! Welcome to the Civic Pulse AI cockpit.`);
  };

  const handleLogout = async () => {
    await CivicAuth.signOut();
    setCurrentUser(null);
    setCurrentView("feed");
    showToast("Signed out successfully. Jai Hind!");
  };

  // 1. Interactive Voting (Yes/No Poll)
  const handleVote = async (issueId: string, voteType: "yes" | "no") => {
    if (!currentUser) return;

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const votedUserIds = { ...(issue.votedUserIds || {}) };
    const alreadyVoted = currentUser.uid in votedUserIds;

    // Trigger persistence update
    await CivicDatabase.voteIssue(issueId, currentUser.uid, voteType);

    // Award civic score points to voter (+5) and trigger badge unlocks
    if (!alreadyVoted && currentUser.role === "citizen") {
      const updatedBadges = [...currentUser.badges];
      
      // Check guard badge (verified 5 local issues)
      const peerVotesCount = issues.filter(i => i.votedUserIds && currentUser.uid in i.votedUserIds).length + 1;
      if (peerVotesCount >= 5 && !updatedBadges.includes("guard")) {
        updatedBadges.push("guard");
        setTimeout(() => showToast("🏆 Unlocked Badge: 'Neighborhood Guard'!"), 1000);
      }

      // Check truth seeker badge (voted YES on AI-verified real issues)
      if (issue.isReal && voteType === "yes") {
        const truthCount = issues.filter(i => i.isReal && i.votedUserIds && i.votedUserIds[currentUser.uid] === "yes").length + 1;
        if (truthCount >= 3 && !updatedBadges.includes("truth_seeker")) {
          updatedBadges.push("truth_seeker");
          setTimeout(() => showToast("🏆 Unlocked Badge: 'Truth Seeker'!"), 1000);
        }
      }

      const newScore = currentUser.civicScore + 5;
      await CivicAuth.updateProfile(currentUser.uid, {
        civicScore: newScore,
        badges: updatedBadges
      });

      showToast("Verified! Earned +5 Civic Points.");
    } else {
      showToast("Vote updated.");
    }
  };

  // 2. Interactive Resolution Voting (Solved/Pending Feedback)
  const handleVoteResolution = async (issueId: string, voteType: "solved" | "pending") => {
    if (!currentUser) return;

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const votedResolutionUserIds = { ...(issue.votedResolutionUserIds || {}) };
    const alreadyVoted = currentUser.uid in votedResolutionUserIds;

    const { isResolved } = await CivicDatabase.voteResolution(issueId, currentUser.uid, voteType);

    // Award score for participating
    if (!alreadyVoted && currentUser.role === "citizen") {
      const newScore = currentUser.civicScore + 5;
      await CivicAuth.updateProfile(currentUser.uid, { civicScore: newScore });
    }

    if (isResolved) {
      showToast(`🎉 Issue "${issue.title}" successfully resolved by citizen consensus!`);

      // Try to award point bonus to original author if they are a citizen
      if (issue.authorId === currentUser.uid) {
        const updatedBadges = [...currentUser.badges];
        if (issue.severity >= 8 && !updatedBadges.includes("landmark")) {
          updatedBadges.push("landmark");
          setTimeout(() => showToast("🏆 Unlocked Badge: 'Landmark Maker' for resolving severe issue!"), 1200);
        }

        const newScore = currentUser.civicScore + 25;
        if (newScore >= 500 && !updatedBadges.includes("champion")) {
          updatedBadges.push("champion");
        }

        await CivicAuth.updateProfile(currentUser.uid, {
          civicScore: newScore,
          badges: updatedBadges
        });
      }
    } else {
      showToast("Resolution feedback submitted.");
    }
  };

  // 3. Like Report
  const handleLike = async (issueId: string) => {
    await CivicDatabase.likeIssue(issueId);
    showToast("Liked report!");
  };

  // 4. Save Issue to bookmarks
  const handleSaveIssue = async (issueId: string) => {
    if (!currentUser) return;

    const saved = [...(currentUser.savedIssues || [])];
    const index = saved.indexOf(issueId);

    if (index > -1) {
      saved.splice(index, 1);
      showToast("Removed report from bookmarks.");
    } else {
      saved.push(issueId);
      showToast("Report bookmarked successfully!");
    }

    await CivicAuth.updateProfile(currentUser.uid, {
      savedIssues: saved
    });
  };

  // 5. Add Comment
  const handleAddComment = async (issueId: string, text: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: "comment-" + Date.now(),
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: text,
      timestamp: new Date().toISOString()
    };

    await CivicDatabase.addComment(issueId, newComment);
    showToast("Comment published.");
  };

  // 5b. Add Peer Evidence
  const handleAddPeerEvidence = async (issueId: string, description: string, proofImg?: string) => {
    if (!currentUser) return;

    const newEvidence: PeerEvidence = {
      id: "evidence-" + Date.now(),
      authorName: currentUser.name,
      authorUid: currentUser.uid,
      description,
      proofImageUrl: proofImg,
      timestamp: new Date().toISOString()
    };

    await CivicDatabase.addPeerEvidence(issueId, newEvidence);
    
    // Reward citizen with +15 Civic Coins and sync state
    if (currentUser.role === "citizen") {
      const updatedUser = await CivicAuth.addCoins(currentUser.uid, 15);
      setCurrentUser(updatedUser);
      showToast("🛡️ Evidence registered! Earned +15 Civic Coins.");
    } else {
      showToast("🛡️ Evidence registered successfully!");
    }
  };

  // 5c. Redeem Reward from Shop
  const handleRedeemReward = async (rewardId: string, cost: number) => {
    if (!currentUser) return;
    try {
      const updatedUser = await CivicAuth.redeemReward(currentUser.uid, rewardId, cost);
      setCurrentUser(updatedUser);
      showToast("🎉 Voucher claimed! Check My Active Redeemed Vouchers below.");
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message || "Failed to redeem reward"}`);
      throw err;
    }
  };

  // 6. Submit Resolution Update (Authority)
  const handleAddResolution = async (issueId: string, description: string, proofImg?: string) => {
    if (!currentUser || currentUser.role !== "authority") return;

    const newResponse: ResolutionResponse = {
      responderId: currentUser.uid,
      responderName: currentUser.name,
      responderRole: currentUser.role,
      responderDesignation: currentUser.designation || "Executive Officer",
      responderDepartment: currentUser.department || "PWD Department",
      description,
      proofImageUrl: proofImg,
      timestamp: new Date().toISOString()
    };

    await CivicDatabase.addResolutionResponse(issueId, newResponse);
    showToast("Resolution report published! Citizen consensus polling started.");
  };

  // 7. Submit New Civic Complaint
  const handleCreateIssue = async (newIssueData: Omit<IssueReport, "id" | "createdAt" | "updatedAt" | "pollVotes" | "resolutionVotes" | "responses" | "comments" | "likes" | "shares">) => {
    if (!currentUser) return;

    const newIssueId = await CivicDatabase.createIssue({
      ...newIssueData,
      pollVotes: { yes: 1, no: 0 }, // Author votes yes automatically
      resolutionVotes: { solved: 0, pending: 0 },
      votedUserIds: { [currentUser.uid]: "yes" },
      responses: [],
      comments: [],
      likes: 0,
      shares: 0,
      votedResolutionUserIds: {}
    });

    setCurrentView("feed");

    // Award First Reporter Badge if appropriate and score updates
    if (currentUser.role === "citizen") {
      const updatedBadges = [...currentUser.badges];
      if (!updatedBadges.includes("first_reporter")) {
        updatedBadges.push("first_reporter");
        setTimeout(() => showToast("🏆 Unlocked Badge: 'First Reporter'!"), 1000);
      }

      const newScore = currentUser.civicScore + 25;
      await CivicAuth.updateProfile(currentUser.uid, {
        civicScore: newScore,
        badges: updatedBadges
      });

      showToast("Complaint published successfully! Earned +25 Civic Points.");
    } else {
      showToast("Issue report filed successfully!");
    }
  };

  // Authority quick-resolve trigger callback
  const handleTriggerFix = (issueId: string) => {
    // Scroll view to feed, highlight issue resolution block
    setCurrentView("feed");
    showToast("Please publish work proof under the work order in Feed.");
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-row w-full relative overflow-hidden">
      {/* LEFT SIDEBAR MENU (ChatGPT/Google Workspace Style) */}
      <AnimatePresence initial={false}>
        {isDrawerOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? 220 : 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="shrink-0 bg-[#1E293B] border-r border-white/10 h-screen sticky top-0 z-50 overflow-hidden flex flex-col justify-between"
          >
            <div style={{ width: isMobile ? 220 : 300 }} className="h-full flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <CivicPulseLogo variant="primary" size={32} animate={true} />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                      title="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* User Context Info Card */}
                <div className="bg-[#111827]/50 rounded-xl p-3.5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                      {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F1F5F9] line-clamp-1">{currentUser.name}</h4>
                      <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">{currentUser.role}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="line-clamp-1">{currentUser.location}</span>
                  </div>
                </div>

                {/* Main Navigation Menu */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black tracking-widest text-text-muted uppercase px-2 mb-2">
                    Civic Dashboard
                  </p>

                  <button
                    onClick={() => {
                      setCurrentView("feed");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "feed"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4" />
                      <span>Community Feed</span>
                    </div>
                    {currentView === "feed" && <Check className="w-3.5 h-3.5 shrink-0 animate-pulse" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("leaderboard");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "leaderboard"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                      <span>Priority Issues</span>
                    </div>
                    {currentView === "leaderboard" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  <button
                    id="nav-issues-map-button"
                    onClick={() => {
                      setCurrentView("map");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "map"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Map className="w-4 h-4 text-brand-success" />
                      <span>Issue Map</span>
                    </div>
                    {currentView === "map" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("chatbot");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "chatbot"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-brand-warning" />
                      <span>DrishtiBot AI</span>
                    </div>
                    {currentView === "chatbot" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("rewards");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "rewards"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-brand-warning shrink-0" />
                      <span>Reward Store</span>
                    </div>
                    {currentView === "rewards" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("profile");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "profile"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>My Profile</span>
                    </div>
                    {currentView === "profile" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Drawer Footer controls */}
              <div className="p-6 border-t border-white/5 bg-[#111827]/40 space-y-4">
                {currentUser.role === "citizen" && (
                  <div className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 p-3 rounded-xl flex items-center justify-between">
                    <span>🏆 Total Civic Score:</span>
                    <span>{currentUser.civicScore} Pts</span>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Cockpit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT SIDE CONTAINER (Header + Content viewport) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-[1000] bg-[#0B0E14]/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] border-b border-white/[0.05] transition-all duration-300 w-full select-none flex items-center">
        {/* Hardware-accelerated Bottom Shimmer Gradient Line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, #3B82F6 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%"]
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear"
          }}
        />

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-3 lg:py-4 w-full flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
          
          {/* ROW 1 (Mobile/Tablet) / LEFT SECTION (Desktop) */}
          <div className="flex items-center justify-between w-full lg:w-auto shrink-0 order-1">
            <div className="flex items-center gap-3">
              <motion.button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white shadow-sm transition-all cursor-pointer group shrink-0"
                whileTap={{ scale: 0.95 }}
                title="Open navigation menu"
              >
                <Menu className="w-5 h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 stroke-[2]" />
              </motion.button>

              <div onClick={() => setCurrentView("feed")} className="cursor-pointer flex items-center gap-2 group shrink-0">
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-blue-500/10 blur-sm rounded-full transition-colors"
                  />
                  <CivicPulseLogo variant="icon" size={28} animate={true} />
                </div>
                <span className="font-extrabold tracking-tight text-white leading-none font-sans text-lg">
                  CivicPulse AI
                </span>
              </div>
            </div>

            {/* Profile for Mobile/Tablet */}
            <div className="flex items-center lg:hidden relative shrink-0">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center p-1 rounded-full hover:bg-white/[0.05] border border-transparent transition-all group"
                title="Profile Options"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm group-hover:border-[#3B82F6]/50 group-hover:scale-105 transition-all">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} referrerPolicy="no-referrer" alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs uppercase font-display">
                      {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {showMoreDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 top-full w-48 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 origin-top-right"
                    >
                      <div className="px-2.5 py-2 border-b border-slate-800/60 mb-1">
                        <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Signed In As</p>
                        <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <button onClick={() => { setCurrentView("profile"); setShowMoreDropdown(false); }} className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer">
                        <User className="w-3.5 h-3.5 text-emerald-400" /><span>View Profile</span>
                      </button>
                      <button onClick={() => { handleLogout(); setShowMoreDropdown(false); }} className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer border-t border-slate-800/40 mt-1">
                        <LogOut className="w-3.5 h-3.5" /><span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ROW 2 (Mobile/Tablet) / CENTER SECTION (Desktop) */}
          <div className="w-full lg:flex-1 order-2 shrink min-w-[200px]">
            <div className={`relative flex items-center w-full rounded-2xl border transition-all duration-300 ${
              isSearchFocused 
                ? "bg-[#1A2230] border-[#3B82F6] shadow-[0_0_24px_rgba(59,130,246,0.25)]" 
                : "bg-[#111620]/80 border-white/10 hover:border-white/20"
            }`}>
              <span className="absolute left-4 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 transition-colors duration-300 ${isSearchFocused ? "text-[#3B82F6]" : "text-slate-400"}`} />
              </span>
              <input
                id="header-search-input"
                type="text"
                value={globalSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (currentView !== "feed") setCurrentView("feed");
                }}
                placeholder="Search reports, locations or issues..."
                className="w-full h-11 lg:h-12 bg-transparent pl-11 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery("")}
                  className="absolute right-3.5 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/10"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ROW 3 (Mobile/Tablet) / RIGHT SECTION (Desktop) */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full lg:w-auto shrink-0 order-3">
            
            {/* Location Chip */}
            <motion.button
              onClick={handleRefreshHeaderLocation}
              disabled={isRefreshingHeaderLoc}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 lg:py-2 rounded-xl bg-white/[0.03] border border-white/10 transition-all whitespace-nowrap group disabled:opacity-50 shrink-0"
              title="Locate Me / Refresh Coordinates"
            >
              <MapPin className={`w-3.5 h-3.5 text-[#3B82F6] ${isRefreshingHeaderLoc ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
              <span className="text-[11px] lg:text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {currentUser?.location?.split(',')[0] || "Kanpur"}
              </span>
            </motion.button>

            {/* Civic Coins Chip */}
            <motion.button
              onClick={() => setCurrentView("rewards")}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 lg:py-2 rounded-xl bg-white/[0.03] border border-white/10 transition-all whitespace-nowrap group shrink-0"
              title="Civic Coins"
            >
              <Coins className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] lg:text-xs font-bold text-amber-400">
                {currentUser?.civicScore || 0}
              </span>
            </motion.button>

            {/* Report Issue Button */}
            {currentUser?.role === "citizen" && (
              <motion.button
                onClick={() => setCurrentView("report")}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
                className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-3 lg:px-4 py-1.5 lg:py-2 h-[32px] lg:h-[36px] rounded-xl text-[11px] lg:text-xs font-semibold shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Issue</span>
                <span className="sm:hidden">Report</span>
              </motion.button>
            )}

            {/* Profile for Desktop */}
            <div className="hidden lg:flex items-center relative ml-1 shrink-0">
              <div className="w-[1px] h-8 bg-white/10 shrink-0 mr-3" />
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all group"
                title="Profile Options"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm group-hover:border-[#3B82F6]/50 group-hover:scale-105 transition-all">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} referrerPolicy="no-referrer" alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs uppercase font-display">
                      {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start text-left max-w-[120px]">
                  <span className="text-xs font-semibold text-slate-100 truncate w-full group-hover:text-white transition-colors">
                    {currentUser.name ? currentUser.name.split(" ")[0] : "User"}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors ml-0.5" />
              </button>
              
              <AnimatePresence>
                {showMoreDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 top-full w-48 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 origin-top-right"
                    >
                      <div className="px-2.5 py-2 border-b border-slate-800/60 mb-1">
                        <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Signed In As</p>
                        <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <button onClick={() => { setCurrentView("profile"); setShowMoreDropdown(false); }} className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer">
                        <User className="w-3.5 h-3.5 text-emerald-400" /><span>View Profile</span>
                      </button>
                      <button onClick={() => { handleLogout(); setShowMoreDropdown(false); }} className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer border-t border-slate-800/40 mt-1">
                        <LogOut className="w-3.5 h-3.5" /><span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* FULL WIDTH LAYOUT CONTAINER */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
        
        {/* Quick Authority Notification Box */}
        {currentUser.role === "authority" && (
          <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <span className="font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                🏛 Authority Corner — Active Ward Dashboard
              </span>
              <p className="text-text-secondary">
                Registered as <strong>{currentUser.designation}</strong> under <strong>{currentUser.department}</strong>.
              </p>
            </div>
            <div className="text-[10px] text-text-muted max-w-md sm:text-right">
              Verify outstanding community reports. Publish a resolved report with work proof to trigger citizen consensus polling.
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <main className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {currentView === "feed" && (
                <IssueFeed
                  issues={issues}
                  currentUser={currentUser}
                  onVote={handleVote}
                  onVoteResolution={handleVoteResolution}
                  onAddComment={handleAddComment}
                  onAddResolution={handleAddResolution}
                  onLike={handleLike}
                  onSaveIssue={handleSaveIssue}
                  onAddPeerEvidence={handleAddPeerEvidence}
                  searchQuery={globalSearchQuery}
                  setSearchQuery={setGlobalSearchQuery}
                />
              )}

              {currentView === "report" && (
                <CreateIssueModal
                  currentUser={currentUser}
                  onClose={() => setCurrentView("feed")}
                  onSave={handleCreateIssue}
                />
              )}

              {currentView === "map" && (
                <GeoMap
                  issues={issues}
                  currentUser={currentUser}
                  onSelectIssue={(issueId) => {
                    // When user clicks issue on map, show it in feed
                    setCurrentView("feed");
                    setTimeout(() => {
                      const el = document.getElementById(issueId);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                />
              )}

              {currentView === "rewards" && (
                <RewardsShop
                  issues={issues}
                  currentUser={currentUser}
                  onRedeemReward={handleRedeemReward}
                  onSaveIssue={handleSaveIssue}
                  onLike={handleLike}
                  onSelectIssue={(issueId) => {
                    setCurrentView("feed");
                    setTimeout(() => {
                      const el = document.getElementById(issueId);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  onNavigate={(view) => setCurrentView(view)}
                />
              )}

              {currentView === "leaderboard" && (
                <Leaderboard
                  issues={issues}
                  currentUser={currentUser}
                  onSaveIssue={handleSaveIssue}
                  onLike={handleLike}
                  onSelectIssue={(issueId) => {
                    setCurrentView("feed");
                    setTimeout(() => {
                      const el = document.getElementById(issueId);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                />
              )}

              {currentView === "chatbot" && (
                <div className="max-w-3xl mx-auto w-full">
                  <DrishtiBot currentUser={currentUser} issues={issues} />
                </div>
              )}

              {currentView === "profile" && (
                <>
                  <UserProfileView
                    user={sharedProfile || currentUser!}
                    issues={issues}
                    onTriggerFix={handleTriggerFix}
                    onUpdateUser={handleUpdateUser}
                    loggedInUser={currentUser}
                    isViewingShared={!!sharedProfile}
                    onBackToOwnProfile={() => setSharedProfile(null)}
                    onVote={handleVote}
                  />
                  <ProfileTabs
                    user={sharedProfile || currentUser!}
                    issues={issues}
                    currentUser={currentUser!}
                    onVote={handleVote}
                    onVoteResolution={handleVoteResolution}
                    onAddComment={handleAddComment}
                    onAddResolution={handleAddResolution}
                    onLike={handleLike}
                    onSaveIssue={handleSaveIssue}
                    onAddPeerEvidence={handleAddPeerEvidence}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      </div>

      {/* FLOATING ACTION CREATE COMPLAINT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateIssueModal
            currentUser={currentUser}
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateIssue}
          />
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-bg-secondary border border-brand-primary/20 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3.5 max-w-sm"
          >
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs text-text-primary leading-snug">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
