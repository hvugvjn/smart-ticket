/**
 * LocationSelect.tsx
 * Searchable dropdown for Indian city selection with voice search
 */
import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, MapPin, Mic } from "lucide-react";
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
import { toast } from "sonner";

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

// Synonyms and alternate pronunciations for voice recognition
const CITY_SYNONYMS: Record<string, string[]> = {
  "Mumbai": ["bombay", "mumbai"],
  "Delhi": ["delhi", "new delhi", "dilli"],
  "Bengaluru": ["bangalore", "bengaluru", "bengalore"],
  "Chennai": ["chennai", "madras"],
  "Kolkata": ["kolkata", "calcutta"],
  "Hyderabad": ["hyderabad"],
  "Pune": ["pune", "poona"],
  "Ahmedabad": ["ahmedabad", "amdavad"],
  "Jaipur": ["jaipur"],
  "Lucknow": ["lucknow", "lakhnau"],
  "Kochi": ["kochi", "cochin"],
  "Goa": ["goa"],
  "Varanasi": ["varanasi", "banaras", "benares", "kashi"],
  "Nagpur": ["nagpur"],
  "Surat": ["surat"],
  "Indore": ["indore"],
  "Bhubaneswar": ["bhubaneswar", "bhubaneshwar"],
  "Mysore": ["mysore", "mysuru"],
  "Amritsar": ["amritsar"],
  "Visakhapatnam": ["visakhapatnam", "vizag", "vishakhapatnam"],
};

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Match city using synonyms and Levenshtein distance
function matchCity(transcript: string): string | null {
  const cleaned = transcript.toLowerCase().replace(/[^\w\s]/g, "");
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  // First try exact synonym match in full transcript
  for (const [city, synonyms] of Object.entries(CITY_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (cleaned.includes(synonym)) {
        return city;
      }
    }
  }
  
  // Try Levenshtein distance matching on each word against synonyms
  // Allow up to 2 character differences for words 5+ chars
  let bestMatch: { city: string; distance: number } | null = null;
  
  for (const word of words) {
    if (word.length < 4) continue;
    
    for (const [city, synonyms] of Object.entries(CITY_SYNONYMS)) {
      for (const synonym of synonyms) {
        const distance = levenshtein(word, synonym);
        const threshold = Math.floor(synonym.length / 3); // ~33% tolerance
        
        if (distance <= threshold) {
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { city, distance };
          }
        }
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch.city;
  }
  
  // Final fallback: partial match on city name prefixes
  for (const city of INDIAN_CITIES) {
    const cityLower = city.toLowerCase();
    for (const word of words) {
      if (word.length >= 4 && (cityLower.startsWith(word.slice(0, 4)) || word.startsWith(cityLower.slice(0, 4)))) {
        return city;
      }
    }
  }
  
  return null;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  excludeCity?: string;
}

export function LocationSelect({ value, onChange, placeholder = "Select city", excludeCity }: LocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const filteredCities = excludeCity 
    ? INDIAN_CITIES.filter(city => city !== excludeCity)
    : INDIAN_CITIES;

  const handleChange = (city: string) => {
    console.log("LocationSelect onChange:", city);
    onChange(city);
  };

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Voice search not supported on this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("[voice] Recognized:", transcript);
      
      const matchedCity = matchCity(transcript);
      
      if (matchedCity) {
        handleChange(matchedCity);
        setOpen(false);
        toast.success(`Selected: ${matchedCity}`);
      } else {
        toast.error(`Heard "${transcript}". Try saying a city name like "Mumbai" or "Bangalore".`);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      toast.error("Couldn't understand. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startVoiceSearch();
              }}
              className={cn(
                "p-1 rounded-full hover:bg-primary/20 transition-colors",
                isListening && "animate-pulse bg-primary/30"
              )}
              data-testid="voice-search-btn"
              aria-label="Voice search"
            >
              <Mic className={cn("h-4 w-4", isListening ? "text-primary" : "text-muted-foreground")} />
            </button>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
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
