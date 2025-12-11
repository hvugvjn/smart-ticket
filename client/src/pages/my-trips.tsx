/**
 * my-trips.tsx
 * Modifications:
 * - Updated for email-based authentication
 * - Added INR currency formatting
 */
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { format } from "date-fns";
import { Ticket, Calendar, MapPin, ArrowRight, CheckCircle2, XCircle, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/currency";

interface BookingRecord {
  id: number;
  showId: number;
  seatIds: number[];
  status: string;
  totalAmount: string;
  createdAt: string;
  tripDetails?: {
    operatorName: string;
    source: string;
    destination: string;
    departureTime: string;
  };
}

export default function MyTrips() {
  const { isAuthenticated, currentUser, setShowOtpModal } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowOtpModal(true);
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?userId=${currentUser?.email}`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        } else {
          const mockBookings = localStorage.getItem("userBookings");
          if (mockBookings) {
            setBookings(JSON.parse(mockBookings));
          }
        }
      } catch {
        const mockBookings = localStorage.getItem("userBookings");
        if (mockBookings) {
          setBookings(JSON.parse(mockBookings));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, currentUser]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Timer className="w-5 h-5 text-amber-500" />;
      case "EXPIRED":
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Ticket className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "EXPIRED":
      case "CANCELLED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-display font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login to view your trips</p>
          <Button onClick={() => setShowOtpModal(true)} className="bg-primary hover:bg-primary/90">
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-24 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">My Trips</h1>
          <p className="text-muted-foreground">View your booking history and upcoming journeys</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="glass-card border-white/5 text-center py-12">
            <CardContent>
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Trips Yet</h2>
              <p className="text-muted-foreground mb-6">You haven't booked any trips yet</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  Book Your First Trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card border-white/5">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(booking.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {booking.tripDetails?.operatorName || `Trip #${booking.showId}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3" />
                          {booking.tripDetails ? (
                            <>
                              {booking.tripDetails.source}
                              <ArrowRight className="w-3 h-3" />
                              {booking.tripDetails.destination}
                            </>
                          ) : (
                            `Trip ID: ${booking.showId}`
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Booked On
                        </p>
                        <p className="font-medium">{format(new Date(booking.createdAt), "PPP")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Ticket className="w-3 h-3" /> Seats
                        </p>
                        <p className="font-medium">{booking.seatIds.length} seat(s)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Paid</p>
                        <p className="font-medium text-primary">{formatINR(booking.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booking ID</p>
                        <p className="font-mono text-xs">{booking.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
