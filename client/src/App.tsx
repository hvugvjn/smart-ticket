/**
 * App.tsx
 * Modifications:
 * - Uses OtpEmailModal instead of OtpModal (phone-based)
 */
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { OtpEmailModal } from "@/components/modules/OtpEmailModal";
import NotFound from "@/pages/not-found";
import HomeConnected from "@/pages/home-connected";
import AdminConnected from "@/pages/admin-connected";
import MyTrips from "@/pages/my-trips";
import TripDetails from "@/pages/trip-details";
import BookingPage from "@/pages/booking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeConnected} />
      <Route path="/admin" component={AdminConnected} />
      <Route path="/my-trips" component={MyTrips} />
      <Route path="/my-trips/:bookingId" component={TripDetails} />
      <Route path="/booking/:id" component={BookingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <OtpEmailModal />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
