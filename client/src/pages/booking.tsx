import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { SeatMapConnected } from "@/components/modules/SeatMapConnected";
import { PickupModal } from "@/components/PickupModal";
import { DropModal } from "@/components/DropModal";
import { Button } from "@/components/ui/button";
import { api, type Show, type Seat } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { sampleTrips } from "@/data/sampleTrips";
import { format, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, MapPin, Navigation, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingPage() {
  const [, params] = useRoute("/booking/:id");
  const [location, setLocation] = useLocation();
  
  // Parse tripId from route params, extracting only numeric part if query params got mixed in
  const rawTripId = params?.id || "";
  const tripId = rawTripId.split("?")[0]; // Handle case where query params are included in path
  const numericTripId = parseInt(tripId, 10);
  
  const urlParams = new URLSearchParams(window.location.search);
  const pickupParam = urlParams.get("pickup");
  const dropParam = urlParams.get("drop");
  
  console.log('BOOKING PAGE LOAD', { tripId, pickup: pickupParam, drop: dropParam });

  const { isAuthenticated, currentUser, setShowOtpModal } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookingStep, setBookingStep] = useState<"seats" | "processing" | "success">("seats");
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<{ id: string; label: string } | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<{ id: string; label: string } | null>(null);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["show", numericTripId],
    queryFn: () => api.getShow(numericTripId),
    enabled: !isNaN(numericTripId) && numericTripId > 0,
  });

  const sampleTrip = sampleTrips.find(t => t.id === numericTripId);
  const tripWithPoints = trip ? { 
    ...trip, 
    pickupPoints: sampleTrip?.pickupPoints || [],
    dropPoints: sampleTrip?.dropPoints || []
  } : null;

  useEffect(() => {
    if (!pickupParam || !dropParam) {
      if (!showPickupModal && !showDropModal) {
        setShowPickupModal(true);
      }
    } else {
      const pickup = tripWithPoints?.pickupPoints?.find((p: any) => p.id === pickupParam);
      const drop = tripWithPoints?.dropPoints?.find((d: any) => d.id === dropParam);
      if (pickup) setSelectedPickup(pickup);
      if (drop) setSelectedDrop(drop);
    }
  }, [pickupParam, dropParam, tripWithPoints]);

  const handlePickupSelect = (point: { id: string; label: string }) => {
    setSelectedPickup(point);
    setShowPickupModal(false);
    setShowDropModal(true);
  };

  const handleDropSelect = (point: { id: string; label: string }) => {
    setSelectedDrop(point);
    setShowDropModal(false);
    const newUrl = `/booking/${tripId}?pickup=${selectedPickup?.id}&drop=${point.id}`;
    window.history.replaceState({}, '', newUrl);
  };

  const bookSeatsMutation = useMutation({
    mutationFn: async ({ showId, seatIds }: { showId: number; seatIds: number[] }) => {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36)}`;
      const userId = currentUser?.id;
      const booking = await api.bookSeats(showId, seatIds, idempotencyKey, userId);
      if (isAuthenticated) {
        return await api.confirmBooking(booking.id, {
          pickupPointId: selectedPickup?.id,
          dropPointId: selectedDrop?.id,
          pickupLabel: selectedPickup?.label,
          dropLabel: selectedDrop?.label,
        });
      }
      return booking;
    },
    onSuccess: (booking) => {
      console.log('BOOKING CONFIRMED', booking.id);
      setCurrentBookingId(booking.id);
      setBookingStep("success");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      
      toast({
        title: "Booking Confirmed!",
        description: `Confirmation sent to ${currentUser?.email || 'your email'}`,
        className: "bg-green-500/10 border-green-500/20 text-green-500"
      });
    },
    onError: (error: any) => {
      console.error('BOOKING ERROR', error);
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if (error.error) {
          if (Array.isArray(error.error)) {
            errorMessage = error.error.map((e: any) => e.message || e).join(', ');
          } else {
            errorMessage = error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setBookingStep("seats");
    },
  });

  const handleBook = () => {
    if (!trip || selectedSeats.length === 0 || isNaN(numericTripId)) return;
    
    if (!isAuthenticated) {
      setShowOtpModal(true);
      toast({
        title: "Login Required",
        description: "Please login to complete your booking.",
      });
      return;
    }
    
    setBookingStep("processing");
    bookSeatsMutation.mutate({
      showId: numericTripId,
      seatIds: selectedSeats.map(s => s.id),
    });
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Trip Not Found</h1>
          <p className="text-muted-foreground mb-6">The trip you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {trip && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-display font-bold">{trip.operatorName}</h1>
                <p className="text-muted-foreground">{trip.vehicleType}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatINR(trip.price)}</p>
                <p className="text-xs text-muted-foreground">per seat</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 py-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-lg font-bold">{format(parseISO(trip.departureTime), "HH:mm")}</p>
                <p className="text-sm text-muted-foreground">{trip.source}</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">{trip.duration}</p>
                <div className="w-full h-[2px] bg-white/20 relative">
                  <ArrowRight className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{format(parseISO(trip.arrivalTime), "HH:mm")}</p>
                <p className="text-sm text-muted-foreground">{trip.destination}</p>
              </div>
            </div>

            {(selectedPickup || selectedDrop) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {selectedPickup && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-medium">{selectedPickup.label}</p>
                    </div>
                  </div>
                )}
                {selectedDrop && (
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Drop</p>
                      <p className="text-sm font-medium">{selectedDrop.label}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {bookingStep === "seats" && selectedPickup && selectedDrop && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-display font-semibold mb-4">Select Your Seats</h2>
              <SeatMapConnected 
                showId={numericTripId} 
                onSelectionChange={setSelectedSeats} 
              />
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">{selectedSeats.length} seats selected</span>
                <span className="text-2xl font-bold text-primary">
                  {formatINR(selectedSeats.reduce((acc, s) => acc + parseFloat(s.price), 0))}
                </span>
              </div>
              <Button 
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90"
                disabled={selectedSeats.length === 0 || bookSeatsMutation.isPending}
                onClick={handleBook}
                data-testid="button-confirm-booking"
              >
                {bookSeatsMutation.isPending ? "Processing..." : isAuthenticated ? "Confirm Booking" : "Login & Book"}
              </Button>
            </div>
          </div>
        )}

        {bookingStep === "processing" && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-xl font-bold mt-6">Processing Your Booking...</h3>
            <p className="text-muted-foreground mt-2">Please wait while we reserve your seats</p>
          </div>
        )}

        {bookingStep === "success" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Confirmation has been sent to {currentUser?.email || 'your email'}
            </p>
            
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Booking ID</span>
                <span className="font-mono">#{currentBookingId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Seats</span>
                <span>{selectedSeats.map(s => s.seatNumber).join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-primary font-bold">
                  {formatINR(selectedSeats.reduce((a, b) => a + parseFloat(b.price), 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setLocation("/my-trips")}>
                View My Trips
              </Button>
              <Button onClick={() => setLocation("/")}>
                Book Another Trip
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <PickupModal
        open={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        trip={tripWithPoints}
        onSelect={handlePickupSelect}
      />

      <DropModal
        open={showDropModal}
        onClose={() => {
          setShowDropModal(false);
          setShowPickupModal(true);
        }}
        trip={tripWithPoints}
        onSelect={handleDropSelect}
        selectedPickup={selectedPickup || undefined}
      />
    </div>
  );
}
