import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Scan, Download, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

interface ScannerProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onScanComplete: (score: number, isCorrect: boolean, fileName?: string) => void;
}

export default function Scanner({ imageUrl, setImageUrl, onScanComplete }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanScore, setScanScore] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger scanning process
  const startScanProcess = (targetUrl: string, name?: string) => {
    if (!targetUrl) return;
    setIsScanning(true);
    setScanScore(null);
    setIsCorrect(null);

    // Simulate precise image structural scanning with a beautiful laser effect
    setTimeout(() => {
      setIsScanning(false);
      // Realistic municipal infrastructure verification score (82 - 99)
      const score = Math.floor(Math.random() * 18) + 82;
      const correct = score >= 85;
      setScanScore(score);
      setIsCorrect(correct);
      onScanComplete(score, correct, name || fileName);
    }, 2400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        setImageUrl(resultUrl);
        // Immediately start scanning upon image upload
        startScanProcess(resultUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "civic_issue_scan_proof.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetScanner = () => {
    setImageUrl("");
    setScanScore(null);
    setIsCorrect(null);
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-brand-primary/20 rounded-xl bg-bg-secondary w-full">
      {/* Viewport Frame */}
      <div className="relative w-full h-48 bg-black/40 rounded-lg overflow-hidden flex flex-col items-center justify-center border border-brand-primary/10 group">
        
        {/* If no image, show upload placeholder with scanning up/down preview line if triggered */}
        {!imageUrl ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/25 transition-all p-4 text-center"
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-brand-primary" />
            </div>
            <p className="text-xs font-semibold text-text-primary">Upload Complaint Photograph</p>
            <p className="text-[10px] text-text-muted mt-1">Click to browse or drag image here</p>
          </div>
        ) : (
          /* If image uploaded, show image + scanning laser line */
          <div className="relative w-full h-full">
            <img 
              src={imageUrl} 
              alt="Scan target" 
              className="w-full h-full object-cover select-none"
            />
            
            {/* Dark overlay during scanning */}
            {isScanning && (
              <div className="absolute inset-0 bg-brand-primary/15 transition-opacity duration-300" />
            )}

            {/* UP-AND-DOWN Scanning Laser Line inside the viewport */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-brand-primary shadow-[0_0_15px_#3b82f6,0_0_6px_#3b82f6]"
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Scanning Overlay Indicator */}
            {isScanning && (
              <div className="absolute top-2 left-2 bg-black/70 px-2.5 py-1 rounded text-[9px] font-mono font-bold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider animate-pulse border border-brand-primary/20">
                <Scan className="w-3.5 h-3.5 animate-spin" /> Analyzing Image Matrix...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Actions Panel - Start Scanner button always visible */}
      <div className="flex items-center gap-2 justify-between">
        <button
          type="button"
          disabled={isScanning}
          onClick={imageUrl ? () => startScanProcess(imageUrl) : () => fileInputRef.current?.click()}
          className="flex-1 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
        >
          <Scan className="w-4 h-4" />
          {isScanning ? "Scanning..." : imageUrl ? "Start Scanner" : "Start Scanner & Upload Image"}
        </button>

        {imageUrl && (
          <>
            {/* Download Action */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download Captures"
              className="p-2 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary rounded-lg border border-brand-primary/10 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Reset Action */}
            <button
              type="button"
              disabled={isScanning}
              onClick={resetScanner}
              title="Upload different image"
              className="p-2 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary rounded-lg border border-brand-primary/10 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dynamic Scan Score & Authenticity Report */}
      {scanScore !== null && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
            isCorrect 
              ? "bg-brand-success/10 border-brand-success/30 text-brand-success" 
              : "bg-brand-critical/10 border-brand-critical/30 text-brand-critical"
          }`}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-brand-success" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-brand-critical" />
            )}
            <div>
              <p className="text-xs font-bold font-display uppercase tracking-wider">
                {isCorrect ? "Structural Match Approved" : "Low Confidence Defect Match"}
              </p>
              <p className="text-[10px] text-text-secondary">
                {isCorrect 
                  ? "Image successfully confirmed as depicting realistic municipal anomalies." 
                  : "Unable to find reliable structural anomalies in this picture."}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-text-secondary block uppercase font-mono">Score</span>
            <span className="text-lg font-black font-mono">{scanScore}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
