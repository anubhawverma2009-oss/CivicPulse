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
  MoreHorizontal, RotateCw, Check, ChevronDown, Menu, X
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
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between relative">
      {/* LEFT SLIDING DRAWER MENU (ChatGPT/Google Workspace Style) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Dark blur backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Slide-out Left Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-[#1E293B] border-r border-white/10 shadow-2xl z-50 flex flex-col justify-between"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">C</div>
                    <span className="font-black text-[#F1F5F9] tracking-tight text-base">
                      CivicPulse<span className="text-blue-500">AI</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                    title="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                      setIsDrawerOpen(false);
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
                      setIsDrawerOpen(false);
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
                      setIsDrawerOpen(false);
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
                      setIsDrawerOpen(false);
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
                      setIsDrawerOpen(false);
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
                      setIsDrawerOpen(false);
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#111622] border-b border-white/[0.05] shadow-xl px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/[0.06]"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4 text-blue-500" />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-md">C</div>
          <h1 className="text-lg font-black tracking-tight text-[#F1F5F9] cursor-pointer" onClick={() => setCurrentView("feed")}>
            CivicPulse<span className="text-blue-500 underline decoration-2 underline-offset-4 ml-0.5">AI</span>
          </h1>
        </div>



        {/* Action icons, Interactive Location Pill & User details */}
        <div className="flex items-center gap-3.5">
          {/* INTERACTIVE CLICK-TO-REFRESH LOCATION PILL */}
          <button
            onClick={handleRefreshHeaderLocation}
            disabled={isRefreshingHeaderLoc}
            className="hidden lg:flex items-center gap-3 bg-[#1F2937]/80 hover:bg-[#2D3748] border border-white/5 px-4 py-1.5 rounded-full transition-all cursor-pointer group disabled:opacity-50"
            title="Locate Me / Refresh Coordinates (GPS/IP)"
          >
            <span className="text-[9px] text-[#94A3B8] font-black tracking-widest uppercase">My Ward</span>
            <span className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
              {currentUser.location}
              <RotateCw className={`w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors ${isRefreshingHeaderLoc ? "animate-spin" : ""}`} />
            </span>
            <div className={`w-2 h-2 rounded-full ${isRefreshingHeaderLoc ? "bg-blue-400 animate-ping" : "bg-emerald-500 animate-pulse"}`}></div>
          </button>

          {currentUser.role === "citizen" && (
            <div className="hidden sm:block text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3 py-1.5 rounded-xl">
              ⭐ {currentUser.civicScore} Pts
            </div>
          )}

          {/* Report Issue Button */}
          {currentUser.role === "citizen" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden md:inline">Report Issue</span>
              <span className="inline md:hidden">Report</span>
            </button>
          )}

          {/* User Profile initials */}
          <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
            <div 
              onClick={() => setCurrentView("profile")}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center border border-white/10 text-white font-bold text-xs uppercase cursor-pointer transition-colors"
              title="Go to Profile Dashboard"
            >
              {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl bg-bg-secondary border border-brand-primary/10 hover:border-brand-critical/30 text-text-muted hover:text-brand-critical transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
                <DrishtiBot currentUser={currentUser} issues={issues} />
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
