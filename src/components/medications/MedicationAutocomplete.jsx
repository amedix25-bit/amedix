import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Pill } from "lucide-react";

function escapeRegex(v) {
  return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const matchQuery = (q) => ({
  $or: [
    { medication_name: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
    { active_ingredient: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
  ],
});

// Medication name autocomplete — as the user types the first letters, drug
// options appear from the built-in drug catalog AND from pharmacy inventory
// across all affiliated pharmacies. Every option is a drug name, whether it
// currently has stock or not; stocked drugs carry an "In stock" badge.
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
        const query = matchQuery(q);
        const fields = ["medication_name", "active_ingredient", "strength", "dosage_form"];
        const [catalogPage, inventoryPage] = await Promise.all([
          base44.entities.DrugCatalog.filter(
            {
              $or: [
                { medication_name: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
                { active_ingredient: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
              ],
            },
            { fields: ["medication_name", "active_ingredient", "dosage_form"], limit: 100 }
          ),
          base44.entities.PharmacyInventory.filter(
            { $and: [query, { is_quarantined: { $ne: true } }, { quantity_in_stock: { $gt: 0 } }] },
            { fields, limit: 100 }
          ),
        ]);
        const catalog = (catalogPage.items || catalogPage) || [];
        const stocked = (inventoryPage.items || inventoryPage) || [];
        const inStock = new Map();
        for (const item of stocked) {
          const key = String(item.medication_name || "").toLowerCase();
          if (!key || !inStock.has(key)) inStock.set(key, item);
        }
        const merged = [];
        const seen = new Set();
        for (const [nameKey, item] of inStock) {
          seen.add(nameKey);
          merged.push({ ...item, in_stock: true });
        }
        for (const item of catalog) {
          const key = String(item.medication_name || "").toLowerCase();
          if (!key || seen.has(key)) continue;
          merged.push({ ...item, in_stock: false });
        }
        merged.sort((a, b) => (b.in_stock === a.in_stock ? 0 : b.in_stock ? 1 : -1));
        setOptions(merged.slice(0, 8));
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
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {option.medication_name}
                    {option.strength ? ` ${option.strength}` : ""}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                      option.in_stock
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {option.in_stock ? "In stock" : "Not in stock"}
                  </span>
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