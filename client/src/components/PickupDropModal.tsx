import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Point {
  id: string;
  label: string;
  time?: string;
}

interface PickupDropModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pickupId: string, dropId: string) => void;
  pickupPoints: Point[];
  dropPoints: Point[];
  source: string;
  destination: string;
}

export function PickupDropModal({
  open,
  onClose,
  onConfirm,
  pickupPoints,
  dropPoints,
  source,
  destination,
}: PickupDropModalProps) {
  const [step, setStep] = useState<"pickup" | "drop">("pickup");
  const [selectedPickup, setSelectedPickup] = useState<string>("");
  const [selectedDrop, setSelectedDrop] = useState<string>("");

  const handleNext = () => {
    if (step === "pickup" && selectedPickup) {
      setStep("drop");
    } else if (step === "drop" && selectedDrop) {
      onConfirm(selectedPickup, selectedDrop);
      setStep("pickup");
      setSelectedPickup("");
      setSelectedDrop("");
    }
  };

  const handleBack = () => {
    if (step === "drop") {
      setStep("pickup");
    }
  };

  const handleClose = () => {
    setStep("pickup");
    setSelectedPickup("");
    setSelectedDrop("");
    onClose();
  };

  const selectedPickupPoint = pickupPoints.find(p => p.id === selectedPickup);
  const selectedDropPoint = dropPoints.find(p => p.id === selectedDrop);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            {step === "pickup" ? (
              <>
                <MapPin className="w-5 h-5 text-primary" />
                Select Pickup Point
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 text-primary" />
                Select Drop Point
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "pickup" 
              ? `Choose your boarding point in ${source}`
              : `Choose your alighting point in ${destination}`
            }
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "pickup" ? (
            <motion.div
              key="pickup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-4"
            >
              <RadioGroup value={selectedPickup} onValueChange={setSelectedPickup}>
                <div className="space-y-3">
                  {pickupPoints.map((point) => (
                    <div
                      key={point.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedPickup === point.id
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedPickup(point.id)}
                    >
                      <RadioGroupItem value={point.id} id={point.id} />
                      <Label htmlFor={point.id} className="flex-1 cursor-pointer">
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
            </motion.div>
          ) : (
            <motion.div
              key="drop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              {selectedPickupPoint && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <span className="text-muted-foreground">Pickup: </span>
                  <span className="font-medium">{selectedPickupPoint.label}</span>
                  {selectedPickupPoint.time && (
                    <span className="text-muted-foreground"> at {selectedPickupPoint.time}</span>
                  )}
                </div>
              )}

              <RadioGroup value={selectedDrop} onValueChange={setSelectedDrop}>
                <div className="space-y-3">
                  {dropPoints.map((point) => (
                    <div
                      key={point.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedDrop === point.id
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedDrop(point.id)}
                    >
                      <RadioGroupItem value={point.id} id={point.id} />
                      <Label htmlFor={point.id} className="flex-1 cursor-pointer">
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 pt-2">
          {step === "drop" && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={step === "pickup" ? !selectedPickup : !selectedDrop}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {step === "pickup" ? (
              <>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              "Confirm & View Seats"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
