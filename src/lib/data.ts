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
    title: "Dangerous Crater-sized Pothole on Sigra Main Road",
    description: "A massive pothole has opened up near the busy Sigra crossing. It is about 1.5 feet deep and is extremely hazardous for two-wheelers and auto-rickshaws at night. Already caused several near-misses and skids.",
    category: "POTHOLE",
    severity: 9,
    location: "Varanasi, Sigra Ward",
    latitude: 25.3178,
    longitude: 82.9741,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the PWD repair this Sigra pothole within 24 hours to prevent more road accidents?",
    authorId: "user-vijay",
    authorName: "Vijay Verma",
    authorRole: "citizen",
    tags: ["#RoadSafety", "#SigraCrossing", "#PotholeAlert"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    pollVotes: { yes: 18, no: 2 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-aravind": "yes", "user-vijay": "yes" },
    responses: [],
    comments: [
      {
        id: "comment-1-1",
        authorName: "Aravind Dev",
        authorRole: "citizen",
        content: "Be extremely careful taking this turn at night, the streetlighting is also dim here!",
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        id: "comment-1-2",
        authorName: "Nikhil Anand",
        authorRole: "citizen",
        content: "I skidded here yesterday. PWD must look into this on priority.",
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ],
    likes: 24,
    shares: 8,
    aiConfidence: 0.95,
    isReal: true,
    hazards: ["High Traffic", "Biker Hazard", "Near School"],
    triage: {
      department: "PWD (Public Works Department)",
      assignedOfficer: "Er. Vinay Kumar (Executive Engineer)",
      budgetINR: 35000,
      agentPriorityIndex: 92,
      justification: "Critical arterial road pothole posing imminent safety threats to two-wheeler riders. Requires immediate compaction and high-strength asphalt overlay."
    },
    peerEvidence: [
      {
        id: "pe-1-1",
        authorName: "Aravind Dev",
        authorUid: "user-aravind",
        description: "Confirmed. It has grown wider after yesterday's heavy rain.",
        timestamp: new Date(Date.now() - 3600000 * 15).toISOString()
      }
    ]
  },
  {
    id: "issue-2",
    title: "Non-Functional High-Mast Light near Sigra Stadium",
    description: "The streetlighting high-mast light outside Sigra Stadium entrance has been dead for several days. The entire lane is completely pitch black after 7 PM, making walkers feel unsafe.",
    category: "STREETLIGHT",
    severity: 7,
    location: "Varanasi, Sigra Ward",
    latitude: 25.3169,
    longitude: 82.9731,
    imageUrl: "https://images.unsplash.com/photo-1509021436665-8f37df706a44?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Does the lack of lighting at Sigra Stadium present an active security risk for evening walkers?",
    authorId: "user-aravind",
    authorName: "Aravind Dev",
    authorRole: "citizen",
    tags: ["#DarkStreet", "#SigraStadium", "#SafetyFirst"],
    status: "in_progress",
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    pollVotes: { yes: 22, no: 1 },
    resolutionVotes: { solved: 2, pending: 1 },
    votedUserIds: { "user-vijay": "yes", "user-aravind": "yes" },
    responses: [
      {
        responderId: "user-muni",
        responderName: "Director Mishra",
        responderRole: "authority",
        responderDesignation: "Executive Engineer",
        responderDepartment: "Electricity Board",
        description: "Maintenance materials dispatched. Our electrical contracting crew is scheduled to replace the faulty high-mast LED bulb and ballast tomorrow morning.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-2-1",
        authorName: "Vijay Verma",
        authorRole: "citizen",
        content: "Glad to see an official response. The dark stretch is indeed a security concern.",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ],
    likes: 19,
    shares: 3,
    aiConfidence: 0.91,
    isReal: true,
    hazards: ["Pedestrian Danger", "Commercial Zone"],
    triage: {
      department: "Electricity Board",
      assignedOfficer: "Er. Vinay Kumar (Executive Engineer)",
      budgetINR: 15000,
      agentPriorityIndex: 78,
      justification: "High-mast public safety light failure requires light-board repair and safety bulb replacement. Scheduled for urgent attention."
    },
    peerEvidence: [
      {
        id: "pe-2-1",
        authorName: "Vijay Verma",
        authorUid: "user-vijay",
        description: "Confirmed dark stretch yesterday night. Walking was highly difficult.",
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString()
      }
    ]
  },
  {
    id: "issue-3",
    title: "Overflowing Municipal Garbage Bin in Orderly Bazar",
    description: "A large public waste bin has not been cleared for three days. Rotting organic waste is spilling onto the main commercial road, creating a terrible smell and attracting stray animals.",
    category: "GARBAGE",
    severity: 8,
    location: "Varanasi, Orderly Bazar",
    latitude: 25.3258,
    longitude: 82.9826,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Do you agree that this garbage dump is spreading infectious vectors inside Orderly Bazar?",
    authorId: "user-vijay",
    authorName: "Vijay Verma",
    authorRole: "citizen",
    tags: ["#SwachhBharat", "#OrderlyBazar", "#CleanVaranasi"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    pollVotes: { yes: 12, no: 0 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-aravind": "yes" },
    responses: [],
    comments: [
      {
        id: "comment-3-1",
        authorName: "Nikhil Anand",
        authorRole: "citizen",
        content: "Stray cows are constantly blockading traffic near this trash heap.",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    likes: 15,
    shares: 4,
    aiConfidence: 0.94,
    isReal: true,
    hazards: ["Health Risk", "Stray Animals", "Blocking Lane"],
    triage: {
      department: "Sanitation Department",
      assignedOfficer: "Inspector Mishra (Sanitation Supervisor)",
      budgetINR: 8000,
      agentPriorityIndex: 85,
      justification: "Overflowing refuse bin inside active commercial market zone triggers biohazard concerns. Directing heavy transit clearance crane."
    },
    peerEvidence: []
  },
  {
    id: "issue-4",
    title: "Broken Pavement Slabs on Hazratganj Promenade",
    description: "Several concrete pavement slabs are cracked and dislocated on the Hazratganj promenade. Multiple citizens, especially senior citizens out for walks, have tripped here.",
    category: "FOOTPATH",
    severity: 5,
    location: "Lucknow, Hazratganj",
    latitude: 26.8465,
    longitude: 80.9460,
    imageUrl: "https://images.unsplash.com/photo-1621243804936-775306a8f2e3?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the Hazratganj walking plaza slabs be re-paved immediately to protect seniors?",
    authorId: "user-priya",
    authorName: "Priya Sen",
    authorRole: "citizen",
    tags: ["#HazratganjPromenade", "#PavementRepair", "#CivicPride"],
    status: "resolved",
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    pollVotes: { yes: 28, no: 1 },
    resolutionVotes: { solved: 8, pending: 1 },
    votedUserIds: { "user-aravind": "yes", "user-vijay": "yes" },
    votedResolutionUserIds: { "user-aravind": "solved", "user-vijay": "solved" },
    responses: [
      {
        responderId: "user-muni",
        responderName: "Director Mishra",
        responderRole: "authority",
        responderDesignation: "Chief Inspector",
        responderDepartment: "PWD (Public Works Department)",
        description: "The dislocated concrete pavement slabs on the walking plaza have been fully reset, cemented, and leveled. The walkway is open for public use once again.",
        proofImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        timestamp: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-4-1",
        authorName: "Aravind Dev",
        authorRole: "citizen",
        content: "I took a stroll here this morning. Excellent leveling job! Appreciate the fast action.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        id: "comment-4-2",
        authorName: "Vijay Verma",
        authorRole: "citizen",
        content: "Verified solved. A safe promenade once again.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.8).toISOString()
      }
    ],
    likes: 31,
    shares: 6,
    aiConfidence: 0.89,
    isReal: true,
    hazards: ["Senior Trip Zone", "Shopping Zone"],
    triage: {
      department: "PWD (Public Works Department)",
      assignedOfficer: "Shri R. K. Dixit (Chief Inspector)",
      budgetINR: 12000,
      agentPriorityIndex: 55,
      justification: "Damaged pedestrian promenade slabs reset to restore clear and safe public accessibility."
    },
    peerEvidence: []
  },
  {
    id: "issue-5",
    title: "Major Water Pipeline Burst near Civil Lines Crossing",
    description: "A clean drinking water pipeline has burst, causing thousands of liters of treated water to go to waste. The water is flooding the left lane of the main Civil Lines crossing.",
    category: "WATER_LEAKAGE",
    severity: 8,
    location: "Prayagraj, Civil Lines",
    latitude: 25.4358,
    longitude: 81.8463,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the Water Department declare an emergency shutdown to plug this pipeline breach?",
    authorId: "user-amit",
    authorName: "Amit Mishra",
    authorRole: "citizen",
    tags: ["#WaterWaste", "#CivilLines", "#JalBoard"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    pollVotes: { yes: 10, no: 0 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-vijay": "yes" },
    responses: [],
    comments: [],
    likes: 14,
    shares: 5,
    aiConfidence: 0.93,
    isReal: true,
    hazards: ["Water Wastage", "Flooding Risk", "Road Obstruction"],
    triage: {
      department: "Water Supply Department",
      assignedOfficer: "Er. Ramesh Shukla (Executive Engineer)",
      budgetINR: 45000,
      agentPriorityIndex: 88,
      justification: "Arterial pipe rupture causing extensive freshwater wastage and road flooding. Directing immediate shutoff valve isolation and clamp repairs."
    },
    peerEvidence: []
  },
  {
    id: "issue-6",
    title: "Dead Traffic Signal Lights at Orderly Bazar Junction",
    description: "The traffic lights at the major Orderly Bazar commercial junction have completely shut down. Traffic is in absolute gridlock with no traffic policeman to manual-route vehicles.",
    category: "TRAFFIC",
    severity: 7,
    location: "Varanasi, Orderly Bazar",
    latitude: 25.3265,
    longitude: 82.9835,
    imageUrl: "https://images.unsplash.com/photo-1542362567-b07eac790947?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Do you think a manual traffic warden is immediately required at this Orderly Bazar junction?",
    authorId: "user-vijay",
    authorName: "Vijay Verma",
    authorRole: "citizen",
    tags: ["#TrafficChaos", "#OrderlyBazar", "#RoadSafety"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    pollVotes: { yes: 8, no: 0 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-aravind": "yes" },
    responses: [],
    comments: [
      {
        id: "comment-6-1",
        authorName: "Karan Malhotra",
        authorRole: "citizen",
        content: "Avoid this junction if possible! Took me 35 minutes to cross.",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    likes: 11,
    shares: 2,
    aiConfidence: 0.92,
    isReal: true,
    hazards: ["Gridlock Risk", "Accident-Prone Junction"],
    triage: {
      department: "Traffic Police",
      assignedOfficer: "SI Anand Pathak (Traffic Division)",
      budgetINR: 6000,
      agentPriorityIndex: 76,
      justification: "Power controller failure at key urban junction. Immediate traffic police warden deployment and technical signal restoration required."
    },
    peerEvidence: []
  },
  {
    id: "issue-7",
    title: "Unfilled Trench Left Open on Hazratganj Main Road",
    description: "A deep trench was dug across the roadway for laying telecom fiber cables, but it was left unfilled with only loose gravel covering it. It is causing motorbike tire skids.",
    category: "POTHOLE",
    severity: 7,
    location: "Lucknow, Hazratganj",
    latitude: 26.8472,
    longitude: 80.9475,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should utility companies be heavily fined for leaving open cuts on major Lucknow roads?",
    authorId: "user-rishi",
    authorName: "Rishi Kapoor",
    authorRole: "citizen",
    tags: ["#PWDNeglect", "#Hazratganj", "#BikerDanger"],
    status: "in_progress",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    pollVotes: { yes: 15, no: 0 },
    resolutionVotes: { solved: 0, pending: 1 },
    votedUserIds: { "user-vijay": "yes" },
    responses: [
      {
        responderId: "user-muni",
        responderName: "Director Mishra",
        responderRole: "authority",
        responderDesignation: "Executive Engineer",
        responderDepartment: "PWD (Public Works Department)",
        description: "Official notice issued to the telecom contractor. PWD road maintenance teams have scheduled backfilling, compaction, and resurfacing for tonight.",
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-7-1",
        authorName: "Vijay Verma",
        authorRole: "citizen",
        content: "Glad that contractor accountability is being enforced here.",
        timestamp: new Date(Date.now() - 3600000 * 15).toISOString()
      },
      {
        id: "comment-7-2",
        authorName: "Priya Sen",
        authorRole: "citizen",
        content: "Still raw gravel as of this afternoon. Hoping for a quick repair.",
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString()
      }
    ],
    likes: 12,
    shares: 4,
    aiConfidence: 0.90,
    isReal: true,
    hazards: ["Loose Gravel Skid", "High-Volume Traffic Lane"],
    triage: {
      department: "PWD (Public Works Department)",
      assignedOfficer: "Er. Vinay Kumar (Executive Engineer)",
      budgetINR: 25000,
      agentPriorityIndex: 73,
      justification: "Excavation site backfilling neglect creates high risk for commercial traffic. Resurfacing must be fast-tracked."
    },
    peerEvidence: [
      {
        id: "pe-7-1",
        authorName: "Vijay Verma",
        authorUid: "user-vijay",
        description: "Confirming gravel patch is highly loose and active. Saw a bike almost lose control.",
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ]
  },
  {
    id: "issue-8",
    title: "Illegal Solid Waste Dumping Site Cleared near Sigra Park",
    description: "Unidentified commercial entities have been dumping heavy plastic refuse and organic waste along the boundary fence of Sigra Park, polluting the green zone.",
    category: "GARBAGE",
    severity: 6,
    location: "Varanasi, Sigra Ward",
    latitude: 25.3160,
    longitude: 82.9720,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Do you support installing solar security cameras around Sigra Park to deter trash throwers?",
    authorId: "user-vijay",
    authorName: "Vijay Verma",
    authorRole: "citizen",
    tags: ["#SigraPark", "#KeepVaranasiClean", "#CommunityAction"],
    status: "resolved",
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    pollVotes: { yes: 20, no: 1 },
    resolutionVotes: { solved: 5, pending: 0 },
    votedUserIds: { "user-aravind": "yes", "user-vijay": "yes" },
    votedResolutionUserIds: { "user-aravind": "solved", "user-vijay": "solved" },
    responses: [
      {
        responderId: "user-muni",
        responderName: "Director Mishra",
        responderRole: "authority",
        responderDesignation: "Sanitation Supervisor",
        responderDepartment: "Sanitation Department",
        description: "Sanitation dumper trucks deployed to clear the solid waste pile. Installed two 'No Dumping - Fine ₹5000' warning boards and repaired the damaged park fencing.",
        proofImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-8-1",
        authorName: "Aravind Dev",
        authorRole: "citizen",
        content: "Great effort by municipal teams! The park entrance looks clean and fresh.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.2).toISOString()
      },
      {
        id: "comment-8-2",
        authorName: "Karan Malhotra",
        authorRole: "citizen",
        content: "Awesome response! Let's hope the signs keep illegal dumpers away.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
      }
    ],
    likes: 25,
    shares: 5,
    aiConfidence: 0.91,
    isReal: true,
    hazards: ["Park Pollution", "Environmental Risk"],
    triage: {
      department: "Sanitation Department",
      assignedOfficer: "Inspector Mishra (Sanitation Supervisor)",
      budgetINR: 10000,
      agentPriorityIndex: 62,
      justification: "Accumulated dump clean-up outside public parks. Cleared, sprayed disinfectant, and installed penalty deterrent signage."
    },
    peerEvidence: []
  },
  {
    id: "issue-9",
    title: "Dangerous Hanging Live Wires Fixed in Civil Lines",
    description: "Following a small storm, a overhead streetlight power line broke and was hanging dangerously low, touching tree branches. Active high voltage hazard for pedestrians.",
    category: "STREETLIGHT",
    severity: 8,
    location: "Prayagraj, Civil Lines",
    latitude: 25.4365,
    longitude: 81.8475,
    imageUrl: "https://images.unsplash.com/photo-1509021436665-8f37df706a44?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the municipal body run regular preventive inspections of overhead power cables?",
    authorId: "user-karan",
    authorName: "Karan Malhotra",
    authorRole: "citizen",
    tags: ["#ElectricalHazard", "#CivilLines", "#SafetyFirst"],
    status: "resolved",
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    pollVotes: { yes: 35, no: 0 },
    resolutionVotes: { solved: 6, pending: 0 },
    votedUserIds: { "user-aravind": "yes", "user-vijay": "yes" },
    votedResolutionUserIds: { "user-aravind": "solved", "user-vijay": "solved" },
    responses: [
      {
        responderId: "user-muni",
        responderName: "Director Mishra",
        responderRole: "authority",
        responderDesignation: "Assistant Engineer",
        responderDepartment: "Electricity Board",
        description: "Emergency unit isolated the overhead streetlight wire. Line has been securely re-insulated, tensioned, and hoisted back to standard clearance height.",
        proofImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString()
      }
    ],
    comments: [
      {
        id: "comment-9-1",
        authorName: "Amit Mishra",
        authorRole: "citizen",
        content: "Thank god they fixed it fast. It was right over a busy walking lane.",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.1).toISOString()
      }
    ],
    likes: 42,
    shares: 10,
    aiConfidence: 0.96,
    isReal: true,
    hazards: ["High Voltage Risk", "Overhead Tree Contact"],
    triage: {
      department: "Electricity Board",
      assignedOfficer: "Er. Ramesh Shukla (Executive Engineer)",
      budgetINR: 5000,
      agentPriorityIndex: 80,
      justification: "Dangling energized service line poses immediate shock risks. isolated power, re-hung cable with proper standard mechanical clearance."
    },
    peerEvidence: []
  },
  {
    id: "issue-10",
    title: "Missing Sewer Manhole Cover on Orderly Bazar Footpath",
    description: "A deep storm sewer drain on the crowded Orderly Bazar commercial footpath is completely open. It represents a massive hazard for children, elderly, and blind pedestrians.",
    category: "FOOTPATH",
    severity: 9,
    location: "Varanasi, Orderly Bazar",
    latitude: 25.3245,
    longitude: 82.9815,
    imageUrl: "https://images.unsplash.com/photo-1621243804936-775306a8f2e3?auto=format&fit=crop&w=600&q=80",
    pollQuestion: "Should the Municipal Corporation face automatic legal penalties if open manholes aren't barricaded in 2 hours?",
    authorId: "user-nikhil",
    authorName: "Nikhil Anand",
    authorRole: "citizen",
    tags: ["#OpenManhole", "#OrderlyBazar", "#DangerZone"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(), // 7 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    pollVotes: { yes: 14, no: 0 },
    resolutionVotes: { solved: 0, pending: 0 },
    votedUserIds: { "user-vijay": "yes" },
    responses: [],
    comments: [
      {
        id: "comment-10-1",
        authorName: "Vijay Verma",
        authorRole: "citizen",
        content: "Highly dangerous! Someone needs to put a temporary barrier here right now.",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    likes: 18,
    shares: 6,
    aiConfidence: 0.97,
    isReal: true,
    hazards: ["Fatal Falling Risk", "Dense Pedestrian Traffic"],
    triage: {
      department: "Municipal Corporation",
      assignedOfficer: "Er. Amit Singh (Superintendent Engineer)",
      budgetINR: 7500,
      agentPriorityIndex: 95,
      justification: "Uncovered sewer opening inside active walkway. Immediate protective perimeter barricades and a heavy-duty replacement manhole cover are critical."
    },
    peerEvidence: []
  }
];
