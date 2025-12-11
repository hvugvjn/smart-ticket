import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { X, Navigation, Pause, Play, Crosshair, Zap } from "lucide-react";
import { api } from "@/lib/api";

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface LiveMapOverlayProps {
  tripId: number;
  pickup: Location;
  drop: Location;
  stops?: Location[];
  onClose: () => void;
}

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const busIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function CenterOnBus({ position, trigger }: { position: [number, number] | null; trigger: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && trigger > 0) {
      map.setView(position, map.getZoom());
    }
  }, [map, position, trigger]);

  return null;
}

export function LiveMapOverlay({ tripId, pickup, drop, stops = [], onClose }: LiveMapOverlayProps) {
  const [isTracking, setIsTracking] = useState(true);
  const [busPosition, setBusPosition] = useState<{ lat: number; lng: number; ts: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const routePoints: [number, number][] = [
    [pickup.lat, pickup.lng],
    ...stops.map(s => [s.lat, s.lng] as [number, number]),
    [drop.lat, drop.lng],
  ];

  const center: [number, number] = [
    (pickup.lat + drop.lat) / 2,
    (pickup.lng + drop.lng) / 2,
  ];

  const fetchPosition = useCallback(async () => {
    try {
      const position = await api.getLivePosition(tripId);
      if (position) {
        console.log("[LiveMapOverlay] Position update:", position);
        setBusPosition(position);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("[LiveMapOverlay] Error fetching position:", error);
    }
  }, [tripId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isTracking) {
      fetchPosition();
      const interval = 2000 / speed;
      intervalRef.current = setInterval(fetchPosition, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, speed, fetchPosition]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    overlayRef.current?.focus();
    
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleCenterOnBus = () => {
    setCenterTrigger(prev => prev + 1);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Live bus tracking"
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl h-[80vh] md:h-[70vh] bg-background rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Live Bus Tracking</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isTracking ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {isTracking ? "Tracking" : "Paused"}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-close-live-map"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <CenterOnBus position={busPosition ? [busPosition.lat, busPosition.lng] : null} trigger={centerTrigger} />

            <Polyline
              positions={routePoints}
              pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.8 }}
            />

            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
              <Popup>
                <strong>Pickup:</strong> {pickup.name}
              </Popup>
            </Marker>

            <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
              <Popup>
                <strong>Drop:</strong> {drop.name}
              </Popup>
            </Marker>

            {stops.map((stop, index) => (
              <CircleMarker
                key={index}
                center={[stop.lat, stop.lng]}
                radius={6}
                pathOptions={{
                  fillColor: "#f59e0b",
                  fillOpacity: 0.9,
                  color: "#fff",
                  weight: 2,
                }}
              >
                <Popup>{stop.name}</Popup>
              </CircleMarker>
            ))}

            {busPosition && (
              <Marker position={[busPosition.lat, busPosition.lng]} icon={busIcon}>
                <Popup>
                  <strong>Bus Position</strong>
                  <br />
                  Last updated: {lastUpdate?.toLocaleTimeString()}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isTracking ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsTracking(!isTracking)}
              data-testid="button-toggle-tracking"
            >
              {isTracking ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isTracking ? "Stop" : "Start"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCenterOnBus}
              disabled={!busPosition}
              className="bg-white/5 border-white/10"
              data-testid="button-center-bus"
            >
              <Crosshair className="w-4 h-4 mr-1" />
              Center
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpeed(speed === 1 ? 2 : 1)}
              className="bg-white/5 border-white/10"
              data-testid="button-speed-toggle"
            >
              <Zap className="w-4 h-4 mr-1" />
              {speed}x
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {lastUpdate ? (
              <>Last update: {lastUpdate.toLocaleTimeString()}</>
            ) : (
              <>Waiting for position...</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
