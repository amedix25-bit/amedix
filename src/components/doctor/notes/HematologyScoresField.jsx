import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { HEMA_SCORES, readHemaScore } from "@/lib/hematologyScores";
import { asObject } from "@/lib/hematologyFieldKit";

// Validated haematology tools. A tool produces a number only when every input it
// needs is recorded; otherwise it states exactly what is missing. Nothing is
// pre-filled and no tool makes a diagnosis.
export default function HematologyScoresField({ value, onChange }) {
  const values = asObject(value);
  const [openKeys, setOpenKeys] = useState([]);

  const toggle = (key) => setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const setInput = (scoreKey, inputKey, next) => {
    const current = asObject(values[scoreKey]);
    onChange({ ...values, [scoreKey]: { ...current, [inputKey]: next } });
  };

  return (
    <div className="space-y-2">
      {HEMA_SCORES.map((def) => {
        const read = readHemaScore(def, values[def.key]);
        const expanded = openKeys.includes(def.key);
        const summary = !read.documented
          ? "not scored"
          : read.missing
            ? `missing: ${read.missing.join(", ")}`
            : `${read.value}${read.unit ? ` ${read.unit}` : ""}`;
        return (
          <div key={def.key} className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(def.key)}
              aria-expanded={expanded}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`}
                />
                <span className="text-xs font-medium truncate">{def.label}</span>
              </span>
              <span className={`shrink-0 text-[11px] ${read.missing ? "text-muted-foreground" : "text-foreground"}`}>
                {summary}
              </span>
            </button>

            {expanded && (
              <div className="px-3 pb-3 pt-2 space-y-3">
                <p className="text-[11px] text-muted-foreground leading-snug">{def.note}</p>

                {def.inputs.map((input) => {
                  const current = asObject(values[def.key])[input.key];
                  return (
                    <div key={input.key} className="space-y-1">
                      <Label className="text-[11px] leading-snug">{input.label}</Label>

                      {input.type === "select" && (
                        <Select
                          value={current || undefined}
                          onValueChange={(v) => setInput(def.key, input.key, v)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {input.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {input.type === "multi" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {input.options.map((option) => {
                            const selected = Array.isArray(current) ? current : [];
                            const on = selected.includes(option);
                            return (
                              <label
                                key={option}
                                className="flex items-start gap-2 text-[11px] leading-snug cursor-pointer"
                              >
                                <Checkbox
                                  checked={on}
                                  onCheckedChange={(checked) =>
                                    setInput(
                                      def.key,
                                      input.key,
                                      checked ? [...selected, option] : selected.filter((x) => x !== option)
                                    )
                                  }
                                  className="mt-0.5"
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {input.type === "number" && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={current ?? ""}
                            onChange={(e) => setInput(def.key, input.key, e.target.value)}
                          />
                          {input.unit && (
                            <span className="text-xs text-muted-foreground shrink-0">{input.unit}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-md border border-border bg-muted/30 px-2.5 py-2 space-y-1">
                  {read.missing ? (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Not scored — {read.missing.join(", ")} still missing. No value is estimated from partial
                      data.
                    </p>
                  ) : !read.documented ? (
                    <p className="text-[11px] text-muted-foreground">This tool has not been used in this note.</p>
                  ) : (
                    <p className="text-xs">
                      <span className="font-semibold">
                        {read.value}
                        {read.unit ? ` ${read.unit}` : ""}
                      </span>
                      {read.interpretation ? ` — ${read.interpretation}` : ""}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">Source: {def.source}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}