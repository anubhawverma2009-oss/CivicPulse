import React from "react";
import { UserProfile as UserProfileType, Badge, IssueReport } from "../types";
import { Award, User, Star, MapPin, ClipboardList, TrendingUp, CheckCircle, Flame } from "lucide-react";
import { INITIAL_BADGES, CATEGORIES } from "../lib/data";

interface UserProfileProps {
  user: UserProfileType;
  issues: IssueReport[];
  onTriggerFix: (issueId: string) => void;
}

export default function UserProfile({ user, issues, onTriggerFix }: UserProfileProps) {
  const isCitizen = user.role === "citizen";

  // Calculate stats
  const reportedCount = issues.filter(i => i.authorId === user.uid).length;
  
  // Verifications cast count
  const verificationsCount = issues.filter(i => {
    return i.votedUserIds && user.uid in i.votedUserIds;
  }).length;

  // Resolved count
  const resolvedCount = issues.filter(i => i.authorId === user.uid && i.status === "resolved").length;

  // Active work orders assigned to authority department
  const getAssignedWorkOrders = () => {
    if (isCitizen || !user.department) return [];
    
    // Find category ID that maps to this department
    let assignedCategory = "";
    if (user.department.includes("PWD")) assignedCategory = "POTHOLE";
    else if (user.department.includes("Electricity")) assignedCategory = "STREETLIGHT";
    else if (user.department.includes("Sanitation") || user.department.includes("Municipal")) assignedCategory = "GARBAGE";
    else if (user.department.includes("Water")) assignedCategory = "WATER LEAKAGE";
    else if (user.department.includes("PWD")) assignedCategory = "FOOTPATH";
    else if (user.department.includes("Traffic")) assignedCategory = "TRAFFIC";

    return issues.filter(i => {
      // If authority matches, or return all active items for testing convenience
      return i.status !== "resolved";
    });
  };

  const assignedWorkOrders = getAssignedWorkOrders();

  const getBadgeDetails = (badgeId: string): Badge => {
    return INITIAL_BADGES.find(b => b.id === badgeId) || INITIAL_BADGES[0];
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      {/* Profile Header Block */}
      <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-brand-primary/10">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-primary p-1 bg-bg-secondary flex items-center justify-center">
            {user.photoURL ? (
              <img src={user.photoURL} referrerPolicy="no-referrer" alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-extrabold text-2xl uppercase select-none">
                {user.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "US"}
              </span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 bg-brand-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
            {user.role.toUpperCase()}
          </span>
        </div>

        <div className="text-center md:text-left space-y-1.5 flex-1">
          <h2 className="text-xl font-bold font-display text-text-primary flex items-center justify-center md:justify-start gap-2">
            {user.name}
            {user.documentVerified && (
              <span className="text-brand-success bg-brand-success/15 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-brand-success/20">
                ✓ Govt Verified ID
              </span>
            )}
          </h2>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-text-secondary">
            <span className="flex items-center gap-1 text-text-muted">
              <MapPin className="w-3.5 h-3.5" /> {user.location}
            </span>
            <span>•</span>
            <span className="text-brand-primary font-semibold">
              {isCitizen ? "Varanasi Citizen Board" : `${user.department} — ${user.designation}`}
            </span>
          </div>

          {!isCitizen && user.bio && (
            <p className="text-xs text-text-muted italic max-w-md">
              &ldquo;{user.bio}&rdquo;
            </p>
          )}
        </div>

        {/* Civic points box */}
        {isCitizen && (
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 text-center min-w-[120px]">
            <Star className="w-5 h-5 text-brand-warning mx-auto mb-1 animate-spin-slow" />
            <div className="text-2xl font-black font-display text-text-primary">{user.civicScore}</div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Civic Points</div>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citizen Side Badges & Activity */}
        {isCitizen ? (
          <>
            {/* Badges Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                <Award className="w-4.5 h-4.5 text-brand-warning" /> Unlocked Civic Badges
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {INITIAL_BADGES.map(badge => {
                  const isUnlocked = user.badges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                        isUnlocked
                          ? "bg-brand-primary/10 border-brand-primary/20"
                          : "bg-bg-secondary/40 border-brand-primary/5 opacity-50 select-none"
                      }`}
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">{badge.name}</div>
                        <div className="text-[9px] text-text-muted truncate">{badge.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity History */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                <ClipboardList className="w-4.5 h-4.5 text-brand-primary" /> My Civic Activity Timeline
              </h3>

              <div className="bg-bg-secondary/30 rounded-xl p-4 border border-brand-primary/5 space-y-3 text-xs leading-relaxed">
                <div className="flex items-center justify-between border-b border-brand-primary/5 pb-2">
                  <span className="text-text-muted">Complaints Filed:</span>
                  <span className="font-bold text-text-secondary">{reportedCount} cases</span>
                </div>
                <div className="flex items-center justify-between border-b border-brand-primary/5 pb-2">
                  <span className="text-text-muted">Peer verifications cast:</span>
                  <span className="font-bold text-text-secondary">{verificationsCount} votes</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-text-muted">Resolved improvements:</span>
                  <span className="font-bold text-brand-success">{resolvedCount} closed</span>
                </div>

                <div className="bg-brand-primary/5 p-3 rounded-lg border border-brand-primary/10 flex items-center gap-2.5 mt-2 text-[11px]">
                  <Flame className="w-4 h-4 text-brand-warning animate-bounce" />
                  <div>
                    <span className="font-bold text-white">Active Streak!</span> Verified 3 issues in Sigra Ward this week. You earned <span className="text-brand-success font-bold">+12 points</span>.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Authority Side Assignments & Work Orders */
          <>
            {/* Authority stats boxes */}
            <div className="space-y-4 col-span-full">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Departmental Efficiency Dashboard
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-secondary p-4 rounded-xl text-center border border-brand-primary/5">
                  <div className="text-xl font-bold text-brand-primary">{assignedWorkOrders.length}</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">Pending Orders</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-xl text-center border border-brand-primary/5">
                  <div className="text-xl font-bold text-brand-success">
                    {issues.filter(i => i.status === "resolved").length}
                  </div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">Resolved Fixed</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-xl text-center border border-brand-primary/5">
                  <div className="text-xl font-bold text-brand-warning">94%</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">Response Rate</div>
                </div>
              </div>
            </div>

            {/* Active assigned cases list */}
            <div className="space-y-4 col-span-full">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <ClipboardList className="w-4.5 h-4.5 text-brand-primary" /> Active Work Orders Assigned
              </h3>

              <div className="space-y-3">
                {assignedWorkOrders.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">
                    No active complaints assigned to your department right now! Excellent job.
                  </p>
                ) : (
                  assignedWorkOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-bg-secondary/40 p-4 rounded-xl border border-brand-primary/5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs font-bold text-text-primary">{order.title}</div>
                        <p className="text-[10px] text-text-muted mt-1">
                          📍 {order.location} | Severity {order.severity}/10
                        </p>
                      </div>

                      <button
                        onClick={() => onTriggerFix(order.id)}
                        className="px-3.5 py-1.5 bg-brand-success hover:bg-brand-success/90 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Publish Fix
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
