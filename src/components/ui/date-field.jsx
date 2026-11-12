import React, { useEffect, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// A real date field: the day can be picked from the calendar OR typed by hand
// (DD/MM/YYYY), and nothing is ever pre-filled or fixed. The stored value is
// always an ISO date ("yyyy-MM-dd") — the format the patient records use.
const ISO = "yyyy-MM-dd";
const DISPLAY = "dd/MM/yyyy";
const ACCEPTED = [DISPLAY, "d/M/yyyy", ISO, "dd-MM-yyyy", "d-M-yyyy"];

export function parseDateText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  for (const pattern of ACCEPTED) {
    const parsed = parse(raw, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

export default function DateField({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  minYear = 1900,
  maxYear,
  disableFuture = false,
  className,
  disabled,
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const upperYear = maxYear || new Date().getFullYear() + 1;
  const selected = parseDateText(value);

  useEffect(() => {
    const parsed = parseDateText(value);
    setText(parsed ? format(parsed, DISPLAY) : "");
  }, [value]);

  const isAllowed = (parsed) => {
    if (!parsed) return false;
    const year = parsed.getFullYear();
    if (year < minYear || year > upperYear) return false;
    if (disableFuture && parsed > new Date()) return false;
    return true;
  };

  const commit = (raw) => {
    setText(raw);
    if (!raw.trim()) {
      if (value) onChange("");
      return;
    }
    const parsed = parseDateText(raw);
    if (!isAllowed(parsed)) return;
    const iso = format(parsed, ISO);
    if (iso !== value) onChange(iso);
  };

  const restore = () => {
    if (!text.trim()) {
      if (value) onChange("");
      return;
    }
    // An unreadable or out-of-range date is never saved silently — the last
    // valid value stays.
    if (!isAllowed(parseDateText(text))) {
      setText(selected ? format(selected, DISPLAY) : "");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          id={id}
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={restore}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          className={cn("pe-9", className)}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Open calendar"
            className="absolute end-1 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          defaultMonth={selected || new Date()}
          captionLayout="dropdown"
          fromYear={minYear}
          toYear={upperYear}
          disabled={disableFuture ? { after: new Date() } : undefined}
          onSelect={(day) => {
            onChange(day ? format(day, ISO) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}