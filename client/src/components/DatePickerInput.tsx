/**
 * DatePickerInput.tsx
 * Calendar date picker with 6-month future limit
 * Uses local date formatting to avoid timezone issues
 */
import { useState } from "react";
import { format, addMonths, startOfToday } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toLocalISO } from "@/utils/dateLocal";

interface DatePickerInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePickerInput({ value, onChange, placeholder = "Pick a date" }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const today = startOfToday();
  const maxDate = addMonths(today, 6);

  const handleChange = (date: Date | undefined) => {
    if (date) {
      console.log("DatePickerInput onChange (local):", toLocalISO(date));
    }
    onChange(date);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10 h-12",
            !value && "text-muted-foreground"
          )}
          data-testid="date-picker"
          aria-label="Select travel date"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            handleChange(date);
            setOpen(false);
          }}
          disabled={(date) => date < today || date > maxDate}
          initialFocus
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
}
