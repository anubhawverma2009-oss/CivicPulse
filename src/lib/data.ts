import { Locality, IssueReport, Badge } from "../types";

export const MOCK_LOCALITIES: Locality[] = [
  { city: "Varanasi", ward: "Sigra Ward", lat: 25.3176, lng: 82.9739 },
  { city: "Varanasi", ward: "Orderly Bazar", lat: 25.3258, lng: 82.9826 },
  { city: "Lucknow", ward: "Hazratganj", lat: 26.8467, lng: 80.9462 },
  { city: "Prayagraj", ward: "Civil Lines", lat: 25.4358, lng: 81.8463 }
];

export const CATEGORIES = [
  { id: "pothole", name: "POTHOLE", icon: "🔴", color: "#EF4444" },
  { id: "streetlight", name: "STREETLIGHT", icon: "💡", color: "#F59E0B" },
  { id: "garbage", name: "GARBAGE", icon: "🗑️", color: "#22C55E" },
  { id: "water_leakage", name: "WATER LEAKAGE", icon: "💧", color: "#3B82F6" },
  { id: "footpath", name: "FOOTPATH", icon: "🚶", color: "#8B5CF6" },
  { id: "traffic", name: "TRAFFIC", icon: "🚨", color: "#EC4899" }
] as const;

export const DEPARTMENTS = [
  "Municipal Corporation",
  "PWD (Public Works Department)",
  "Electricity Board",
  "Water Supply Department",
  "Sanitation Department",
  "Traffic Police"
];

export const INITIAL_BADGES: Badge[] = [
  { id: "community_hero", name: "Community Hero", description: "Top 1% contributor in citywide engagement", icon: "💎", locked: false },
  { id: "problem_solver", name: "Problem Solver", description: "Reported 10+ issues that reached full resolution", icon: "🛠️", locked: false },
  { id: "neighbor_guard", name: "Neighborhood Guardian", description: "Verified 20+ reports in your local ward", icon: "🛡️", locked: false },
  { id: "eco_champion", name: "Eco Champion", description: "Highly active in Garbage & Sanitation reports", icon: "🌱", locked: false },
  { id: "road_advocate", name: "Road Safety Advocate", description: "Verified hazardous road conditions across 5 wards", icon: "🛣️", locked: true }
];

export const SEVERITY_COLORS: { [key: number]: string } = {
  1: "#22C55E", 2: "#22C55E", 3: "#22C55E", 4: "#22C55E",
  5: "#F59E0B", 6: "#F59E0B", 7: "#F59E0B",
  8: "#EF4444", 9: "#EF4444", 10: "#EF4444"
};

