import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc as fbSetDoc, 
  getDoc, 
  collection, 
  addDoc as fbAddDoc, 
  updateDoc as fbUpdateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs
} from "firebase/firestore";

function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

const setDoc = (reference: any, data: any, options?: any) => {
  const cleanedData = cleanUndefined(data);
  return options ? fbSetDoc(reference, cleanedData, options) : fbSetDoc(reference, cleanedData);
};

const updateDoc = (reference: any, data: any) => {
  const cleanedData = cleanUndefined(data);
  return fbUpdateDoc(reference, cleanedData);
};

const addDoc = (reference: any, data: any) => {
  const cleanedData = cleanUndefined(data);
  return fbAddDoc(reference, cleanedData);
};
import { UserProfile, UserRole, IssueReport, Comment, ResolutionResponse, PeerEvidence } from "../types";
import { INITIAL_ISSUES } from "../lib/data";
import firebaseConfig from "../../firebase-applet-config.json";

// Hardening configuration manager: Load VITE_ env variables, fallback to applet json
const metaEnv = (import.meta as any).env || {};

const apiConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || "",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId || "",
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || "(default)"
};

// Check if Firebase keys are fully set up
const isFirebaseConfigured = !!(
  apiConfig.apiKey && 
  apiConfig.projectId && 
  apiConfig.apiKey !== "YOUR_API_KEY"
);

let app;
let realAuth: any = null;
let realDb: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(apiConfig) : getApp();
    realAuth = getAuth(app);
    realDb = getFirestore(app, apiConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
    console.log("🔥 Firebase successfully initialized in real-time Cloud production mode.");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to Local Engine:", error);
  }
} else {
  console.log("📱 Firebase credentials not detected. Operating in High-Fidelity Local Engine.");
}

// ==========================================
// ERROR HANDLERS FOR FIRESTORE PERMISSIONS
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: realAuth?.currentUser?.uid || null,
      email: realAuth?.currentUser?.email || null,
      emailVerified: realAuth?.currentUser?.emailVerified || null,
      isAnonymous: realAuth?.currentUser?.isAnonymous || null,
      tenantId: realAuth?.currentUser?.tenantId || null,
      providerInfo: realAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// HIGH-FIDELITY LOCAL STORAGE ENGINE CORES
// ==========================================

const LOCAL_USERS_KEY = "civicpulse_firebase_users";
const LOCAL_ISSUES_KEY = "civicpulse_firebase_issues";
const LOCAL_CURRENT_USER_KEY = "civicpulse_firebase_current";

const getLocalUsers = (): Record<string, UserProfile> => {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  if (!data) {
    // Generate initial sample users
    const sampleUsers: Record<string, UserProfile> = {
      "user-aravind": {
        uid: "user-aravind",
        email: "aravind@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        name: "Aravind Dev",
        role: "citizen",
        location: "Varanasi, Sigra Ward",
        civicScore: 1240,
        badges: ["first_reporter", "guard", "truth_seeker", "landmark"],
        savedIssues: [],
        createdAt: new Date().toISOString(),
        onboardingComplete: true
      },
      "user-muni": {
        uid: "user-muni",
        email: "authority@muncipal.in",
        photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        name: "Director Mishra",
        role: "authority",
        location: "Varanasi Central District",
        civicScore: 100,
        badges: [],
        savedIssues: [],
        createdAt: new Date().toISOString(),
        department: "PWD Pavement & Roads",
        designation: "Executive Engineer",
        bio: "Overseeing public infrastructure maintenance and safety operations for Varanasi East division.",
        documentVerified: true,
        onboardingComplete: true
      }
    };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(sampleUsers));
    return sampleUsers;
  }
  return JSON.parse(data);
};

const getLocalIssues = (): IssueReport[] => {
  const data = localStorage.getItem(LOCAL_ISSUES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_ISSUES_KEY, JSON.stringify(INITIAL_ISSUES));
    return INITIAL_ISSUES;
  }
  return JSON.parse(data);
};

const saveLocalUsers = (users: Record<string, UserProfile>) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const saveLocalIssues = (issues: IssueReport[]) => {
  localStorage.setItem(LOCAL_ISSUES_KEY, JSON.stringify(issues));
};

