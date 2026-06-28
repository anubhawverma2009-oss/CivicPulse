import React, { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { AlertTriangle, Clock, Heart, Share2, Award, Calendar, ThumbsUp, Bookmark, ChevronRight, Activity, Target, CheckCircle2, Timer } from "lucide-react";
import { CATEGORIES } from "../lib/data";
import { motion, AnimatePresence } from "motion/react";

interface LeaderboardProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onSaveIssue: (issueId: string) => void;
  onLike: (issueId: string) => void;
  onSelectIssue: (issueId: string) => void;
}

export default function Leaderboard({ issues, currentUser, onSaveIssue, onLike, onSelectIssue }: LeaderboardProps) {
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "resolved">("daily");
  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(new Set());

  const getFilteredLeaderboard = () => {
    const now = new Date();
    let startDate = new Date();
    if (filter === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
    }

    let list = [...issues];

    if (filter === "resolved") {
      list = list.filter(i => i.status === "resolved");
    } else {
      list = list.filter(i => i.status !== "resolved");
      list = list.filter(i => new Date(i.createdAt) >= startDate);
    }

    return list.sort((a, b) => {
      const scoreA = (a.severity * 10) + a.pollVotes.yes;
      const scoreB = (b.severity * 10) + b.pollVotes.yes;
      return scoreB - scoreA;
    });
  };

  const leaderboardItems = getFilteredLeaderboard();

  // Summary Metrics
  const pendingIssuesCount = issues.filter(i => i.status !== "resolved").length;
  const criticalIssuesCount = issues.filter(i => i.status !== "resolved" && ((i.severity * 10) + i.pollVotes.yes) >= 80).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedTodayCount = issues.filter(i => i.status === "resolved" && new Date(i.updatedAt || i.createdAt) >= today).length;
  const avgResponseTime = "12.4 hrs"; // Mocked for display

  const getDaysPending = (createdDateStr: string) => {
    const diffTime = Math.abs(Date.now() - new Date(createdDateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? "1d" : `${diffDays}d`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", label: "🥇" };
    if (index === 1) return { bg: "bg-slate-300/10", border: "border-slate-300/20", text: "text-slate-300", label: "🥈" };
    if (index === 2) return { bg: "bg-orange-400/10", border: "border-orange-400/20", text: "text-orange-400", label: "🥉" };
    return { bg: "bg-white/[0.03]", border: "border-white/5", text: "text-slate-400", label: `#${index + 1}` };
  };

  const getCategoryDetails = (catName: string) => {
    return CATEGORIES.find(c => c.name.toUpperCase() === catName.toUpperCase()) || CATEGORIES[0];
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(expandedIssueIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIssueIds(next);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold font-sans tracking-tight text-white leading-tight">Priority Command Center</h2>
            <p className="text-xs text-slate-400 font-medium">Enterprise incident triage and civic resource allocation</p>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111620]/80 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Issues</span>
          </div>
          <div className="text-2xl font-black text-white font-sans tracking-tight">{pendingIssuesCount}</div>
        </div>
        <div className="bg-[#111620]/80 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Issues</span>
          </div>
          <div className="text-2xl font-black text-white font-sans tracking-tight">{criticalIssuesCount}</div>
        </div>
        <div className="bg-[#111620]/80 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved Today</span>
          </div>
          <div className="text-2xl font-black text-white font-sans tracking-tight">{resolvedTodayCount}</div>
        </div>
        <div className="bg-[#111620]/80 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
              <Timer className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
          </div>
          <div className="text-2xl font-black text-white font-sans tracking-tight">{avgResponseTime}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#0B0E14] p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto hide-scrollbar">
        {(["daily", "weekly", "monthly", "resolved"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 min-w-[80px] sm:min-w-[100px] py-1.5 px-3 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer select-none whitespace-nowrap ${
              filter === tab
                ? "bg-white/[0.08] text-white shadow-sm border border-white/10"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3 pb-8">
        {leaderboardItems.length === 0 ? (
          <div className="text-center py-16 bg-[#111620]/50 rounded-2xl border border-white/5 border-dashed">
            <Award className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-400 font-medium">No active cases are listed for this time period.</p>
          </div>
        ) : (
          leaderboardItems.map((issue, index) => {
            const cat = getCategoryDetails(issue.category);
            const civicScore = (issue.severity * 10) + issue.pollVotes.yes;
            const maxScorePossible = 100 + 50; 
            const progressPercent = Math.min((civicScore / maxScorePossible) * 100, 100);
            const rankStyle = getRankBadge(index);
            const isExpanded = expandedIssueIds.has(issue.id);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="group relative bg-[#111620]/90 border border-white/10 hover:border-blue-500/30 rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-[0_4px_24px_rgba(59,130,246,0.1)] flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center"
              >
                {/* Desktop Background Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Left: Rank & Priority Badge */}
                <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 shrink-0 sm:w-16 w-full sm:border-r border-white/5 sm:pr-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${rankStyle.bg} ${rankStyle.border} ${rankStyle.text} font-black font-sans text-sm shadow-sm shrink-0`}>
                    {rankStyle.label}
                  </div>
                  <div className="flex flex-col items-center flex-1 sm:flex-none">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mb-0.5">Priority</span>
                    <span className="text-xs sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest sm:hidden mr-auto">Priority Score</span>
                    <div className="bg-slate-800/80 border border-white/10 px-2 py-0.5 sm:py-1 rounded-md">
                      <span className="text-xs sm:text-sm font-black text-white">{civicScore}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Details */}
                <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-200 group-hover:text-white transition-colors truncate">
                      <span className="mr-2 opacity-80">{cat.icon}</span>
                      {issue.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded text-slate-300">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{getDaysPending(issue.createdAt)} pending</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded text-slate-300">
                      <span className="font-bold text-blue-400">{issue.pollVotes.yes + issue.pollVotes.no}</span>
                      <span>confirms</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded" style={{ color: cat.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                      <span>📍</span>
                      <span className="truncate">{issue.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full mt-1">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Escalation Progress</span>
                      <span style={{ color: cat.color }}>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }}
                      />
                    </div>
                  </div>

                  {/* Description Truncation / Expansion */}
                  <div className="mt-1">
                    <p className={`text-xs text-slate-400 leading-relaxed ${isExpanded ? "" : "line-clamp-1"}`}>
                      {issue.description}
                    </p>
                    {issue.description.length > 80 && (
                      <button 
                        onClick={(e) => toggleExpand(e, issue.id)}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center transition-colors"
                      >
                        {isExpanded ? "Show Less" : "Read More"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-col items-center justify-end sm:justify-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSaveIssue(issue.id); }}
                    className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 transition-all group/btn"
                    title="Bookmark"
                  >
                    <Bookmark className="w-4 h-4 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onLike(issue.id); }}
                    className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-all group/btn"
                    title="Upvote"
                  >
                    <ThumbsUp className="w-4 h-4 sm:w-4 sm:h-4 group-hover/btn:scale-110 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                  <button
                    className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-all group/btn hidden sm:flex pointer-events-none"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
