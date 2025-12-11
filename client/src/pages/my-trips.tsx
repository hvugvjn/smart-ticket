import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api, type EnrichedBooking } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { 
  ArrowRight, 
  Download, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  Bus,
  Ticket
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function MyTripsPage() {
  const { isAuthenticated, currentUser, setShowOtpModal } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingBooking, setCancellingBooking] = useState<EnrichedBooking | null>(null);
  const [refundPreview, setRefundPreview] = useState<{ amount: number; reason: string } | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["userBookings", currentUser?.id],
    queryFn: () => api.getUserBookings(String(currentUser?.id)),
    enabled: isAuthenticated && !!currentUser?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => api.cancelBooking(bookingId),
    onSuccess: (result) => {
      console.log('BOOKING_CANCEL', result.bookingId, { refundAmount: result.refundAmount, status: 'CANCELLED' });
      toast({
        title: "Booking Cancelled",
        description: `Refund of ${formatINR(result.refundAmount)} has been processed.`,
        className: "bg-green-500/10 border-green-500/20 text-green-500"
      });
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      setCancellingBooking(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelClick = (booking: EnrichedBooking) => {
    if (!booking.show) return;
    
    const departureTime = new Date(booking.show.departureTime).getTime();
    const now = Date.now();
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
    
    const totalAmount = parseFloat(booking.totalAmount);
    const cancellationFee = 50;
    let refundAmount: number;
    let reason: string;
    
    if (hoursUntilDeparture < 2) {
      refundAmount = 0;
      reason = "Non-refundable (less than 2 hours before departure)";
    } else if (hoursUntilDeparture < 24) {
      refundAmount = Math.max(0, (totalAmount * 0.5) - cancellationFee);
      reason = "Partial refund (less than 24 hours before departure)";
    } else {
      refundAmount = Math.max(0, totalAmount - cancellationFee);
      reason = "Full refund (more than 24 hours before departure)";
    }
    
    setRefundPreview({ amount: refundAmount, reason });
    setCancellingBooking(booking);
  };

  const handleDownloadTicket = (bookingId: number) => {
    window.open(api.getTicketUrl(bookingId), '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm">
            <CheckCircle2 className="w-4 h-4" /> Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" /> Pending
          </span>
        );
      case "CANCELLED":
        return (
          <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-sm">
            <XCircle className="w-4 h-4" /> Cancelled
          </span>
        );
      case "EXPIRED":
        return (
          <span className="flex items-center gap-1 text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" /> Expired
          </span>
        );
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="main-content max-w-4xl mx-auto px-4 py-20 text-center">
          <Ticket className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login to view your trips.</p>
          <Button onClick={() => setShowOtpModal(true)} className="bg-primary hover:bg-primary/90">
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="main-content max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8">My Trips</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-6">You haven't booked any trips yet.</p>
            <Link href="/">
              <Button>Book Your First Trip</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-2xl p-6"
                data-testid={`booking-card-${booking.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-mono text-lg font-bold">#{booking.id}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {booking.show && (
                  <>
                    <div className="mb-4">
                      <h3 className="font-bold text-lg">{booking.show.operatorName}</h3>
                      <p className="text-sm text-muted-foreground">{booking.show.vehicleType}</p>
                    </div>

                    <div className="flex items-center gap-4 py-4 border-t border-b border-white/10">
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {format(parseISO(booking.show.departureTime), "HH:mm")}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.show.source}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <p className="text-xs text-muted-foreground mb-1">{booking.show.duration}</p>
                        <div className="w-full h-[2px] bg-white/20 relative">
                          <ArrowRight className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {format(parseISO(booking.show.arrivalTime), "HH:mm")}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.show.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(booking.show.departureTime), "EEEE, MMMM d, yyyy")}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">
                      {booking.seats?.map(s => s.seatNumber).join(", ") || booking.seatIds?.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">{formatINR(booking.totalAmount)}</p>
                  </div>
                </div>

                {booking.refund && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-500 font-medium">Refund: {formatINR(booking.refund.amount)}</p>
                    <p className="text-xs text-muted-foreground">{booking.refund.reason}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {booking.status === "CONFIRMED" && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadTicket(booking.id)}
                        data-testid={`button-download-ticket-${booking.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Ticket
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleCancelClick(booking)}
                        data-testid={`button-cancel-booking-${booking.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!cancellingBooking} onOpenChange={(open) => !open && setCancellingBooking(null)}>
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Cancel Booking
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Are you sure you want to cancel booking <span className="font-mono font-bold">#{cancellingBooking?.id}</span>?
            </p>

            {refundPreview && (
              <div className="p-4 bg-white/5 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="text-xl font-bold text-green-500">{formatINR(refundPreview.amount)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{refundPreview.reason}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              A cancellation fee of ₹50 is applicable.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancellingBooking(null)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancellingBooking && cancelMutation.mutate(cancellingBooking.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
