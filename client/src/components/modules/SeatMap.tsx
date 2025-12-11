import { useState, useEffect } from "react";
import { Seat, generateSeats } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Armchair, Bed, Lock, User, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface SeatMapProps {
  tripId: string;
  onSelectionChange: (seats: Seat[]) => void;
  maxSeats?: number;
}

export function SeatMap({ tripId, onSelectionChange, maxSeats = 6 }: SeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching seats with a slight delay for realism
    setLoading(true);
    const timer = setTimeout(() => {
      setSeats(generateSeats(tripId));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [tripId]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status === "booked" || seat.status === "locked") return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(seat.id)) {
      newSelected.delete(seat.id);
    } else {
      if (newSelected.size >= maxSeats) {
        // Could show toast here
        return;
      }
      newSelected.add(seat.id);
    }
    setSelectedIds(newSelected);
    
    const selectedSeats = seats.filter(s => newSelected.has(s.id));
    onSelectionChange(selectedSeats);
  };

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedIds.has(seat.id);
    const isBooked = seat.status === "booked";
    const isLocked = seat.status === "locked";
    const isLadies = seat.type === "ladies";

    return (
      <TooltipProvider key={seat.id}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={!isBooked && !isLocked ? { scale: 1.1 } : {}}
              whileTap={!isBooked && !isLocked ? { scale: 0.95 } : {}}
              onClick={() => toggleSeat(seat)}
              className={cn(
                "relative flex items-center justify-center rounded-md transition-all duration-300",
                seat.deck === "lower" ? "w-10 h-10" : "w-10 h-16", // Sleepers are taller
                isBooked && "seat-booked text-muted-foreground/20",
                isLocked && "bg-amber-500/10 border border-amber-500/30 text-amber-500 cursor-not-allowed",
                isSelected && "seat-selected text-primary-foreground",
                !isBooked && !isLocked && !isSelected && "seat-available text-muted-foreground",
                isLadies && !isBooked && !isSelected && "seat-female text-pink-400"
              )}
              disabled={isBooked || isLocked}
            >
              {isLocked && <Lock className="w-4 h-4 absolute" />}
              {isBooked && <User className="w-4 h-4 absolute" />}
              
              {!isBooked && !isLocked && (
                seat.deck === "upper" ? <Bed className="w-5 h-5" /> : <Armchair className="w-5 h-5" />
              )}
              
              {/* Price Tag on Hover */}
              {(!isBooked && !isLocked) && (
                <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover/90 backdrop-blur border-border p-2">
            <div className="text-xs font-medium">
              <p className="font-bold text-primary">{seat.label}</p>
              <p>{seat.type === "sleeper" ? "Sleeper" : "Seater"}</p>
              <p className="text-muted-foreground">${seat.price}</p>
              {seat.features?.map(f => (
                <span key={f} className="block text-[10px] text-accent-foreground/70">• {f}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Fetching real-time availability...</p>
      </div>
    );
  }

  const lowerDeck = seats.filter(s => s.deck === "lower");
  const upperDeck = seats.filter(s => s.deck === "upper");

  // Group by row
  const groupRows = (deckSeats: Seat[]) => {
    const rows: Record<number, Seat[]> = {};
    deckSeats.forEach(s => {
      if (!rows[s.row]) rows[s.row] = [];
      rows[s.row].push(s);
    });
    return Object.values(rows);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/10 border border-white/20" /> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" /> Selected
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/5 opacity-30" /> Booked
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-pink-500/50" /> Ladies
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center">
        {/* Lower Deck */}
        <div className="bg-card/50 backdrop-blur border border-white/5 rounded-xl p-4 relative">
          <h3 className="text-center text-sm font-medium mb-4 text-muted-foreground">Lower Deck</h3>
          <div className="absolute top-4 right-4"><Armchair className="w-4 h-4 text-muted-foreground/30" /></div>
          
          <div className="flex flex-col gap-2">
            {groupRows(lowerDeck).map((row, i) => (
              <div key={i} className="flex gap-4 justify-between">
                <div className="flex gap-2">
                  {row.filter(s => s.col <= 2).map(renderSeat)}
                </div>
                {/* Aisle */}
                <div className="w-4" />
                <div className="flex gap-2">
                  {row.filter(s => s.col > 2).map(renderSeat)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Steering Wheel Indicator */}
          <div className="mt-8 flex justify-end opacity-20">
             <div className="w-8 h-8 border-2 border-white rounded-full" />
          </div>
        </div>

        {/* Upper Deck */}
        <div className="bg-card/50 backdrop-blur border border-white/5 rounded-xl p-4 relative">
          <h3 className="text-center text-sm font-medium mb-4 text-muted-foreground">Upper Deck</h3>
          <div className="absolute top-4 right-4"><Bed className="w-4 h-4 text-muted-foreground/30" /></div>

          <div className="flex flex-col gap-2">
             {groupRows(upperDeck).map((row, i) => (
              <div key={i} className="flex gap-4 justify-between">
                <div className="flex gap-2">
                   {row.filter(s => s.col === 1).map(renderSeat)}
                </div>
                {/* Aisle */}
                <div className="w-4" />
                <div className="flex gap-2">
                   {row.filter(s => s.col > 1).map(renderSeat)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
