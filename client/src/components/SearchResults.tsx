import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/currency";
import { Wifi, Coffee, Battery, ArrowRight, Star, Users, Bus, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { MapMock } from "@/components/MapMock";
import { calculateFareFromBasePrice } from "@/components/FareBreakdownModal";

interface Trip {
  id: number;
  operatorName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  vehicleType: string;
  rating: string;
  totalSeats: number;
  amenities: string[];
}

interface SearchResultsProps {
  results: Trip[];
  from: string;
  to: string;
  date?: string;
  isLoading?: boolean;
}

export function SearchResults({ results, from, to, date, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 glass-card rounded-2xl">
        <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-bold mb-2">No buses available</h3>
        <p className="text-muted-foreground mb-4">
          No buses found for {from} → {to}
          {date && ` on ${format(parseISO(date), "PPP")}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Try different dates or cities
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {results.length} bus{results.length !== 1 ? "es" : ""} found
        </h3>
        <p className="text-sm text-muted-foreground">
          {from} → {to} {date && `• ${format(parseISO(date), "PP")}`}
        </p>
      </div>

      {results.map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group glass-card rounded-2xl p-6 relative overflow-hidden"
          data-testid={`search-result-${trip.id}`}
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
                <span className="flex items-center text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                  <Star className="w-3 h-3 mr-1 fill-amber-400" /> {trip.rating}
                </span>
                <span className="flex items-center text-xs text-muted-foreground">
                  <Users className="w-3 h-3 mr-1" /> {trip.totalSeats} seats
                </span>
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
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Total: {formatINR(calculateFareFromBasePrice(parseFloat(trip.price), 1).grandTotal)}
              </p>
              <Link href={`/booking/${trip.id}`}>
                <Button
                  data-testid={`view-seats-${trip.id}`}
                  className="w-full bg-white/10 hover:bg-primary hover:text-primary-foreground text-foreground border border-white/10 transition-all duration-300"
                >
                  View Seats
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <MapMock
              departureTime={trip.departureTime}
              arrivalTime={trip.arrivalTime}
              source={trip.source}
              destination={trip.destination}
              compact
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 overflow-x-auto pb-2">
            {trip.amenities.map((a) => (
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
  );
}
