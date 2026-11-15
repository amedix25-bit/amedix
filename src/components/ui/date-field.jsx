import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { displayFromIso, isRealDate, isoFromParts, isoParts, todayIso } from "@/lib/dateOnly";

// Groups typed digits into DD/MM/YYYY as the patient types, so a phone
// number-pad — which has no "/" key — is enough to enter any date.
function formatDigits(raw) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// The portal's one date field. The patient can pick a day from the calendar or
// type it on the keypad, and can always come back to change, replace or clear
// it. The saved value is always a date-only ISO string ("YYYY-MM-DD") and the
// shown value is always DD/MM/YYYY, so the date displayed is exactly the date
// saved — no timezone can shift it. Impossible dates (31/02, 32/13) are
// rejected and never saved.
export default function DateField({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  minYear = 1900,
  maxYear,
  minDate,
  maxDate,
  disableFuture = false,
  className,
  disabled,
}) {
  const [text, setText] = useState(() => displayFromIso(value));
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const lastValid = useRef(value || "");
  const upperYear = maxYear || new Date().getFullYear() + 1;

  useEffect(() => {
    setText(displayFromIso(value));
    setInvalid(false);
    if (value) lastValid.current = value;
  }, [value]);

  const inRange = (iso) => {
    const parts = isoParts(iso);
    if (!parts) return false;
    if (parts.year < minYear || parts.year > upperYear) return false;
    if (disableFuture && iso > todayIso()) return false;
    if (minDate && iso < minDate) return false;
    if (maxDate && iso > maxDate) return false;
    return true;
  };

  const commit = (raw) => {
    const next = formatDigits(raw);
    setText(next);
    const digits = next.replace(/\D/g, "");
    if (!digits) {
      setInvalid(false);
      if (value) onChange("");
      return;
    }
    // Still being typed — nothing is saved and nothing is flagged yet.
    if (digits.length < 8) {
      setInvalid(false);
      return;
    }
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (!isRealDate(year, month, day)) {
      setInvalid(true);
      return;
    }
    const iso = isoFromParts(year, month, day);
    if (!inRange(iso)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (iso !== value) onChange(iso);
  };

  // Leaving the field with something that can never be saved (an impossible
  // date, a future date where it is not allowed, half a date) restores the
  // last valid date instead of keeping a value the patient cannot save.
  const restore = () => {
    if (invalid || (text.replace(/\D/g, "").length > 0 && text.replace(/\D/g, "").length < 8)) {
      setText(displayFromIso(lastValid.current));
      setInvalid(false);
    }
  };

  const clear = () => {
    setText("");
    setInvalid(false);
    setOpen(false);
    if (value) onChange("");
  };

  const selected = isoParts(value);
  const selectedDate = selected ? new Date(selected.year, selected.month - 1, selected.day) : null;

  const calendarDisabled = () => {
    const before = minDate ? new Date(`${minDate}T00:00:00`) : null;
    const after = maxDate ? new Date(`${maxDate}T00:00:00`) : disableFuture ? new Date() : null;
    if (before && after) return { before, after };
    if (before) return { before };
    if (after) return { after };
    return undefined;
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <div className="relative">
        <Input
          id={id}
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={restore}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn("pe-16", invalid && "border-destructive focus-visible:ring-destructive", className)}
        />
        {(text || value) && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear date"
            className="absolute end-9 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Open calendar"
            className="absolute end-0.5 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          defaultMonth={selectedDate || new Date()}
          captionLayout="dropdown"
          fromYear={minYear}
          toYear={upperYear}
          disabled={calendarDisabled()}
          onSelect={(day) => {
            if (!day) {
              clear();
              return;
            }
            const iso = isoFromParts(day.getFullYear(), day.getMonth() + 1, day.getDate());
            setInvalid(false);
            setText(displayFromIso(iso));
            onChange(iso);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}