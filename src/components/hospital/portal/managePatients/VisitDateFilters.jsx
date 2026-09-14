import React from "react";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/lib/appLanguage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MODES = [
  { key: "all", labelKey: "All Time" },
  { key: "today", labelKey: "Today" },
  { key: "week", labelKey: "This Week" },
  { key: "month", labelKey: "This Month" },
  { key: "custom", labelKey: "Custom Range" },
];

// Period selector for the Manage Patients table — Today, This Week, This Month,
// or a custom date range that filters live as the dates are picked.
export default function VisitDateFilters({ mode, onModeChange, from, to, onFromChange, onToChange }) {
  const { t } = useAppLanguage();
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onModeChange(m.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              mode === m.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {t(m.labelKey)}
          </button>
        ))}
      </div>
      {mode === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("From")}</Label>
            <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("To")}</Label>
            <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}