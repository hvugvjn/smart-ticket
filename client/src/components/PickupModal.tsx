import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { useState } from "react";

interface PickupPoint {
  id: string;
  label: string;
  time?: string;
}

interface PickupModalProps {
  open: boolean;
  onClose: () => void;
  trip: any;
  onSelect: (point: PickupPoint) => void;
}

const defaultPickupPoints: PickupPoint[] = [
  { id: "p1", label: "Central Bus Stand", time: "06:00" },
  { id: "p2", label: "Railway Station", time: "06:30" },
  { id: "p3", label: "City Center", time: "07:00" },
];

export function PickupModal({ open, onClose, trip, onSelect }: PickupModalProps) {
  const [selected, setSelected] = useState<string>("");
  
  const pickupPoints: PickupPoint[] = trip?.pickupPoints?.length > 0 
    ? trip.pickupPoints 
    : defaultPickupPoints;

  const handleConfirm = () => {
    const point = pickupPoints.find(p => p.id === selected);
    if (point) {
      console.log('PICKUP SELECTED', point);
      onSelect(point);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Pickup Point
          </DialogTitle>
          <DialogDescription>
            Choose your boarding point in {trip?.source || "source city"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selected} onValueChange={setSelected}>
            <div className="space-y-3">
              {pickupPoints.map((point) => (
                <div
                  key={point.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    selected === point.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setSelected(point.id)}
                  data-testid={`pickup-point-${point.id}`}
                >
                  <RadioGroupItem value={point.id} id={`pickup-${point.id}`} />
                  <Label htmlFor={`pickup-${point.id}`} className="flex-1 cursor-pointer">
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
          data-testid="button-confirm-pickup"
        >
          Continue to Drop Point
        </Button>
      </DialogContent>
    </Dialog>
  );
}
