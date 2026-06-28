import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gift, 
  Wallet, 
  Star, 
  ArrowRight,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Flame,
  Crown,
  Medal,
  ChevronRight,
  Coffee,
  ShoppingBag,
  Ticket,
  Heart,
  FileText,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { UserProfile, IssueReport, computeCivicStats } from "../types";

interface RewardsShopProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onRedeemReward: (rewardId: string, cost: number, rewardTitle: string) => Promise<void>;
  onSaveIssue: (issueId: string) => void;
  onLike: (issueId: string) => void;
  onSelectIssue: (issueId: string) => void;
  onNavigate: (view: string) => void;
}

type ShopTab = "wallet" | "store" | "leaderboard";

const REWARD_CATEGORIES = [
  { id: "all", name: "All Rewards", icon: <Medal className="w-4 h-4" /> },
  { id: "gift_cards", name: "Gift Cards", icon: <Ticket className="w-4 h-4" /> },
  { id: "shopping", name: "Shopping", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "food", name: "Food", icon: <Coffee className="w-4 h-4" /> },
  { id: "community", name: "Community", icon: <Heart className="w-4 h-4" /> },
  { id: "certificates", name: "Certificates", icon: <FileText className="w-4 h-4" /> }
];

const MOCK_REWARDS = [
  { id: "metro_pass", title: "Varanasi Metro Pass", category: "gift_cards", cost: 150, available: 12, icon: "🚇" },
  { id: "sapling", title: "Free Fruit Sapling", category: "community", cost: 100, available: Infinity, icon: "🌱" },
  { id: "stadium_pass", title: "Sigra Stadium Pass", category: "food", cost: 350, available: 45, icon: "🏏" },
  { id: "water_kit", title: "Water Conservation Kit", category: "community", cost: 200, available: 100, icon: "💧" },
  { id: "tax_rebate", title: "5% Property Tax Rebate", category: "certificates", cost: 500, available: Infinity, icon: "🏠" },
  { id: "amazon_500", title: "₹500 Amazon Gift Card", category: "gift_cards", cost: 5000, available: 12, icon: "📦" },
  { id: "market_vouch", title: "Market Voucher", category: "shopping", cost: 2000, available: 45, icon: "🛍️" },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Rahul Sharma", score: 12450, reports: 42, badge: "Community Hero", color: "text-amber-400", photo: "https://i.pravatar.cc/150?u=rahul" },
  { rank: 2, name: "Priya Varma", score: 9820, reports: 35, badge: "Neighborhood Guardian", color: "text-slate-300", photo: "https://i.pravatar.cc/150?u=priya" },
  { rank: 3, name: "Ankit Mishra", score: 8500, reports: 28, badge: "Problem Solver", color: "text-amber-700", photo: "https://i.pravatar.cc/150?u=ankit" },
  { rank: 4, name: "Sneha Kapur", score: 7200, reports: 22, badge: "Eco Champion", color: "text-blue-400", photo: "https://i.pravatar.cc/150?u=sneha" },
  { rank: 5, name: "Vikram Sen", score: 6800, reports: 19, badge: "Road Safety Advocate", color: "text-blue-400", photo: "https://i.pravatar.cc/150?u=vikram" }
];

