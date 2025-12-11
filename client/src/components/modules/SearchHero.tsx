/**
 * SearchHero.tsx
 * Modifications:
 * - Replaced text inputs with LocationSelect dropdown for Indian cities
 * - Updated date picker with proper constraints
 * - Changed default placeholders to Indian cities
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { LocationSelect } from "@/components/LocationSelect";
import { DatePickerInput } from "@/components/DatePickerInput";

export function SearchHero({ onSearch }: { onSearch: (data: any) => void }) {
  const [date, setDate] = useState<Date>();
  const [from, setFrom] = useState("Mumbai");
  const [to, setTo] = useState("Bengaluru");

  const handleSearch = () => {
    console.log("SEARCH", { from, to, date: date?.toISOString().split('T')[0] });
    onSearch({ from, to, date });
  };

  return (
    <div className="w-full max-w-5xl mx-auto -mt-24 relative z-10 px-4">
      <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-4 items-end shadow-2xl shadow-primary/10">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* FROM */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">FROM</label>
            <LocationSelect
              value={from}
              onChange={setFrom}
              placeholder="Select departure city"
              excludeCity={to}
            />
          </div>

          {/* TO */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">TO</label>
            <LocationSelect
              value={to}
              onChange={setTo}
              placeholder="Select destination city"
              excludeCity={from}
            />
          </div>

          {/* DATE */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">DATE</label>
            <DatePickerInput
              value={date}
              onChange={setDate}
              placeholder="Pick a date"
            />
          </div>
        </div>

        {/* SEARCH BUTTON */}
        <Button 
          size="lg" 
          className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 w-full md:w-auto"
          onClick={handleSearch}
        >
          <Search className="mr-2 h-5 w-5" />
          SEARCH
        </Button>
      </div>
    </div>
  );
}
