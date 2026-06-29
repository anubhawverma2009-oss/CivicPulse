import React from "react";
import { 
  LayoutGrid, Activity, Map, Gift, Bot, User, LogOut, X, Check, Star, ShieldCheck, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CivicPulseLogo from "../CivicPulseLogo";
import { UserProfile } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  currentUser: UserProfile;
}

export default function Sidebar({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onLogout,
  currentUser
}: SidebarProps) {
  const menuItems = [
    { id: "feed", icon: LayoutGrid, label: "Community Feed", color: "text-blue-400" },
    { id: "leaderboard", icon: Activity, label: "Priority Issues", color: "text-amber-400" },
    { id: "map", icon: Map, label: "Issue Map", color: "text-emerald-400" },
    { id: "rewards", icon: Gift, label: "Reward Store", color: "text-amber-400" },
    { id: "chatbot", icon: Bot, label: "DrishtiBot AI", color: "text-purple-400" },
    { id: "profile", icon: User, label: "My Profile", color: "text-pink-400" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ x: "-100%", opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: "-100%", opacity: 0 }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-[#0B0E14] border-r border-white/5 z-[3000] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Soft Radial Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {/* Brand Area */}
              <div className="px-6 pt-8 pb-4 flex items-center gap-3 border-b border-white/[0.03]">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse" />
                  <CivicPulseLogo variant="icon" size={36} animate={true} />
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-1 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                    <span className="font-black tracking-tighter text-white leading-none text-xl">
                      CivicPulse <span className="text-blue-400">AI</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Header */}
              <div className="relative pt-4 pb-4 px-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
                      <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#0B0E14]">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-400 font-black text-xl bg-blue-500/10">
                            {currentUser.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0B0E14] rounded-full flex items-center justify-center border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-white tracking-tight leading-none truncate max-w-[160px]">{currentUser.name}</h2>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <span className="uppercase tracking-widest text-blue-400/80">Verified Citizen</span>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{currentUser.location.split(',')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                      <Star className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Civic Score</span>
                  </div>
                  <span className="text-sm font-black text-white">{currentUser.civicScore}</span>
                </div>
              </div>

              <div className="py-2 px-3 space-y-1">
                {menuItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                    className={`w-full text-left px-3 py-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all group relative overflow-hidden ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-600/20 to-transparent text-white" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                      />
                    )}
                    <div className="flex items-center gap-3.5 relative z-10">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${isActive ? "bg-blue-600/20" : "bg-transparent group-hover:bg-white/5"}`}>
                        <item.icon className={`w-4 h-4 transition-all duration-500 ${isActive ? "text-blue-400 scale-110" : "text-slate-500 group-hover:text-slate-300"}`} />
                      </div>
                      <span className={`tracking-tight transition-all ${isActive ? "translate-x-0.5" : ""}`}>{item.label}</span>
                    </div>
                    {isActive && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

            {/* Bottom Area */}
            <div className="p-3 mt-auto flex justify-center">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-3 w-[92%] shadow-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signed in</p>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[9px] text-slate-500 truncate lowercase">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={onLogout}
                  className="w-full py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
