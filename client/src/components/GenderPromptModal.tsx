import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

interface GenderPromptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (gender: string) => void;
  isLoading?: boolean;
}

export function GenderPromptModal({ open, onClose, onSave, isLoading }: GenderPromptModalProps) {
  const [gender, setGender] = useState<string>("");

  const handleSave = () => {
    if (gender) {
      onSave(gender);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Help us personalize your experience by sharing your gender (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-full bg-white/5 border-white/10" data-testid="select-gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!gender || isLoading}
            className="flex-1 bg-primary hover:bg-primary/90"
            data-testid="button-save-gender"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
