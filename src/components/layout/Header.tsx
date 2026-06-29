import React, { useState } from "react";
import { UserProfile } from "../../types";
import { Search, MapPin, Coins, ChevronDown, Bell, User, LogOut, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CivicPulseLogo from "../CivicPulseLogo";

interface HeaderProps {
  currentUser: UserProfile;
  activeLocation?: string;
  isRefreshingHeaderLoc: boolean;
  onRefreshLocation: () => void;
  onLogout: () => void;
  onNavigate: (view: any) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onMenuClick: () => void;
}

export default function Header({
  currentUser,
  activeLocation,
  isRefreshingHeaderLoc,
  onRefreshLocation,
  onLogout,
  onNavigate,
  searchQuery,
  onSearchChange,
  onMenuClick
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] bg-[#0B0E14]/70 backdrop-blur-xl border-b border-white/[0.05] h-16 lg:h-20 flex items-center">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button 
            onClick={onMenuClick}
            className="w-10 h-10 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-slate-300 transition-all"
            whileTap={{ scale: 0.95 }}
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-current rounded-full" />
              <div className="w-5 h-0.5 bg-current rounded-full" />
              <div className="w-5 h-0.5 bg-current rounded-full" />
            </div>
          </motion.button>

          <div onClick={() => onNavigate("feed")} className="cursor-pointer flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full group-hover:bg-blue-500/40 transition-all" />
              <CivicPulseLogo variant="icon" size={28} animate={true} />
            </div>
            <div className="flex items-center">
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/5 border border-blue-500/20 rounded-lg shadow-inner">
                <span className="font-black tracking-tighter text-white leading-none text-base">
                  CivicPulse <span className="text-blue-400">AI</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl hidden md:block">
          <div className={`relative flex items-center w-full rounded-2xl border transition-all duration-300 ${
            isSearchFocused 
              ? "bg-[#1A2230] border-[#3B82F6] shadow-[0_0_24px_rgba(59,130,246,0.25)]" 
              : "bg-[#111620]/80 border-white/10"
          }`}>
            <Search className={`absolute left-4 w-5 h-5 ${isSearchFocused ? "text-[#3B82F6]" : "text-slate-400"}`} />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search civic reports, areas or issues..."
              className="w-full h-11 bg-transparent pl-11 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            onClick={() => onNavigate("report")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Issue</span>
          </motion.button>

          <motion.button
            onClick={onRefreshLocation}
            disabled={isRefreshingHeaderLoc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 transition-all whitespace-nowrap"
          >
            <MapPin className={`w-3.5 h-3.5 text-[#3B82F6] ${isRefreshingHeaderLoc ? "animate-pulse" : ""}`} />
            <span className="text-[11px] lg:text-xs font-semibold text-slate-200 max-w-[100px] truncate">
              {activeLocation ? activeLocation.split(',')[0] : "Location"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </motion.button>

          <motion.button
            onClick={() => onNavigate("rewards")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] lg:text-xs font-bold text-amber-400">
              {currentUser.civicScore || 0}
            </span>
          </motion.button>

          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} referrerPolicy="no-referrer" alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xs">
                  {currentUser.name[0]}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showUserDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  className="absolute right-0 mt-2 w-48 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50"
                >
                  <button 
                    onClick={() => { onNavigate("profile"); setShowUserDropdown(false); }} 
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" /> My Profile
                  </button>
                  <button 
                    onClick={onLogout} 
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-800/40 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
