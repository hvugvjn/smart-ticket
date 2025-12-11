import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { MapMini } from "@/components/MapMini";
import { LiveMapOverlay } from "@/components/LiveMapOverlay";
import { MapSkeleton } from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { 
  ArrowRight, 
  ArrowLeft,
  Download, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  Bus,
  Radio,
  MapPin,
  User
} from "lucide-react";
import { motion } from "framer-motion";

export default function TripDetailsPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/my-trips/:bookingId");
  const [, setLocation] = useLocation();
  const bookingId = parseInt(params?.bookingId || "0", 10);
  
  const { isAuthenticated, currentUser, setShowOtpModal } = useAuth();
  const queryClient = useQueryClient();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refundPreview, setRefundPreview] = useState<{ amount: number; reason: string } | null>(null);
  const [showLiveMap, setShowLiveMap] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api.getBooking(bookingId),
    enabled: bookingId > 0,
  });

  const show = booking?.show;

  const { data: routeData, isLoading: isRouteLoading } = useQuery({
    queryKey: ["route", show?.id],
    queryFn: () => api.getTripRoute(show?.id || 0),
    enabled: !!show?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => api.cancelBooking(bookingId),
    onSuccess: (result) => {
      toast({
        title: t("cancel.success"),
        description: `${t("cancel.refundAmount")}: ${formatINR(result.refundAmount)}`,
        className: "bg-green-500/10 border-green-500/20 text-green-500"
      });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      setShowCancelModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("cancel.failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelClick = () => {
    if (!booking || !show) return;
    
    const departureTime = new Date(show.departureTime).getTime();
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
    setShowCancelModal(true);
  };

  const handleDownloadTicket = () => {
    window.open(api.getTicketUrl(bookingId), '_blank');
  };

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
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="main-content max-w-4xl mx-auto px-4 py-20 text-center">
          <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">{t("auth.loginRequired")}</h1>
          <p className="text-muted-foreground mb-6">{t("auth.loginDesc")}</p>
          <Button onClick={() => setShowOtpModal(true)} className="bg-primary hover:bg-primary/90">
            {t("auth.loginNow")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="main-content max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="main-content max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500/50 mb-4" />
          <h1 className="text-2xl font-display font-bold mb-4">{t("errors.bookingNotFound")}</h1>
          <p className="text-muted-foreground mb-6">{t("errors.tryAgain")}</p>
          <Button onClick={() => setLocation("/my-trips")}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="main-content max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => setLocation("/my-trips")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Trips
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-mono text-2xl font-bold">#{booking.id}</p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            {show && (
              <>
                <div className="mb-6">
                  <h3 className="font-bold text-xl">{show.operatorName}</h3>
                  <p className="text-muted-foreground">{show.vehicleType}</p>
                </div>

                <div className="flex items-center gap-4 py-6 border-t border-b border-white/10">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {format(parseISO(show.departureTime), "HH:mm")}
                    </p>
                    <p className="text-sm text-muted-foreground">{show.source}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-1">{show.duration}</p>
                    <div className="w-full h-[2px] bg-white/20 relative">
                      <ArrowRight className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {format(parseISO(show.arrivalTime), "HH:mm")}
                    </p>
                    <p className="text-sm text-muted-foreground">{show.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6 border-b border-white/10">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Travel Date</p>
                      <p className="font-medium">{format(parseISO(show.departureTime), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Seats</p>
                      <p className="font-medium">
                        {booking.seats?.map(s => s.seatNumber).join(", ") || booking.seatIds?.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="flex items-center justify-between py-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                    <p className="text-3xl font-bold text-primary">{formatINR(booking.totalAmount)}</p>
                  </div>
                </div>
              </>
            )}

            {booking.refund && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-lg text-green-500 font-medium">Refund: {formatINR(booking.refund.amount)}</p>
                <p className="text-sm text-muted-foreground">{booking.refund.reason}</p>
              </div>
            )}
          </div>

          {booking.status === "CONFIRMED" && (
            <>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-green-500 animate-pulse" />
                  {t("myTrips.liveTracking")}
                </h3>
                
                {isRouteLoading ? (
                  <MapSkeleton />
                ) : routeData ? (
                  <div className="space-y-4">
                    <MapMini
                      pickup={routeData.pickup}
                      drop={routeData.drop}
                      stops={routeData.stops || []}
                    />
                    <Button
                      className="w-full bg-primary/20 border border-primary/50 hover:bg-primary/30"
                      onClick={() => setShowLiveMap(true)}
                      data-testid="button-track-live"
                    >
                      <Radio className="w-4 h-4 mr-2 text-green-500 animate-pulse" />
                      {t("ticket.track")}
                    </Button>
                  </div>
                ) : (
                  <div className="h-[220px] rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                    <p>{t("myTrips.routeMap")}</p>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">{t("myTrips.ticketActions")}</h3>
                <div className="flex gap-4">
                  <Button
                    className="flex-1"
                    onClick={handleDownloadTicket}
                    data-testid="button-download-ticket"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("ticket.downloadPdf")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={handleCancelClick}
                    data-testid="button-cancel-booking"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {t("ticket.cancelTicket")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="glass-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              {t("cancel.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              {t("cancel.confirmation")}
            </p>

            {refundPreview && (
              <div className="p-4 bg-white/5 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cancel.refundAmount")}</span>
                  <span className="text-xl font-bold text-green-500">{formatINR(refundPreview.amount)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{refundPreview.reason}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              {t("cancel.cancellationFee")}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              {t("cancel.keepBooking")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(bookingId)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t("cancel.cancelling") : t("cancel.confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLiveMap && routeData && show && (
        <LiveMapOverlay
          tripId={show.id}
          pickup={routeData.pickup}
          drop={routeData.drop}
          stops={routeData.stops || []}
          onClose={() => setShowLiveMap(false)}
        />
      )}
    </div>
  );
}
