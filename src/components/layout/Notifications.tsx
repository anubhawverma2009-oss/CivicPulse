import React from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationsProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

export default function Notifications({ show, setShow }: NotificationsProps) {
  const notifications = [
    { title: "Resolution Verified", desc: "Your 'Hazardous Pothole' report in Sigra was resolved and verified by 15 neighbors.", time: "2m ago" },
    { title: "Trending Issue", desc: "A 'Non-Functional Streetlight' in Orderly Bazar has gained 25 votes. AI routed to Dept.", time: "1h ago" },
    { title: "Reward Unlocked", desc: "You earned the 'Truth Seeker' badge for verifying authentic reports!", time: "5h ago" }
  ];

  return (
    <div className="relative">
      <motion.div
        onClick={() => setShow(!show)}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
        whileTap={{ scale: 0.98 }}
        className={`p-2.5 rounded-xl border border-white/10 group cursor-pointer transition-all flex items-center justify-center ${
          show ? "bg-white/[0.08]" : "bg-white/[0.03] hover:bg-white/[0.08]"
        }`}
      >
        <Bell className={`w-4 h-4 lg:w-5 lg:h-5 text-[#3B82F6] ${show ? "" : "animate-bounce"}`} />
      </motion.div>

      <AnimatePresence>
        {show && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
              className="absolute right-0 top-full mt-3 w-[300px] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[2000] flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-white">Alert Center</h3>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">3 NEW</span>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.map((notif, i) => (
                  <div key={i} className="p-4 border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[10px] font-bold text-slate-100 group-hover:text-blue-500 transition-colors">{notif.title}</h4>
                      <span className="text-[8px] text-slate-500 font-medium">{notif.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{notif.desc}</p>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/[0.02] transition-all">
                Dismiss All Alerts
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
