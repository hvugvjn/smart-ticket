import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface PassengerDetails {
  gender: string;
  phone: string;
  idType: string;
  idNumber: string;
}

interface PassengerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (passenger: PassengerDetails) => Promise<void>;
  defaultPhone?: string;
}

const ID_TYPES = [
  "Aadhar Card",
  "Driving Licence",
  "Passport",
  "PAN Card",
  "Voter ID",
];

export function PassengerDetailsModal({ open, onClose, onSubmit, defaultPhone = "" }: PassengerDetailsModalProps) {
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalizePhone = (phoneInput: string): string => {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
      return `+${digits}`;
    }
    return `+91${digits.slice(-10)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!gender) {
      newErrors.gender = "Please select your gender";
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (phoneDigits.length < 10) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!idType) {
      newErrors.idType = "Please select an ID type";
    }

    if (!idNumber) {
      newErrors.idNumber = "ID number is required";
    } else if (idNumber.length < 4) {
      newErrors.idNumber = "ID number must be at least 4 characters";
    } else if (idType === "Aadhar Card" && !/^\d{12}$/.test(idNumber.replace(/\s/g, ""))) {
      newErrors.idNumber = "Aadhar must be 12 digits";
    } else if (idType === "PAN Card" && !/^[A-Z0-9]{10}$/i.test(idNumber)) {
      newErrors.idNumber = "PAN must be 10 alphanumeric characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const passenger: PassengerDetails = {
      gender,
      phone: normalizePhone(phone),
      idType,
      idNumber: idNumber.toUpperCase().replace(/\s/g, ""),
    };

    console.log("PASSENGER DETAILS SUBMIT", passenger);

    setIsSubmitting(true);
    try {
      await onSubmit(passenger);
      onClose();
    } catch (error) {
      console.error("Passenger submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = gender && phone.replace(/\D/g, "").length >= 10 && idType && idNumber.length >= 4;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display">Passenger Details</DialogTitle>
          <DialogDescription>
            Please provide your details for this booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Gender <span className="text-destructive">*</span></Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" data-testid="radio-gender-male" />
                <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" data-testid="radio-gender-female" />
                <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" data-testid="radio-gender-other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
            {errors.gender && <p className="text-destructive text-sm">{errors.gender}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/10 bg-muted text-muted-foreground text-sm">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone"
                value={phone.replace(/^\+?91/, "")}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="rounded-l-none"
                data-testid="input-phone"
              />
            </div>
            {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label>Government ID Type <span className="text-destructive">*</span></Label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger data-testid="select-id-type">
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`option-id-${type.toLowerCase().replace(/\s/g, "-")}`}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idType && <p className="text-destructive text-sm">{errors.idType}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number <span className="text-destructive">*</span></Label>
            <Input
              id="idNumber"
              placeholder="Enter your ID number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              data-testid="input-id-number"
            />
            {errors.idNumber && <p className="text-destructive text-sm">{errors.idNumber}</p>}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} data-testid="button-cancel-passenger">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-submit-passenger"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Booking"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
