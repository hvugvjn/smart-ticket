import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function SearchHero({ onSearch }: { onSearch: (data: any) => void }) {
  const [date, setDate] = useState<Date>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSearch = () => {
    onSearch({ from, to, date });
  };

  return (
    <div className="w-full max-w-5xl mx-auto -mt-24 relative z-10 px-4">
      <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-4 items-end shadow-2xl shadow-primary/10">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* FROM */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">FROM</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="New York" 
                className="pl-9 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-lg"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>

          {/* TO */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">TO</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Boston" 
                className="pl-9 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-lg"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* DATE */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">DATE</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all text-lg",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-card text-foreground"
                />
              </PopoverContent>
            </Popover>
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
