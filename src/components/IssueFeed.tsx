import React, { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORIES } from "../lib/data";
import IssueCard from "./IssueCard";
import DrishtiBot from "./DrishtiBot";

interface IssueFeedProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onVote: (issueId: string, voteType: any) => void;
  onVoteResolution: (issueId: string, voteType: any) => void;
  onAddComment: (issueId: string, text: string) => void;
  onAddResolution: (issueId: string, description: string, proofImg?: string) => void;
  onLike: (issueId: string) => void;
  onSaveIssue: (issueId: string) => void;
  onAddPeerEvidence: (issueId: string, description: string, proofImg?: string) => void;
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
  onAddPeerEvidence
}: IssueFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === "all" || issue.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && issue.status !== "resolved") ||
      (selectedStatus === "resolved" && issue.status === "resolved");
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search local reports (e.g. pothole)..."
            className="w-full bg-bg-secondary border border-brand-primary/15 rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:col-span-2 scrollbar-thin">
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
      <div className="flex border-b border-brand-primary/10 pb-px">
        <button
          onClick={() => setSelectedStatus("all")}
          className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer ${
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
          className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer ${
            selectedStatus === "active" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Active Complaints ({issues.filter(i => i.status !== "resolved").length})
          {selectedStatus === "active" && (
            <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>
        <button
          onClick={() => setSelectedStatus("resolved")}
          className={`px-5 py-3 text-sm font-semibold transition-all relative cursor-pointer ${
            selectedStatus === "resolved" ? "text-brand-primary" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Resolved Work Orders ({issues.filter(i => i.status === "resolved").length})
          {selectedStatus === "resolved" && (
            <motion.div layoutId="activeStatusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
          )}
        </button>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Community Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredIssues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center glass-panel rounded-2xl"
              >
                <AlertOctagon className="w-12 h-12 text-brand-warning mx-auto mb-3 animate-bounce" />
                <h3 className="text-lg font-bold">No Issues Found</h3>
                <p className="text-sm text-text-muted mt-1 px-4">
                  No civic complaints match the active filters in this locality. Report a new issue to alert municipal engineers!
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

        {/* RIGHT COLUMN: Chatbot & Insights Sidebar (1/3 width, STICKY) */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
          <DrishtiBot currentUser={currentUser} issues={issues} />
        </div>
      </div>
    </div>
  );
}
