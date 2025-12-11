import { useState, useEffect } from "react";
import { Bus, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface MapMockProps {
  departureTime: string;
  arrivalTime: string;
  source: string;
  destination: string;
  compact?: boolean;
}

export function MapMock({ departureTime, arrivalTime, source, destination, compact = false }: MapMockProps) {
  const [progress, setProgress] = useState(0);
  const [etaText, setEtaText] = useState("");
  const [status, setStatus] = useState<"before" | "during" | "after">("before");

  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const departure = new Date(departureTime).getTime();
      const arrival = new Date(arrivalTime).getTime();
      const tripDuration = arrival - departure;
      
      if (now < departure) {
        setStatus("before");
        const timeUntilDeparture = departure - now;
        const minutes = Math.floor(timeUntilDeparture / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        
        if (hours > 0) {
          setEtaText(`Departs in ${hours}h ${remainingMins}m`);
        } else {
          setEtaText(`Departs in ${minutes}m`);
        }
        setProgress(0);
      } else if (now > arrival) {
        setStatus("after");
        setEtaText("Trip completed");
        setProgress(1);
      } else {
        setStatus("during");
        const elapsed = now - departure;
        const currentProgress = Math.min(Math.max(elapsed / tripDuration, 0), 1);
        setProgress(currentProgress);
        
        const remaining = arrival - now;
        const minutes = Math.ceil(remaining / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        
        if (hours > 0) {
          setEtaText(`ETA: ${hours}h ${remainingMins}m`);
        } else {
          setEtaText(`ETA: ${minutes} min`);
        }
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 30000);
    return () => clearInterval(interval);
  }, [departureTime, arrivalTime]);

  if (compact) {
    return (
      <div className="flex items-center gap-2" data-testid="map-mock-compact">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
            initial={{ left: "0%" }}
            animate={{ left: `calc(${progress * 100}% - 6px)` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="w-3 h-3" />
          <span data-testid="text-eta-compact">{etaText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4" data-testid="map-mock-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bus className="w-5 h-5 text-primary" />
          <span className="font-medium">Live Tracking</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {status === "after" ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Clock className="w-4 h-4 text-primary animate-pulse" />
          )}
          <span 
            className={status === "after" ? "text-green-500" : "text-primary"}
            data-testid="text-eta-full"
          >
            {etaText}
          </span>
        </div>
      </div>

      <div className="relative py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{source}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{destination}</span>
            <MapPin className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-muted-foreground/30 via-primary/50 to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
            initial={{ left: "0%" }}
            animate={{ left: `calc(${progress * 100}% - 12px)` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
                <Bus className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              {status === "during" && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{Math.round(progress * 100)}% complete</span>
          <span>{status === "during" ? "In transit" : status === "before" ? "Not started" : "Arrived"}</span>
        </div>
      </div>
    </div>
  );
}
