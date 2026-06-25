import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IssueReport, UserProfile } from "../types";
import { detectLocationByIP, detectLocationByGPS } from "../utils/location";
import { MapPin, Users, Info } from "lucide-react";

interface GeoMapProps {
  issues: IssueReport[];
  currentUser: UserProfile;
  onSelectIssue: (issueId: string) => void;
}

// Default fallback location (Varanasi Center)
const DEFAULT_LAT = 25.3176;
const DEFAULT_LNG = 82.9739;

// Component to dynamically re-center map when user location is detected
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function GeoMap({ 
  issues, 
  currentUser, 
  onSelectIssue 
}: GeoMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationSource, setLocationSource] = useState<"GPS" | "IP" | "DEFAULT">("DEFAULT");

  // Immediate detection of coordinates on mount (No API Keys, fully free!)
  useEffect(() => {
    let active = true;

    async function detect() {
      // 1. Try immediate IP Geolocation first
      const ipLoc = await detectLocationByIP();
      if (active && ipLoc) {
        setUserLocation([ipLoc.lat, ipLoc.lng]);
        setLocationSource("IP");
        setLoading(false);
      }

      // 2. Try High Accuracy Device GPS Geolocation
      const gpsLoc = await detectLocationByGPS(5000);
      if (active && gpsLoc) {
        setUserLocation([gpsLoc.lat, gpsLoc.lng]);
        setLocationSource("GPS");
        setLoading(false);
      } else if (active && !ipLoc) {
        // Ultimate fallback
        setUserLocation([DEFAULT_LAT, DEFAULT_LNG]);
        setLocationSource("DEFAULT");
        setError("GPS and IP location lookups failed. Centering on Varanasi.");
        setLoading(false);
      }
    }

    detect();

    return () => {
      active = false;
    };
  }, []);

  // Custom high-contrast Tailwind DivIcons to avoid broken default Leaflet assets
  const createCustomMarker = (color: string, size: number = 24) => {
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color}; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      className: "custom-leaflet-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  const createLiveUserBeacon = () => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(59, 130, 246, 0.4); 
            border-radius: 50%; 
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 14px; 
            height: 14px; 
            background-color: #2563eb; 
            border: 2.5px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 2px 6px rgba(37,99,235,0.4);
            position: relative;
            z-index: 10;
          "></div>
        </div>
      `,
      className: "user-beacon-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const getSeverityColor = (severity: number): string => {
    if (severity >= 8) return "#EF4444"; // Red - Critical
    if (severity >= 5) return "#F59E0B"; // Orange - Warning
    return "#22C55E"; // Green - Minor
  };

  if (loading) {
    return (
      <div id="map-loading-indicator" className="p-12 glass-panel rounded-2xl text-center space-y-3.5 flex flex-col items-center justify-center min-h-[480px] border border-brand-primary/10 shadow-lg bg-bg-secondary/20">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <MapPin className="w-5 h-5 text-brand-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-secondary animate-pulse">Initializing OpenStreetMap Grid...</p>
          <p className="text-[10px] text-text-muted">Resolving coordinates via immediate IP lookup & GPS satellites</p>
        </div>
      </div>
    );
  }

  const initialCenter: [number, number] = userLocation || [DEFAULT_LAT, DEFAULT_LNG];

  return (
    <div id="leaflet-maps-container" className="w-full space-y-4">
      {/* STATUS AND METHOD HEADER BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-bg-secondary/40 border border-brand-primary/10 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-text-secondary font-medium">
            {locationSource === "GPS" && "📍 Real-Time GPS Tracking Active (High Accuracy)"}
            {locationSource === "IP" && "🌐 IP Address Smart Geolocation Active (Instant Free Match)"}
            {locationSource === "DEFAULT" && "⚠️ GPS Offline (Defaulting Varanasi Center)"}
          </span>
        </div>
        
        {userLocation && (
          <span className="font-mono text-[10px] text-text-muted">
            {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-brand-warning/10 border border-brand-warning/20 flex items-center gap-2 text-xs text-brand-warning">
          <Info className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAP VIEWPORT CARD */}
      <div className="relative glass-panel rounded-2xl overflow-hidden border border-brand-primary/10 shadow-xl" style={{ height: "480px" }}>
        <MapContainer
          center={initialCenter}
          zoom={13}
          style={{ width: "100%", height: "100%", zIndex: 1 }}
          scrollWheelZoom={true}
        >
          {/* Tile layer using free, open-source cartodb dark matter for elegant visual co-existence with our app dark/glass theme */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Controller to handle live updates */}
          {userLocation && <MapController center={userLocation} />}

          {/* USER'S LIVE DEVICE BEACON MARKER */}
          {userLocation && (
            <Marker position={userLocation} icon={createLiveUserBeacon()}>
              <Popup>
                <div className="p-1 text-slate-900 font-sans text-xs">
                  <p className="font-bold">You are here</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* CIVIC ISSUES MARKERS */}
          {issues.map((issue) => {
            const lat = issue.latitude || DEFAULT_LAT;
            const lng = issue.longitude || DEFAULT_LNG;
            const color = getSeverityColor(issue.severity);
            const customIcon = createCustomMarker(color);

            return (
              <Marker key={issue.id} position={[lat, lng]} icon={customIcon}>
                <Popup>
                  <div className="p-1.5 space-y-2 w-48 text-slate-900 font-sans leading-normal">
                    <div>
                      <h4 className="font-bold text-xs leading-tight text-slate-950 line-clamp-2">
                        {issue.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-violet-600" /> {issue.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[9px] mt-1">
                      <span 
                        className="font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px] border"
                        style={{ 
                          color: getSeverityColor(issue.severity), 
                          backgroundColor: `${getSeverityColor(issue.severity)}10`, 
                          borderColor: `${getSeverityColor(issue.severity)}40` 
                        }}
                      >
                        SEVERITY: {issue.severity}/10
                      </span>
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase tracking-tight text-[8px]">
                        {issue.category}
                      </span>
                    </div>

                    {issue.pollVotes && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-1.5 rounded-lg mt-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{issue.pollVotes.yes + issue.pollVotes.no} consensus votes</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onSelectIssue(issue.id);
                      }}
                      className="w-full mt-1 py-1.5 bg-violet-600 hover:bg-violet-700 text-white transition-colors rounded-lg text-[10px] font-bold shadow-sm cursor-pointer text-center"
                    >
                      View Pulse Discussion
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* MAP LEGEND & DATA STATS */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between text-xs border border-brand-primary/5">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm shrink-0"></span>
            <span className="text-text-secondary font-medium text-[11px]">My Detected Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0"></span>
            <span className="text-text-secondary font-medium text-[11px]">Critical (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] shrink-0"></span>
            <span className="text-text-secondary font-medium text-[11px]">Warning (5-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0"></span>
            <span className="text-text-secondary font-medium text-[11px]">Minor (1-4)</span>
          </div>
        </div>

        <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
          Total Backlog: <span className="font-bold text-brand-primary">{issues.length} Cases</span>
        </div>
      </div>
    </div>
  );
}
