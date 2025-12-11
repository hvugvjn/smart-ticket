/**
 * OtpModal.tsx
 * Modifications:
 * - Created new OTP login modal component
 * - Handles phone input, OTP request, and verification
 * - Integrates with AuthContext to complete login flow
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Shield, Phone, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OtpModal() {
  const { showOtpModal, setShowOtpModal, phoneNumber, setPhoneNumber, login } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  const requestOtpMutation = useMutation({
    mutationFn: () => api.requestOtp(phoneNumber),
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check the server logs for your 4-digit code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => api.verifyOtp(phoneNumber, otp),
    onSuccess: (data) => {
      login(data.token, data.user);
      setStep("phone");
      setOtp("");
      toast({
        title: "Login Successful",
        description: "You can now proceed with your booking",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setShowOtpModal(false);
    setStep("phone");
    setOtp("");
  };

  return (
    <Dialog open={showOtpModal} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-sm">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display">
            {step === "phone" ? "Login to Continue" : "Verify OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "Enter your phone number to receive a verification code"
              : `Enter the 4-digit code sent to ${phoneNumber}`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    placeholder="+1 555 123 4567"
                    className="pl-10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
              <Button
                data-testid="button-request-otp"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => requestOtpMutation.mutate()}
                disabled={requestOtpMutation.isPending || !phoneNumber}
              >
                {requestOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    data-testid="input-otp-modal"
                    placeholder="0000"
                    className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Check server logs for your OTP code
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("phone")}
                >
                  Back
                </Button>
                <Button
                  data-testid="button-verify-otp"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => verifyOtpMutation.mutate()}
                  disabled={verifyOtpMutation.isPending || otp.length < 4}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
