import { useState } from "react";
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

function EmptyState({ title, icon: Icon }: { title: string; icon: React.ComponentType<any> }) {
  return (
    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 border border-white/5 rounded-2xl space-y-5 shadow-lg relative overflow-hidden group">
      {/* Subtle ambient glow on hover */}
      <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Decorative premium icon shield */}
      <div className="w-20 h-20 rounded-2xl bg-slate-950/40 border border-white/10 flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-brand-primary/20">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/5 flex items-center justify-center border border-brand-primary/25">
          <Icon className="w-6 h-6 text-brand-primary group-hover:animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Start contributing to your city. Help make Varanasi better by filing reports and participating in local civic actions!
        </p>
      </div>
    </div>
  );
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
    { id: "reports", label: "Reports", count: myReports.length, icon: FileText },
    { id: "polls", label: "Polls Voted", count: pollIssues.length, icon: BarChart3 },
    { id: "saves", label: "Saves", count: savedReports.length, icon: Bookmark },
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
    <div className="mt-10 space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 pb-1 gap-1 sm:gap-4 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-t-xl transition-all relative shrink-0 cursor-pointer ${
                isActive 
                  ? "text-brand-primary bg-white/[0.02]" 
                  : "text-text-muted hover:text-text-secondary hover:bg-white/[0.01]"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? "text-brand-primary" : "text-text-muted"}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                isActive 
                  ? "bg-brand-primary/20 text-brand-primary font-bold" 
                  : "bg-slate-900 text-slate-500 font-medium"
              }`}>
                {tab.count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid of Issues / Empty States */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTab === "reports" && (
          myReports.length > 0 ? (
            myReports.map(renderIssue)
          ) : (
            <EmptyState title="No reports available" icon={FileText} />
          )
        )}

        {activeTab === "polls" && (
          pollIssues.length > 0 ? (
            pollIssues.map(renderIssue)
          ) : (
            <EmptyState title="No polls available" icon={BarChart3} />
          )
        )}

        {activeTab === "saves" && (
          savedReports.length > 0 ? (
            savedReports.map(renderIssue)
          ) : (
            <EmptyState title="No saved items available" icon={Bookmark} />
          )
        )}
      </div>

    </div>
  );
}
