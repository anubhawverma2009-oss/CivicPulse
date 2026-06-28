import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import MarkerClusterGroup from "react-leaflet-cluster";
import { IssueReport, UserProfile } from "../types";
import { detectLocationByIP, detectLocationByGPS } from "../utils/location";
import { 
  MapPin, Info, Locate, Plus, 
  Activity, Shield, Layers, List, ChevronRight, 
  AlertTriangle, CheckCircle2, Search, X, ExternalLink
} from "lucide-react";
import CivicPulseLogo from "./CivicPulseLogo";
import { CATEGORIES, SEVERITY_COLORS } from "../lib/data";
import { motion, AnimatePresence } from "motion/react";

interface GeoMapProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onSelectIssue: (issueId: string) => void;
}

// Default fallback location (Varanasi Center)
const DEFAULT_LAT = 25.3176;
const DEFAULT_LNG = 82.9739;

// Component to dynamically re-center map when user location is detected
function MapController({ center, zoom = 14 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, map, zoom]);
  return null;
}

// Heatmap Layer component
const HeatmapLayer = React.memo(({ points }: { points: [number, number, number][] }) => {
  const map = useMap();
  const heatLayerRef = React.useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - L.heatLayer comes from leaflet.heat
    if (!heatLayerRef.current) {
      // @ts-ignore
      heatLayerRef.current = L.heatLayer(points, { 
        radius: 25, 
        blur: 15, 
        maxZoom: 16,
        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
      }).addTo(map);
    } else {
      heatLayerRef.current.setLatLngs(points);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
});

// Cache for marker icons to avoid recreating them on every render
const iconCache: Record<string, L.DivIcon> = {};

// Memoized Marker component for performance with large datasets
const IssueMarker = React.memo(({ 
  issue, 
  color, 
  icon, 
  onSelect 
}: { 
  issue: IssueReport, 
  color: string, 
  icon: L.DivIcon, 
  onSelect: (id: string) => void 
}) => {
  const lat = issue.latitude || DEFAULT_LAT;
  const lng = issue.longitude || DEFAULT_LNG;

  return (
    <Marker 
      position={[lat, lng]} 
      icon={icon}
    >
      <Popup className="civic-popup">
        <div className="p-4 w-64 space-y-4 text-slate-900 font-sans">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Civic Audit Report</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                issue.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {issue.status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <h4 className="font-bold text-sm leading-tight text-slate-900 line-clamp-2">
              {issue.title}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">AI Confidence</p>
              <p className="text-xs font-black text-slate-900">{(issue.aiConfidence * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Verification</p>
              <p className="text-xs font-black text-slate-900">{issue.isReal ? "Confirmed" : "Evaluating"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Priority Index</span>
              <span className="text-xs font-black" style={{ color }}>{issue.severity}/10 Score</span>
            </div>
            <button
              onClick={() => onSelect(issue.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white transition-all rounded-lg text-[10px] font-bold cursor-pointer"
            >
              Open Report <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

export default function GeoMap({ 
  issues, 
  onSelectIssue 
}: GeoMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "resolved" | "critical">("all");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(13);

  const refreshLocation = async () => {
    setIsRefreshing(true);
    try {
      const gpsLoc = await detectLocationByGPS(4000);
      if (gpsLoc) {
        setUserLocation([gpsLoc.lat, gpsLoc.lng]);
        setMapCenter([gpsLoc.lat, gpsLoc.lng]);
        return;
      }

      const ipLoc = await detectLocationByIP();
      if (ipLoc) {
        setUserLocation([ipLoc.lat, ipLoc.lng]);
        setMapCenter([ipLoc.lat, ipLoc.lng]);
        return;
      }
    } catch (err) {
      // Ignored
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function detect() {
      const ipLoc = await detectLocationByIP();
      if (active && ipLoc) {
        setUserLocation([ipLoc.lat, ipLoc.lng]);
        setMapCenter([ipLoc.lat, ipLoc.lng]);
        setLoading(false);
      }

      const gpsLoc = await detectLocationByGPS(5000);
      if (active && gpsLoc) {
        setUserLocation([gpsLoc.lat, gpsLoc.lng]);
        setMapCenter([gpsLoc.lat, gpsLoc.lng]);
        setLoading(false);
      } else if (active && !ipLoc) {
        setUserLocation([DEFAULT_LAT, DEFAULT_LNG]);
        setMapCenter([DEFAULT_LAT, DEFAULT_LNG]);
        setLoading(false);
      }
    }
    detect();
    return () => { active = false; };
  }, []);

  // Filter issues based on activeFilter and searchQuery
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           issue.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;
      if (activeFilter === "pending") return issue.status === "pending" || issue.status === "in_progress";
      if (activeFilter === "resolved") return issue.status === "resolved";
      if (activeFilter === "critical") return issue.severity >= 8 && issue.status !== "resolved";
      return true;
    });
  }, [issues, activeFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter(i => i.severity >= 8 && i.status !== "resolved").length;
    const resolved = issues.filter(i => i.status === "resolved").length;
    
    // Safe Zones: Count wards where there are no critical issues
    const wards = Array.from(new Set(issues.map(i => i.location)));
    const safeZones = wards.filter(ward => {
      const wardIssues = issues.filter(i => i.location === ward);
      return !wardIssues.some(i => i.severity >= 8 && i.status !== "resolved");
    }).length;

    return { total, critical, resolved, safeZones };
  }, [issues]);

  // Heatmap points preparation [lat, lng, intensity]
  const heatmapPoints = useMemo(() => {
    return issues
      .filter(i => i.status !== "resolved")
      .map(i => [i.latitude || DEFAULT_LAT, i.longitude || DEFAULT_LNG, i.severity / 10] as [number, number, number]);
  }, [issues]);

  const getCachedMarkerIcon = (color: string, isSelected: boolean = false) => {
    const key = `${color}-${isSelected}`;
    if (iconCache[key]) return iconCache[key];

    const size = isSelected ? 32 : 24;
    const icon = L.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color}; 
          border: ${isSelected ? '4px' : '2.5px'} solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          ${isSelected ? 'transform: scale(1.2);' : ''}
        ">
          <div style="width: ${size/3}px; height: ${size/3}px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      className: "custom-leaflet-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
    
    iconCache[key] = icon;
    return icon;
  };

  const userBeaconIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(59, 130, 246, 0.4); 
            border-radius: 50%; 
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 12px; 
            height: 12px; 
            background-color: #3B82F6; 
            border: 2px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 0 10px rgba(59,130,246,0.6);
            position: relative;
            z-index: 10;
          "></div>
        </div>
      `,
      className: "user-beacon-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }, []);

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center space-y-5 flex flex-col items-center justify-center min-h-[500px] border border-brand-primary/10 bg-slate-900/40">
        <CivicPulseLogo variant="square-icon" size={64} animate={true} />
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">Initializing Civic GIS</h3>
          <p className="text-sm text-slate-400 animate-pulse">Synchronizing with live infrastructure datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      
      {/* TOP DASHBOARD BAR */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Civic Intelligence Map</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Real-time GIS Dashboard</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
            <div className="text-center px-3 border-r border-white/5">
              <div className="text-lg font-black text-white leading-none">{stats.total}</div>
              <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Total Issues</div>
            </div>
            <div className="text-center px-3 border-r border-white/5">
              <div className="text-lg font-black text-red-500 leading-none">{stats.critical}</div>
              <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Critical</div>
            </div>
            <div className="text-center px-3 border-r border-white/5">
              <div className="text-lg font-black text-emerald-500 leading-none">{stats.resolved}</div>
              <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Resolved</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-black text-blue-400 leading-none">{stats.safeZones}</div>
              <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Safe Zones</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* SEARCH BOX */}
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotspots..."
              className="bg-slate-800/50 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition-all w-[180px] lg:w-[240px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`p-2 rounded-lg border transition-all ${showHeatmap ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Toggle Heatmap"
          >
            <Layers className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg border transition-all ${showSidebar ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-800 border-white/10 text-slate-400'}`}
            title="Toggle Sidebar"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* MAP CONTAINER */}
        <div className="flex-1 relative">
          {/* MAP FILTERS OVERLAY */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex bg-slate-900/90 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl">
            {[
              { id: "all", label: "All", icon: Globe },
              { id: "pending", label: "Pending", icon: Timer },
              { id: "resolved", label: "Resolved", icon: CheckCircle2 },
              { id: "critical", label: "Critical", icon: AlertTriangle }
            ].map((f) => {
              const Icon = f.icon as any;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    activeFilter === f.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${f.id === 'critical' && activeFilter === 'critical' ? 'animate-pulse' : ''}`} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* EMPTY STATE OVERLAY */}
          <AnimatePresence>
            {filteredIssues.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center"
              >
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-4 shadow-2xl max-w-sm mx-4 pointer-events-auto">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                    <Search className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-bold">No Data Points</h3>
                    <p className="text-xs text-slate-400">No civic reports available in this area matching your active filters.</p>
                  </div>
                  <button 
                    onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    Reset Visual Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MapContainer
            center={userLocation || [DEFAULT_LAT, DEFAULT_LNG]}
            zoom={mapZoom}
            style={{ width: "100%", height: "100%", zIndex: 1 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapController center={mapCenter || userLocation || [DEFAULT_LAT, DEFAULT_LNG]} zoom={mapZoom} />

            {/* ACCURACY CIRCLE */}
            {userLocation && (
              <Circle 
                center={userLocation} 
                radius={200} 
                pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.1, color: '#3B82F6', weight: 1, dashArray: '5, 5' }} 
              />
            )}

            {/* USER BEACON */}
            {userLocation && (
              <Marker position={userLocation} icon={userBeaconIcon}>
                <Popup className="civic-popup">
                  <div className="p-2 text-slate-900 font-sans">
                    <p className="font-bold text-xs">Terminal Connection: Active</p>
                    <p className="text-[10px] text-slate-500 mt-1">Live Coordinates Synchronized</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* HEATMAP LAYER */}
            {showHeatmap && heatmapPoints.length > 0 && (
              <HeatmapLayer points={heatmapPoints} />
            )}

            {/* ISSUE MARKERS WITH CLUSTERING */}
            <MarkerClusterGroup
              chunkedLoading
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              maxClusterRadius={40}
            >
              {filteredIssues.map((issue) => (
                <IssueMarker 
                  key={issue.id}
                  issue={issue}
                  color={SEVERITY_COLORS[issue.severity] || "#22C55E"}
                  icon={getCachedMarkerIcon(SEVERITY_COLORS[issue.severity] || "#22C55E")}
                  onSelect={onSelectIssue}
                />
              ))}
            </MarkerClusterGroup>

            {/* ZOOM CONTROLS OVERLAY */}
            <div className="leaflet-bottom leaflet-left !mb-6 !ml-6 flex flex-col gap-2 z-[400]">
              <button 
                onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setMapZoom(prev => Math.max(prev - 1, 3))}
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl cursor-pointer"
              >
                <div className="w-4 h-1 bg-white rounded-full"></div>
              </button>
            </div>

            {/* LOCATE ME BUTTON */}
            <div className="leaflet-bottom leaflet-right !mb-6 !mr-6 z-[400]">
              <button
                onClick={refreshLocation}
                disabled={isRefreshing}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer group active:scale-95 disabled:opacity-50"
              >
                <Locate className={`w-6 h-6 ${isRefreshing ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} />
              </button>
            </div>
          </MapContainer>
        </div>

        {/* RIGHT COLLAPSIBLE SIDEBAR: ACTIVE ISSUES */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: window.innerWidth < 640 ? "100%" : 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`bg-slate-900/50 backdrop-blur-xl border-l border-white/10 flex flex-col h-full z-[400] relative ${window.innerWidth < 640 ? 'fixed inset-0 z-[1000]' : ''}`}
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Hotspots</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">
                    {filteredIssues.length} Listed
                  </span>
                  {window.innerWidth < 640 && (
                    <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setMapCenter([issue.latitude || DEFAULT_LAT, issue.longitude || DEFAULT_LNG]);
                        setMapZoom(16);
                      }}
                      className="w-full text-left bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl p-3.5 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-white/5">
                          {CATEGORIES.find(c => c.name.toUpperCase() === issue.category.toUpperCase())?.icon || "🚨"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                             <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">{issue.category}</span>
                             <div className="flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }} />
                               <span className="text-[9px] font-bold text-slate-400">LVL {issue.severity}</span>
                             </div>
                          </div>
                          <h4 className="text-[11px] font-bold text-slate-100 leading-tight truncate group-hover:text-blue-400 transition-colors">
                            {issue.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-[9px] text-slate-500">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate">{issue.location.split(',')[1] || issue.location}</span>
                            </div>
                            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              issue.status === 'resolved' ? 'text-emerald-400 bg-emerald-400/5' : 'text-orange-400 bg-orange-400/5'
                            }`}>
                              {issue.status === 'resolved' ? 'REPAIRED' : 'ACTIVE'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Active Indicator Hover Effect */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all">
                        <ChevronRight className="w-4 h-4 text-blue-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <Info className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="text-[11px] text-slate-500 font-medium">No results matching visual filters</p>
                  </div>
                )}
              </div>

              {/* SIDEBAR FOOTER */}
              <div className="p-4 bg-slate-900/60 border-t border-white/5 space-y-3">
                 <div className="bg-slate-800/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-300">Security Index</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400">OPTIMAL</span>
                 </div>
                 <button 
                  onClick={() => onSelectIssue(filteredIssues[0]?.id || '')}
                  disabled={filteredIssues.length === 0}
                  className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                 >
                   Export Intelligence Report
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #020617 !important;
        }
        .civic-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border-radius: 16px !important;
          padding: 0 !important;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }
        .civic-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .civic-popup .leaflet-popup-tip {
          background: #ffffff !important;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}

// Helper icons not imported
function Globe(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function Timer(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="15" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

