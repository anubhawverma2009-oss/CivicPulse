import { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORIES } from "../lib/data";
import { Bot } from "lucide-react";
import IssueCard from "./IssueCard";
import DrishtiBot from "./DrishtiBot";
import CivicPulseLogo from "./CivicPulseLogo";

interface IssueFeedProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onVote: (issueId: string, voteType: "yes" | "no") => void;
  onVoteResolution: (issueId: string, voteType: "solved" | "pending") => void;
  onAddComment: (issueId: string, text: string) => void;
  onAddResolution: (issueId: string, description: string, proofImg?: string) => void;
  onLike: (issueId: string) => void;
  onSaveIssue: (issueId: string) => void;
  onAddPeerEvidence: (issueId: string, description: string, proofImg?: string) => void;
  onTriggerFix: (issueId: string) => void;
  activeLocation?: string;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  onNavigate?: (view: string) => void;
}

export default function IssueFeed({
  issues,
  currentUser,
  onVote,
  onVoteResolution,
  onAddComment,
  onAddResolution,
  onLike,
  onSaveIssue,
  onAddPeerEvidence,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  onNavigate
}: IssueFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === "all" || issue.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && issue.status !== "resolved") ||
      (selectedStatus === "resolved" && issue.status === "resolved");
    const matchesSearch = issue.id.toLowerCase() === activeSearchQuery.toLowerCase() ||
      issue.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) || 
      issue.description.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      issue.category.toLowerCase().includes(activeSearchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="w-full">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 w-full scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === "all"
                ? "bg-brand-primary text-white"
                : "bg-bg-secondary border border-brand-primary/10 text-text-secondary hover:text-white"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-brand-primary text-white"
                  : "bg-bg-secondary border border-brand-primary/10 text-text-secondary hover:text-white"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Status Tabs */}
      <div className="flex items-center justify-between border-b border-brand-primary/10 pb-px overflow-x-auto scrollbar-none">
        <div className="flex">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
              selectedStatus === "all" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            All Issues ({issues.length})
            {selectedStatus === "all" && (
              <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
          <button
            onClick={() => setSelectedStatus("active")}
            className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
              selectedStatus === "active" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Active ({issues.filter(i => i.status !== "resolved").length})
            {selectedStatus === "active" && (
              <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
          <button
            onClick={() => setSelectedStatus("resolved")}
            className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
              selectedStatus === "resolved" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Resolved ({issues.filter(i => i.status === "resolved").length})
            {selectedStatus === "resolved" && (
              <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
          <button
            onClick={() => setSelectedStatus("bot")}
            className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedStatus === "bot" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" /> DrishtiBot <span className="text-blue-400">AI</span>
            {selectedStatus === "bot" && (
              <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        </div>

        {activeSearchQuery && (
          <button 
            onClick={() => {
              if (externalSetSearchQuery) externalSetSearchQuery("");
              setLocalSearchQuery("");
            }}
            className="px-4 py-1.5 mr-4 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-all flex items-center gap-2"
          >
            Clear Search: <span className="text-white">"{activeSearchQuery.length > 15 ? activeSearchQuery.substring(0, 15) + '...' : activeSearchQuery}"</span>
          </button>
        )}
      </div>

      {/* RENDER BODY */}
      <div className="w-full">
        {selectedStatus === "bot" ? (
          <div className="w-full max-w-4xl mx-auto">
            <DrishtiBot 
              currentUser={currentUser} 
              issues={issues} 
              compact={false} 
              onNavigate={onNavigate} 
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredIssues.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center glass-panel rounded-2xl"
                >
                  <div className="mb-4 flex justify-center">
                    <CivicPulseLogo variant="circular-icon" size={54} animate={true} />
                  </div>
                  <h3 className="text-lg font-bold">No Issues Found</h3>
                  <p className="text-sm text-text-muted mt-1 px-4">
                    No civic reports found in this area.
                  </p>
                </motion.div>
              ) : (
                filteredIssues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    currentUser={currentUser}
                    onVote={onVote}
                    onVoteResolution={onVoteResolution}
                    onAddComment={onAddComment}
                    onAddResolution={onAddResolution}
                    onLike={onLike}
                    onSaveIssue={onSaveIssue}
                    onAddPeerEvidence={onAddPeerEvidence}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
