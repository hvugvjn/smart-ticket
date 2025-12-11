import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Navigation, Clock } from "lucide-react";
import { useState } from "react";

interface DropPoint {
  id: string;
  label: string;
  time?: string;
}

interface DropModalProps {
  open: boolean;
  onClose: () => void;
  trip: any;
  onSelect: (point: DropPoint) => void;
  selectedPickup?: { id: string; label: string };
}

const defaultDropPoints: DropPoint[] = [
  { id: "d1", label: "Central Bus Stand", time: "14:00" },
  { id: "d2", label: "Railway Station", time: "14:30" },
  { id: "d3", label: "City Center", time: "15:00" },
];

export function DropModal({ open, onClose, trip, onSelect, selectedPickup }: DropModalProps) {
  const [selected, setSelected] = useState<string>("");
  
  const dropPoints: DropPoint[] = trip?.dropPoints?.length > 0 
    ? trip.dropPoints 
    : defaultDropPoints;

  const handleConfirm = () => {
    const point = dropPoints.find(p => p.id === selected);
    if (point) {
      console.log('DROP SELECTED', point);
      onSelect(point);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Select Drop Point
          </DialogTitle>
          <DialogDescription>
            Choose your alighting point in {trip?.destination || "destination city"}
          </DialogDescription>
        </DialogHeader>

        {selectedPickup && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <span className="text-muted-foreground">Pickup: </span>
            <span className="font-medium">{selectedPickup.label}</span>
          </div>
        )}

        <div className="py-4">
          <RadioGroup value={selected} onValueChange={setSelected}>
            <div className="space-y-3">
              {dropPoints.map((point) => (
                <div
                  key={point.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    selected === point.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setSelected(point.id)}
                  data-testid={`drop-point-${point.id}`}
                >
                  <RadioGroupItem value={point.id} id={`drop-${point.id}`} />
                  <Label htmlFor={`drop-${point.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{point.label}</div>
                    {point.time && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {point.time}
                      </div>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-primary hover:bg-primary/90"
          data-testid="button-confirm-drop"
        >
          Confirm & View Seats
        </Button>
      </DialogContent>
    </Dialog>
  );
}
