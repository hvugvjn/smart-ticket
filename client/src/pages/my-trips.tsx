import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { api, type EnrichedBooking } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  XCircle,
  Calendar,
  Bus,
  Ticket
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function MyTripsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, currentUser, setShowOtpModal } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["userBookings", currentUser?.id],
    queryFn: () => api.getUserBookings(String(currentUser?.id)),
    enabled: isAuthenticated && !!currentUser?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm">
            <CheckCircle2 className="w-4 h-4" /> {t("ticket.confirmed")}
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" /> {t("ticket.pending")}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-sm">
            <XCircle className="w-4 h-4" /> {t("ticket.cancelled")}
          </span>
        );
      case "EXPIRED":
        return (
          <span className="flex items-center gap-1 text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" /> {t("ticket.expired")}
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
          <h1 className="text-2xl font-display font-bold mb-4">{t("auth.loginRequired")}</h1>
          <p className="text-muted-foreground mb-6">{t("auth.loginDesc")}</p>
          <Button onClick={() => setShowOtpModal(true)} className="bg-primary hover:bg-primary/90">
            {t("auth.loginNow")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="main-content max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8">{t("myTrips.title")}</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t("myTrips.noTrips")}</h3>
            <p className="text-muted-foreground mb-6">{t("myTrips.noTripsDesc")}</p>
            <Link href="/">
              <Button>{t("myTrips.bookFirst")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <Link href={`/my-trips/${booking.id}`} key={booking.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition-colors"
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

                <div className="flex items-center justify-end mt-4 text-sm text-primary">
                  {t("ticket.viewDetails")} <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
