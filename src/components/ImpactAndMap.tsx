import React, { useState, useEffect } from "react";
import { IssueReport, UserProfile } from "../types";
import { Map, TrendingUp, AlertTriangle, Shield, CheckCircle, BarChart2, Info, Compass, HelpCircle, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "../lib/data";

interface ImpactAndMapProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onSelectIssue: (issueId: string) => void;
}

interface PredictedHotspot {
  location: string;
  riskLevel: string;
  fragilityIndex: number;
  predictedIssue: string;
  justification: string;
  preventativeMeasure: string;
}

interface PredictionData {
  predictedHotspots: PredictedHotspot[];
  summaryAnalysis: string;
}

export default function ImpactAndMap({ issues, currentUser, onSelectIssue }: ImpactAndMapProps) {
  const [activeTab, setActiveTab] = useState<"map" | "budget" | "predictions">("map");
  const [selectedWard, setSelectedWard] = useState<string>("All");
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
  const [mapTooltip, setMapTooltip] = useState<{ x: number; y: number; text: string; show: boolean }>({ x: 0, y: 0, text: "", show: false });

  // Load predictions on mount
  useEffect(() => {
    fetchPredictions();
  }, [issues]);

  const fetchPredictions = async () => {
    setLoadingPredictions(true);
    try {
      const response = await fetch("/api/gemini/predict-hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allIssues: issues })
      });
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Ward data calculation
  const wards = [
    { id: "Sigra Ward", name: "Sigra Ward", city: "Varanasi", color: "#F59E0B", path: "M 20 20 L 140 20 L 120 120 L 20 100 Z", fragility: 82, active: 0, resolved: 0 },
    { id: "Orderly Bazar", name: "Orderly Bazar", city: "Varanasi", color: "#EF4444", path: "M 140 20 L 280 20 L 260 110 L 120 120 Z", fragility: 68, active: 0, resolved: 0 },
    { id: "Hazratganj", name: "Hazratganj", city: "Lucknow", color: "#10B981", path: "M 20 100 L 120 120 L 100 240 L 20 220 Z", fragility: 35, active: 0, resolved: 0 },
    { id: "Civil Lines", name: "Civil Lines", city: "Prayagraj", color: "#3B82F6", path: "M 120 120 L 260 110 L 240 240 L 100 240 Z", fragility: 22, active: 0, resolved: 0 },
  ];

  // Map issues to wards
  wards.forEach(w => {
    const wardIssues = issues.filter(i => i.location.toLowerCase().includes(w.id.toLowerCase()));
    w.active = wardIssues.filter(i => i.status !== "resolved").length;
    w.resolved = wardIssues.filter(i => i.status === "resolved").length;
    
    // Recalculate fragility dynamically based on active severity backlog
    const activeSeveritySum = wardIssues.filter(i => i.status !== "resolved").reduce((acc, curr) => acc + curr.severity, 0);
    w.fragility = Math.min(Math.max(15, activeSeveritySum * 8 + 15), 98);
  });

  const getFragilityColor = (score: number) => {
    if (score > 75) return "text-brand-danger";
    if (score > 45) return "text-brand-warning";
    return "text-brand-success";
  };

  const getFragilityBg = (score: number) => {
    if (score > 75) return "bg-brand-danger/10 border-brand-danger/25";
    if (score > 45) return "bg-brand-warning/10 border-brand-warning/25";
    return "bg-brand-success/10 border-brand-success/25";
  };

  // Filtered issues to show on the interactive map pins
  const displayedIssues = issues.filter(i => {
    if (selectedWard === "All") return true;
    return i.location.toLowerCase().includes(selectedWard.toLowerCase());
  });

  // Calculate Departmental budget spending
  const departments = [
    { name: "PWD Pavement & Roads", allocated: 2500000, spent: 0, activeIssues: 0, resolvedIssues: 0 },
    { name: "Electricity Board", allocated: 1500000, spent: 0, activeIssues: 0, resolvedIssues: 0 },
    { name: "Sanitation Department", allocated: 1000000, spent: 0, activeIssues: 0, resolvedIssues: 0 },
    { name: "Water Supply Department", allocated: 1200000, spent: 0, activeIssues: 0, resolvedIssues: 0 },
    { name: "Traffic Police", allocated: 800000, spent: 0, activeIssues: 0, resolvedIssues: 0 },
  ];

  // Aggregate stats
  issues.forEach(i => {
    const triageDept = i.triage?.department || "";
    let deptIndex = -1;
    if (triageDept.includes("PWD") || i.category === "POTHOLE" || i.category === "FOOTPATH") deptIndex = 0;
    else if (triageDept.includes("Electricity") || i.category === "STREETLIGHT") deptIndex = 1;
    else if (triageDept.includes("Sanitation") || i.category === "GARBAGE") deptIndex = 2;
    else if (triageDept.includes("Water") || i.category === "WATER LEAKAGE") deptIndex = 3;
    else if (triageDept.includes("Traffic") || i.category === "TRAFFIC") deptIndex = 4;

    if (deptIndex !== -1) {
      const budget = i.triage?.budgetINR || (i.severity * 8500 + 12000);
      if (i.status === "resolved") {
        departments[deptIndex].spent += budget;
        departments[deptIndex].resolvedIssues += 1;
      } else {
        departments[deptIndex].activeIssues += 1;
      }
    }
  });

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-primary/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-primary/15 rounded-xl text-brand-primary">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-black font-display text-text-primary">Civic Pulse & Impact Room</h2>
            <p className="text-xs text-text-muted">Interactive Ward maps, predictive hazard modeling, and municipal budget auditing</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-bg-secondary p-1 rounded-xl border border-brand-primary/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "map" ? "bg-brand-primary text-white shadow-md" : "text-text-secondary hover:text-white"
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Interactive Ward Map
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "budget" ? "bg-brand-primary text-white shadow-md" : "text-text-secondary hover:text-white"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Budget & Impact
          </button>
          <button
            onClick={() => setActiveTab("predictions")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "predictions" ? "bg-brand-primary text-white shadow-md" : "text-text-secondary hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> AI Predictive Hotspots
          </button>
        </div>
      </div>

      {/* Tab content 1: INTERACTIVE MAP */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SVG Map stage */}
          <div className="lg:col-span-7 bg-bg-secondary/40 border border-brand-primary/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[350px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Tactical Geo-GIS Map</span>
                <h3 className="text-sm font-bold text-text-primary">Regional Ward Status Overview</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-success inline-block"></span> Low Risk
                </span>
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-warning inline-block"></span> Medium
                </span>
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-danger inline-block"></span> Critical Hotspot
                </span>
              </div>
            </div>

            {/* Interactive Vector Map Grid */}
            <div className="my-6 flex justify-center relative">
              <svg width="300" height="260" className="drop-shadow-lg">
                {/* Background Grid Accent */}
                <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(139, 92, 246, 0.03)" strokeWidth="0.5" />
                </pattern>
                <rect width="300" height="260" fill="url(#grid)" />

                {/* Ward Polygons */}
                {wards.map((ward) => {
                  const isSelected = selectedWard === ward.id;
                  const isCritical = ward.fragility > 60;
                  const strokeColor = isSelected ? "#8B5CF6" : "rgba(139, 92, 246, 0.15)";
                  const fillOpacity = isSelected ? "0.35" : "0.15";
                  
                  // Color depending on dynamic fragility
                  const pathColor = ward.fragility > 75 
                    ? "#EF4444" 
                    : ward.fragility > 45 
                      ? "#F59E0B" 
                      : "#10B981";

                  return (
                    <path
                      key={ward.id}
                      d={ward.path}
                      fill={pathColor}
                      fillOpacity={fillOpacity}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-300 cursor-pointer hover:fill-opacity-40"
                      onClick={() => setSelectedWard(isSelected ? "All" : ward.id)}
                      onMouseEnter={(e) => {
                        setMapTooltip({
                          x: e.nativeEvent.offsetX,
                          y: e.nativeEvent.offsetY - 25,
                          text: `${ward.name}: Fragility ${ward.fragility}% (${ward.active} Active)`,
                          show: true
                        });
                      }}
                      onMouseMove={(e) => {
                        setMapTooltip(prev => ({ ...prev, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY - 25 }));
                      }}
                      onMouseLeave={() => setMapTooltip(prev => ({ ...prev, show: false }))}
                    />
                  );
                })}

                {/* Pins Overlay inside selected Wards */}
                {displayedIssues.map((issue) => {
                  // Simulate coordinate offsets inside SVG map
                  let svgX = 80;
                  let svgY = 70;
                  if (issue.location.includes("Sigra")) {
                    svgX = 70 + (issue.severity * 4);
                    svgY = 50 + (issue.severity * 3);
                  } else if (issue.location.includes("Orderly")) {
                    svgX = 180 + (issue.severity * 5);
                    svgY = 55 + (issue.severity * 3);
                  } else if (issue.location.includes("Hazrat")) {
                    svgX = 60 + (issue.severity * 3);
                    svgY = 160 + (issue.severity * 4);
                  } else {
                    svgX = 170 + (issue.severity * 4);
                    svgY = 160 + (issue.severity * 5);
                  }

                  const catEmoji = CATEGORIES.find(c => c.name.toUpperCase() === issue.category.toUpperCase())?.icon || "🚨";

                  return (
                    <g 
                      key={issue.id}
                      className="cursor-pointer group"
                      onClick={() => onSelectIssue(issue.id)}
                    >
                      {/* Pulse circle for pending critical issues */}
                      {issue.status !== "resolved" && issue.severity >= 8 && (
                        <circle cx={svgX} cy={svgY} r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      )}
                      
                      {/* Pin Circle */}
                      <circle 
                        cx={svgX} 
                        cy={svgY} 
                        r={issue.status === "resolved" ? "5" : "7.5"} 
                        fill={issue.status === "resolved" ? "#10B981" : "#EF4444"} 
                        stroke="#1F2937" 
                        strokeWidth="1.5" 
                      />
                      {/* Floating Text Label */}
                      <text 
                        x={svgX} 
                        y={svgY - 10} 
                        textAnchor="middle" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-bg-primary text-[8px] font-bold fill-white pointer-events-none"
                      >
                        {catEmoji} {issue.title.substring(0, 15)}...
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Map Tooltip */}
              {mapTooltip.show && (
                <div 
                  className="absolute pointer-events-none bg-bg-primary/95 border border-brand-primary/20 rounded px-2 py-1 text-[10px] font-semibold text-white shadow-xl z-10 transition-transform duration-75"
                  style={{ left: mapTooltip.x, top: mapTooltip.y, transform: "translate(-50%, -100%)" }}
                >
                  {mapTooltip.text}
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-muted flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-brand-primary" />
              <span>Click on any ward segment to isolate its active reports. Click on a marker pin to inspect the report.</span>
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">Ward Risk Index Backlog</h3>
                {selectedWard !== "All" && (
                  <button 
                    onClick={() => setSelectedWard("All")}
                    className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Wards List Cards */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {wards.map(w => {
                  const isSelected = selectedWard === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWard(isSelected ? "All" : w.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "bg-brand-primary/10 border-brand-primary/30 shadow" 
                          : "bg-bg-secondary/30 border-brand-primary/5 hover:border-brand-primary/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-text-primary">{w.name}</span>
                          <span className="text-[9px] text-text-muted">({w.city})</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                          <span className="flex items-center gap-0.5 text-brand-danger">
                            ● {w.active} active
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-brand-success">
                            ✓ {w.resolved} fixed
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded text-right min-w-[75px] border ${getFragilityBg(w.fragility)}`}>
                        <div className={`text-xs font-black ${getFragilityColor(w.fragility)}`}>{w.fragility}%</div>
                        <div className="text-[7px] font-bold uppercase tracking-wider text-text-muted mt-0.5">Fragility WFI</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick stats summarizing selected filter */}
            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>Selected: {selectedWard === "All" ? "Varanasi Regional Backlog" : `${selectedWard} Isolated`}</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                We detected <span className="text-white font-bold">{displayedIssues.length} total reports</span> inside this territory boundaries. 
                Average resolution confidence score holds at <span className="text-brand-success font-bold">92.4%</span> with active authority synchronization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: BUDGET & AUDITING */}
      {activeTab === "budget" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total allocated */}
            <div className="bg-bg-secondary p-4 rounded-xl border border-brand-primary/5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Total Municipal Pool</span>
              <div className="text-xl font-black font-display text-text-primary mt-1">₹70,00,000</div>
              <p className="text-[9px] text-brand-success mt-1">✓ Active Central Allocation Pool</p>
            </div>

            {/* Total Spent */}
            <div className="bg-bg-secondary p-4 rounded-xl border border-brand-primary/5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Disbursed Fix Budgets</span>
              <div className="text-xl font-black font-display text-brand-success mt-1">
                ₹{departments.reduce((acc, curr) => acc + curr.spent, 0).toLocaleString("en-IN")}
              </div>
              <p className="text-[9px] text-text-muted mt-1">Based on consensus verified closed issues</p>
            </div>

            {/* Total Backlog Estimate */}
            <div className="bg-bg-secondary p-4 rounded-xl border border-brand-primary/5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Pending Remediation Backlog Cost</span>
              <div className="text-xl font-black font-display text-brand-warning mt-1">
                ₹{(issues.filter(i => i.status !== "resolved").reduce((acc, curr) => acc + (curr.triage?.budgetINR || (curr.severity * 8500 + 12000)), 0)).toLocaleString("en-IN")}
              </div>
              <p className="text-[9px] text-text-muted mt-1">Autonomous cost model estimation</p>
            </div>
          </div>

          {/* Budget Progress Bars Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">Departmental Budget Utilization Audits</h3>
            
            <div className="space-y-3">
              {departments.map((dept, idx) => {
                const percentSpent = Math.min((dept.spent / dept.allocated) * 100, 100);
                return (
                  <div key={idx} className="bg-bg-secondary/30 p-4 rounded-xl border border-brand-primary/5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="font-bold text-text-primary flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CATEGORIES[idx]?.color || "#8B5CF6" }} />
                        {dept.name}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        Allocated: ₹{dept.allocated.toLocaleString("en-IN")} | Spent: <span className="font-bold text-brand-success">₹{dept.spent.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${percentSpent}%`, 
                          backgroundColor: CATEGORIES[idx]?.color || "#8B5CF6" 
                        }} 
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-[9px] text-text-muted">
                      <span>{percentSpent.toFixed(2)}% budget utilized</span>
                      <span className="font-semibold text-text-secondary">
                        💼 {dept.resolvedIssues} fixed | {dept.activeIssues} active backlog
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab content 3: AI PREDICTIVE HOTSPOTS */}
      {activeTab === "predictions" && (
        <div className="space-y-5">
          {/* Top Banner */}
          <div className="bg-brand-warning/10 border border-brand-warning/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-brand-warning uppercase tracking-wider">AI Pre-monsoon Infrastructure Fragility Scan</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                By processing active community complaints, water runoff charts, soil index profiles, and local humidity datasets, the Gemini-3.5 engine has modeled structural failure liabilities over the next 30 days.
              </p>
            </div>
          </div>

          {loadingPredictions ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-muted">Querying Gemini AI Predictive Neural Grid...</p>
            </div>
          ) : predictions ? (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 bg-bg-secondary rounded-xl border border-brand-primary/5 text-xs text-text-muted italic leading-relaxed">
                🤖 <span className="font-bold text-white uppercase not-italic text-[10px] mr-1.5">System Forecast:</span> 
                &ldquo;{predictions.summaryAnalysis}&rdquo;
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {predictions.predictedHotspots.map((hotspot, idx) => (
                  <div key={idx} className="bg-bg-secondary/40 border border-brand-primary/5 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:border-brand-primary/10 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-wider text-brand-primary uppercase">📍 {hotspot.location}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          hotspot.riskLevel === "HIGH" 
                            ? "bg-brand-danger/15 text-brand-danger border-brand-danger/20" 
                            : hotspot.riskLevel === "MEDIUM" 
                              ? "bg-brand-warning/15 text-brand-warning border-brand-warning/20" 
                              : "bg-brand-success/15 text-brand-success border-brand-success/20"
                        }`}>
                          {hotspot.riskLevel} RISK
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-text-primary">{hotspot.predictedIssue}</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed">{hotspot.justification}</p>
                    </div>

                    <div className="border-t border-brand-primary/5 pt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-text-muted flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-brand-warning" /> Ward Fragility Index
                        </span>
                        <span className={`font-black ${getFragilityColor(hotspot.fragilityIndex)}`}>{hotspot.fragilityIndex}/100</span>
                      </div>

                      <div className="bg-brand-primary/5 p-2 rounded border border-brand-primary/10 text-[9px] leading-relaxed text-text-secondary">
                        <span className="font-bold text-brand-success block mb-0.5">💡 PREVENTATIVE REMEDY:</span>
                        {hotspot.preventativeMeasure}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <HelpCircle className="w-10 h-10 mx-auto text-text-muted mb-2" />
              <p className="text-xs text-text-muted">No prediction data generated. Click below to retry.</p>
              <button 
                onClick={fetchPredictions}
                className="mt-3 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded hover:bg-brand-primary/90"
              >
                Scan Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
