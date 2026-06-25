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
  MapPin, HelpCircle, Bell, Volume2, ShieldCheck, CheckCircle, Compass, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#151A23] border-b border-[#3B82F615] shadow-lg px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base">C</div>
          <h1 className="text-lg font-bold tracking-tight text-[#F1F5F9]">
            CivicPulse<span className="text-blue-500 underline decoration-2 underline-offset-4 ml-0.5">AI</span>
          </h1>
        </div>

        {/* Location pill */}
        <div className="hidden md:flex items-center gap-4 bg-[#1F2937] px-4 py-1.5 rounded-full border border-white/5">
          <span className="text-[10px] text-[#94A3B8] font-bold tracking-wider">LOCATION</span>
          <span className="text-xs font-medium text-[#CBD5E1]">{currentUser.location}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* Action icons & User details */}
        <div className="flex items-center gap-4">
          {currentUser.role === "citizen" && (
            <div className="hidden sm:block text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3 py-1.5 rounded-xl">
              ⭐ {currentUser.civicScore} Pts
            </div>
          )}

          {/* New Issue Button */}
          {currentUser.role === "citizen" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-white/10 text-white font-bold text-xs uppercase">
              {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
            </div>
            <span className="hidden sm:inline font-medium text-text-secondary">{currentUser.name}</span>
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

      {/* DUAL LAYER LAYOUT CONTAINER */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION CONTROL */}
        <aside className="w-full md:w-64 shrink-0 space-y-3">
          <div className="glass-panel p-4 rounded-2xl space-y-1">
            <p className="text-[9px] font-black tracking-widest text-text-muted uppercase px-3 mb-2">
              Citizen Cockpit
            </p>

            <button
              onClick={() => setCurrentView("feed")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "feed"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Community Feed
            </button>

            <button
              onClick={() => setCurrentView("map")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "map"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4 text-brand-success animate-spin-slow" />
              Pulse GeoMap & Impact
            </button>

            <button
              onClick={() => setCurrentView("rewards")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "rewards"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <Gift className="w-4 h-4 text-brand-warning animate-bounce" />
              Coins Reward Store
            </button>

            <button
              onClick={() => setCurrentView("leaderboard")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "leaderboard"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Priority Leaderboard
            </button>

            <button
              onClick={() => setCurrentView("chatbot")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "chatbot"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-warning animate-pulse" />
              DrishtiBot AI
            </button>

            <button
              onClick={() => setCurrentView("profile")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                currentView === "profile"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Profile Dashboard
            </button>
          </div>

          {/* Quick Authority Notification Box */}
          {currentUser.role === "authority" && (
            <div className="bg-brand-warning/10 border border-brand-warning/20 p-4 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-brand-warning uppercase tracking-wider block">
                🏛 Authority Corner
              </span>
              <p className="text-text-secondary">
                You are registered as <strong>{currentUser.designation}</strong> under <strong>{currentUser.department}</strong>.
              </p>
              <div className="text-[10px] text-text-muted">
                Please check outstanding cases assigned to your department. Publish a fix report to request citizen consensus closure.
              </div>
            </div>
          )}
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 min-w-0">
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
