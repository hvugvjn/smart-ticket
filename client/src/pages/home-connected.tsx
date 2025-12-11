/**
 * home-connected.tsx
 * Modifications:
 * - Integrated AuthContext for booking protection
 * - Changed all currency from USD to INR
 * - Opens OTP modal when unauthenticated user tries to book
 * - Added search functionality with API and fallback
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { SearchHero } from "@/components/modules/SearchHero";
import { SearchResults } from "@/components/SearchResults";
import { api, type Show, type Seat } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { SeatMapConnected } from "@/components/modules/SeatMapConnected";
import { format, parseISO } from "date-fns";
import { Wifi, Coffee, Battery, ArrowRight, CheckCircle2, Star, Users } from "lucide-react";
import heroImage from "@assets/generated_images/futuristic_luxury_bus_interior_with_ambient_lighting.png";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/currency";
import { sampleTrips, filterTrips } from "@/data/sampleTrips";
import { PickupModal } from "@/components/PickupModal";
import { DropModal } from "@/components/DropModal";
import { toLocalISO } from "@/utils/dateLocal";
import { useLocation } from "wouter";

export default function HomeConnected() {
  const { isAuthenticated, currentUser, setShowOtpModal, setPendingBooking, pendingBooking } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookingStep, setBookingStep] = useState<"seats" | "processing" | "success">("seats");
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  
  // Pickup/Drop point selection state
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const [pendingTripForBooking, setPendingTripForBooking] = useState<any>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<{ id: string; label: string } | null>(null);
  const [selectedDropPoint, setSelectedDropPoint] = useState<{ id: string; label: string } | null>(null);
  const [, setLocation] = useLocation();
  
  const queryClient = useQueryClient();

  const { data: shows = [] } = useQuery({
    queryKey: ["shows"],
    queryFn: () => api.getShows(),
  });

  const handleSearch = async ({ from, to, date }: { from: string; to: string; date?: Date }) => {
    const localDateStr = date ? toLocalISO(date) : "";
    console.log("SEARCH START", { from, to, date: localDateStr });
    
    if (!from || !to) {
      toast({
        title: "Missing fields",
        description: "Please select both From and To cities",
        variant: "destructive",
      });
      return;
    }

    setSearchFrom(from);
    setSearchTo(to);
    setSearchDate(localDateStr);
    setIsSearching(true);
    setIsSearched(true);

    try {
      // Try API first
      const dateParam = localDateStr;
      const url = `/api/shows?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${dateParam ? `&date=${dateParam}` : ""}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Filter results by source/destination (API returns all shows)
        const filtered = data.filter((trip: any) => 
          trip.source.toLowerCase() === from.toLowerCase() &&
          trip.destination.toLowerCase() === to.toLowerCase()
        );
        console.log("SEARCH RESULTS", filtered.length);
        setSearchResults(filtered);
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      // Fallback to local sample data
      console.log("FALLBACK: local sampleTrips used");
      const dateStr = date ? toLocalISO(date) : undefined;
      const filtered = filterTrips(sampleTrips, from, to, dateStr);
      console.log("SEARCH RESULTS", filtered.length);
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  // Resume booking after login
  useEffect(() => {
    if (isAuthenticated && pendingBooking && pendingBooking.seatIds.length > 0) {
      const tripToBook = shows.find(s => s.id === pendingBooking.showId);
      if (tripToBook) {
        setSelectedTrip(tripToBook);
        bookSeatsMutation.mutate({
          showId: pendingBooking.showId,
          seatIds: pendingBooking.seatIds,
        });
        setPendingBooking(null);
      }
    }
  }, [isAuthenticated, pendingBooking, shows]);

  const bookSeatsMutation = useMutation({
    mutationFn: async ({ showId, seatIds, pickupId, dropId, pickupLabel, dropLabel }: { showId: number; seatIds: number[]; pickupId?: string; dropId?: string; pickupLabel?: string; dropLabel?: string }) => {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36)}`;
      const booking = await api.bookSeats(showId, seatIds, idempotencyKey);
      if (isAuthenticated) {
        return await api.confirmBooking(booking.id, { pickupPointId: pickupId, dropPointId: dropId, pickupLabel, dropLabel });
      }
      return booking;
    },
    onSuccess: (booking) => {
      setCurrentBookingId(booking.id);
      setBookingStep("success");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      
      const existingBookings = JSON.parse(localStorage.getItem("userBookings") || "[]");
      existingBookings.push({
        ...booking,
        tripDetails: selectedTrip ? {
          operatorName: selectedTrip.operatorName,
          source: selectedTrip.source,
          destination: selectedTrip.destination,
          departureTime: selectedTrip.departureTime,
        } : undefined,
      });
      localStorage.setItem("userBookings", JSON.stringify(existingBookings));
      
      toast({
        title: "Booking Confirmed! 🚀",
        description: "Your tickets have been reserved.",
        className: "bg-green-500/10 border-green-500/20 text-green-500"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewSeats = (trip: any) => {
    const sampleTrip = sampleTrips.find(s => s.id === trip.id);
    setPendingTripForBooking({ 
      ...trip, 
      pickupPoints: sampleTrip?.pickupPoints || [], 
      dropPoints: sampleTrip?.dropPoints || [] 
    });
    setShowPickupModal(true);
  };

  const handlePickupSelect = (point: { id: string; label: string }) => {
    console.log('PICKUP SELECTED', point);
    setSelectedPickupPoint(point);
    setShowPickupModal(false);
    setShowDropModal(true);
  };

  const handleDropSelect = (point: { id: string; label: string }) => {
    console.log('DROP SELECTED', point);
    setSelectedDropPoint(point);
    setShowDropModal(false);
    
    if (pendingTripForBooking && selectedPickupPoint) {
      setLocation(`/booking/${pendingTripForBooking.id}?pickup=${selectedPickupPoint.id}&drop=${point.id}`);
      setPendingTripForBooking(null);
      setSelectedPickupPoint(null);
      setSelectedDropPoint(null);
    }
  };

  const handleBook = () => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    
    if (!isAuthenticated) {
      setPendingBooking({
        showId: selectedTrip.id,
        seatIds: selectedSeats.map(s => s.id),
      });
      setSelectedTrip(null);
      setShowOtpModal(true);
      toast({
        title: "Login Required",
        description: "Please login to complete your booking. Your seat selection has been saved.",
      });
      return;
    }
    
    setBookingStep("processing");
    bookSeatsMutation.mutate({
      showId: selectedTrip.id,
      seatIds: selectedSeats.map(s => s.id),
      pickupId: selectedPickupPoint?.id,
      dropId: selectedDropPoint?.id,
      pickupLabel: selectedPickupPoint?.label,
      dropLabel: selectedDropPoint?.label,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar />

      <div className="relative h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10 pointer-events-none" />
        <img 
          src={heroImage} 
          alt="Luxury Travel" 
          className="w-full h-full object-cover opacity-80 scale-105 animate-in fade-in zoom-in duration-[2s]"
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 text-glow">Future</span> of Travel
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Premium intercity bus booking with intelligent seat selection, real-time tracking, and superior comfort.
            </p>
          </motion.div>
        </div>
      </div>

      <SearchHero onSearch={handleSearch} />

      <div className="max-w-5xl mx-auto px-4 py-24 space-y-12">
        {/* Search Results Section */}
        {isSearched && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <SearchResults 
              results={searchResults}
              from={searchFrom}
              to={searchTo}
              date={searchDate || undefined}
              isLoading={isSearching}
            />
          </div>
        )}

        {/* All Available Trips (shown when not searching) */}
        {!isSearched && shows.length > 0 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-semibold">Available Trips</h2>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all">Cheapest</Button>
                 <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all">Fastest</Button>
              </div>
            </div>
            
            {shows.map((trip) => (
              <motion.div 
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group glass-card rounded-2xl p-6 relative overflow-hidden"
                data-testid={`trip-card-${trip.id}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white/5 p-2 rounded-full border border-white/10">
                      <ArrowRight className="w-5 h-5 -rotate-45 text-primary" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-4 space-y-1">
                    <h3 className="text-xl font-bold font-display">{trip.operatorName}</h3>
                    <p className="text-sm text-muted-foreground">{trip.vehicleType}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded"><Star className="w-3 h-3 mr-1 fill-amber-400" /> {trip.rating}</span>
                      <span className="flex items-center text-xs text-muted-foreground"><Users className="w-3 h-3 mr-1" /> {trip.totalSeats} seats</span>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{format(parseISO(trip.departureTime), "HH:mm")}</p>
                      <p className="text-xs text-muted-foreground">{trip.source}</p>
                    </div>
                    <div className="flex flex-col items-center flex-1 px-4">
                      <p className="text-[10px] text-muted-foreground mb-1">{trip.duration}</p>
                      <div className="w-full h-[1px] bg-white/20 relative">
                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-primary/50" />
                        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-primary/50" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{format(parseISO(trip.arrivalTime), "HH:mm")}</p>
                      <p className="text-xs text-muted-foreground">{trip.destination}</p>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold font-display text-primary">{formatINR(trip.price)}</p>
                    <Button 
                      data-testid={`view-seats-${trip.id}`}
                      className="w-full bg-white/10 hover:bg-primary hover:text-primary-foreground text-foreground border border-white/10 transition-all duration-300"
                      onClick={() => handleViewSeats(trip)}
                    >
                      View Seats
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex gap-4 overflow-x-auto pb-2">
                   {trip.amenities.map(a => (
                     <span key={a} className="text-xs text-muted-foreground flex items-center whitespace-nowrap">
                       {a === "WiFi" && <Wifi className="w-3 h-3 mr-1" />}
                       {a === "Water Bottle" && <Coffee className="w-3 h-3 mr-1" />}
                       {a === "Charging Point" && <Battery className="w-3 h-3 mr-1" />}
                       {a}
                     </span>
                   ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-background/95 backdrop-blur-xl border-l border-white/10 p-0 overflow-y-auto">
          {selectedTrip && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-6 border-b border-white/10">
                <SheetTitle className="text-2xl font-display">{selectedTrip.operatorName}</SheetTitle>
                <SheetDescription className="flex justify-between items-center text-muted-foreground">
                  <span>{selectedTrip.source} → {selectedTrip.destination}</span>
                  <span className="text-primary font-bold">{format(parseISO(selectedTrip.departureTime), "HH:mm")}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 p-6">
                <AnimatePresence mode="wait">
                  {bookingStep === "seats" && (
                    <motion.div 
                      key="seats"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <SeatMapConnected 
                        showId={selectedTrip.id} 
                        onSelectionChange={setSelectedSeats} 
                      />
                    </motion.div>
                  )}

                  {bookingStep === "processing" && (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center justify-center h-full space-y-6 text-center pt-20"
                    >
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <h3 className="text-xl font-bold">Processing Booking...</h3>
                      <p className="text-sm text-muted-foreground">Please wait while we reserve your seats</p>
                    </motion.div>
                  )}

                  {bookingStep === "success" && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full space-y-6 text-center pt-20"
                    >
                      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                         <CheckCircle2 className="w-12 h-12 text-black" />
                      </div>
                      <h2 className="text-3xl font-display font-bold">Booking Confirmed!</h2>
                      <p className="text-muted-foreground max-w-xs">Your seats have been successfully reserved. A confirmation has been sent.</p>
                      
                      <div className="w-full bg-white/5 rounded-xl p-4 mt-8 border border-white/10 text-left">
                         <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Trip ID</span>
                            <span className="font-mono">{selectedTrip.id}</span>
                         </div>
                         <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Seats</span>
                            <span>{selectedSeats.map(s => s.seatNumber).join(", ")}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="text-primary font-bold">{formatINR(selectedSeats.reduce((a,b) => a + parseFloat(b.price), 0))}</span>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {bookingStep === "seats" && (
                <SheetFooter className="p-6 border-t border-white/10 flex-col gap-4 sm:flex-col">
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{selectedSeats.length} seats selected</span>
                      <span className="text-xl font-bold font-display text-primary">
                        {formatINR(selectedSeats.reduce((acc, s) => acc + parseFloat(s.price), 0))}
                      </span>
                    </div>
                    <Button 
                      data-testid="button-proceed-book"
                      className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      disabled={selectedSeats.length === 0 || bookSeatsMutation.isPending}
                      onClick={handleBook}
                    >
                      {bookSeatsMutation.isPending ? "Booking..." : isAuthenticated ? "Confirm Booking" : "Login & Book"}
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-xs text-center text-muted-foreground">
                        You'll be prompted to login before completing your booking
                      </p>
                    )}
                  </div>
                </SheetFooter>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PickupModal
        open={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setPendingTripForBooking(null);
        }}
        trip={pendingTripForBooking}
        onSelect={handlePickupSelect}
      />

      <DropModal
        open={showDropModal}
        onClose={() => {
          setShowDropModal(false);
          setShowPickupModal(true);
        }}
        trip={pendingTripForBooking}
        onSelect={handleDropSelect}
        selectedPickup={selectedPickupPoint || undefined}
      />
    </div>
  );
}
