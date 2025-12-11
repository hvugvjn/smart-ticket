/**
 * LocationSelect.tsx
 * Searchable dropdown for Indian city selection
 */
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Kochi",
  "Goa",
  "Varanasi",
  "Nagpur",
  "Surat",
  "Indore",
  "Bhubaneswar",
  "Mysore",
  "Amritsar",
  "Visakhapatnam",
];

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  excludeCity?: string;
}

export function LocationSelect({ value, onChange, placeholder = "Select city", excludeCity }: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  
  const filteredCities = excludeCity 
    ? INDIAN_CITIES.filter(city => city !== excludeCity)
    : INDIAN_CITIES;

  const handleChange = (city: string) => {
    console.log("LocationSelect onChange:", city);
    onChange(city);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 text-left font-normal h-12"
          data-testid="location-select"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className={cn(!value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-popover border-border z-50">
        <Command>
          <CommandInput placeholder="Search city..." className="h-10" />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => {
                    handleChange(city);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { INDIAN_CITIES };
