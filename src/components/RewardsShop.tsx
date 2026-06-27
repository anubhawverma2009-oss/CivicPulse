import React, { useState } from "react";
import { IssueReport, UserProfile } from "../types";
import { Award, Gift, Ticket, TreePine, Flame, Sparkles, CheckCircle2, ShoppingBag, Trophy, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Leaderboard from "./Leaderboard";

interface RewardsShopProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onRedeemReward: (rewardId: string, cost: number) => Promise<void>;
  onSaveIssue: (issueId: string) => void;
  onLike: (issueId: string) => void;
  onSelectIssue: (issueId: string) => void;
  onNavigate: (view: string) => void;
}

interface RewardItem {
  id: string;
  name: string;
  category: "PERK" | "ECO" | "PASS" | "TAX";
  description: string;
  cost: number;
  icon: string;
  color: string;
  couponCode: string;
}

const REWARDS: RewardItem[] = [
  { id: "metro_pass", name: "Varanasi Metro Ticket Pass", category: "PERK", description: "One-way high priority commuter metro pass across any Varanasi terminal.", cost: 150, icon: "🚇", color: "from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20", couponCode: "VM-METRO-9831" },
  { id: "sapling", name: "Free Fruit Sapling", category: "ECO", description: "Redeemable for a mango, guava, or neem sapling from Sigra Municipal Nursery.", cost: 100, icon: "🌱", color: "from-green-500/10 to-green-600/5 text-green-400 border-green-500/20", couponCode: "VM-ECO-GREEN" },
  { id: "stadium_pass", name: "Sigra Stadium Cricket Pass", category: "PASS", description: "Pass for 1 local league cricket or sports match inside Sigra Sports Stadium.", cost: 350, icon: "🏏", color: "from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20", couponCode: "VM-SIGRA-PLAY" },
  { id: "water_kit", name: "Water Conservation Kit", category: "ECO", description: "Household water aerator and conservation nozzle pack delivered by Water Board.", cost: 200, icon: "💧", color: "from-cyan-500/10 to-cyan-600/5 text-cyan-400 border-cyan-500/20", couponCode: "VM-WATER-FLOW" },
  { id: "tax_rebate", name: "5% Property Tax Discount", category: "TAX", description: "Direct discount rebate code applied on municipal property tax filing.", cost: 500, icon: "🏠", color: "from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20", couponCode: "VM-TAX-REBATE-5" }
];

