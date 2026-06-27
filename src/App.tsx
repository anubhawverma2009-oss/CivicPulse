import React, { useState, useEffect } from "react";
import { UserProfile, IssueReport, Comment, ResolutionResponse, PeerEvidence } from "./types";
import AuthScreen from "./components/AuthScreen";
import IssueFeed from "./components/IssueFeed";
import Leaderboard from "./components/Leaderboard";
import DrishtiBot from "./components/DrishtiBot";
import UserProfileView from "./components/UserProfile";
import CreateIssueModal from "./components/CreateIssueModal";
import GeoMap from "./components/GeoMap";
import RewardsShop from "./components/RewardsShop";
import { INITIAL_ISSUES } from "./lib/data";
import { CivicAuth, CivicDatabase } from "./firebase/config";
import { 
  Building, LogOut, Sparkles, MessageSquare, Trophy, User, PlusCircle, 
  MapPin, HelpCircle, Bell, Volume2, ShieldCheck, CheckCircle, Compass, Gift,
  MoreHorizontal, RotateCw, Check, ChevronDown, Menu, X, Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { findClosestLocation, detectLocationByIP, detectLocationByGPS } from "./utils/location";

export default function App() {
  // Authentication & State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("civicpulse_firebase_current");
    return saved ? JSON.parse(saved) : null;
  });

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [currentView, setCurrentView] = useState<"feed" | "leaderboard" | "chatbot" | "profile" | "map" | "rewards">("feed");
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
    // Seed database if empty (relevant for real cloud Firestore mode)
    CivicDatabase.seedDatabaseIfEmpty();

    // Subscribe to real-time issues feed updates
    const unsubscribeIssues = CivicDatabase.subscribeIssues((updatedIssues) => {
      setIssues(updatedIssues);
    });

    // Subscribe to auth state changes
    const unsubscribeAuth = CivicAuth.onAuthChanged((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribeIssues();
      unsubscribeAuth();
    };
  }, []);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Namaste ${user.name}! Welcome to the CivicPulse AI cockpit.`);
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

    setShowCreateModal(false);

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
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">C</div>
                    <span className="font-black text-[#F1F5F9] tracking-tight text-base">
                      CivicPulse<span className="text-blue-500">AI</span>
                    </span>
                  </div>
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
                    Core Dashboard Pages
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
                      setCurrentView("map");
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      currentView === "map"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="w-4 h-4 text-brand-success" />
                      <span>Plus Google Map Impact</span>
                    </div>
                    {currentView === "map" && <Check className="w-3.5 h-3.5 shrink-0" />}
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
                      <span>Coins Reward Store</span>
                    </div>
                    {currentView === "rewards" && <Check className="w-3.5 h-3.5 shrink-0" />}
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
                      <Trophy className="w-4 h-4 text-[#F59E0B]" />
                      <span>Priority Leaderboard</span>
                    </div>
                    {currentView === "leaderboard" && <Check className="w-3.5 h-3.5 shrink-0" />}
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
                      <span>DrishtiBot AI Assistant</span>
                    </div>
                    {currentView === "chatbot" && <Check className="w-3.5 h-3.5 shrink-0" />}
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
                      <span>Profile Dashboard</span>
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

      {/* MOBILE SEARCH OVERLAY (Full Viewport) */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 bg-[#0B0E14] z-[2000] p-4 flex items-center gap-3 border-b border-[#3B82F6]/30 shadow-2xl"
          >
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#3B82F6]" />
              </span>
              <input
                autoFocus
                type="text"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (currentView !== "feed") {
                    setCurrentView("feed");
                  }
                }}
                placeholder="Search report feed..."
                className="w-full bg-[#151A23] border border-[#3B82F6]/50 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 shadow-inner"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 hover:scale-110 transition-transform p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white bg-[#151A23] border border-slate-800/80 rounded-xl transition-all"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-[1000] bg-[#0B0E14]/92 backdrop-blur-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] min-h-16 md:min-h-[76px] lg:min-h-[80px] transition-all duration-300 w-full select-none flex items-center py-2 md:py-3">
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

        <div className="max-w-[95%] mx-auto px-4 md:px-6 lg:px-8 w-full flex items-center justify-between gap-4 py-1.5 md:py-2">
          {/* LEFT SECTION: BRANDING + REPOSITIONED SEARCH & LOCATION */}
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6 flex-1 min-w-0">
            {/* Branding with Menu Button */}
            <motion.div 
              className="flex items-center gap-2 md:gap-2.5 lg:gap-3 shrink-0"
              whileHover="hover"
              whileTap="tap"
            >
              {/* Logo Element (Now replaced with three-line Menu icon button) */}
              <motion.button 
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] border border-blue-400/20 cursor-pointer"
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 4px 12px rgba(59,130,246,0.3)",
                    "0 4px 22px rgba(59,130,246,0.6)",
                    "0 4px 12px rgba(59,130,246,0.3)"
                  ]
                }}
                transition={{
                  scale: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  },
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ 
                  scale: 1.12, 
                  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.45)" 
                }}
                whileTap={{ scale: 0.95 }}
                title="Open navigation menu"
              >
                <Menu className="w-5 h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 text-white stroke-[2.5]" />
              </motion.button>

              {/* App Name */}
              <div 
                onClick={() => setCurrentView("feed")}
                className="flex items-center gap-1 font-display tracking-tight text-slate-100 text-sm md:text-base lg:text-[20px] leading-none cursor-pointer"
              >
                <span className="hidden sm:inline-block font-semibold group-hover:text-white transition-colors duration-300">
                  CivicPulse
                </span>
                <span className="font-regular text-[#3B82F6]">
                  AI
                </span>
              </div>
            </motion.div>

            {/* SEARCH BAR (repositioned next to Civic Pulse AI) */}
            <div className="hidden md:flex items-center shrink-0">
              <div className={`w-[200px] lg:w-[320px] xl:w-[420px] h-10 lg:h-11 relative flex items-center rounded-xl border transition-all duration-300 ${
                isSearchFocused 
                  ? "bg-[#151A23]/95 border-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.25)] scale-[1.01]" 
                  : "bg-[#151A23]/70 border-[#3B82F6]/25 hover:border-[#3B82F6]/50"
              }`}>
                <span className="absolute left-3.5 flex items-center pointer-events-none">
                  <Search className={`w-[18px] h-[18px] transition-colors duration-300 ${isSearchFocused ? "text-[#3B82F6]" : "text-slate-400"}`} />
                </span>
                <input
                  id="header-search-input"
                  type="text"
                  value={globalSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    if (currentView !== "feed") {
                      setCurrentView("feed");
                    }
                  }}
                  placeholder="Search report feed (e.g., potholes, safety)..."
                  className="w-full h-full bg-transparent pl-10 pr-10 text-xs lg:text-sm text-slate-100 placeholder:text-slate-500/80 focus:outline-none"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery("")}
                    className="absolute right-3.5 text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white/5"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* LOCATION CHIP (repositioned next to Search display) */}
            <div className="hidden sm:flex items-center shrink-0">
              <motion.button
                onClick={handleRefreshHeaderLocation}
                disabled={isRefreshingHeaderLoc}
                className="flex flex-col items-start bg-[#151A23]/70 hover:bg-[#151A23]/95 border border-[#3B82F6]/30 hover:border-[#3B82F6]/60 px-4 py-1.5 lg:py-2 rounded-xl transition-all cursor-pointer group disabled:opacity-50 shadow-sm w-[180px] lg:w-[220px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Locate Me / Refresh Coordinates (GPS/IP)"
              >
                <div className="flex items-center gap-1 w-full justify-between">
                  <span className="text-[9px] uppercase font-bold text-[#3B82F6] tracking-wider">
                    LOCATION
                  </span>
                  <RotateCw className={`w-3 h-3 text-blue-400 group-hover:text-blue-300 transition-colors shrink-0 ${isRefreshingHeaderLoc ? "animate-spin" : ""}`} />
                </div>
                <div className="flex items-center gap-1 mt-0.5 w-full min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                  <span className="text-[10px] lg:text-xs font-semibold text-[#CBD5E1] truncate w-full text-left">
                    MY WARD: {currentUser?.location || "Kanpur, Swaroop Nagar"}
                  </span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* RIGHT SECTION: LOCATION + USER PROFILE + ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile Search Standalone Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>


            {/* REPORT ISSUE BUTTON */}
            {currentUser?.role === "citizen" && (
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] hover:brightness-110 active:scale-95 text-white px-4 md:px-5 h-10 rounded-xl text-xs md:text-sm font-semibold items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all cursor-pointer min-w-[110px] md:min-w-[130px]"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 0, scale: 0.98 }}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Report Issue</span>
                <span className="md:hidden inline">Report</span>
              </motion.button>
            )}

            {/* Symmetrical Vertical Separator (Only on Desktop/Tablet) */}
            <div className="hidden sm:block w-[1px] h-8 bg-slate-800 shrink-0" />

            {/* USER PROFILE SECTION */}
            <div className="relative shrink-0 flex items-center gap-2">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/5 transition-all group"
                title="Profile Options"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-blue-500/40 group-hover:border-[#3B82F6] bg-slate-800 flex items-center justify-center overflow-hidden transition-all shadow-[0_2px_8px_rgba(59,130,246,0.2)] group-hover:scale-105">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      referrerPolicy="no-referrer" 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-bold text-xs uppercase font-display">
                      {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
                    </span>
                  )}
                </div>

                {/* Optional notification pulse */}
                {notification && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#0B0E14] rounded-full animate-ping" />
                )}

                {/* User Info (Desktop only) */}
                <div className="hidden lg:flex flex-col items-start text-left max-w-[110px]">
                  <span className="text-xs font-semibold text-slate-100 truncate w-full group-hover:text-white transition-colors duration-150">
                    {currentUser.name ? currentUser.name.split(" ")[0] : "User"}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">
                    {currentUser.role}
                  </span>
                </div>

                <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showMoreDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMoreDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 top-full w-48 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1"
                    >
                      <div className="px-2.5 py-2 border-b border-slate-800/60 mb-1">
                        <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Signed In As</p>
                        <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentView("profile");
                          setShowMoreDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setShowMoreDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer border-t border-slate-800/40 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Hamburger Mobile Menu Toggle Button (Visible on mobile screens) */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="sm:hidden w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
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
                  currentUser={currentUser}
                  onRedeemReward={handleRedeemReward}
                />
              )}

              {currentView === "leaderboard" && (
                <Leaderboard
                  issues={issues}
                  currentUser={currentUser}
                  onSaveIssue={handleSaveIssue}
                  onLike={handleLike}
                />
              )}

              {currentView === "chatbot" && (
                <div className="max-w-3xl mx-auto w-full">
                  <DrishtiBot currentUser={currentUser} issues={issues} />
                </div>
              )}

              {currentView === "profile" && (
                <UserProfileView
                  user={currentUser}
                  issues={issues}
                  onTriggerFix={handleTriggerFix}
                />
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
