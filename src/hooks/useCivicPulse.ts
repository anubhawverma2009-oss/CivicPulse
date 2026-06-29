import { useState, useEffect, useCallback, useMemo } from "react";
import { UserProfile, IssueReport, Comment, ResolutionResponse, PeerEvidence } from "../types";
import { CivicAuth, CivicDatabase } from "../firebase/config";
import { findClosestLocation, detectLocationByIP, detectLocationByGPS } from "../utils/location";

export function useCivicPulse() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [currentView, setCurrentView] = useState<string>("feed");
  const [notification, setNotification] = useState<string | null>(null);
  const [isRefreshingHeaderLoc, setIsRefreshingHeaderLoc] = useState(false);
  const [sessionLocation, setSessionLocation] = useState<string | null>(() => sessionStorage.getItem("civicpulse_session_loc"));
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const showToast = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  }, []);

  useEffect(() => {
    if (sessionLocation) {
      sessionStorage.setItem("civicpulse_session_loc", sessionLocation);
    } else {
      sessionStorage.removeItem("civicpulse_session_loc");
    }
  }, [sessionLocation]);

  useEffect(() => {
    const unsubscribeAuth = CivicAuth.onAuthChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIssues([]);
      return;
    }
    CivicDatabase.seedDatabaseIfEmpty();
    const unsubscribeIssues = CivicDatabase.subscribeIssues((updatedIssues) => {
      setIssues(updatedIssues);
    });
    return () => unsubscribeIssues();
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    await CivicAuth.signOut();
    setCurrentUser(null);
    setCurrentView("feed");
    showToast("Signed out successfully. Jai Hind!");
  }, [showToast]);

  const handleVote = useCallback(async (issueId: string, voteType: "yes" | "no") => {
    if (!currentUser) return;
    await CivicDatabase.voteIssue(issueId, currentUser.uid, voteType);
    showToast("Verification recorded. Civic Points updated.");
  }, [currentUser, showToast]);

  const handleVoteResolution = useCallback(async (issueId: string, voteType: "solved" | "pending") => {
    if (!currentUser) return;
    const { isResolved } = await CivicDatabase.voteResolution(issueId, currentUser.uid, voteType);
    if (isResolved) {
      showToast("Resolution verified! Issue status updated.");
    } else {
      showToast("Feedback recorded.");
    }
  }, [currentUser, showToast]);

  const handleLike = useCallback(async (issueId: string) => {
    if (!currentUser) return;
    await CivicDatabase.likeIssue(issueId, currentUser.uid);
  }, [currentUser]);

  const handleSaveIssue = useCallback(async (issueId: string) => {
    if (!currentUser) return;
    const savedIssues = [...(currentUser.savedIssues || [])];
    const index = savedIssues.indexOf(issueId);
    if (index === -1) {
      savedIssues.push(issueId);
      showToast("🔖 Issue saved to your profile.");
    } else {
      savedIssues.splice(index, 1);
      showToast("🔖 Issue removed from your profile.");
    }
    await CivicAuth.updateProfile(currentUser.uid, { savedIssues });
  }, [currentUser, showToast]);

  const handleAddComment = useCallback(async (issueId: string, content: string) => {
    if (!currentUser) return;
    const comment: Comment = {
      id: "comment-" + Date.now(),
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content,
      timestamp: new Date().toISOString()
    };
    await CivicDatabase.addComment(issueId, comment);
    showToast("💬 Comment added.");
  }, [currentUser, showToast]);

  const handleAddResolution = useCallback(async (issueId: string, resolution: Omit<ResolutionResponse, "responderId" | "responderName" | "responderRole" | "timestamp">) => {
    if (!currentUser) return;
    const response: ResolutionResponse = {
      ...resolution,
      responderId: currentUser.uid,
      responderName: currentUser.name,
      responderRole: currentUser.role,
      responderDesignation: currentUser.designation,
      responderDepartment: currentUser.department,
      timestamp: new Date().toISOString()
    };
    await CivicDatabase.addResolutionResponse(issueId, response);
    showToast("✅ Resolution update published.");
  }, [currentUser, showToast]);

  const handleAddPeerEvidence = useCallback(async (issueId: string, evidence: Omit<PeerEvidence, "id" | "authorName" | "authorUid" | "timestamp">) => {
    if (!currentUser) return;
    const newEvidence: PeerEvidence = {
      ...evidence,
      id: "evidence-" + Date.now(),
      authorName: currentUser.name,
      authorUid: currentUser.uid,
      timestamp: new Date().toISOString()
    };
    await CivicDatabase.addPeerEvidence(issueId, newEvidence);
    showToast("📸 Verification evidence added. +5 Civic Points.");
  }, [currentUser, showToast]);

  const handleCreateIssue = useCallback(async (newIssue: Omit<IssueReport, "id" | "createdAt" | "updatedAt">) => {
    if (!currentUser) return "";
    const issueId = await CivicDatabase.createIssue(newIssue);
    showToast("🚀 Issue report published!");
    setCurrentView("feed");
    return issueId;
  }, [currentUser, showToast]);

  const handleRedeemReward = useCallback(async (rewardId: string, cost: number) => {
    if (!currentUser) return;
    try {
      await CivicAuth.redeemReward(currentUser.uid, rewardId, cost);
      showToast("🎁 Reward redeemed!");
    } catch (e: any) {
      showToast("❌ Redemption failed: " + e.message);
    }
  }, [currentUser, showToast]);

  const handleTriggerFix = useCallback(async (issueId: string) => {
    showToast("Authority notified. Triggering rapid response triage...");
  }, [showToast]);

  const handleRefreshHeaderLocation = useCallback(async () => {
    if (!currentUser) return;
    setIsRefreshingHeaderLoc(true);
    setSessionLocation(null);
    try {
      const gpsLoc = await detectLocationByGPS(3500);
      if (gpsLoc) {
        const closest = findClosestLocation(gpsLoc.lat, gpsLoc.lng);
        setSessionLocation(closest);
        showToast(`📍 Location updated: ${closest}`);
        return;
      }
      const ipLoc = await detectLocationByIP();
      if (ipLoc) {
        const closest = findClosestLocation(ipLoc.lat, ipLoc.lng);
        setSessionLocation(closest);
        showToast(`📍 Location updated: ${closest}`);
        return;
      }
    } catch (err) {
      showToast("Location detection failed.");
    } finally {
      setIsRefreshingHeaderLoc(false);
    }
  }, [currentUser, showToast]);

  const activeLocation = useMemo(() => sessionLocation || currentUser?.location, [sessionLocation, currentUser]);

  const locationFilteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // If searching for a specific issue (e.g. from map or direct search), bypass location filter
      if (globalSearchQuery) {
        const s = globalSearchQuery.toLowerCase();
        if (
          issue.id.toLowerCase() === s ||
          issue.title.toLowerCase().includes(s) ||
          issue.description.toLowerCase().includes(s)
        ) return true;
      }

      if (!activeLocation) return true;
      const searchLoc = activeLocation.split(',')[0].toLowerCase();
      return issue.location.toLowerCase().includes(searchLoc);
    });
  }, [issues, activeLocation, globalSearchQuery]);

  return {
    currentUser,
    setCurrentUser,
    issues,
    currentView,
    setCurrentView,
    notification,
    showToast,
    isRefreshingHeaderLoc,
    handleRefreshHeaderLocation,
    sessionLocation,
    setSessionLocation,
    globalSearchQuery,
    setGlobalSearchQuery,
    handleLogout,
    handleVote,
    handleVoteResolution,
    handleLike,
    handleSaveIssue,
    handleAddComment,
    handleAddResolution,
    handleAddPeerEvidence,
    handleCreateIssue,
    handleRedeemReward,
    handleTriggerFix,
    activeLocation,
    locationFilteredIssues,
    authLoading
  };
}
