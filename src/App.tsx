import React, { useState } from "react";
import { UserProfile } from "./types";
import { useCivicPulse } from "./hooks/useCivicPulse";
import AuthScreen from "./components/AuthScreen";
import IssueFeed from "./components/IssueFeed";
import Leaderboard from "./components/Leaderboard";
import DrishtiBot from "./components/DrishtiBot";
import UserProfileView from "./components/UserProfile";
import CreateIssueModal from "./components/CreateIssueModal";
import GeoMap from "./components/GeoMap";
import RewardsShop from "./components/RewardsShop";
import ImpactAndMap from "./components/ImpactAndMap";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { PlusCircle, LayoutGrid, Activity, Map, Bot, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const {
    currentUser,
    setCurrentUser,
    issues,
    currentView,
    setCurrentView,
    notification,
    isRefreshingHeaderLoc,
    handleRefreshHeaderLocation,
    globalSearchQuery,
    setGlobalSearchQuery,
    handleLogout,
    handleVote,
    handleVoteResolution,
    handleLike,
    handleSaveIssue,
    handleAddComment,
    handleAddResolution,
    handleAddPeerEvidence,
    handleCreateIssue,
    handleRedeemReward,
    handleTriggerFix,
    activeLocation,
    locationFilteredIssues,
    authLoading
  } = useCivicPulse();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sharedProfile, setSharedProfile] = useState<UserProfile | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06080C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Initializing CivicPulse AI...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && currentView !== "report" && currentView !== "feed" && currentView !== "map") {
    return <AuthScreen onLogin={setCurrentUser} />;
  }

  const guestUser: UserProfile = {
    uid: "guest-" + Date.now(),
    name: "Guest Citizen",
    email: "guest@civicpulse.ai",
    photoURL: "https://ui-avatars.com/api/?name=Guest+Citizen&background=3b82f6&color=fff",
    role: "citizen",
    civicScore: 0,
    location: "Varanasi, UP",
    savedIssues: [],
    badges: [],
    createdAt: new Date().toISOString()
  };

  const effectiveUser = currentUser || guestUser;

  return (
    <div className="min-h-screen bg-[#06080C] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      <Header 
        currentUser={effectiveUser}
        activeLocation={activeLocation}
        isRefreshingHeaderLoc={isRefreshingHeaderLoc}
        onRefreshLocation={handleRefreshHeaderLocation}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        currentUser={effectiveUser}
      />

      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-12 min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {currentView === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              <IssueFeed 
                issues={issues}
                currentUser={effectiveUser}
                onVote={handleVote}
                onVoteResolution={handleVoteResolution}
                onLike={handleLike}
                onSaveIssue={handleSaveIssue}
                onAddComment={handleAddComment}
                onAddResolution={(id, desc, img) => handleAddResolution(id, { description: desc, proofImageUrl: img })}
                onAddPeerEvidence={(id, desc, img) => handleAddPeerEvidence(id, { description: desc, proofImageUrl: img })}
                onTriggerFix={handleTriggerFix}
                activeLocation={activeLocation}
                searchQuery={globalSearchQuery}
              />
            </motion.div>
          )}

          {currentView === "leaderboard" && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Leaderboard issues={issues} currentUser={effectiveUser} onSaveIssue={handleSaveIssue} onLike={handleLike} onSelectIssue={(id) => { setGlobalSearchQuery(id); setCurrentView("feed"); }} activeLocation={activeLocation} />
            </motion.div>
          )}

          {currentView === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GeoMap issues={issues} currentUser={effectiveUser} onSelectIssue={(id) => { setGlobalSearchQuery(id); setCurrentView("feed"); }} />
            </motion.div>
          )}

          {currentView === "rewards" && (
            <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RewardsShop 
                issues={issues}
                currentUser={effectiveUser} 
                onRedeemReward={handleRedeemReward} 
                onSaveIssue={handleSaveIssue}
                onLike={handleLike}
                onSelectIssue={(id) => { setGlobalSearchQuery(id); setCurrentView("feed"); }}
                onNavigate={setCurrentView}
              />
            </motion.div>
          )}

          {currentView === "chatbot" && (
            <motion.div key="chatbot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DrishtiBot currentUser={effectiveUser} issues={issues} />
            </motion.div>
          )}

          {currentView === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UserProfileView 
                user={sharedProfile || effectiveUser} 
                issues={issues}
                onTriggerFix={handleTriggerFix}
                onUpdateUser={setCurrentUser}
                loggedInUser={currentUser}
                isViewingShared={!!sharedProfile}
                onBackToOwnProfile={() => { setSharedProfile(null); setCurrentView("feed"); }}
                onVote={handleVote}
              />
            </motion.div>
          )}

          {currentView === "report" && (
            <motion.div key="report" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-3xl mx-auto">
              <CreateIssueModal currentUser={effectiveUser} onClose={() => setCurrentView("feed")} onSave={handleCreateIssue} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[2000] md:hidden bg-[#0B0E14]/90 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex items-center justify-between">
         <button onClick={() => setCurrentView("feed")} className={`p-2 ${currentView === "feed" ? "text-blue-400" : "text-slate-500"}`}><LayoutGrid className="w-6 h-6" /></button>
         <button onClick={() => setCurrentView("map")} className={`p-2 ${currentView === "map" ? "text-blue-400" : "text-slate-500"}`}><Map className="w-6 h-6" /></button>
         <button onClick={() => setCurrentView("report")} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-blue-600/30 text-white"><PlusCircle className="w-6 h-6" /></button>
         <button onClick={() => setCurrentView("chatbot")} className={`p-2 ${currentView === "chatbot" ? "text-blue-400" : "text-slate-500"}`}><Bot className="w-6 h-6" /></button>
         <button onClick={() => setCurrentView("profile")} className={`p-2 ${currentView === "profile" ? "text-blue-400" : "text-slate-500"}`}><User className="w-6 h-6" /></button>
      </div>

      {/* Global Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 100, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 100, x: "-50%" }} className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#111827] border border-blue-500/30 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-sm font-bold text-slate-100">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
