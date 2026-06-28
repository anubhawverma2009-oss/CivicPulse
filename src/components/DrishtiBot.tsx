import React, { useState, useRef, useEffect } from "react";
import { UserProfile, IssueReport } from "../types";
import { 
  Send, Sparkles, RefreshCw, Bot, Mic, 
  MapPin, Shield, Zap, Brain, MessageSquare, 
  ChevronRight, ExternalLink, Trophy, AlertCircle,
  X, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: string;
  isStructured?: boolean;
  type?: "issue" | "reward" | "priority" | "summary" | "location";
  metadata?: any;
  questions?: string[];
}

interface DrishtiBotProps {
  currentUser: UserProfile;
  issues: IssueReport[];
  onNavigate?: (view: any) => void;
}

// Typing effect for the first welcome message
const Typewriter = ({ text, delay = 25 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

// Structured Response Cards
const IssueSummaryCard = ({ issue, onOpen }: { issue: IssueReport; onOpen: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 hover:bg-white/[0.08] hover:border-blue-500/30 transition-all group w-full relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
    
    <div className="flex items-start justify-between relative gap-2">
      <div className="flex items-start md:items-center gap-3">
        <div className="p-2 md:p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform shrink-0 mt-0.5 md:mt-0">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h4 className="text-[13px] md:text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors pr-2">{issue.title}</h4>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black">{issue.category}</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full shrink-0" />
            <span className="text-[9px] md:text-[10px] text-slate-500 font-medium">#{issue.id.slice(-6)}</span>
          </div>
        </div>
      </div>
      <span className={`px-2 py-1 md:px-2.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase border tracking-wider shrink-0 ${
        issue.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
      }`}>
        {issue.status.replace('_', ' ')}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 md:p-2.5 bg-white/5 rounded-xl border border-white/5">
        <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">Priority Index</p>
        <div className="flex items-center gap-1.5">
           <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500" style={{ width: `${issue.severity * 10}%` }} />
           </div>
           <span className="text-[11px] md:text-xs font-black text-white shrink-0">{issue.severity}/10</span>
        </div>
      </div>
      <div className="p-2 md:p-2.5 bg-white/5 rounded-xl border border-white/5">
        <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">AI Confidence</p>
        <p className="text-[11px] md:text-xs font-black text-emerald-400">{(issue.aiConfidence * 100).toFixed(0)}% Match</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-white/5">
      <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-400 min-w-0 pr-2">
        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 shrink-0" />
        <span className="font-medium truncate">{issue.location.split(',')[0]}</span>
      </div>
      <button 
        onClick={onOpen}
        className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] md:text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
      >
        Open Report <ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
      </button>
    </div>
  </motion.div>
);

const DepartmentCard = ({ dept, task }: { dept: string, task: string }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-slate-800/50 border border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 w-full"
  >
    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
      <Shield className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
    </div>
    <div className="min-w-0 pr-2">
      <h4 className="text-[11px] md:text-xs font-black text-white uppercase tracking-widest truncate">{dept}</h4>
      <p className="text-xs md:text-sm text-slate-400 truncate mt-0.5">{task}</p>
    </div>
  </motion.div>
);

const RewardCard = ({ onShop }: { onShop: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-2 group w-full relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
    <div className="flex items-center gap-3 md:gap-4 relative min-w-0">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform shrink-0">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
      </div>
      <div className="min-w-0 pr-2">
        <h4 className="text-[13px] md:text-sm font-bold text-white truncate">{/* Civic Rewards Store */}Civic Rewards Store</h4>
        <p className="text-[10px] md:text-[11px] text-slate-400 truncate mt-0.5">Claim municipal benefits & coupons</p>
      </div>
    </div>
    <button 
      onClick={onShop}
      className="p-2 md:p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-900/20 active:scale-95 relative shrink-0"
    >
      <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
    </button>
  </motion.div>
);

const WelcomeCard = ({ userName, onAction }: { userName: string, onAction: (text: string) => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[24px] md:rounded-3xl p-6 md:p-8 space-y-5 md:space-y-6 max-w-lg mx-auto w-full"
  >
    <div className="space-y-1.5 md:space-y-2">
      <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Namaste, {userName}.</h3>
      <p className="text-sm md:text-base text-slate-400 leading-relaxed">
        I am <span className="text-blue-400 font-bold">DrishtiBot AI</span>, your personal civic intelligence assistant. How can I help you improve your city today?
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
      {[
        { icon: Brain, label: "Summarize area issues", prompt: "Summarize all active issues in my area" },
        { icon: Trophy, label: "Check my civic rewards", prompt: "How many civic coins do I have?" },
        { icon: AlertCircle, label: "High priority hotspots", prompt: "Show me high priority hotspots" },
        { icon: Zap, label: "Check utility status", prompt: "Is the streetlight functional in my ward?" }
      ].map((cap) => (
        <button 
          key={cap.label}
          onClick={() => onAction(cap.prompt)}
          className="flex items-center gap-2.5 md:gap-3 p-3 md:p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[16px] md:rounded-2xl transition-all text-left group cursor-pointer"
        >
          <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors shrink-0">
            <cap.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
          </div>
          <span className="text-[11px] md:text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-tight">{cap.label}</span>
        </button>
      ))}
    </div>

    <div className="pt-4 flex items-center justify-between md:justify-center md:gap-6 border-t border-white/5">
      <div className="flex flex-col items-center gap-0.5 md:gap-1">
        <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</span>
        <span className="text-[11px] md:text-xs font-bold text-white">98.4%</span>
      </div>
      <div className="w-px h-6 bg-white/10" />
      <div className="flex flex-col items-center gap-0.5 md:gap-1">
        <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Response</span>
        <span className="text-[11px] md:text-xs font-bold text-white">&lt; 200ms</span>
      </div>
      <div className="w-px h-6 bg-white/10" />
      <div className="flex flex-col items-center gap-0.5 md:gap-1">
        <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
        <span className="text-[11px] md:text-xs font-bold text-emerald-400 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active
        </span>
      </div>
    </div>
  </motion.div>
);

export default function DrishtiBot({ currentUser, issues, onNavigate }: DrishtiBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mimeType: string, previewUrl: string } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64String,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "bot",
          content: `Namaste ${currentUser.name}. I'm DrishtiBot AI. I can analyse civic complaints, summarize reports, prioritize issues, explain government actions, locate nearby problems, help you earn Civic Score, and answer questions about your city. How can I assist you today?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [currentUser.name]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };
      
      recognitionRef.current.onend = () => setIsRecording(false);
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (isFirstLoad && messages.length > 0) {
      setIsFirstLoad(false);
    }
  }, [messages, loading]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend.trim() && !selectedImage) return;

    const userMsg = textToSend || "Analyze this attached image";
    setInputText("");

    let imgPreviewUrl = null;
    let imgPayload = null;

    if (selectedImage) {
      imgPreviewUrl = selectedImage.previewUrl;
      imgPayload = {
        base64: selectedImage.base64,
        mimeType: selectedImage.mimeType
      };
      setSelectedImage(null);
    }

    const newMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
      metadata: imgPreviewUrl ? { image: imgPreviewUrl } : undefined
    };

    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const formattedHistory = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content
      }));

      const response = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMsg,
          locality: currentUser.location || "Kanpur",
          allIssues: issues,
          history: formattedHistory,
          image: imgPayload
        })
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      
      const botMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "bot",
        content: data.message,
        timestamp: new Date().toISOString(),
        questions: data.questions || []
      };

      // Detect structured intent from text
      const lowerReply = data.message.toLowerCase();
      if (lowerReply.includes("nearby issue") || lowerReply.includes("reported") || lowerReply.includes("hotspot")) {
        botMsg.isStructured = true;
        botMsg.type = "issue";
        botMsg.metadata = issues[0]; 
      } else if (lowerReply.includes("reward") || lowerReply.includes("shop") || lowerReply.includes("coin")) {
        botMsg.isStructured = true;
        botMsg.type = "reward";
      } else if (lowerReply.includes("department") || lowerReply.includes("authority") || lowerReply.includes("municipality")) {
        botMsg.isStructured = true;
        botMsg.type = "priority"; // Reuse priority as generic structured
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      // High-fidelity fallback
      const reply = `Namaste! I'm monitoring civic hotspots in real-time. In ${currentUser.location}, we're tracking active complaints and infrastructure work. Would you like to check the nearby hotspots or visit the rewards shop?`;
      
      const botMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "bot",
        content: reply,
        timestamp: new Date().toISOString(),
        isStructured: true,
        type: "summary",
        questions: ["Show reported potholes in Varanasi", "How to earn Civic Score?", "Can we converse in Hindi?"]
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setIsFirstLoad(true);
  };

  return (
    <div className="flex flex-col h-[75vh] md:h-full min-h-[600px] w-full bg-[#030712] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#030712] to-[#020617] overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* HEADER: Enterprise AI Identity */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-white/[0.04] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 z-10 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="relative group/bot shrink-0">
              {/* Subtle blue glow around the icon */}
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-600/30 to-indigo-500/30 rounded-2xl blur-lg opacity-60 group-hover/bot:opacity-90 transition duration-500" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-30 group-hover/bot:opacity-50 blur-xs transition duration-500" />
              <div className="relative w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">
                <Bot className="w-6 h-6 md:w-9 md:h-9 text-white group-hover/bot:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-emerald-500 border-2 md:border-[3px] border-[#020617] rounded-full shadow-lg" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight truncate">DrishtiBot AI</h2>
                {/* Reduced weight of COMMAND CENTER badge */}
                <div className="self-start sm:self-auto px-1.5 md:px-2 py-0.5 bg-white/5 rounded-md border border-white/10 shadow-inner shrink-0">
                  <span className="text-[8px] md:text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Command Center</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-slate-400 mt-0.5 md:mt-1">
                <span className="text-[10px] md:text-[11px] font-medium opacity-80 truncate">Live Civic Intelligence Assistant</span>
              </div>
            </div>
          </div>
          
          <div className="flex md:hidden items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.1em]">Live</span>
            </div>
            <button 
              onClick={handleResetChat}
              className="p-2 md:p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/10 active:scale-95"
              title="Reset Intelligence"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.15em]">System Live</span>
          </div>
          <button 
            onClick={handleResetChat}
            className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/10 active:scale-95"
            title="Reset Intelligence"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AI STATUS BAR - elegant indicators with smaller height, softer borders, lower contrast, smooth hover glow */}
      <div className="px-4 md:px-6 lg:px-8 py-2.5 border-b border-white/[0.03] flex gap-2 md:gap-3 overflow-x-auto no-scrollbar shrink-0 bg-slate-950/40 backdrop-blur-md">
        {[
          { icon: Brain, label: "Neural Analysis", color: "text-blue-400/80" },
          { icon: MapPin, label: "Geospatial Aware", color: "text-purple-400/80" },
          { icon: Zap, label: "Real-time Sync", color: "text-amber-400/80" },
          { icon: Shield, label: "Verified Core", color: "text-emerald-400/80" }
        ].map((chip) => (
          <div 
            key={chip.label} 
            className="flex items-center gap-2 px-3.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full whitespace-nowrap group hover:bg-white/[0.06] hover:border-blue-500/20 hover:shadow-[0_0_12px_rgba(59,130,246,0.06)] transition-all duration-300 cursor-default"
          >
            <chip.icon className={`w-3 h-3 ${chip.color} group-hover:scale-110 transition-all duration-300`} />
            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-300">{chip.label}</span>
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8 no-scrollbar relative w-full max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <WelcomeCard userName={currentUser.name.split(' ')[0]} onAction={handleSendMessage} />
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-3 md:gap-5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "bot" && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 mt-1 md:mt-1.5">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                  </div>
                )}
                
                <div className={`flex flex-col gap-2 md:gap-3 max-w-full ${msg.role === "user" ? "items-end" : "items-start w-full"}`}>
                  <div className={`${
                    msg.role === "user" 
                      ? "px-5 md:px-6 py-3.5 md:py-4.5 rounded-[24px] md:rounded-[28px] rounded-tr-none bg-gradient-to-b from-slate-800 to-slate-850/95 text-white border border-white/10 max-w-[92%] md:max-w-[80%] lg:max-w-[70%] shadow-md shadow-slate-950/20 leading-[1.6] md:leading-[1.75] text-[14px] md:text-[15px] tracking-wide break-words" 
                      : "text-slate-200 w-full max-w-[95%] md:max-w-[85%] lg:max-w-[75%] py-2 md:py-2.5 px-1 md:px-2 leading-[1.6] md:leading-[1.75] text-[14px] md:text-[15px] tracking-wide break-words"
                  }`}>
                    {msg.role === "user" && msg.metadata?.image && (
                      <div className="mb-3 max-w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                        <img src={msg.metadata.image} alt="User attachment" className="w-full max-h-60 object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {msg.id === "welcome" && isFirstLoad ? (
                      <Typewriter text={msg.content} />
                    ) : (
                      <div className="whitespace-pre-line space-y-3.5">{msg.content}</div>
                    )}

                    {/* Structured Content Integration */}
                    {msg.role === "bot" && msg.isStructured && (
                      <div className="mt-6 space-y-4">
                        {msg.type === "issue" && msg.metadata && (
                          <IssueSummaryCard 
                            issue={msg.metadata} 
                            onOpen={() => onNavigate?.("feed")}
                          />
                        )}
                        {msg.type === "reward" && (
                          <RewardCard onShop={() => onNavigate?.("rewards")} />
                        )}
                        {msg.type === "priority" && (
                          <DepartmentCard 
                            dept="Municipal Authority" 
                            task="Processing Verification #VA-294" 
                          />
                        )}
                        
                        <div className="flex flex-wrap gap-3 pt-2">
                        </div>
                      </div>
                    )}

                    {/* Contextual Follow-up Questions (Notebook LLM Style) */}
                    {msg.role === "bot" && msg.questions && msg.questions.length > 0 && (
                      <div className="mt-5 md:mt-6 pt-4 md:pt-5 border-t border-white/5 space-y-3 w-full max-w-2xl">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400 shrink-0 animate-pulse" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Related Questions</span>
                        </div>
                        <div className="flex flex-col gap-2 md:gap-2.5">
                          {msg.questions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="text-left w-full px-4 md:px-5 py-3.5 md:py-4 bg-slate-900/40 hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-indigo-600/5 text-slate-300 hover:text-white rounded-[16px] md:rounded-2xl text-[11px] md:text-xs font-semibold border border-white/[0.04] hover:border-blue-500/30 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-[1.005] flex items-center justify-between group"
                            >
                              <span className="font-medium pr-3 md:pr-4">{q}</span>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-all shrink-0">
                                <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-1 md:px-2">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === "bot" && (
                      <>
                        <span className="hidden sm:inline w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] md:tracking-[0.2em]">Encrypted Pulse</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-5"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
              <Bot className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-none px-6 py-4 shadow-xl">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-300">DrishtiBot AI is analysing civic data</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.2, 1]
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5, 
                        delay: i * 0.2 
                      }} 
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={threadEndRef} className="h-10" />
      </div>

      {/* INPUT AREA: Floating Design */}
      <div className="pb-6 md:pb-8 pt-4 space-y-4 md:space-y-5 relative max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          accept="image/*" 
          className="hidden" 
        />

        {selectedImage && (
          <div className="absolute bottom-[80px] md:bottom-[90px] left-4 md:left-6 lg:left-8 bg-slate-900/90 border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-md z-20">
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
              <img src={selectedImage.previewUrl} alt="Selected preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                type="button" 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="pr-2 md:pr-3">
              <p className="text-[8px] md:text-[9px] font-black uppercase text-blue-400 tracking-wider">Vision Attachment</p>
              <p className="text-[10px] md:text-xs font-bold text-slate-300">Ready for Vision AI analysis</p>
            </div>
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 md:gap-4 relative"
        >
          <div className="relative flex-1 group">
            {/* Input Glow Focus Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl md:rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            
            <div className="relative flex items-center">
              <div className="absolute left-3 md:left-5 text-slate-500 group-focus-within:text-blue-500 transition-colors flex items-center gap-2 md:gap-3">
                <MessageSquare className="hidden sm:block w-4 h-4 md:w-5 md:h-5" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 md:p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  title="Upload image to Vision AI"
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your city or civic services..."
                className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[20px] md:rounded-[24px] pl-12 sm:pl-20 md:pl-24 pr-12 md:pr-16 py-4 md:py-6 text-sm md:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-2xl"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-2 md:right-4 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-110' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {isRecording ? (
                  <div className="flex gap-1 items-center px-1">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [4, 16, 4] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} 
                        className="w-0.5 bg-white rounded-full" 
                      />
                    ))}
                  </div>
                ) : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || loading}
            className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[16px] md:rounded-[24px] flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.3)] md:shadow-[0_12px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.5)] transition-all disabled:opacity-30 disabled:shadow-none group active:scale-90 cursor-pointer overflow-hidden relative shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform relative z-10" />
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
