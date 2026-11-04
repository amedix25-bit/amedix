import React from "react";
import { CATEGORIES } from "@/lib/radiologistWorklist";

// Worklist categories — one shared department queue, eight views.
export default function WorklistCategories({ counts, active, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {CATEGORIES.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm border transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground border-primary font-medium"
                : "bg-card border-border hover:bg-accent"
            }`}
          >
            {c.label}
            <span className={`ml-1.5 text-xs tabular-nums ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
              {counts[c.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}