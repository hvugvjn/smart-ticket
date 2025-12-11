import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/currency";
import { Receipt, IndianRupee, Percent, Calculator } from "lucide-react";

interface FareBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  seatPrices: number[];
}

const PLATFORM_FEE = 40;
const GST_RATE = 0.18;

export function FareBreakdownModal({ open, onClose, seatPrices }: FareBreakdownModalProps) {
  const baseFareTotal = seatPrices.reduce((sum, price) => sum + price, 0);
  const seatsCount = seatPrices.length;
  const avgSeatPrice = seatsCount > 0 ? baseFareTotal / seatsCount : 0;
  const subtotal = baseFareTotal + PLATFORM_FEE;
  const gstAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + gstAmount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="glass-card border-white/10 sm:max-w-md" data-testid="modal-fare-breakdown">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <Receipt className="w-5 h-5 text-primary" />
            Fare Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Seat Fares ({seatsCount} seat{seatsCount !== 1 ? 's' : ''})</span>
              </div>
              <div className="text-right">
                {seatsCount > 1 ? (
                  <>
                    <p className="font-medium">{formatINR(baseFareTotal)}</p>
                    <p className="text-xs text-muted-foreground">avg {formatINR(avgSeatPrice)}/seat</p>
                  </>
                ) : (
                  <p className="font-medium">{formatINR(baseFareTotal)}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Platform Fee</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatINR(PLATFORM_FEE)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">GST (18%)</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatINR(gstAmount)}</p>
                <p className="text-xs text-muted-foreground">on {formatINR(subtotal)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 bg-primary/10 rounded-xl px-4 -mx-2">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary" data-testid="text-fare-total">
              {formatINR(grandTotal)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            All prices are inclusive of applicable taxes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function calculateFareBreakdown(seatPrices: number[]) {
  const baseFareTotal = seatPrices.reduce((sum, price) => sum + price, 0);
  const seatsCount = seatPrices.length;
  const subtotal = baseFareTotal + PLATFORM_FEE;
  const gstAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + gstAmount;
  
  return {
    seatsCount,
    baseFareTotal,
    platformFee: PLATFORM_FEE,
    subtotal,
    gstRate: GST_RATE,
    gstAmount,
    grandTotal,
  };
}

export function calculateFareFromBasePrice(basePrice: number, seatsCount: number = 1) {
  const seatPrices = Array(seatsCount).fill(basePrice);
  return calculateFareBreakdown(seatPrices);
}