export const INITIAL_ISSUES: IssueReport[] = [
  {
    id: "issue-1",
    title: "Hazardous Deep Pothole at Sigra Crossing",
    description: "A severe 2-foot road depression right in the middle of Sigra Main Crossing. This has already caused two motorbikes to skid today.",
    category: "POTHOLE",
    severity: 9,
    location: "Varanasi, Sigra Ward",
    latitude: 25.3178,
    longitude: 82.9741,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the PWD repair this Sigra pothole within 24 hours to prevent more road accidents?",
    authorId: "user-alpha",
    authorName: "Rahul Sharma",
    authorRole: "citizen",
    tags: ["#RoadSafety", "#SigraDanger"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    pollVotes: { yes: 14, no: 1 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-alpha": "yes", "user-beta": "yes" },
    responses: [],
    comments: [
      {
        id: "comment-1",
        authorName: "Aarav Mehta",
        authorRole: "citizen",
        content: "Be extremely careful taking this turn at night, the streetlighting is also dim here!",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    likes: 24,
    shares: 8,
    aiConfidence: 0.94,
    isReal: true,
    hazards: ["School Zone", "High Traffic", "Biker Hazard"],
    triage: {
      department: "PWD Pavement & Roads",
      assignedOfficer: "Er. Vinay Kumar (Executive Engineer)",
      budgetINR: 35000,
      agentPriorityIndex: 94,
      justification: "This critical pothole at Sigra Crossing poses an active skidding risk for motorists, especially in rain conditions, needing asphalt filling."
    },
    peerEvidence: [
      {
        id: "pe-1",
        authorName: "Anil K. Varma",
        authorUid: "user-anil",
        description: "Still active as of this morning. It grew wider after yesterday's heavy commercial traffic transit.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: "issue-2",
    title: "Non-Functional High-Mast Light near Sigra Stadium",
    description: "The streetlighting high-mast light outside Sigra Stadium entrance has been dead for 5 days. The entire lane is completely pitch black after 7 PM.",
    category: "STREETLIGHT",
    severity: 7,
    location: "Varanasi, Sigra Ward",
    latitude: 25.3169,
    longitude: 82.9731,
    imageUrl: "https://images.unsplash.com/photo-1509021436665-8f37df706a44?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Does the lack of lighting at Sigra Stadium present an active security risk for evening walkers?",
    authorId: "user-gamma",
    authorName: "Pooja Patel",
    authorRole: "citizen",
    tags: ["#DarkStreet", "#SigraStadium"],
    status: "in_progress",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // updated 3 hours ago
    pollVotes: { yes: 28, no: 0 },
    resolutionVotes: { solved: 2, pending: 1 },
    votedUserIds: { "user-gamma": "yes" },
    responses: [
      {
        responderId: "auth-electricity",
        responderName: "Er. Vinay Kumar",
        responderRole: "authority",
        responderDesignation: "Assistant Engineer",
        responderDepartment: "Electricity Board",
        description: "Materials dispatched. PWD/Electricity contractors have scheduled the bulb and capacitor replacement for Sigra stadium lane tomorrow morning.",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ],
    comments: [],
    likes: 19,
    shares: 3,
    aiConfidence: 0.89,
    isReal: true,
    hazards: ["Sports Zone", "Night Walkers"],
    triage: {
      department: "Electricity Board",
      assignedOfficer: "Er. Vinay Kumar (Executive Engineer)",
      budgetINR: 15000,
      agentPriorityIndex: 78,
      justification: "High-mast lighting outside public stadiums must be kept fully functional for pedestrian security."
    },
    peerEvidence: [
      {
        id: "pe-2",
        authorName: "Maya Dwivedi",
        authorUid: "user-maya",
        description: "Confirmed dark. Walked past at 8 PM yesterday and felt unsafe.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]
  },
  {
    id: "issue-3",
    title: "Overflowing Garbage Bin Outside Orderly Bazar Market",
    description: "Massive pile of solid waste spilling onto the main road outside the commercial market. The smell is unbearable and stray cows are blocking traffic.",
    category: "GARBAGE",
    severity: 8,
    location: "Varanasi, Orderly Bazar",
    latitude: 25.3258,
    longitude: 82.9826,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Do you agree that this garbage dump is spreading infectious vectors inside Orderly Bazar?",
    authorId: "user-beta",
    authorName: "Amit Mishra",
    authorRole: "citizen",
    tags: ["#SwachhBharat", "#OrderlyBazar"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    pollVotes: { yes: 19, no: 2 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-beta": "yes" },
    responses: [],
    comments: [],
    likes: 12,
    shares: 5,
    aiConfidence: 0.91,
    isReal: true,
    hazards: ["Market Entrance", "Stray Animals"],
    triage: {
      department: "Sanitation Department",
      assignedOfficer: "Inspector Mishra (Sanitation Supervisor)",
      budgetINR: 8000,
      agentPriorityIndex: 82,
      justification: "Solid waste accumulation in a commercial zone poses vector disease risk and triggers animal vehicle collisions."
    },
    peerEvidence: []
  },
  {
    id: "issue-4",
    title: "Cracked Sidewalk Slab on Hazratganj Promenade",
    description: "The stone slabs on Hazratganj walking promenade are cracked, leaving deep gaps. Pedestrians frequently trip over the loose stone tiles.",
    category: "FOOTPATH",
    severity: 5,
    location: "Lucknow, Hazratganj",
    latitude: 26.8465,
    longitude: 80.9460,
    imageUrl: "https://images.unsplash.com/photo-1621243804936-775306a8f2e3?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the Hazratganj walking plaza slabs be re-paved immediately to protect seniors?",
    authorId: "user-delta",
    authorName: "Vikram Sen",
    authorRole: "citizen",
    tags: ["#HazratganjPromenade", "#Walkways"],
    status: "resolved",
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), // resolved 1 day ago
    pollVotes: { yes: 31, no: 2 },
    resolutionVotes: { solved: 15, pending: 2 }, // > 80%
    votedUserIds: { "user-delta": "yes" },
    responses: [
      {
        responderId: "auth-pwd",
        responderName: "Shri R. K. Dixit",
        responderRole: "authority",
        responderDesignation: "Chief Inspector",
        responderDepartment: "PWD (Public Works Department)",
        description: "Ganj walk slabs have been reset and cemented. All hazardous cracks on the promenade sidewalk are fully resolved and cured.",
        proofImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", // concrete photo
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-2",
        authorName: "Ananya Roy",
        authorRole: "citizen",
        content: "Walked here this morning. High quality work! Thanks for the quick repair.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1 + 3600000).toISOString()
      }
    ],
    likes: 45,
    shares: 11,
    aiConfidence: 0.95,
    isReal: true,
    hazards: ["Senior Trip Zone", "Shopping Promenade"],
    triage: {
      department: "PWD Pavement & Roads",
      assignedOfficer: "Shri R. K. Dixit (Chief Inspector)",
      budgetINR: 12000,
      agentPriorityIndex: 55,
      justification: "Walkway promenade tiles reset to restore standard senior citizen pedestrian flow."
    },
    peerEvidence: []
  }
];
