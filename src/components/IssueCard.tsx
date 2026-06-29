import { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { 
  AlertTriangle, CheckCircle2, Clock, ThumbsUp, MessageSquare, Share2, 
  Bookmark, HelpCircle, Shield, Twitter, Check, Sparkles
} from "lucide-react";
import { SEVERITY_COLORS, CATEGORIES } from "../lib/data";
import { motion, AnimatePresence } from "motion/react";

interface IssueCardProps {
  key?: string | number;
  issue: IssueReport;
  currentUser: UserProfile;
  onVote: (issueId: string, voteType: "yes" | "no") => void;
  onVoteResolution: (issueId: string, voteType: "solved" | "pending") => void;
  onAddComment: (issueId: string, text: string) => void;
  onAddResolution: (issueId: string, description: string, proofImg?: string) => void;
  onLike: (issueId: string) => void;
  onSaveIssue: (issueId: string) => void;
  onAddPeerEvidence: (issueId: string, description: string, proofImg?: string) => void;
}

export default function IssueCard({
  issue,
  currentUser,
  onVote,
  onVoteResolution,
  onAddComment,
  onAddResolution,
  onLike,
  onSaveIssue,
  onAddPeerEvidence
}: IssueCardProps) {
  const [activeComments, setActiveComments] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Resolution submission states (for authority)
  const [activeResolution, setActiveResolution] = useState(false);
  const [resolutionDesc, setResolutionDesc] = useState("");

  // Peer Evidence States
  const [newEvidenceDesc, setNewEvidenceDesc] = useState("");

  const getCategoryDetails = (catName: string) => {
    return CATEGORIES.find(c => c.name.toUpperCase() === catName.toUpperCase()) || CATEGORIES[0];
  };

  const catDetails = getCategoryDetails(issue.category);
  const severityColor = SEVERITY_COLORS[issue.severity] || "#3B82F6";
  
  const totalVotes = issue.pollVotes.yes + issue.pollVotes.no;
  const yesPercent = totalVotes > 0 ? Math.round((issue.pollVotes.yes / totalVotes) * 100) : 0;
  const hasVotedPoll = issue.votedUserIds && currentUser.uid in issue.votedUserIds;
  const userPollChoice = issue.votedUserIds ? issue.votedUserIds[currentUser.uid] : null;

  const totalResVotes = issue.resolutionVotes.solved + issue.resolutionVotes.pending;
  const solvedPercent = totalResVotes > 0 ? Math.round((issue.resolutionVotes.solved / totalResVotes) * 100) : 0;
  const userResChoice = issue.votedResolutionUserIds ? issue.votedResolutionUserIds[currentUser.uid] : null;

  const isSaved = currentUser.savedIssues && currentUser.savedIssues.includes(issue.id);

  const handleShare = (type: "twitter" | "whatsapp") => {
    const text = `🚨 Civic Issue reported: ${issue.title} in ${issue.location}! Severity ${issue.severity}/10. Verified by AI. #CivicPulseAI`;
    if (type === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const submitResolution = () => {
    if (!resolutionDesc) {
      alert("Please write a short description of the fix work completed.");
      return;
    }
    onAddResolution(issue.id, resolutionDesc);
    setResolutionDesc("");
    setActiveResolution(false);
  };

  const submitEvidence = () => {
    if (!newEvidenceDesc) {
      alert("Please add a short description of what you observed.");
      return;
    }
    onAddPeerEvidence(issue.id, newEvidenceDesc);
    setNewEvidenceDesc("");
    setActiveEvidence(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.3 }}
      className={`glass-panel p-5 rounded-2xl relative flex flex-col justify-between overflow-hidden border border-brand-primary/10 shadow-lg ${
        issue.status === "resolved" ? "border-l-4 border-l-brand-success" : "border-l-4 border-l-brand-primary"
      }`}
    >
      <div>
        {/* Status badge top right */}
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-bg-secondary/80 backdrop-blur-md border border-brand-primary/5">
          {issue.status === "resolved" ? (
            <span className="text-brand-success flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
          ) : issue.status === "in_progress" ? (
            <span className="text-brand-warning flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> In Progress
            </span>
          ) : (
            <span className="text-text-muted flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Pending
            </span>
          )}
        </div>

        {/* Report Header Info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs text-text-muted">
          <span className="px-2 py-0.5 rounded text-white font-semibold text-[10px] tracking-wide" style={{ backgroundColor: catDetails.color }}>
            {catDetails.icon} {catDetails.name}
          </span>
          <span className="text-[11px]">📍 {issue.location}</span>
          <span className="text-[11px]">⏰ {new Date(issue.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Title */}
        <h3 className="text-md font-bold font-display text-text-primary mb-2.5 leading-snug">
          {issue.title}
        </h3>

        {/* Problem Image */}
        {issue.imageUrl && (
          <div className="w-full h-40 rounded-xl overflow-hidden mb-3 relative bg-bg-secondary group border border-brand-primary/5">
            <img 
              src={issue.imageUrl} 
              alt={issue.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 text-white border border-brand-primary/10">
              {issue.isReal ? (
                <span className="text-brand-success">✓ Authentic Real Photo</span>
              ) : (
                <span className="text-brand-warning">⚠ Rendered Asset</span>
              )}
              <span>• AI Conf: {Math.round(issue.aiConfidence * 100)}%</span>
            </div>
          </div>
        )}

        {/* Professional Clean AI Description */}
        <div className="bg-bg-secondary/50 rounded-xl p-3 mb-3 border border-brand-primary/5">
          <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-primary" /> AI Refined Description
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {issue.description}
          </p>
        </div>

        {/* Autonomous Agent Triage Details */}
        {issue.triage && (
          <div className="bg-brand-primary/5 rounded-xl p-3 mb-3 border border-brand-primary/10">
            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">🤖 CivicPulse AI Dispatch Agent</span>
              <span className="text-brand-success font-semibold bg-brand-success/10 px-2 py-0.5 rounded text-[9px]">
                Priority Score: {issue.triage.agentPriorityIndex}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-text-muted mb-2 border-b border-brand-primary/5 pb-2">
              <div>
                <span className="block text-[8px] uppercase font-bold text-text-muted/60">Routed Department:</span>
                <span className="font-semibold text-text-secondary text-[11px]">{issue.triage.department}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase font-bold text-text-muted/60">Assigned Officer:</span>
                <span className="font-semibold text-text-secondary text-[11px]">{issue.triage.assignedOfficer}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase font-bold text-text-muted/60">Est. Repair Budget:</span>
                <span className="font-semibold text-brand-success text-[11px] font-display">₹{issue.triage.budgetINR.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase font-bold text-text-muted/60">Autotriage Match:</span>
                <span className="font-semibold text-text-secondary text-[11px]">High Accuracy</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted leading-normal italic">
              &ldquo;{issue.triage.justification}&rdquo;
            </p>
          </div>
        )}

        {/* Threat Meter & Hazards Grid */}
        <div className="bg-bg-secondary/30 rounded-xl p-3 mb-3 border border-brand-primary/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary flex items-center gap-1">
              Threat Severity Assessment:
            </span>
            <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px]" style={{ color: severityColor, backgroundColor: severityColor + "15" }}>
              {issue.severity}/10 Severity
            </span>
          </div>
          <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${issue.severity * 10}%`, backgroundColor: severityColor }} />
          </div>

          {/* Hazards Tags */}
          {issue.hazards && issue.hazards.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1.5 border-t border-brand-primary/5">
              <span className="text-[10px] font-bold text-text-muted uppercase mr-1">Hazards:</span>
              {issue.hazards.map((haz, i) => (
                <span key={i} className="text-[9px] font-semibold text-brand-critical bg-brand-critical/10 border border-brand-critical/10 px-1.5 py-0.5 rounded-full">
                  ⚠ {haz}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* COMMUNITY POLL */}
        <div className="bg-bg-secondary/60 rounded-xl p-3 mb-3 border border-brand-primary/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-warning mb-1.5 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5 text-brand-warning" /> Community Verification Poll
          </div>
          <p className="text-xs text-text-primary mb-2.5 font-semibold leading-normal">{issue.pollQuestion}</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onVote(issue.id, "yes")}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                userPollChoice === "yes"
                  ? "bg-brand-success text-white shadow-sm"
                  : "bg-bg-secondary/80 border border-brand-primary/10 text-text-secondary hover:text-white"
              }`}
            >
              <span>✅ Yes ({issue.pollVotes.yes})</span>
            </button>
            <button
              onClick={() => onVote(issue.id, "no")}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                userPollChoice === "no"
                  ? "bg-brand-critical text-white shadow-sm"
                  : "bg-bg-secondary/80 border border-brand-primary/10 text-text-secondary hover:text-white"
              }`}
            >
              <span>❌ No ({issue.pollVotes.no})</span>
            </button>
          </div>

          {hasVotedPoll && (
            <div className="mt-2 text-[10px] text-text-muted text-center flex items-center justify-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success" /> 
              {yesPercent}% of local neighbors confirm this issue exists.
            </div>
          )}
        </div>

        {/* MUNICIPAL WORK ORDERS & FIX UPDATES */}
        <div className="space-y-3 mb-3">
          {issue.responses && issue.responses.length > 0 ? (
            <div className="bg-brand-success/5 border border-brand-success/15 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-brand-success uppercase tracking-wider flex items-center gap-1">
                  🛠 Resolution Update Posted
                </span>
                <span className="text-[9px] text-text-muted">
                  {new Date(issue.responses[0].timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <p className="text-text-secondary font-sans leading-relaxed text-xs">
                  &ldquo;{issue.responses[0].description}&rdquo;
                </p>
                
                <div className="flex items-center gap-2 text-text-muted text-[9px] border-t border-brand-success/10 pt-1.5">
                  <span>Responder: <strong className="text-text-primary">{issue.responses[0].responderName}</strong></span>
                  <span>•</span>
                  <span className="text-brand-success font-semibold uppercase">{issue.responses[0].responderDepartment}</span>
                </div>

                {/* Resolution BEFORE/AFTER Comparison if proof photo exists */}
                {issue.responses[0].proofImageUrl && (
                  <div className="mt-3 bg-black/10 rounded-lg p-2.5 border border-brand-success/10">
                    <p className="text-[9px] text-text-muted font-bold mb-2 uppercase text-center tracking-wider">Before & After Comparison</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <span className="text-[8px] font-semibold text-brand-critical bg-brand-critical/10 px-1 py-0.5 rounded mb-1 inline-block">BEFORE REPORT</span>
                        <div className="w-full h-20 rounded overflow-hidden border border-brand-primary/5">
                          {issue.imageUrl ? (
                            <img src={issue.imageUrl} alt="Before" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[9px]">Damage</div>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-semibold text-brand-success bg-brand-success/10 px-1 py-0.5 rounded mb-1 inline-block">AFTER WORK</span>
                        <div className="w-full h-20 rounded overflow-hidden border border-brand-success/20">
                          <img src={issue.responses[0].proofImageUrl} alt="After" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution verification poll for citizens */}
              <div className="mt-3 pt-3 border-t border-brand-success/15 space-y-1.5">
                <p className="text-[11px] font-semibold text-text-secondary text-center">
                  Has this issue been successfully resolved?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onVoteResolution(issue.id, "solved")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userResChoice === "solved"
                        ? "bg-brand-success text-white"
                        : "bg-bg-secondary border border-brand-success/20 text-brand-success hover:bg-brand-success/5"
                    }`}
                  >
                    👍 Solved ({issue.resolutionVotes.solved})
                  </button>
                  <button
                    onClick={() => onVoteResolution(issue.id, "pending")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userResChoice === "pending"
                        ? "bg-brand-critical text-white"
                        : "bg-bg-secondary border border-brand-critical/20 text-brand-critical hover:bg-brand-critical/5"
                    }`}
                  >
                    👎 Still Pending ({issue.resolutionVotes.pending})
                  </button>
                </div>
                {totalResVotes > 0 && (
                  <div className="text-[9px] text-text-muted text-center pt-1 font-sans">
                    Progress: {solvedPercent}% solved votes. Requires 80%+ solved votes for automatic closure.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 bg-bg-secondary/15 rounded-xl text-xs text-text-muted border border-dashed border-brand-primary/10">
              No resolution updates have been posted yet.
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div>
        <div className="flex items-center justify-between pt-2.5 border-t border-brand-primary/10 text-xs">
          <div className="flex gap-3">
            <button 
              onClick={() => onLike(issue.id)}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                issue.likedUserIds?.includes(currentUser.uid)
                  ? "text-brand-primary"
                  : "text-text-secondary hover:text-brand-primary"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${issue.likedUserIds?.includes(currentUser.uid) ? "fill-current" : ""}`} />
              <span>{issue.likes || 0}</span>
            </button>
            <button 
              onClick={() => {
                setActiveComments(!activeComments);
                setActiveEvidence(false);
              }}
              className={`flex items-center gap-1 hover:text-brand-primary transition-colors cursor-pointer ${
                activeComments ? "text-brand-primary font-bold" : "text-text-secondary"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{issue.comments ? issue.comments.length : 0}</span>
            </button>
            <button 
              onClick={() => {
                setActiveEvidence(!activeEvidence);
                setActiveComments(false);
              }}
              className={`flex items-center gap-1 hover:text-brand-warning transition-colors cursor-pointer ${
                activeEvidence ? "text-brand-warning font-bold" : "text-text-secondary"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-brand-warning" />
              <span className="text-[11px]">Witness ({issue.peerEvidence ? issue.peerEvidence.length : 0})</span>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Twitter Share */}
            <button 
              onClick={() => handleShare("twitter")}
              title="Share to Twitter"
              className="p-1 rounded hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
            >
              <Twitter className="w-3.5 h-3.5" />
            </button>
            {/* WhatsApp Share */}
            <button 
              onClick={() => handleShare("whatsapp")}
              title="Share on WhatsApp"
              className="p-1 rounded hover:bg-brand-success/10 text-text-secondary hover:text-brand-success transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {/* Save to Profile */}
            <button 
              onClick={() => onSaveIssue(issue.id)}
              title="Save Complaint"
              className={`p-1 rounded transition-colors cursor-pointer ${
                isSaved ? "text-brand-warning bg-brand-warning/10" : "hover:bg-brand-warning/10 text-text-secondary hover:text-brand-warning"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* AUTHORITY FIX PANEL */}
        {currentUser.role === "authority" && (
         <div className="mt-3 pt-3 border-t border-brand-primary/10">
           {activeResolution ? (
             <div className="bg-bg-secondary p-3 rounded-xl border border-brand-primary/10 space-y-3">
               <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                 Submit Fix Resolution
               </h4>
               
               <div>
                 <label className="block text-[10px] font-bold text-text-secondary mb-1">
                   Describe Resolved Works Done
                 </label>
                 <textarea
                   value={resolutionDesc}
                   onChange={(e) => setResolutionDesc(e.target.value)}
                   placeholder="Details of the repaired pothole / restored bulb..."
                   className="w-full bg-bg-primary border border-brand-primary/10 rounded-lg p-2.5 text-xs text-text-primary h-14 resize-none focus:outline-none focus:border-brand-primary font-sans"
                  />
                  {/* Synthetic Image Proof generation */}
               <div className="space-y-2">
                 <label className="block text-[10px] font-bold text-text-secondary">
                   Upload Resolution Proof Photo
                 </label>
               </div>
               </div>

               <div className="flex justify-end gap-2 pt-1">
                 <button
                   onClick={() => setActiveResolution(false)}
                   className="px-3 py-1 rounded bg-bg-tertiary text-text-secondary text-xs font-bold hover:text-white cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={submitResolution}
                   className="px-3 py-1 rounded bg-brand-success hover:bg-brand-success/90 text-white text-xs font-bold cursor-pointer"
                 >
                   Submit Update
                 </button>
               </div>
             </div>
           ) : (
             <button
               onClick={() => setActiveResolution(true)}
               className="w-full py-2 bg-brand-success/15 hover:bg-brand-success/25 text-brand-success border border-brand-success/20 hover:border-brand-success/40 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
             >
               <Check className="w-4 h-4" /> Publish Resolution Work Report
             </button>
           )}
         </div>
        )}

        {/* COMMENTS THREAD */}
        <AnimatePresence>
          {activeComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-brand-primary/10 overflow-hidden space-y-2.5"
            >
              <h4 className="text-xs font-bold text-text-secondary">
                Comments Thread ({issue.comments ? issue.comments.length : 0})
              </h4>

              {/* List of comments */}
              <div className="max-h-28 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {issue.comments && issue.comments.length > 0 ? (
                  issue.comments.map(c => (
                    <div key={c.id} className="bg-bg-secondary/80 p-2.5 rounded-lg text-xs">
                      <div className="flex justify-between font-semibold text-text-muted text-[10px] mb-1">
                        <span className="flex items-center gap-1">
                          {c.authorName}{" "}
                          <span className="text-[8px] px-1 bg-bg-primary text-text-muted rounded">
                            {c.authorRole}
                          </span>
                        </span>
                        <span>
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-text-secondary leading-normal">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-text-muted text-center py-2">
                    No comments posted yet.
                  </p>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a supportive reply..."
                  className="flex-1 bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
                <button
                  onClick={() => {
                    if (!newCommentText.trim()) return;
                    onAddComment(issue.id, newCommentText);
                    setNewCommentText("");
                  }}
                  className="bg-brand-primary hover:bg-brand-primary-dark px-3 py-1.5 rounded-lg text-white font-bold text-xs cursor-pointer"
                >
                  Post
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PEER EVIDENCE CROWDSOURCING THREAD */}
        <AnimatePresence>
          {activeEvidence && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-brand-primary/10 overflow-hidden space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-warning flex items-center gap-1">
                  🛡️ Witness Logs ({issue.peerEvidence ? issue.peerEvidence.length : 0})
                </h4>
                <span className="text-[9px] text-brand-success font-semibold">Earn +15 Civic Coins!</span>
              </div>

              {/* List of evidence */}
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {issue.peerEvidence && issue.peerEvidence.length > 0 ? (
                  issue.peerEvidence.map(pe => (
                    <div key={pe.id} className="bg-bg-secondary/75 p-2.5 rounded-xl text-xs border border-brand-primary/5 space-y-1.5">
                      <div className="flex justify-between font-semibold text-text-muted text-[9px]">
                        <span className="flex items-center gap-1 text-white">
                          👤 {pe.authorName}{" "}
                          <span className="text-[8px] px-1 bg-brand-warning/10 text-brand-warning rounded font-bold">
                            WITNESS
                          </span>
                        </span>
                        <span>
                          {new Date(pe.timestamp || "").toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-text-secondary leading-normal font-sans text-xs">{pe.description}</p>
                      {pe.proofImageUrl && (
                        <div className="w-full h-20 rounded-lg overflow-hidden border border-brand-primary/5 mt-1">
                          <img src={pe.proofImageUrl} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-text-muted text-center py-3 bg-bg-secondary/20 rounded-xl border border-dashed border-brand-primary/5">
                    No active witness proof has been logged yet. Confirm it exists by submitting witness testimony!
                  </p>
                )}
              </div>

              {/* Submit New Evidence Form */}
              <div className="bg-bg-secondary/85 p-3 rounded-xl border border-brand-primary/5 space-y-2.5">
                <span className="text-[9px] font-bold text-text-muted uppercase block">Witness Testimony Log</span>
                
                <div>
                  <textarea
                    value={newEvidenceDesc}
                    onChange={(e) => setNewEvidenceDesc(e.target.value)}
                    placeholder="State what you saw at this site (e.g. street light is still flickering, pothole is filled with rain)..."
                    className="w-full bg-bg-primary border border-brand-primary/10 rounded-lg p-2 text-xs text-text-primary h-12 resize-none focus:outline-none focus:border-brand-primary font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setNewEvidenceDesc("");
                      setActiveEvidence(false);
                    }}
                    className="px-2.5 py-1 rounded bg-bg-tertiary text-text-secondary text-[10px] font-semibold hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitEvidence}
                    className="px-2.5 py-1 rounded bg-brand-warning hover:bg-brand-warning/90 text-black text-[10px] font-bold"
                  >
                    Log Evidence
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
