import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { SearchHero } from "@/components/modules/SearchHero";
import { trips, Trip, Seat } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { SeatMap } from "@/components/modules/SeatMap";
import { format } from "date-fns";
import { Clock, Wifi, Coffee, Battery, ArrowRight, CheckCircle2, Shield, Star, Users } from "lucide-react";
import heroImage from "@assets/generated_images/futuristic_luxury_bus_interior_with_ambient_lighting.png";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState<Trip[] | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookingStep, setBookingStep] = useState<"seats" | "auth" | "success">("seats");
  const [otp, setOtp] = useState("");

  const handleSearch = () => {
    // Simulate API call
    setTimeout(() => {
      setSearchResults(trips);
    }, 500);
  };

  const handleBook = () => {
    setBookingStep("auth");
  };

  const handleConfirmBooking = () => {
    if (otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit code.",
        variant: "destructive"
      });
      return;
    }
    
    setBookingStep("success");
    toast({
      title: "Booking Confirmed! 🚀",
      description: "Your tickets have been sent to your email.",
      className: "bg-green-500/10 border-green-500/20 text-green-500"
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
        <img 
          src={heroImage} 
          alt="Luxury Travel" 
          className="w-full h-full object-cover opacity-80 scale-105 animate-in fade-in zoom-in duration-[2s]"
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              {t("home.title").split("Future").map((part, i) => 
                i === 0 ? (
                  <span key={i}>{part}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 text-glow">Future</span></span>
                ) : part
              )}
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              {t("home.subtitle")}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search Interface */}
      <SearchHero onSearch={handleSearch} />

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-24 space-y-12">
        {searchResults && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-semibold">Available Trips</h2>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all">Cheapest</Button>
                 <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all">Fastest</Button>
              </div>
            </div>
            
            {searchResults.map((trip) => (
              <motion.div 
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group glass-card rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white/5 p-2 rounded-full border border-white/10">
                      <ArrowRight className="w-5 h-5 -rotate-45 text-primary" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Operator Info */}
                  <div className="md:col-span-4 space-y-1">
                    <h3 className="text-xl font-bold font-display">{trip.operator}</h3>
                    <p className="text-sm text-muted-foreground">{trip.type}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded"><Star className="w-3 h-3 mr-1 fill-amber-400" /> {trip.rating}</span>
                      <span className="flex items-center text-xs text-muted-foreground"><Users className="w-3 h-3 mr-1" /> {trip.totalSeats - trip.seatsAvailable} booked</span>
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="md:col-span-5 flex items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{trip.departureTime}</p>
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
                      <p className="text-lg font-bold">{trip.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{trip.destination}</p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="md:col-span-3 flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold font-display text-primary">${trip.price}</p>
                    <Button 
                      className="w-full bg-white/10 hover:bg-primary hover:text-primary-foreground text-foreground border border-white/10 transition-all duration-300"
                      onClick={() => {
                        setSelectedTrip(trip);
                        setBookingStep("seats");
                        setSelectedSeats([]);
                      }}
                    >
                      View Seats
                    </Button>
                  </div>
                </div>
                
                {/* Amenities */}
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

      {/* Booking Sheet */}
      <Sheet open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-background/95 backdrop-blur-xl border-l border-white/10 p-0 overflow-y-auto">
          {selectedTrip && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-6 border-b border-white/10">
                <SheetTitle className="text-2xl font-display">{selectedTrip.operator}</SheetTitle>
                <SheetDescription className="flex justify-between items-center text-muted-foreground">
                  <span>{selectedTrip.source} → {selectedTrip.destination}</span>
                  <span className="text-primary font-bold">{selectedTrip.departureTime}</span>
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
                      <SeatMap 
                        tripId={selectedTrip.id} 
                        onSelectionChange={setSelectedSeats} 
                      />
                    </motion.div>
                  )}

                  {bookingStep === "auth" && (
                    <motion.div 
                      key="auth"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6 pt-10"
                    >
                      <div className="text-center space-y-2">
                         <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <Shield className="w-8 h-8" />
                         </div>
                         <h3 className="text-xl font-bold">Verify Identity</h3>
                         <p className="text-sm text-muted-foreground">Enter the OTP sent to +1 (555) ***-**99</p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-4">
                        <input 
                           type="text" 
                           placeholder="0000"
                           className="w-full text-center text-4xl tracking-[1em] font-mono bg-transparent border-b-2 border-white/20 focus:border-primary outline-none py-4 transition-colors"
                           maxLength={4}
                           value={otp}
                           onChange={(e) => setOtp(e.target.value)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Resend in 00:45</span>
                           <span className="text-primary cursor-pointer hover:underline">Resend</span>
                        </div>
                      </div>
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
                      <p className="text-muted-foreground max-w-xs">Your seats have been successfully reserved. A confirmation email has been sent.</p>
                      
                      <div className="w-full bg-white/5 rounded-xl p-4 mt-8 border border-white/10 text-left">
                         <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Trip ID</span>
                            <span className="font-mono">{selectedTrip.id}</span>
                         </div>
                         <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Seats</span>
                            <span>{selectedSeats.map(s => s.label).join(", ")}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="text-primary font-bold">${selectedSeats.reduce((a,b) => a + b.price, 0)}</span>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {bookingStep !== "success" && (
                <SheetFooter className="p-6 border-t border-white/10 flex-col gap-4 sm:flex-col">
                  {bookingStep === "seats" ? (
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{selectedSeats.length} seats selected</span>
                        <span className="text-xl font-bold font-display text-primary">
                          ${selectedSeats.reduce((acc, s) => acc + s.price, 0)}
                        </span>
                      </div>
                      <Button 
                        className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        disabled={selectedSeats.length === 0}
                        onClick={handleBook}
                      >
                        Proceed to Book
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      onClick={handleConfirmBooking}
                    >
                      Confirm Booking
                    </Button>
                  )}
                </SheetFooter>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
