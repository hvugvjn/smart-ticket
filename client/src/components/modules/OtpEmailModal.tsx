/**
 * OtpEmailModal.tsx
 * Email-based OTP authentication modal
 */
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, KeyRound, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OtpEmailModal() {
  const { showOtpModal, setShowOtpModal, email, setEmail, login } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/request-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send OTP");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("otp");
      setAttempts(prev => prev + 1);
      setCooldown(60);
      toast({
        title: "OTP Sent",
        description: "Check your email inbox (and spam folder) for your 4-digit code",
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
    mutationFn: async () => {
      const res = await fetch("/api/auth/verify-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid OTP");
      }
      return res.json();
    },
    onSuccess: (data) => {
      login(data.token, { id: data.user.id, email: data.user.email });
      setStep("email");
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
    setStep("email");
    setOtp("");
  };

  const canResend = cooldown === 0 && attempts < 3;

  return (
    <Dialog open={showOtpModal} onOpenChange={handleClose}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-sm">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display">
            {step === "email" ? "Login to Continue" : "Verify OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to receive a verification code"
              : `Enter the 4-digit code sent to ${email}`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                <span>Max 3 requests per 10 minutes</span>
              </div>
              <Button
                data-testid="button-request-otp"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => requestOtpMutation.mutate()}
                disabled={requestOtpMutation.isPending || !email || attempts >= 3}
              >
                {requestOtpMutation.isPending ? "Sending..." : attempts >= 3 ? "Rate Limited" : "Send OTP"}
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
                  Check your email inbox and spam folder
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("email")}
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
              {cooldown > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Resend available in {cooldown}s
                </p>
              )}
              {canResend && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => requestOtpMutation.mutate()}
                  disabled={requestOtpMutation.isPending}
                >
                  Resend OTP
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