export default function RewardsShop({ currentUser, issues, onRedeemReward, onNavigate }: RewardsShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>("wallet");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<any>(null);

  const { transactions, currentCoins, civicScore } = computeCivicStats(currentUser);

  const citizenLevel = Math.floor(civicScore / 500) + 1;
  const levelProgress = (civicScore % 500) / 500 * 100;
  const nextBadge = civicScore < 1000 ? "Community Hero" : "Neighborhood Guardian";

  const impactStats = [
    { label: "Issues Reported", value: issues.filter(i => i.authorId === currentUser.uid).length, icon: <FileText className="w-4 h-4" /> },
    { label: "Verified Reports", value: Math.floor(civicScore / 25), icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: "Resolved Reports", value: issues.filter(i => i.status === 'resolved').length, icon: <Zap className="w-4 h-4" /> },
    { label: "Citizens Helped", value: Math.floor(civicScore * 1.5), icon: <Users className="w-4 h-4" /> }
  ];

  const filteredRewards = selectedCategory === "all" 
    ? MOCK_REWARDS 
    : MOCK_REWARDS.filter(r => r.category === selectedCategory);

  const handleRedeem = async (reward: typeof MOCK_REWARDS[0]) => {
    if (currentCoins < reward.cost) return;
    
    setIsRedeeming(reward.id);
    try {
      await onRedeemReward(reward.id, reward.cost, reward.title);
      setSuccessReward(reward);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRedeeming(null);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-amber-400 to-yellow-600";
    if (rank === 2) return "from-slate-300 to-slate-500";
    if (rank === 3) return "from-amber-600 to-amber-800";
    return "from-slate-800 to-slate-900";
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Platform Header */}
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                <Gift className="w-6 h-6 text-orange-500" />
              </div>
              Reward Store
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Empowering Varanasi through data-driven contribution
            </p>
          </div>
          <button 
            onClick={() => onNavigate("feed")} 
            className="self-start md:self-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-slate-800/20 p-1.5 rounded-[20px] border border-white/5 max-w-2xl">
          {[
            { id: "wallet", label: "My Wallet", icon: <Wallet className="w-4 h-4" /> },
            { id: "store", label: "Civic Store", icon: <Gift className="w-4 h-4" /> },
            { id: "leaderboard", label: "City Rankings", icon: <Users className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ShopTab)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all relative overflow-hidden ${
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10 max-w-5xl mx-auto"
            >
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] p-8 shadow-2xl shadow-blue-900/30 border border-white/10 relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 text-blue-100 text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                        <Wallet className="w-4 h-4" /> Available Civic Coins
                      </div>
                      <div className="flex items-baseline gap-3">
                        <motion.span 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-6xl font-black text-white"
                        >
                          {currentCoins}
                        </motion.span>
                        <span className="text-xl font-bold text-blue-200 uppercase">CPS</span>
                      </div>
                    </div>
                    <div className="mt-12 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Lifetime Score</div>
                          <div className="text-lg font-black text-white">{civicScore} EXP</div>
                        </div>
                      </div>
                      <div className="group/tooltip relative">
                        <HelpCircle className="w-5 h-5 text-blue-200/50 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-slate-900 border border-white/10 rounded-xl text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 leading-relaxed">
                          Civic Score represents your lifetime contribution and never decreases when redeeming rewards.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Level Card */}
                <div className="lg:col-span-5 bg-slate-900 border border-white/5 rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                        <Star className="w-4 h-4" /> Citizen Status
                      </div>
                      <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400">
                        LEVEL {citizenLevel}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div className="text-3xl font-black text-white">Citizen</div>
                        <div className="text-sm font-bold text-slate-400">{Math.round(levelProgress)}%</div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Badge</span>
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1.5">
                          Next: {nextBadge} <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Streak</div>
                        <div className="text-lg font-black text-white">🔥 18 Days</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 text-right">
                      2 days until<br />milestone
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Impact Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Community Impact</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {impactStats.map((stat, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.02)" }}
                      className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl transition-all group"
                    >
                      <div className="text-slate-500 mb-4 group-hover:text-blue-400 transition-colors">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-black text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Audit History</h3>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">Export Ledger</button>
                </div>
                
                <div className="bg-slate-900/20 border border-white/5 rounded-[32px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {transactions.map((t, i) => (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  t.type === 'earn' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {t.type === 'earn' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                </div>
                                <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{t.description}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-[11px] text-slate-400 font-medium">
                                {new Date(t.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                {new Date(t.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-xs font-black ${t.type === 'earn' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {t.type === 'earn' ? '+' : '-'}{t.amount} CPS
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                                {t.status || 'Completed'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
              {/* Category Filter */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                {REWARD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedCategory === cat.id
                        ? "bg-white text-slate-900 border-white shadow-xl shadow-white/10"
                        : "bg-slate-900/40 text-slate-400 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {cat.icon}
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Rewards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRewards.length > 0 ? filteredRewards.map((reward) => (
                  <motion.div 
                    layout
                    key={reward.id} 
                    className="bg-slate-900/40 border border-white/5 rounded-[32px] p-6 flex items-center gap-6 group hover:border-blue-500/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-black text-white mb-2 tracking-tight">{reward.title}</div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-black text-brand-warning">
                          <Zap className="w-3.5 h-3.5 fill-current" /> {reward.cost}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {reward.available === Infinity ? "Unlimited" : `${reward.available} Remaining`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={currentCoins < reward.cost || isRedeeming !== null}
                        className={`mt-4 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                          currentCoins >= reward.cost
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        {isRedeeming === reward.id ? "Processing..." : "Claim Reward"}
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[32px] border border-dashed border-white/10">
                    <Gift className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">No rewards available</h3>
                    <p className="text-xs text-slate-600 mt-2">Check back later for new municipal perks.</p>
                  </div>
                )}
              </div>


            </motion.div>
          )}

          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_LEADERBOARD.slice(0, 3).map((hero) => (
                  <div 
                    key={hero.rank}
                    className={`relative p-8 rounded-[40px] border border-white/10 bg-gradient-to-br ${getRankColor(hero.rank)} overflow-hidden group hover:scale-[1.02] transition-all duration-500 cursor-default`}
                  >
                    <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500">
                      {hero.rank === 1 ? <Crown className="w-32 h-32 text-white" /> : <Medal className="w-32 h-32 text-white" />}
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <img src={hero.photo} alt={hero.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" />
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-white text-slate-900 text-sm font-black flex items-center justify-center shadow-xl">
                          #{hero.rank}
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{hero.badge}</div>
                      <div className="text-xl font-black text-white tracking-tight mb-4">{hero.name}</div>
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/10 rounded-xl">
                          <Star className="w-3.5 h-3.5 text-white/80" />
                          <span className="text-[11px] font-black text-white">{hero.score.toLocaleString()} EXP</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl text-white/80">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black">{hero.reports} Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Callout */}
              <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg font-black">
                    #{MOCK_LEADERBOARD.findIndex(h => h.name.includes("Rahul")) + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Your Ranking</h4>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Top 1% in Sigra Ward</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-white">{civicScore.toLocaleString()} EXP</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">42 Reports Verified</div>
                </div>
              </div>

              {/* Remaining Rankings */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Citywide Directory</h3>
                </div>
                
                <div className="bg-slate-900/20 border border-white/5 rounded-[32px] overflow-hidden">
                  {MOCK_LEADERBOARD.slice(3).map((hero) => (
                    <div key={hero.rank} className="flex items-center justify-between p-6 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-white transition-colors shadow-lg">
                          #{hero.rank}
                        </div>
                        <img src={hero.photo} alt={hero.name} className="w-12 h-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-lg" />
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{hero.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{hero.badge}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] text-brand-primary font-bold uppercase tracking-widest">Level {Math.floor(hero.score / 1000) + 1}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{hero.score.toLocaleString()} EXP</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{hero.reports} Verified Reports</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-5 bg-slate-900/40 border border-white/5 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3 shadow-xl">
                Load Complete City Rankings <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Redemption Success Modal */}
      <AnimatePresence>
        {successReward && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[4000] p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 40 }}
              className="bg-[#0F172A] border border-white/10 max-w-sm w-full rounded-[48px] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
              <div className="w-24 h-24 bg-blue-600/20 rounded-[32px] flex items-center justify-center mx-auto mb-2 shadow-2xl shadow-blue-600/20">
                <Sparkles className="w-12 h-12 text-blue-400 animate-pulse" />
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white tracking-tight">Voucher Issued!</h3>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  You successfully claimed <span className="text-white font-bold">{successReward.title}</span> using your hard-earned civic contribution.
                </p>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 font-mono text-center space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600/40" />
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">REDEMPTION CODE</div>
                <div className="text-2xl font-black text-white tracking-[0.25em]">{successReward.id.toUpperCase().split('_')[0]}-XQ2P-9M</div>
                <div className="flex justify-center gap-1.5 opacity-20 pt-2">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-6 bg-white rounded-full ${i % 3 === 0 ? 'h-10' : i % 2 === 0 ? 'h-4' : ''}`} />
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setSuccessReward(null)}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-blue-600/20"
              >
                Return to Intelligence Center
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Meta */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-slate-950/95 border-t border-white/5 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Verified Node Pulse • 12,401 Active Varanasi Citizens
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Zap className="w-4 h-4 text-brand-warning fill-current" /> {currentCoins} <span className="text-slate-500">CPS</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-xs font-black text-brand-primary">
              LVL {citizenLevel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

