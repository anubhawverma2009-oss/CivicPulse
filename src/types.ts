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
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  type: "earn" | "redeem";
  amount: number;
  description: string;
  timestamp: string;
  status?: "completed" | "pending";
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
  category: string;
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
  resolvedAt?: string;
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
  likedUserIds?: string[];
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

export interface CivicCalculations {
  transactions: Transaction[];
  totalEarned: number;
  totalRedeemed: number;
  currentCoins: number;
  civicScore: number;
}

export function getUserTransactions(user: UserProfile): Transaction[] {
  if (user.transactions && user.transactions.length > 0) {
    return user.transactions;
  }
  
  // Fallback / Initial transactions based on current score and redeemed rewards
  const score = user.civicScore || 0;
  
  // Let's build a set of transactions
  const tx: Transaction[] = [];
  
  if (score > 0) {
    if (score <= 100) {
      tx.push({
        id: "init-1",
        type: "earn",
        amount: score,
        description: "Initial Civic Contributions",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "completed"
      });
    } else {
      let remaining = score;
      const parts = [
        { desc: "Hazardous Pothole Reported", amt: 20 },
        { desc: "Streetlight Report Verified", amt: 50 },
        { desc: "Illegal Dumping Site Resolved", amt: 100 },
        { desc: "Community Landmark Resolution Bonus", amt: 1000 }
      ];
      
      parts.forEach((p, idx) => {
        if (remaining >= p.amt) {
          tx.push({
            id: `init-${idx}`,
            type: "earn",
            amount: p.amt,
            description: p.desc,
            timestamp: new Date(Date.now() - 3600000 * (48 - idx * 8)).toISOString(),
            status: "completed"
          });
          remaining -= p.amt;
        }
      });
      
      if (remaining > 0) {
        tx.push({
          id: "init-rest",
          type: "earn",
          amount: remaining,
          description: "Civic Engagement Activities",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: "completed"
        });
      }
    }
  } else {
    tx.push({
      id: "init-zero",
      type: "earn",
      amount: 25,
      description: "Onboarding Welcome Bonus",
      timestamp: new Date().toISOString(),
      status: "completed"
    });
  }
  
  // Add redeemed transactions if any
  if (user.redeemedRewards && user.redeemedRewards.length > 0) {
    user.redeemedRewards.forEach((rId, idx) => {
      tx.push({
        id: `redeem-${rId}-${idx}`,
        type: "redeem",
        amount: 150, // standard reward cost
        description: `${rId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Claimed`,
        timestamp: new Date(Date.now() - 3600000 * (12 - idx)).toISOString(),
        status: "completed"
      });
    });
  }
  
  return tx;
}

export function computeCivicStats(user: UserProfile): CivicCalculations {
  const transactions = getUserTransactions(user);
  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + t.amount, 0);
  const totalRedeemed = transactions.filter(t => t.type === 'redeem').reduce((acc, t) => acc + t.amount, 0);
  const currentCoins = totalEarned - totalRedeemed;
  const civicScore = totalEarned; // Lifetime Contribution
  
  return {
    transactions,
    totalEarned,
    totalRedeemed,
    currentCoins,
    civicScore
  };
}

