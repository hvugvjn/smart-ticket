import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Seat } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Armchair, Bed, User, Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SeatMapConnectedProps {
  showId: number;
  onSelectionChange: (seats: Seat[]) => void;
  maxSeats?: number;
  userEmail?: string;
}

export function SeatMapConnected({ showId, onSelectionChange, maxSeats = 6, userEmail = "" }: SeatMapConnectedProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifySeat, setNotifySeat] = useState<Seat | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: seats = [], isLoading, refetch } = useQuery({
    queryKey: ["seats", showId],
    queryFn: () => api.getSeats(showId),
  });

  useEffect(() => {
    const eventSource = api.createEventSource(showId);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "seat_update") {
        refetch();
      }
    };

    return () => eventSource.close();
  }, [showId, refetch]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status === "booked") return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(seat.id)) {
      newSelected.delete(seat.id);
    } else {
      if (newSelected.size >= maxSeats) {
        return;
      }
      newSelected.add(seat.id);
    }
    setSelectedIds(newSelected);
    
    const selectedSeats = seats.filter(s => newSelected.has(s.id));
    onSelectionChange(selectedSeats);
  };

  const openNotifyModal = (seat: Seat) => {
    setNotifySeat(seat);
    setNotifyEmail(userEmail);
    setNotifyModalOpen(true);
  };

  const handleNotifySubmit = async () => {
    if (!notifySeat || !notifyEmail) return;
    
    setIsSubmitting(true);
    try {
      const result = await api.notifySeat(showId, notifySeat.seatNumber, notifyEmail);
      toast.success(result.message);
      setNotifyModalOpen(false);
      setNotifySeat(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedIds.has(seat.id);
    const isBooked = seat.status === "booked";
    const isLadies = seat.type === "ladies";
    const bookedGender = seat.bookedGender?.toLowerCase() || "unknown";

    const getBookedGenderClass = () => {
      if (!isBooked) return "";
      switch (bookedGender) {
        case "male": return "seat-booked-male";
        case "female": return "seat-booked-female";
        case "other": return "seat-booked-other";
        default: return "seat-booked";
      }
    };

    return (
      <TooltipProvider key={seat.id}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <motion.button
              data-testid={`seat-${seat.seatNumber}`}
              whileHover={!isBooked ? { scale: 1.1 } : {}}
              whileTap={!isBooked ? { scale: 0.95 } : {}}
              onClick={() => toggleSeat(seat)}
              className={cn(
                "relative flex items-center justify-center rounded-md transition-all duration-300",
                seat.deck === "lower" ? "w-10 h-10" : "w-10 h-16",
                isBooked && getBookedGenderClass(),
                isSelected && "seat-selected text-primary-foreground",
                !isBooked && !isSelected && "seat-available text-muted-foreground",
                isLadies && !isBooked && !isSelected && "seat-female text-pink-400"
              )}
              disabled={isBooked}
            >
              {isBooked && <User className="w-4 h-4 absolute" />}
              
              {!isBooked && (
                seat.deck === "upper" ? <Bed className="w-5 h-5" /> : <Armchair className="w-5 h-5" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover/90 backdrop-blur border-border p-2">
            <div className="text-xs font-medium">
              <p className="font-bold text-primary">{seat.seatNumber}</p>
              <p>{seat.type === "sleeper" ? "Sleeper" : "Seater"}</p>
              <p className="text-muted-foreground">₹{seat.price}</p>
              {isBooked && bookedGender !== "unknown" && (
                <p className="text-[10px] capitalize text-accent-foreground/70">Booked by: {bookedGender}</p>
              )}
              {isBooked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openNotifyModal(seat);
                  }}
                  className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  data-testid={`notify-btn-${seat.seatNumber}`}
                >
                  <Bell className="w-3 h-3" />
                  Notify me when available
                </button>
              )}
              {seat.features?.map(f => (
                <span key={f} className="block text-[10px] text-accent-foreground/70">• {f}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Fetching real-time availability...</p>
      </div>
    );
  }

  const lowerDeck = seats.filter(s => s.deck === "lower");
  const upperDeck = seats.filter(s => s.deck === "upper");

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
      
      <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/10 border border-white/20" /> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" /> Selected
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-sky-400 to-blue-600" /> Male
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-400 to-pink-600" /> Female
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-gray-400 to-gray-600" /> Other
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-pink-500/50" /> Ladies Only
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center">
        <div className="bg-card/50 backdrop-blur border border-white/5 rounded-xl p-4 relative">
          <h3 className="text-center text-sm font-medium mb-4 text-muted-foreground">Lower Deck</h3>
          <div className="absolute top-4 right-4"><Armchair className="w-4 h-4 text-muted-foreground/30" /></div>
          
          <div className="flex flex-col gap-2">
            {groupRows(lowerDeck).map((row, i) => (
              <div key={i} className="flex gap-4 justify-between">
                <div className="flex gap-2">
                  {row.filter(s => s.col <= 2).map(renderSeat)}
                </div>
                <div className="w-4" />
                <div className="flex gap-2">
                  {row.filter(s => s.col > 2).map(renderSeat)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end opacity-20">
             <div className="w-8 h-8 border-2 border-white rounded-full" />
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur border border-white/5 rounded-xl p-4 relative">
          <h3 className="text-center text-sm font-medium mb-4 text-muted-foreground">Upper Deck</h3>
          <div className="absolute top-4 right-4"><Bed className="w-4 h-4 text-muted-foreground/30" /></div>

          <div className="flex flex-col gap-2">
             {groupRows(upperDeck).map((row, i) => (
              <div key={i} className="flex gap-4 justify-between">
                <div className="flex gap-2">
                   {row.filter(s => s.col === 1).map(renderSeat)}
                </div>
                <div className="w-4" />
                <div className="flex gap-2">
                   {row.filter(s => s.col > 1).map(renderSeat)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Get Notified
            </DialogTitle>
            <DialogDescription>
              We'll email you when seat <span className="font-bold text-primary">{notifySeat?.seatNumber}</span> becomes available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notify-email">Email Address</Label>
              <Input
                id="notify-email"
                type="email"
                placeholder="your@email.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                data-testid="input-notify-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyModalOpen(false)}
              data-testid="button-notify-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNotifySubmit}
              disabled={!notifyEmail || isSubmitting}
              data-testid="button-notify-submit"
            >
              {isSubmitting ? "Saving..." : "Notify Me"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
