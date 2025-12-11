/**
 * App.tsx
 * Modifications:
 * - Added AuthProvider for global authentication state
 * - Added OtpModal for login flow
 * - Added /my-trips route
 */
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { OtpModal } from "@/components/modules/OtpModal";
import NotFound from "@/pages/not-found";
import HomeConnected from "@/pages/home-connected";
import AdminConnected from "@/pages/admin-connected";
import MyTrips from "@/pages/my-trips";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeConnected} />
      <Route path="/admin" component={AdminConnected} />
      <Route path="/my-trips" component={MyTrips} />
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
          <OtpModal />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
