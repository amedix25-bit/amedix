import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Pill } from "lucide-react";

function escapeRegex(v) {
  return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Medication name autocomplete — as the user types the first letters, drug
// options from pharmacy inventory (across all affiliated pharmacies) appear.
// Selecting an option returns { medication_name, active_ingredient, strength,
// dosage_form } so the caller can pre-fill the related fields. Free typing
// always stays possible — the list is only a suggestion.
export default function MedicationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  ...inputProps
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = String(value || "").trim();
    if (!q) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const page = await base44.entities.PharmacyInventory.filter(
          {
            $or: [
              { medication_name: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
              { active_ingredient: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
            ],
          },
          { fields: ["medication_name", "active_ingredient", "strength", "dosage_form"], limit: 100 }
        );
        const items = page.items || page;
        const seen = new Map();
        for (const item of items) {
          const key = String(item.medication_name || "").toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.set(key, item);
        }
        setOptions([...seen.values()].slice(0, 8));
      } catch {
        setOptions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  const pick = (option) => {
    onChange(option.medication_name);
    onSelect?.(option);
    setOpen(false);
  };

  return (
    <div className={`relative ${className || ""}`}>
      <Input
        placeholder={placeholder || "e.g. Panadol"}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
        {...inputProps}
      />
      {open && options.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg max-h-52 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.medication_name}
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(option)}
              className="w-full flex items-start gap-2 text-left px-3 py-2 hover:bg-accent transition-colors"
            >
              <Pill className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">
                  {option.medication_name}
                  {option.strength ? ` ${option.strength}` : ""}
                </span>
                {option.active_ingredient && (
                  <span className="block text-xs text-muted-foreground truncate">{option.active_ingredient}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}