// Listeners tracking for simulated real-time updates
const issueListeners = new Set<(issues: IssueReport[]) => void>();
const authListeners = new Set<(user: UserProfile | null) => void>();

let currentSimulatedUser: UserProfile | null = (() => {
  const data = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
})();

const notifyIssueListeners = () => {
  const currentIssues = getLocalIssues();
  issueListeners.forEach(listener => listener(currentIssues));
};

const notifyAuthListeners = () => {
  authListeners.forEach(listener => listener(currentSimulatedUser));
};

// ==========================================
// EXPOSED SERVICE UNIFIED ADAPTER
// ==========================================

export const CivicAuth = {
  // Signs up a new citizen or authority member
  signUp: async (profile: Omit<UserProfile, "uid" | "createdAt" | "badges" | "savedIssues" | "civicScore"> & { password?: string }): Promise<UserProfile> => {
    if (isFirebaseConfigured && realAuth) {
      try {
        const userCred = await createUserWithEmailAndPassword(realAuth, profile.email, profile.password || "Password123!");
        const uid = userCred.user.uid;
        
        const fullProfile: UserProfile = {
          uid,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          location: profile.location,
          photoURL: profile.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
          civicScore: profile.role === "citizen" ? 25 : 100, // starting points
          badges: profile.role === "citizen" ? ["first_reporter"] : [],
          savedIssues: [],
          createdAt: new Date().toISOString(),
          department: profile.department,
          designation: profile.designation,
          bio: profile.bio,
          documentVerified: profile.role === "authority" ? true : undefined,
          money: profile.money,
          onboardingComplete: true
        };

        // Save profile doc to Firestore
        try {
          await setDoc(doc(realDb, "users", uid), fullProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        }
        return fullProfile;
      } catch (err) {
        console.error("Firebase Sign Up Error:", err);
        throw err;
      }
    } else {
      // Local simulated signup
      const users = getLocalUsers();
      const existing = Object.values(users).find(u => u.email.toLowerCase() === profile.email.toLowerCase());
      if (existing) {
        throw new Error("auth/email-already-in-use");
      }

      const uid = "user-" + Date.now();
      const fullProfile: UserProfile = {
        uid,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        location: profile.location,
        photoURL: profile.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
        civicScore: profile.role === "citizen" ? 25 : 100,
        badges: profile.role === "citizen" ? ["first_reporter"] : [],
        savedIssues: [],
        createdAt: new Date().toISOString(),
        department: profile.department,
        designation: profile.designation,
        bio: profile.bio,
        documentVerified: profile.role === "authority" ? true : undefined,
        money: profile.money,
        onboardingComplete: true
      };

      users[uid] = fullProfile;
      saveLocalUsers(users);

      currentSimulatedUser = fullProfile;
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(fullProfile));
      notifyAuthListeners();

      return fullProfile;
    }
  },

  // Signs in a user
  signIn: async (email: string, password?: string): Promise<UserProfile> => {
    if (isFirebaseConfigured && realAuth) {
      try {
        const userCred = await signInWithEmailAndPassword(realAuth, email, password || "Password123!");
        const uid = userCred.user.uid;
        
        // Fetch profile
        let userDoc;
        try {
          userDoc = await getDoc(doc(realDb, "users", uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }
        
        if (userDoc && userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          throw new Error("User document not found in Firestore database");
        }
      } catch (err) {
        console.error("Firebase Sign In Error:", err);
        throw err;
      }
    } else {
      // Local simulated signin
      const users = getLocalUsers();
      const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error("auth/user-not-found");
      }

      currentSimulatedUser = user;
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user));
      notifyAuthListeners();

      return user;
    }
  },

  // Helper to fetch user by email
  getUserByEmail: async (email: string): Promise<UserProfile | null> => {
    if (isFirebaseConfigured && realDb) {
      try {
        const usersCol = collection(realDb, "users");
        const q = query(usersCol, where("email", "==", email.toLowerCase()));
        let qSnap;
        try {
          qSnap = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "users");
        }
        if (qSnap && !qSnap.empty) {
          return qSnap.docs[0].data() as UserProfile;
        }
        return null;
      } catch (err) {
        console.error("Error getting user by email:", err);
        return null;
      }
    } else {
      const users = getLocalUsers();
      const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    }
  },

  signInWithGoogle: async (role: UserRole = "citizen"): Promise<UserProfile> => {
    if (isFirebaseConfigured && realAuth) {
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(realAuth, provider);
        const fbUser = result.user;
        const uid = fbUser.uid;
        
        const userDocRef = doc(realDb, "users", uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }
        
        if (userDoc && userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          const fullProfile: UserProfile = {
            uid,
            email: fbUser.email || `${fbUser.uid}@gmail.com`,
            name: fbUser.displayName || "Google User",
            role: role,
            location: "Varanasi, Sigra Ward",
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || "User")}`,
            civicScore: role === "citizen" ? 25 : 100,
            badges: role === "citizen" ? ["first_reporter"] : [],
            savedIssues: [],
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, fullProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
          }
          return fullProfile;
        }
      } catch (err) {
        console.error("Google Sign In Error:", err);
        throw err;
      }
    } else {
      const uid = "google-user-" + Date.now();
      const email = "vermavijay31550@gmail.com";
      const users = getLocalUsers();
      
      let user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.onboardingComplete) {
        currentSimulatedUser = user;
        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user));
        notifyAuthListeners();
        return user;
      } else {
        const tempUser: UserProfile = {
          uid: user?.uid || uid,
          email: user?.email || email,
          name: user?.name || "Vijay Verma",
          role: user?.role || role,
          location: user?.location || "Varanasi, Sigra Ward",
          photoURL: user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          civicScore: user?.civicScore || (role === "citizen" ? 120 : 100),
          badges: user?.badges || (role === "citizen" ? ["first_reporter", "guard", "truth_seeker"] : []),
          savedIssues: user?.savedIssues || [],
          createdAt: user?.createdAt || new Date().toISOString(),
          money: user?.money
        };
        users[tempUser.uid] = tempUser;
        saveLocalUsers(users);
        return tempUser;
      }
    }
  },

  signInWithPhone: async (phoneNumber: string, role: UserRole = "citizen"): Promise<UserProfile> => {
    if (isFirebaseConfigured && realDb) {
      const phoneEmail = `${phoneNumber.replace(/\+/g, "").replace(/\s/g, "")}@civicpulse.phone`;
      try {
        const usersCol = collection(realDb, "users");
        const q = query(usersCol, where("email", "==", phoneEmail));
        let qSnap;
        try {
          qSnap = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "users");
        }
        if (qSnap && !qSnap.empty) {
          return qSnap.docs[0].data() as UserProfile;
        } else {
          const uid = "phone-uid-" + Date.now();
          const fullProfile: UserProfile = {
            uid,
            email: phoneEmail,
            name: `Citizen ${phoneNumber.slice(-4)}`,
            role: role,
            location: "Varanasi, Sigra Ward",
            photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(phoneNumber)}`,
            civicScore: role === "citizen" ? 25 : 100,
            badges: role === "citizen" ? ["first_reporter"] : [],
            savedIssues: [],
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(realDb, "users", uid), fullProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
          }
          return fullProfile;
        }
      } catch (err) {
        console.error("Phone Sign In Error:", err);
        throw err;
      }
    } else {
      const users = getLocalUsers();
      const phoneEmail = `${phoneNumber.replace(/\+/g, "").replace(/\s/g, "")}@civicpulse.phone`;
      let user = Object.values(users).find(u => u.email === phoneEmail);
      if (!user) {
        const uid = "phone-user-" + Date.now();
        user = {
          uid,
          email: phoneEmail,
          name: `Citizen ${phoneNumber.slice(-4)}`,
          role: role,
          location: "Varanasi, Sigra Ward",
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(phoneNumber)}`,
          civicScore: 25,
          badges: ["first_reporter"],
          savedIssues: [],
          createdAt: new Date().toISOString()
        };
        users[uid] = user;
        saveLocalUsers(users);
      }
      currentSimulatedUser = user;
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user));
      notifyAuthListeners();
      return user;
    }
  },

  // Signs out
  signOut: async () => {
    if (isFirebaseConfigured && realAuth) {
      await signOut(realAuth);
    } else {
      currentSimulatedUser = null;
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
      notifyAuthListeners();
    }
  },

  // Sends email verification
  sendVerification: async (): Promise<void> => {
    if (isFirebaseConfigured && realAuth && realAuth.currentUser) {
      try {
        await sendEmailVerification(realAuth.currentUser);
        console.log("🔥 Verification email sent to: " + realAuth.currentUser.email);
      } catch (err) {
        console.error("Firebase sendEmailVerification error:", err);
        throw err;
      }
    } else {
      console.log("📱 Simulated email verification sent (SMTP bypass is active).");
    }
  },

  // Listen to Auth State
  onAuthChanged: (callback: (user: UserProfile | null) => void) => {
    if (isFirebaseConfigured && realAuth) {
      return onAuthStateChanged(realAuth, async (fbUser) => {
        if (fbUser) {
          let userDoc;
          try {
            userDoc = await getDoc(doc(realDb, "users", fbUser.uid));
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
          }
          if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (data.onboardingComplete) {
              callback(data);
            } else {
              callback(null);
            }
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    } else {
      authListeners.add(callback);
      // Immediately notify current state only if they are fully onboarded
      if (currentSimulatedUser && currentSimulatedUser.onboardingComplete) {
        callback(currentSimulatedUser);
      } else {
        callback(null);
      }
      return () => {
        authListeners.delete(callback);
      };
    }
  },

  // Update profile data in the backend
  updateProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      try {
        const userDocRef = doc(realDb, "users", uid);
        await setDoc(userDocRef, updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    } else {
      const users = getLocalUsers();
      if (!users[uid]) {
        // Initialize a clean default profile structure for this new simulated ID
        users[uid] = {
          uid,
          email: updates.email || `${uid}@civicpulse.local`,
          photoURL: updates.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(uid)}`,
          name: updates.name || "",
          role: updates.role || "citizen",
          location: updates.location || "Varanasi, Sigra Ward",
          civicScore: updates.role === "citizen" ? 25 : 100,
          badges: updates.role === "citizen" ? ["first_reporter"] : [],
          savedIssues: [],
          createdAt: new Date().toISOString()
        };
      }
      users[uid] = { ...users[uid], ...updates };
      saveLocalUsers(users);
      
      if (!currentSimulatedUser || currentSimulatedUser.uid === uid) {
        currentSimulatedUser = users[uid];
        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(currentSimulatedUser));
        notifyAuthListeners();
      }
    }
  },

  redeemReward: async (uid: string, rewardId: string, cost: number): Promise<UserProfile> => {
    if (isFirebaseConfigured && realDb) {
      const userRef = doc(realDb, "users", uid);
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
      if (!userDoc || !userDoc.exists()) throw new Error("User profile not found");
      const data = userDoc.data() as UserProfile;
      const currentCoins = data.civicCoins !== undefined ? data.civicCoins : data.civicScore;
      if (currentCoins < cost) throw new Error("Insufficient Civic Coins");
      
      const redeemedRewards = [...(data.redeemedRewards || []), rewardId];
      const updatedCoins = currentCoins - cost;
      
      const updates = {
        civicCoins: updatedCoins,
        redeemedRewards
      };
      try {
        await updateDoc(userRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
      return { ...data, ...updates };
    } else {
      const users = getLocalUsers();
      if (!users[uid]) throw new Error("User profile not found");
      const user = users[uid];
      const currentCoins = user.civicCoins !== undefined ? user.civicCoins : user.civicScore;
      if (currentCoins < cost) throw new Error("Insufficient Civic Coins");
      
      const redeemedRewards = [...(user.redeemedRewards || []), rewardId];
      const updatedCoins = currentCoins - cost;
      
      const updatedUser = {
        ...user,
        civicCoins: updatedCoins,
        redeemedRewards
      };
      users[uid] = updatedUser;
      saveLocalUsers(users);
      
      if (!currentSimulatedUser || currentSimulatedUser.uid === uid) {
        currentSimulatedUser = updatedUser;
        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(currentSimulatedUser));
        notifyAuthListeners();
      }
      return updatedUser;
    }
  },

  addCoins: async (uid: string, amount: number): Promise<UserProfile> => {
    if (isFirebaseConfigured && realDb) {
      const userRef = doc(realDb, "users", uid);
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
      if (!userDoc || !userDoc.exists()) throw new Error("User profile not found");
      const data = userDoc.data() as UserProfile;
      const currentCoins = data.civicCoins !== undefined ? data.civicCoins : data.civicScore;
      const currentScore = data.civicScore || 0;
      
      const updates = {
        civicScore: currentScore + amount,
        civicCoins: currentCoins + amount
      };
      try {
        await updateDoc(userRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
      return { ...data, ...updates };
    } else {
      const users = getLocalUsers();
      if (!users[uid]) throw new Error("User not found");
      const user = users[uid];
      const currentCoins = user.civicCoins !== undefined ? user.civicCoins : user.civicScore;
      const currentScore = user.civicScore || 0;
      
      const updatedUser = {
        ...user,
        civicScore: currentScore + amount,
        civicCoins: currentCoins + amount
      };
      users[uid] = updatedUser;
      saveLocalUsers(users);
      
      if (!currentSimulatedUser || currentSimulatedUser.uid === uid) {
        currentSimulatedUser = updatedUser;
        localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(updatedUser));
        notifyAuthListeners();
      }
      return updatedUser;
    }
  }
};

export const CivicDatabase = {
  // Subscribe to real-time issues feed
  subscribeIssues: (callback: (issues: IssueReport[]) => void) => {
    if (isFirebaseConfigured && realDb) {
      const issuesCol = collection(realDb, "issues");
      const q = query(issuesCol, orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        const issuesList: IssueReport[] = [];
        snapshot.forEach((doc) => {
          issuesList.push({ id: doc.id, ...doc.data() } as IssueReport);
        });
        callback(issuesList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, "issues");
      });
    } else {
      issueListeners.add(callback);
      // Immediately pass existing issues
      callback(getLocalIssues());
      return () => {
        issueListeners.delete(callback);
      };
    }
  },

  // Create a new civic issue report
  createIssue: async (issue: Omit<IssueReport, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    const issueId = "issue-" + Date.now();
    const newIssue: IssueReport = {
      ...issue,
      id: issueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && realDb) {
      try {
        await setDoc(doc(realDb, "issues", issueId), newIssue);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `issues/${issueId}`);
      }
      return issueId;
    } else {
      const currentIssues = getLocalIssues();
      currentIssues.unshift(newIssue);
      saveLocalIssues(currentIssues);
      notifyIssueListeners();
      return issueId;
    }
  },

  // Update an issue
  updateIssue: async (issueId: string, updates: Partial<IssueReport>): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      try {
        const issueRef = doc(realDb, "issues", issueId);
        await updateDoc(issueRef, updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, ...updates, updatedAt: new Date().toISOString() };
        }
        return issue;
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Upvote or downvote community verification poll
  voteIssue: async (issueId: string, userId: string, voteType: "yes" | "no"): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return;

      const issueData = issueDoc.data() as IssueReport;
      const votedUserIds = { ...(issueData.votedUserIds || {}) };
      const alreadyVoted = userId in votedUserIds;
      const previousVote = votedUserIds[userId];

      let yesDiff = 0;
      let noDiff = 0;

      if (alreadyVoted && previousVote === voteType) {
        delete votedUserIds[userId];
        if (voteType === "yes") yesDiff = -1;
        else noDiff = -1;
      } else {
        votedUserIds[userId] = voteType;
        if (voteType === "yes") yesDiff = 1;
        else noDiff = 1;

        if (alreadyVoted) {
          if (previousVote === "yes") yesDiff -= 1;
          if (previousVote === "no") noDiff -= 1;
        }
      }

      try {
        await updateDoc(issueRef, {
          votedUserIds,
          "pollVotes.yes": Math.max(0, (issueData.pollVotes?.yes || 0) + yesDiff),
          "pollVotes.no": Math.max(0, (issueData.pollVotes?.no || 0) + noDiff),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id !== issueId) return issue;

        const votedUserIds = { ...(issue.votedUserIds || {}) };
        const alreadyVoted = userId in votedUserIds;
        const previousVote = votedUserIds[userId];

        let yesDiff = 0;
        let noDiff = 0;

        if (alreadyVoted && previousVote === voteType) {
          delete votedUserIds[userId];
          if (voteType === "yes") yesDiff = -1;
          else noDiff = -1;
        } else {
          votedUserIds[userId] = voteType;
          if (voteType === "yes") yesDiff = 1;
          else noDiff = 1;

          if (alreadyVoted) {
            if (previousVote === "yes") yesDiff -= 1;
            if (previousVote === "no") noDiff -= 1;
          }
        }

        return {
          ...issue,
          votedUserIds,
          pollVotes: {
            yes: Math.max(0, (issue.pollVotes?.yes || 0) + yesDiff),
            no: Math.max(0, (issue.pollVotes?.no || 0) + noDiff)
          },
          updatedAt: new Date().toISOString()
        };
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Submit resolution verification vote (solved vs pending feedback)
  voteResolution: async (issueId: string, userId: string, voteType: "solved" | "pending"): Promise<{ isResolved: boolean }> => {
    let isResolved = false;

    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return { isResolved };

      const issueData = issueDoc.data() as IssueReport;
      const votedResolutionUserIds = { ...(issueData.votedResolutionUserIds || {}) };
      const alreadyVoted = userId in votedResolutionUserIds;
      const previousVote = votedResolutionUserIds[userId];

      let solvedDiff = 0;
      let pendingDiff = 0;

      if (alreadyVoted && previousVote === voteType) {
        delete votedResolutionUserIds[userId];
        if (voteType === "solved") solvedDiff = -1;
        else pendingDiff = -1;
      } else {
        votedResolutionUserIds[userId] = voteType;
        if (voteType === "solved") solvedDiff = 1;
        else pendingDiff = 1;

        if (alreadyVoted) {
          if (previousVote === "solved") solvedDiff -= 1;
          if (previousVote === "pending") pendingDiff -= 1;
        }
      }

      const newSolvedCount = Math.max(0, (issueData.resolutionVotes?.solved || 0) + solvedDiff);
      const newPendingCount = Math.max(0, (issueData.resolutionVotes?.pending || 0) + pendingDiff);
      const totalResVotes = newSolvedCount + newPendingCount;

      // Auto resolution trigger: 80%+ solved votes out of 2+ verification responses
      let status: any = issueData.status;
      if (totalResVotes >= 2 && (newSolvedCount / totalResVotes) >= 0.8) {
        status = "resolved";
        isResolved = true;
      }

      try {
        await updateDoc(issueRef, {
          status,
          votedResolutionUserIds,
          "resolutionVotes.solved": newSolvedCount,
          "resolutionVotes.pending": newPendingCount,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id !== issueId) return issue;

        const votedResolutionUserIds = { ...(issue.votedResolutionUserIds || {}) };
        const alreadyVoted = userId in votedResolutionUserIds;
        const previousVote = votedResolutionUserIds[userId];

        let solvedDiff = 0;
        let pendingDiff = 0;

        if (alreadyVoted && previousVote === voteType) {
          delete votedResolutionUserIds[userId];
          if (voteType === "solved") solvedDiff = -1;
          else pendingDiff = -1;
        } else {
          votedResolutionUserIds[userId] = voteType;
          if (voteType === "solved") solvedDiff = 1;
          else pendingDiff = 1;

          if (alreadyVoted) {
            if (previousVote === "solved") solvedDiff -= 1;
            if (previousVote === "pending") pendingDiff -= 1;
          }
        }

        const newSolvedCount = Math.max(0, (issue.resolutionVotes?.solved || 0) + solvedDiff);
        const newPendingCount = Math.max(0, (issue.resolutionVotes?.pending || 0) + pendingDiff);
        const totalResVotes = newSolvedCount + newPendingCount;

        let status = issue.status;
        if (totalResVotes >= 2 && (newSolvedCount / totalResVotes) >= 0.8) {
          status = "resolved";
          isResolved = true;
        }

        return {
          ...issue,
          status,
          votedResolutionUserIds,
          resolutionVotes: {
            solved: newSolvedCount,
            pending: newPendingCount
          },
          updatedAt: new Date().toISOString()
        };
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }

    return { isResolved };
  },

  // Add Comment to an issue
  addComment: async (issueId: string, comment: Comment): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return;

      const issueData = issueDoc.data() as IssueReport;
      const comments = [...(issueData.comments || []), comment];

      try {
        await updateDoc(issueRef, {
          comments,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            comments: [...(issue.comments || []), comment],
            updatedAt: new Date().toISOString()
          };
        }
        return issue;
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Add Crowdsourced Peer Evidence to an issue
  addPeerEvidence: async (issueId: string, evidence: PeerEvidence): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return;

      const issueData = issueDoc.data() as IssueReport;
      const peerEvidence = [...(issueData.peerEvidence || []), evidence];

      try {
        await updateDoc(issueRef, {
          peerEvidence,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            peerEvidence: [...(issue.peerEvidence || []), evidence],
            updatedAt: new Date().toISOString()
          };
        }
        return issue;
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Add Authority Resolution Response
  addResolutionResponse: async (issueId: string, response: ResolutionResponse): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return;

      const issueData = issueDoc.data() as IssueReport;
      const responses = [response, ...(issueData.responses || [])];

      try {
        await updateDoc(issueRef, {
          status: "in_progress", // Promote status to active review
          responses,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated: IssueReport[] = currentIssues.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: "in_progress" as const,
            responses: [response, ...(issue.responses || [])],
            updatedAt: new Date().toISOString()
          };
        }
        return issue;
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Quick Like Report
  likeIssue: async (issueId: string): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      const issueRef = doc(realDb, "issues", issueId);
      let issueDoc;
      try {
        issueDoc = await getDoc(issueRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `issues/${issueId}`);
      }
      if (!issueDoc || !issueDoc.exists()) return;

      const issueData = issueDoc.data() as IssueReport;
      try {
        await updateDoc(issueRef, {
          likes: (issueData.likes || 0) + 1
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `issues/${issueId}`);
      }
    } else {
      const currentIssues = getLocalIssues();
      const updated = currentIssues.map(issue => {
        if (issue.id === issueId) {
          return { ...issue, likes: (issue.likes || 0) + 1 };
        }
        return issue;
      });
      saveLocalIssues(updated);
      notifyIssueListeners();
    }
  },

  // Seed initial values in Firestore if it is completely empty
  seedDatabaseIfEmpty: async (): Promise<void> => {
    if (isFirebaseConfigured && realDb) {
      try {
        const issuesCol = collection(realDb, "issues");
        let querySnapshot;
        try {
          querySnapshot = await getDocs(issuesCol);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "issues");
          return;
        }
        if (querySnapshot && querySnapshot.empty) {
          console.log("Seeding Firestore with INITIAL_ISSUES demo dataset...");
          for (const issue of INITIAL_ISSUES) {
            try {
              await setDoc(doc(realDb, "issues", issue.id), issue);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `issues/${issue.id}`);
            }
          }
          // Seed users
          const initialUsers = {
            "user-aravind": {
              uid: "user-aravind",
              email: "aravind@gmail.com",
              photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
              name: "Aravind Dev",
              role: "citizen" as const,
              location: "Varanasi, Sigra Ward",
              civicScore: 1240,
              badges: ["first_reporter", "guard", "truth_seeker", "landmark"],
              savedIssues: [],
              createdAt: new Date().toISOString()
            },
            "user-muni": {
              uid: "user-muni",
              email: "authority@muncipal.in",
              photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
              name: "Director Mishra",
              role: "authority" as const,
              location: "Varanasi Central District",
              civicScore: 100,
              badges: [],
              savedIssues: [],
              createdAt: new Date().toISOString(),
              department: "PWD Pavement & Roads",
              designation: "Executive Engineer",
              bio: "Overseeing public infrastructure maintenance and safety operations for Varanasi East division.",
              documentVerified: true
            }
          };
          for (const [uid, uProfile] of Object.entries(initialUsers)) {
            try {
              await setDoc(doc(realDb, "users", uid), uProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
            }
          }
          console.log("Database seed completed successfully.");
        }
      } catch (err) {
        console.error("Firestore DB seed failed:", err);
      }
    }
  }
};
