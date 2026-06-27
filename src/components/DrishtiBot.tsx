import React, { useState, useRef, useEffect } from "react";
import { UserProfile, IssueReport } from "../types";
import { Send, Sparkles, RefreshCw, Bot, Mic } from "lucide-react";
import { motion } from "motion/react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: string;
}

interface DrishtiBotProps {
  currentUser: UserProfile;
  issues: IssueReport[];
}

export default function DrishtiBot({ currentUser, issues }: DrishtiBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: `🤖 Namaste ${currentUser.name}! I am DrishtiBot, your AI Civic Assistant. Ask me about active potholes, streetlights, sanitation, or how to earn Civic Coins and badges!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => setIsRecording(false);
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        if (err.name === 'DOMException' && err.message.includes('already started')) {
          console.warn("Recognition already started, ignoring start request.");
          setIsRecording(true);
          return;
        }
        console.error("Speech recognition start error:", err);
        setIsRecording(false);
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom on new message
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = inputText;
    setInputText("");

    const newMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      // Format chat history safely for backend
      const formattedHistory = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content
      }));

      const response = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMsg,
          locality: currentUser.location || "Varanasi, Sigra Ward",
          allIssues: issues,
          history: formattedHistory
        })
      });

      if (!response.ok) {
        throw new Error("Chatbot API returned a non-OK status");
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "bot",
        content: data.message || `🤖 I am tracking active civic issues in Varanasi Sigra Ward. Please report any potholes or streetlights you see!`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn("DrishtiBot call failed, using high-fidelity offline fallback:", err);
      
      // Robust client-side keyword fallback
      const lowerMsg = userMsg.toLowerCase();
      let reply = `🤖 Namaste! I'm DrishtiBot. `;
      
      if (lowerMsg.includes("pothole") || lowerMsg.includes("road")) {
        reply += "Road safety is our highest priority! There are active reports of deep potholes at Sigra crossing. Report new ones with real images to gain +25 Civic Points!";
      } else if (lowerMsg.includes("garbage") || lowerMsg.includes("trash") || lowerMsg.includes("clean")) {
        reply += "Cleanliness is next to godliness! Verification by 5+ citizens automatically alerts Varanasi sanitation officers to initiate cleaning drives.";
      } else if (lowerMsg.includes("light") || lowerMsg.includes("dark") || lowerMsg.includes("street")) {
        reply += "Streetlights keep our streets safe at night. Report dark spots or non-functional lights to dispatch high-priority municipal work orders!";
      } else if (lowerMsg.includes("score") || lowerMsg.includes("points") || lowerMsg.includes("badge") || lowerMsg.includes("coin")) {
        reply += "Yes! You can redeem Civic Coins in our Reward Store for exciting municipal items or local coupons. Help the ward to climb up the Priority Leaderboard!";
      } else {
        const activeCount = Array.isArray(issues) ? issues.filter(i => i.status !== "resolved").length : 3;
        reply += `We are monitoring ${activeCount} active infrastructure problems in Varanasi Sigra Ward. We are here to report, verify, and resolve them together!`;
      }

      const botMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "bot",
        content: reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: `🤖 Chat history cleared. Namaste ${currentUser.name}! I am DrishtiBot. Ask me about complaints, verifications, or civic points in ${currentUser.location}!`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col h-[520px] md:h-[580px] lg:h-[620px] justify-between border border-brand-primary/20 shadow-2xl relative overflow-hidden bg-bg-secondary/80 w-full transition-all duration-300">
      {/* Bot Chat Header */}
      <div className="flex items-center justify-between border-b border-brand-primary/15 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#3B82F6]/20 to-[#1E40AF]/20 rounded-xl text-brand-primary shrink-0 shadow-[0_2px_10px_rgba(59,130,246,0.15)]">
            <Bot className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm md:text-base font-bold font-display text-text-primary flex items-center gap-1.5">
              DrishtiBot Civic AI
              <Sparkles className="w-3.5 h-3.5 text-brand-warning animate-pulse shrink-0" />
            </h3>
            <p className="text-[10px] md:text-xs text-text-muted truncate">Civic assistant for {currentUser.location}</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Clear Chat"
          className="p-2 hover:bg-bg-secondary rounded-xl text-text-muted hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1.5 scrollbar-thin">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed font-sans shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-br-none"
                  : "bg-bg-secondary border border-brand-primary/10 text-text-secondary rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
              <span className="block text-[9px] opacity-65 text-right mt-1.5">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-secondary border border-brand-primary/10 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-text-muted flex items-center gap-2.5 shadow-sm">
              <Bot className="w-4.5 h-4.5 animate-bounce text-brand-primary" />
              <span className="text-[11px] md:text-xs">DrishtiBot is typing...</span>
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Suggested Quick Inputs */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 text-[10px] md:text-xs scrollbar-thin shrink-0">
        {[
          "Active potholes?",
          "How to earn badges?",
          "Check lights",
          "Rewards list"
        ].map(suggestion => (
          <button
            key={suggestion}
            onClick={() => setInputText(suggestion)}
            className="px-3 py-1.5 bg-bg-secondary hover:bg-slate-800 rounded-full text-text-secondary hover:text-white border border-brand-primary/10 cursor-pointer whitespace-nowrap transition-all duration-200 shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-bg-secondary text-text-primary hover:bg-slate-800 border border-brand-primary/15'}`}
        >
          <Mic className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about potholes, coins, or badges..."
          className="flex-1 bg-bg-secondary/90 border border-brand-primary/15 rounded-xl px-4 py-2.5 text-xs md:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary-dark text-white px-4.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
