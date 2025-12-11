/**
 * SupportModal.tsx
 * Modifications:
 * - Created new Support modal with contact form
 * - Includes mailto fallback for email support
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Send } from "lucide-react";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In production, this would send to backend
    toast({
      title: "Message Sent",
      description: "Our support team will get back to you within 24 hours.",
    });
    
    setEmail("");
    setSubject("");
    setMessage("");
    onOpenChange(false);
  };

  const handleEmailFallback = () => {
    const mailtoLink = `mailto:support@nextravel.com?subject=${encodeURIComponent(subject || "Support Request")}&body=${encodeURIComponent(message || "")}`;
    window.open(mailtoLink, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display text-center">Contact Support</DialogTitle>
          <DialogDescription className="text-center">
            We're here to help! Send us a message and we'll respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="support-email">Your Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="support-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-subject">Subject</Label>
            <Input
              id="support-subject"
              placeholder="How can we help?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              placeholder="Describe your issue or question..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleEmailFallback}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Instead
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
