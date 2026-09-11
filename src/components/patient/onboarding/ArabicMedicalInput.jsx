import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { suggestTerms } from "@/lib/arabicMedicalTerms";

// Medical text input with an intelligent Arabic autocomplete. As the patient
// types (in Arabic or English), it shows standardized Arabic medical
// suggestions with their English equivalents. Selecting a suggestion maps the
// concept to the standardized English term via onSelectTerm.
export default function ArabicMedicalInput({ value, onChange, onSelectTerm, placeholder, terms, required }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const suggestions = open ? suggestTerms(value, terms) : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <Input
        value={value}
        placeholder={placeholder}
        required={required}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setOpen(true);
          onChange(e);
        }}
      />
      {suggestions.length > 0 && (
        <div className="absolute z-30 w-full mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((term) => (
            <button
              key={term.en}
              type="button"
              className="w-full flex items-baseline justify-between gap-2 px-3 py-2 text-start hover:bg-accent transition-colors"
              onClick={() => {
                onSelectTerm(term);
                setOpen(false);
              }}
            >
              <span className="text-sm font-medium">{term.ar}</span>
              <span className="text-xs text-muted-foreground shrink-0">{term.en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}