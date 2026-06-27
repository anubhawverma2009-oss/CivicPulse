import React, { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { FileText, Bookmark, BarChart3 } from "lucide-react";
import IssueCard from "./IssueCard";

interface ProfileTabsProps {
  user: UserProfile;
  issues: IssueReport[];
  currentUser: UserProfile;
  onVote: (issueId: string, voteType: "yes" | "no") => void;
  onVoteResolution: (issueId: string, voteType: "solved" | "pending") => void;
  onAddComment: (issueId: string, text: string) => void;
  onAddResolution: (issueId: string, description: string, proofImg?: string) => void;
  onLike: (issueId: string) => void;
  onSaveIssue: (issueId: string) => void;
  onAddPeerEvidence: (issueId: string, description: string, proofImg?: string) => void;
}

export default function ProfileTabs({ 
  user, 
  issues, 
  currentUser,
  onVote,
  onVoteResolution,
  onAddComment,
  onAddResolution,
  onLike,
  onSaveIssue,
  onAddPeerEvidence
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"reports" | "polls" | "saves">("reports");

  const myReports = issues.filter(issue => issue.authorId === user.uid);
  const savedReports = issues.filter(issue => user.savedIssues.includes(issue.id));
  const pollIssues = issues.filter(issue => 
    issue.votedUserIds && issue.votedUserIds[user.uid]
  );

  const tabs = [
    { id: "reports", label: "Reports", icon: FileText },
    { id: "polls", label: "Polls", icon: BarChart3 },
    { id: "saves", label: "Saves", icon: Bookmark },
  ] as const;

  const renderIssue = (issue: IssueReport) => (
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
  );

  return (
    <div className="mt-8">
      <div className="flex gap-4 border-b border-brand-primary/10 pb-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? "bg-brand-primary/10 text-brand-primary" 
                : "text-text-muted hover:bg-bg-secondary hover:text-text-secondary"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === "reports" && (
          myReports.length > 0 ? myReports.map(renderIssue) : <p className="text-xs text-text-muted italic">No reports yet.</p>
        )}
        {activeTab === "polls" && (
          pollIssues.length > 0 ? pollIssues.map(renderIssue) : <p className="text-xs text-text-muted italic">No polls voted.</p>
        )}
        {activeTab === "saves" && (
          savedReports.length > 0 ? savedReports.map(renderIssue) : <p className="text-xs text-text-muted italic">No saves yet.</p>
        )}
      </div>
    </div>
  );
}
