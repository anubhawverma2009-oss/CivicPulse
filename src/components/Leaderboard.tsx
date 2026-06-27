import React, { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { AlertTriangle, Clock, Heart, Share2, Award, Calendar, ThumbsUp, Bookmark } from "lucide-react";
import { CATEGORIES } from "../lib/data";

interface LeaderboardProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onSaveIssue: (issueId: string) => void;
  onLike: (issueId: string) => void;
  onSelectIssue: (issueId: string) => void;
}

export default function Leaderboard({ issues, currentUser, onSaveIssue, onLike, onSelectIssue }: LeaderboardProps) {
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "resolved">("daily");

  const getFilteredLeaderboard = () => {
    // Determine the date range
    const now = new Date();
    let startDate = new Date();
    if (filter === "daily") {
      startDate.setHours(0, 0, 0, 0); // start of today
    } else if (filter === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
    }

    let list = [...issues];

    // Filter by resolution status
    if (filter === "resolved") {
      list = list.filter(i => i.status === "resolved");
    } else {
      list = list.filter(i => i.status !== "resolved");
      // filter date range only if not "resolved"
      list = list.filter(i => new Date(i.createdAt) >= startDate);
    }

    // Sort by civic priority score: (severity * 10) + yes_votes
    return list.sort((a, b) => {
      const scoreA = (a.severity * 10) + a.pollVotes.yes;
      const scoreB = (b.severity * 10) + b.pollVotes.yes;
      return scoreB - scoreA;
    });
  };

  const leaderboardItems = getFilteredLeaderboard();

  // Helper to calculate days pending
  const getDaysPending = (createdDateStr: string) => {
    const diffTime = Math.abs(Date.now() - new Date(createdDateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? "1 day" : `${diffDays} days`;
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getCategoryDetails = (catName: string) => {
    return CATEGORIES.find(c => c.name.toUpperCase() === catName.toUpperCase()) || CATEGORIES[0];
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-brand-warning/10 rounded-lg text-brand-warning">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-text-primary">Problem Priority Leaderboard</h2>
          <p className="text-xs text-text-muted">Real-time localized backlog ranking for city department interventions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-bg-secondary p-1 rounded-xl mb-6 border border-brand-primary/10">
        {(["daily", "weekly", "monthly", "resolved"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
              filter === tab
                ? "bg-brand-primary text-white shadow-md"
                : "text-text-secondary hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items Backlog List */}
      <div className="space-y-4">
        {leaderboardItems.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Award className="w-10 h-10 mx-auto mb-2 text-text-muted/60" />
            <p className="text-xs">No active cases are listed for this time period.</p>
          </div>
        ) : (
          leaderboardItems.map((issue, index) => {
            const cat = getCategoryDetails(issue.category);
            const civicScore = (issue.severity * 10) + issue.pollVotes.yes;
            
            // Calculate relative progress width (cap at 100)
            const maxScorePossible = 100 + 50; // Severity 10 * 10 + 50 votes limit
            const progressPercent = Math.min((civicScore / maxScorePossible) * 100, 100);

            return (
              <div
                key={issue.id}
                className="flex items-center gap-4 bg-bg-secondary/40 p-4 rounded-xl border border-brand-primary/5 hover:border-brand-primary/15 transition-all cursor-pointer"
                onClick={() => onSelectIssue(issue.id)}
              >
                {/* Rank Badge */}
                <div className="w-8 text-center font-display font-black text-sm">
                  {getRankEmoji(index)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text-secondary truncate pr-2">
                      <span className="mr-1">{cat.icon}</span>
                      {issue.title}
                    </span>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                      Score: {civicScore}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {getDaysPending(issue.createdAt)} pending
                    </span>
                    <span>•</span>
                    <span>👥 {issue.pollVotes.yes + issue.pollVotes.no} confirms</span>
                    <span>•</span>
                    <span className="font-semibold" style={{ color: cat.color }}>
                      {cat.name}
                    </span>
                    <span>•</span>
                    <span>📍 {issue.location}</span>
                  </div>

                  {/* Priority Bar */}
                  <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>

                  {/* AI Snippet Note */}
                  <p className="text-[10px] italic text-text-muted truncate">
                    🤖 {issue.description.substring(0, 90)}...
                  </p>
                </div>

                {/* Micro Actions */}
                <div className="flex flex-col gap-1.5 justify-center pl-2 border-l border-brand-primary/5">
                  <button
                    onClick={() => onSaveIssue(issue.id)}
                    title="Save case"
                    className="p-1 rounded hover:bg-brand-warning/10 text-text-muted hover:text-brand-warning cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onLike(issue.id)}
                    title="Like report"
                    className="p-1 rounded hover:bg-brand-primary/10 text-text-muted hover:text-brand-primary cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
