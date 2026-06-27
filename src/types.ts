export type UserRole = "citizen" | "authority";

export interface Locality {
  city: string;
  ward: string;
  lat: number;
  lng: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  locked: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  photoURL: string;
  name: string;
  role: UserRole;
  location: string;
  civicScore: number;
  badges: string[]; // Badge IDs
  savedIssues: string[]; // Issue IDs
  createdAt: string;
  
  // Authority only fields
  department?: string;
  designation?: string;
  bio?: string;
  documentVerified?: boolean;
  docType?: string;
  customDocType?: string;
  authorityProofType?: string;
  customAuthorityProofType?: string;
  docWardsRegion?: string;
  customDocWardsRegion?: string;
  docChangeCount?: number;
  docChangeHistory?: Array<{
    date: string;
    reason: string;
    previousDoc: string;
    newDoc: string;
  }>;
  money?: number; // Starting money/budget configuration
  onboardingComplete?: boolean;
  username?: string;
  usernameChangesCount?: number;
  
  // Gamification reward shop expansion
  civicCoins?: number;
  redeemedRewards?: string[];
}

export interface ResolutionResponse {
  responderId: string;
  responderName: string;
  responderRole: UserRole;
  responderDesignation?: string;
  responderDepartment?: string;
  description: string;
  proofImageUrl?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  timestamp: string;
}

export interface PeerEvidence {
  id: string;
  authorName: string;
  authorUid: string;
  description: string;
  proofImageUrl?: string;
  timestamp: string;
}

export interface TriageDetails {
  department: string;
  assignedOfficer: string;
  budgetINR: number;
  agentPriorityIndex: number;
  justification: string;
}

export type IssueStatus = "pending" | "in_progress" | "resolved";

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  category: "POTHOLE" | "STREETLIGHT" | "GARBAGE" | "WATER LEAKAGE" | "FOOTPATH" | "TRAFFIC";
  severity: number; // 1-10
  location: string; // Locality ward string
  latitude: number;
  longitude: number;
  imageUrl?: string;
  pollQuestion: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  tags: string[];
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  pollVotes: {
    yes: number;
    no: number;
  };
  resolutionVotes: {
    solved: number;
    pending: number;
  };
  votedUserIds?: { [userId: string]: "yes" | "no" };
  votedResolutionUserIds?: { [userId: string]: "solved" | "pending" };
  responses: ResolutionResponse[];
  comments: Comment[];
  likes: number;
  shares: number;
  aiConfidence: number;
  isReal: boolean;
  hazards: string[];
  
  // High fidelity community hero expansions
  peerEvidence?: PeerEvidence[];
  triage?: TriageDetails;
}