export default function RewardsShop({ currentUser, issues, onRedeemReward, onSaveIssue, onLike, onSelectIssue, onNavigate }: RewardsShopProps) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<RewardItem | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rewards" | "shop" | "leaderboard">("rewards");

  const currentCoins = currentUser.civicCoins !== undefined ? currentUser.civicCoins : currentUser.civicScore;

  // Calculate Civic Title and Rank progress
  const getRankInfo = (score: number) => {
    if (score < 100) return { title: "Novice Inspector", badge: "🥉", next: 100, current: score, percent: (score / 100) * 100 };
    if (score < 300) return { title: "Neighborhood Guard", badge: "🥈", next: 300, current: score, percent: ((score - 100) / 200) * 100 };
    if (score < 600) return { title: "Ward Champion", badge: "🥇", next: 600, current: score, percent: ((score - 300) / 300) * 100 };
    if (score < 1000) return { title: "District Protector", badge: "💎", next: 1000, current: score, percent: ((score - 600) / 400) * 100 };
    return { title: "Varanasi Savior", badge: "👑", next: 9999, current: score, percent: 100 };
  };

  const rank = getRankInfo(currentUser.civicScore);

  const handleRedeem = async (reward: RewardItem) => {
    setErrorText(null);
    setSuccessReward(null);
    if (currentCoins < reward.cost) {
      setErrorText(`Insufficient Civic Coins. You need ${reward.cost - currentCoins} more coins!`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      await onRedeemReward(reward.id, reward.cost);
      setSuccessReward(reward);
    } catch (err: any) {
      setErrorText(err?.message || "Failed to redeem reward.");
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-warning/5 rounded-full blur-3xl pointer-events-none" />

      {/* Tabs */}
      <div className="flex border-b border-brand-primary/10 mb-4 gap-2">
        {[
          { id: "rewards", label: "Civic Coins & Rewards" },
          { id: "shop", label: "Shop" },
          { id: "leaderboard", label: "Leaderboard" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id 
                ? "text-brand-warning border-b-2 border-brand-warning" 
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "rewards" && (
        <div className="space-y-6">
          {/* Header Block */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-brand-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-warning/15 rounded-xl text-brand-warning">
                <Gift className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black font-display text-text-primary">Civic Coins & Rewards</h2>
                <p className="text-xs text-text-muted">Exchange your peer validation and report points for real commercial & eco perks</p>
              </div>
            </div>

            {/* Dynamic Balance Box */}
            <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black font-display text-brand-warning flex items-center justify-center gap-1">
                  {currentCoins}
                </div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">CPS Coins</div>
              </div>
              <div className="w-px h-10 bg-brand-primary/15" />
              <div className="text-left text-xs leading-none">
                <span className="text-[10px] text-text-muted block mb-1">CIVIC RANK:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  {rank.badge} {rank.title}
                </span>
              </div>
            </div>
          </div>

          {/* User Points Info (earned) */}
          <div className="bg-bg-secondary/40 border border-brand-primary/5 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-text-primary">Civic Points Earned</h3>
            <p className="text-xs text-text-muted">You have earned points through reporting, peer validation, and community engagement.</p>
          </div>

          {/* Claimed vouchers ledger */}
          {currentUser.redeemedRewards && currentUser.redeemedRewards.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-brand-primary/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-brand-primary" /> Active Redeemed Vouchers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentUser.redeemedRewards.map(rewardId => {
                  const details = REWARDS.find(r => r.id === rewardId);
                  if (!details) return null;
                  return (
                    <div key={rewardId} className="bg-bg-secondary p-3 rounded-xl border border-brand-success/15 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{details.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{details.name}</div>
                          <div className="text-[9px] text-brand-success">Verified Active Voucher</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "shop" && (
        <div className="space-y-6">
          <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-black font-display text-brand-warning flex items-center gap-1">
                  {currentCoins}
                </div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">CPS Coins</div>
              </div>
              <div className="text-right text-xs">
                <span className="text-[10px] text-text-muted block mb-1">CIVIC RANK:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  {rank.badge} {rank.title}
                </span>
              </div>
          </div>
          
          {/* Grid of Reward Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REWARDS.map(reward => {
              const isRedeemed = currentUser.redeemedRewards?.includes(reward.id);
              const hasEnough = currentCoins >= reward.cost;

              return (
                <div 
                  key={reward.id} 
                  className={`p-4 rounded-2xl border bg-bg-secondary/40 flex flex-col justify-between space-y-4 hover:bg-bg-secondary/65 transition-all relative overflow-hidden`}
                >
                  {/* Card top details */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{reward.icon}</span>
                      <span className="text-[9px] font-black tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase">
                        {reward.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-text-primary leading-tight">{reward.name}</h3>
                    <p className="text-[10px] text-text-muted leading-relaxed">{reward.description}</p>
                  </div>

                  {/* Card actions / pricing */}
                  <div className="border-t border-brand-primary/5 pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-brand-warning">{reward.cost} coins</div>
                      <div className="text-[8px] uppercase tracking-wider text-text-muted mt-0.5">Redeem Cost</div>
                    </div>

                    {isRedeemed ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-brand-success/10 border border-brand-success/20 text-brand-success text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                      </button>
                    ) : (
                      <button
                        disabled={redeemingId === reward.id}
                        onClick={() => handleRedeem(reward)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          hasEnough 
                            ? "bg-brand-warning hover:bg-brand-warning/90 text-bg-primary shadow" 
                            : "bg-bg-primary text-text-muted border border-brand-primary/5 opacity-50"
                        }`}
                      >
                        {redeemingId === reward.id ? "Confirming..." : "Redeem"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <div className="bg-bg-secondary/40 border border-brand-primary/10 rounded-2xl p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-text-primary mb-6">User Status</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center text-2xl font-black text-brand-primary border border-brand-primary/20">
                {currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
                <button
                  onClick={() => onNavigate("profile")}
                  className="text-xs text-brand-primary hover:underline"
                >
                  View Full Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-primary p-4 rounded-xl border border-brand-primary/5">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">Coins Earned</div>
                <div className="text-2xl font-black text-brand-warning">{currentCoins} CPS</div>
              </div>
              <div className="bg-bg-primary p-4 rounded-xl border border-brand-primary/5">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">Priority Level</div>
                <div className="text-xl font-bold text-white">
                  {rank.title}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Redemption Dialog Backdrop */}
      <AnimatePresence>
        {successReward && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              className="bg-bg-primary border border-brand-warning/30 max-w-sm w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden"
            >
              {/* Confetti sparkle background */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-warning/10 to-transparent pointer-events-none" />
              <Sparkles className="w-12 h-12 text-brand-warning mx-auto animate-bounce" />

              <div className="space-y-1">
                <h3 className="text-lg font-black font-display text-text-primary">Redemption Successful!</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  You successfully claimed the <span className="text-white font-bold">{successReward.name}</span> voucher for <span className="text-brand-warning font-bold">{successReward.cost} Civic Coins</span>.
                </p>
              </div>

              {/* simulated barcode ticket */}
              <div className="bg-bg-secondary/80 border border-brand-primary/15 rounded-xl p-4 font-mono text-center space-y-1.5 relative">
                <div className="text-[8px] text-text-muted">MUNICIPAL DEPOSIT VOUCHER</div>
                <div className="text-xs font-bold text-white tracking-wider">{successReward.couponCode}</div>
                {/* Visual line breaks resembling barcode */}
                <div className="text-text-muted text-[8px] tracking-tighter overflow-hidden whitespace-nowrap opacity-40">
                  ||| | || |||| | ||| || ||| | |||| | ||| || ||| | |||| | ||| || ||
                </div>
              </div>

              <button 
                onClick={() => setSuccessReward(null)}
                className="w-full py-2 bg-brand-warning hover:bg-brand-warning/90 text-bg-primary font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Dismiss Voucher
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

