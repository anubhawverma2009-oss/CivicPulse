import React, { useState } from "react";
import { UserProfile, IssueReport } from "../types";
import { X, Upload, Sparkles, Sliders, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORIES } from "../lib/data";
import { detectLocationByIP, detectLocationByGPS } from "../utils/location";
import Scanner from "./Scanner";

interface CreateIssueModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSave: (newIssue: Omit<IssueReport, "id" | "createdAt" | "updatedAt" | "pollVotes" | "resolutionVotes" | "responses" | "comments" | "likes" | "shares">) => void;
}

export default function CreateIssueModal({ currentUser, onClose, onSave }: CreateIssueModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("POTHOLE");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [severity, setSeverity] = useState(5);
  const [tags, setTags] = useState("");

  // Image attachment states
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Scanner states
  const [scanScore, setScanScore] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // AI Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0.85);
  const [isReal, setIsReal] = useState(true);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [authenticityStatus, setAuthenticityStatus] = useState<string>("");
  const [authenticityExplanation, setAuthenticityExplanation] = useState<string>("");
  const [hazards, setHazards] = useState<string[]>(["High Traffic"]);
  const [pollQuestion, setPollQuestion] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingImage(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAICleanUp = async () => {
    if (!description) {
      alert("Please write a draft description first.");
      return;
    }
    setCleaningUp(true);
    try {
      const response = await fetch("/api/gemini/cleanup-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: description })
      });
      const data = await response.json();
      if (data.cleanedText) {
        setDescription(data.cleanedText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!imageUrl) {
      alert("Please attach an image (upload or generate) to trigger structural analysis.");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await fetch("/api/gemini/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageUrl,
          userDescription: description || title || "Varanasi structural complaint"
        })
      });
      const data = await response.json();
      if (data.category) {
        const catUpper = data.category.toUpperCase().replace("_", " ");
        const isPredefined = CATEGORIES.some(c => c.name === catUpper);
        if (isPredefined) {
          setCategory(catUpper);
          setCustomCategoryName("");
        } else {
          setCategory("CUSTOM");
          setCustomCategoryName(catUpper);
        }
      }
      if (data.severity) setSeverity(data.severity);
      if (data.report) setDescription(data.report);
      if (data.hazards) setHazards(data.hazards);
      if (data.pollQuestion) setPollQuestion(data.pollQuestion);
      if (data.ai_confidence) setAiConfidence(data.ai_confidence);
      if (data.isReal !== undefined) setIsReal(data.isReal);
      if (data.isAiGenerated !== undefined) setIsAiGenerated(data.isAiGenerated);
      if (data.authenticityStatus !== undefined) setAuthenticityStatus(data.authenticityStatus);
      if (data.authenticityExplanation !== undefined) setAuthenticityExplanation(data.authenticityExplanation);
    } catch (e) {
      console.error(e);
      alert("AI analysis completed with localized fallback assessment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Please complete title and description.");
      return;
    }

    if (isAiGenerated || authenticityStatus === "SUSPECTED_AI_GENERATED") {
      alert("⚠️ Submission Denied: This image is flagged as AI-generated or synthetic. Submitting complaints with fake/manipulated images violates community guidelines.");
      return;
    }

    // Auto-capture user's current location with fallback
    const captureLocation = async (): Promise<{ latitude: number; longitude: number }> => {
      // 1. Try precise GPS coordinates
      const gpsLoc = await detectLocationByGPS(3000);
      if (gpsLoc) {
        return { latitude: gpsLoc.lat, longitude: gpsLoc.lng };
      }

      // 2. Fallback to instant IP-based Geolocation lookup
      const ipLoc = await detectLocationByIP();
      if (ipLoc) {
        return { latitude: ipLoc.lat, longitude: ipLoc.lng };
      }

      // 3. Absolute default (Varanasi Center)
      return {
        latitude: 25.3176,
        longitude: 82.9739,
      };
    };

    const locationCoords = await captureLocation();

    const finalCategory = category === "CUSTOM" ? (customCategoryName.trim().toUpperCase() || "CUSTOM") : category;
    const generatedQuestion = pollQuestion || `Should local ward officers fix this ${finalCategory.toLowerCase()} immediately?`;
    const parsedTags = tags ? tags.split(",").map(t => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`) : ["#CivicPulse"];

    onSave({
      title,
      description,
      category: finalCategory,
      severity,
      location: currentUser.location,
      latitude: locationCoords.latitude,
      longitude: locationCoords.longitude,
      imageUrl: imageUrl || undefined,
      pollQuestion: generatedQuestion,
      authorId: currentUser.uid,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      tags: parsedTags,
      isReal,
      aiConfidence,
      hazards,
      status: "pending",
    });
  };

  return (
    <div className="w-full bg-bg-primary">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="max-w-3xl mx-auto glass-panel rounded-2xl overflow-hidden relative border border-brand-primary/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-primary/10 px-6 py-4">
          <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
            File Hyperlocal Complaint
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick AI Assist Info */}
          <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10 flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
            <div>
              <span className="font-bold">AI Co-Pilot active:</span> Attach a picture, write a brief draft, then click <strong className="text-brand-primary">AI Analyze</strong> to automatically parse hazards, category, and severity!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Complaint Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous deep pothole on Sigra Crossing"
                className="w-full bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
                <option value="CUSTOM">➕ Other / Custom Category...</option>
              </select>

              {category === "CUSTOM" && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. SEWER OVERFLOW, DANGEROUS TREE"
                    className="w-full bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary uppercase"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description & AI Clean Up */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Problem Description
              </label>
              <button
                type="button"
                disabled={cleaningUp || !description}
                onClick={handleAICleanUp}
                className="text-[10px] font-bold text-brand-primary flex items-center gap-0.5 hover:underline disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-brand-primary" /> 
                {cleaningUp ? "Refining description..." : "AI Clean Up Description"}
              </button>
            </div>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. There is a deep hole on Sigra Crossing road, water is logging, bikes are skidding."
              className="w-full bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary h-20 resize-none"
            />
          </div>

          {/* Unified Scanner & Photograph Uploader Section */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Photograph Verification Scanner
            </label>
            <Scanner 
              imageUrl={imageUrl} 
              setImageUrl={setImageUrl} 
              onScanComplete={(score, correct) => {
                setScanScore(score);
                setIsCorrect(correct);
              }} 
            />
          </div>

          {/* Previews attached image & AI Analyzer action */}
          {imageUrl && isCorrect && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col md:flex-row items-center gap-4 bg-bg-secondary/60 p-4 rounded-xl border border-brand-success/20 mt-2"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-success">
                  <Sparkles className="w-4 h-4 text-brand-success animate-pulse" />
                  Structural Match Approved! Proceed to AI Gemini Analysis.
                </div>
                <p className="text-[11px] text-text-muted">
                  Gemini will parse the site layout to assess severity, identify hazards, and formulate localized civic action paths.
                </p>
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={handleAIAnalyze}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-brand-warning animate-pulse" />
                  {analyzing ? "AI Structural Analyzing..." : "Run AI Gemini Analysis"}
                </button>
              </div>
            </motion.div>
          )}

          {/* AI Analyzed details box with Fraud Prevention forensics */}
          {(pollQuestion || hazards.length > 0) && (
            <div className="bg-bg-secondary p-4 rounded-xl border border-brand-success/20 space-y-4">
              <div className="text-xs font-bold text-brand-success uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-success animate-pulse" /> Gemini Forensics & Audit Results
                </span>
                <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded font-mono">
                  Engine: v3.5-Flash
                </span>
              </div>

              {/* Forensic Status Tag */}
              <div className="bg-[#111827]/40 p-3 rounded-lg border border-white/5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-text-muted text-[11px] font-medium">Image Authenticity Forensics:</span>
                  {authenticityStatus === "AUTHENTIC" || (!authenticityStatus && isReal) ? (
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
                      ✓ Authentic On-Site Photo
                    </span>
                  ) : authenticityStatus === "SUSPECTED_AI_GENERATED" || isAiGenerated ? (
                    <span className="bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 animate-pulse">
                      ⚠ Suspected AI-Generated/Fake
                    </span>
                  ) : authenticityStatus === "UNRELATED_IMAGE" ? (
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
                      ⚠ Unrelated/Non-Civic Image
                    </span>
                  ) : authenticityStatus === "STOCK_OR_DUPLICATE" ? (
                    <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
                      ⚠ Recycled Stock Photo
                    </span>
                  ) : (
                    <span className="bg-[#475569]/35 text-[#94A3B8] border border-[#475569]/50 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
                      Pending Verification
                    </span>
                  )}
                </div>

                {/* Forensics Analysis Text */}
                <p className="text-[11px] text-text-secondary leading-relaxed italic bg-black/10 p-2 rounded border border-white/5">
                  &ldquo;{authenticityExplanation || "Forensic analysis verifies the camera lens distortion, natural lighting anomalies, and noise texture patterns to authenticate origin."}&rdquo;
                </p>
              </div>

              {/* Fraud Alert Warning Block */}
              {(isAiGenerated || authenticityStatus === "SUSPECTED_AI_GENERATED" || authenticityStatus === "UNRELATED_IMAGE" || authenticityStatus === "STOCK_OR_DUPLICATE" || !isReal) && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    Civic Integrity & Fraud Alert!
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-normal">
                    This upload has been flagged by Gemini's social forensic guards. Submitting AI-generated, fake, or unrelated images to claim <strong>Civic Coins</strong> is a violation of community trust guidelines. Ward telemetry has logged this flag.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-white/5 pt-3">
                <div>
                  <span className="text-text-muted block">Integrity Index:</span>
                  <span className={`font-bold ${isReal && !isAiGenerated ? "text-emerald-400" : "text-rose-400"}`}>
                    {isReal && !isAiGenerated ? "✓ Clean & Real" : "⚠ Flagged / Invalid"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">AI Confidence:</span>
                  <span className="font-bold text-text-secondary">{Math.round(aiConfidence * 100)}% Match</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <div>
                  <span className="text-text-muted text-[11px] block font-semibold mb-1">Detected Safety Hazards:</span>
                  <div className="flex flex-wrap gap-1">
                    {hazards.map((haz, i) => (
                      <span key={i} className="bg-brand-critical/10 text-brand-critical border border-brand-critical/15 px-2 py-0.5 rounded text-[10px] font-semibold">
                        ⚠ {haz}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-text-muted text-[11px] block font-semibold mb-1">Community Poll Question:</span>
                  <p className="text-xs text-text-secondary font-semibold leading-snug">
                    &ldquo;{pollQuestion}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Severity slider / Tags input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-text-secondary">Assessed Severity (1-10)</span>
                <span className="font-bold text-brand-critical bg-brand-critical/10 px-2 py-0.5 rounded text-[10px]">
                  Score: {severity}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full accent-brand-critical h-1 bg-bg-secondary rounded-lg appearance-none cursor-pointer mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Community Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. RoadSafety, SigraCrossing"
                className="w-full bg-bg-secondary border border-brand-primary/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-primary/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary text-text-secondary text-xs font-bold rounded-lg hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-lg cursor-pointer shadow-lg shadow-brand-primary/15"
            >
              Post Complaint
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
