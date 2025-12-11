import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/currency";
import { Receipt, IndianRupee, Percent, Calculator, Sparkles } from "lucide-react";

interface SeatInfo {
  price: number;
  classType: "ECONOMY" | "BUSINESS";
}

interface FareBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  seatPrices: number[];
  seatInfos?: SeatInfo[];
}

const PLATFORM_FEE = 40;
const ECONOMY_GST_RATE = 0.05;
const BUSINESS_GST_RATE = 0.12;
const SERVICE_GST_RATE = 0.18;

export function FareBreakdownModal({ open, onClose, seatPrices, seatInfos }: FareBreakdownModalProps) {
  const breakdown = seatInfos 
    ? calculateFareBreakdownWithClass(seatInfos)
    : calculateFareBreakdown(seatPrices);

  const seatsCount = seatInfos?.length || seatPrices.length;
  const avgSeatPrice = seatsCount > 0 ? breakdown.baseFareTotal / seatsCount : 0;
  const hasBusiness = seatInfos?.some(s => s.classType === "BUSINESS");

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
                <span className="text-muted-foreground">
                  Seat Fares ({seatsCount} seat{seatsCount !== 1 ? 's' : ''})
                  {hasBusiness && <Sparkles className="w-3 h-3 inline ml-1 text-amber-400" />}
                </span>
              </div>
              <div className="text-right">
                {seatsCount > 1 ? (
                  <>
                    <p className="font-medium">{formatINR(breakdown.baseFareTotal)}</p>
                    <p className="text-xs text-muted-foreground">avg {formatINR(avgSeatPrice)}/seat</p>
                  </>
                ) : (
                  <p className="font-medium">{formatINR(breakdown.baseFareTotal)}</p>
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

            <div className="py-2 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">GST Breakdown</span>
              </div>
              
              <div className="ml-6 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Fare GST ({breakdown.economyCount > 0 && breakdown.businessCount > 0 
                      ? 'mixed rates' 
                      : hasBusiness ? '12%' : '5%'})
                  </span>
                  <span>{formatINR(breakdown.gst.baseGST)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee GST (18%)</span>
                  <span>{formatINR(breakdown.gst.serviceGST)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t border-white/5">
                  <span className="text-muted-foreground">Total GST</span>
                  <span className="text-primary">{formatINR(breakdown.gst.totalGST)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 bg-primary/10 rounded-xl px-4 -mx-2">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary" data-testid="text-fare-total">
              {formatINR(breakdown.grandTotal)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            GST: Economy 5% | Business 12% | Service Fee 18%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface FareBreakdownResult {
  seatsCount: number;
  baseFareTotal: number;
  platformFee: number;
  economyCount: number;
  businessCount: number;
  gst: {
    baseGST: number;
    serviceGST: number;
    totalGST: number;
  };
  grandTotal: number;
}

export function calculateFareBreakdownWithClass(seatInfos: SeatInfo[]): FareBreakdownResult {
  const economySeats = seatInfos.filter(s => s.classType === "ECONOMY");
  const businessSeats = seatInfos.filter(s => s.classType === "BUSINESS");
  
  const economyTotal = economySeats.reduce((sum, s) => sum + s.price, 0);
  const businessTotal = businessSeats.reduce((sum, s) => sum + s.price, 0);
  const baseFareTotal = economyTotal + businessTotal;
  
  const economyGST = Math.round(economyTotal * ECONOMY_GST_RATE);
  const businessGST = Math.round(businessTotal * BUSINESS_GST_RATE);
  const baseGST = economyGST + businessGST;
  const serviceGST = Math.round(PLATFORM_FEE * SERVICE_GST_RATE);
  const totalGST = baseGST + serviceGST;
  
  const grandTotal = baseFareTotal + PLATFORM_FEE + totalGST;
  
  return {
    seatsCount: seatInfos.length,
    baseFareTotal,
    platformFee: PLATFORM_FEE,
    economyCount: economySeats.length,
    businessCount: businessSeats.length,
    gst: {
      baseGST,
      serviceGST,
      totalGST,
    },
    grandTotal,
  };
}

export function calculateFareBreakdown(seatPrices: number[]): FareBreakdownResult {
  const seatInfos: SeatInfo[] = seatPrices.map(price => ({
    price,
    classType: "ECONOMY" as const,
  }));
  return calculateFareBreakdownWithClass(seatInfos);
}

export function calculateFareFromBasePrice(basePrice: number, seatsCount: number = 1, classType: "ECONOMY" | "BUSINESS" = "ECONOMY") {
  const seatInfos: SeatInfo[] = Array(seatsCount).fill({ price: basePrice, classType });
  return calculateFareBreakdownWithClass(seatInfos);
}
