import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, MinusCircle, Ban } from "lucide-react";
import { URO_EXAM_GROUPS, EXAM_STATES } from "@/lib/uroExamBlocks";
import { asObject } from "@/lib/uroFieldKit";

// Examination recorded element by element. Each element carries one of five
// states, and only "Normal" reads as normal: an element not performed, not
// applicable or never recorded can never be read back as a normal finding.

const STATE_STYLE = {
  Normal: { icon: CheckCircle2, cls: "text-success" },
  Abnormal: { icon: AlertTriangle, cls: "text-critical" },
  "Not performed": { icon: Ban, cls: "text-warning" },
  "Not applicable": { icon: MinusCircle, cls: "text-muted-foreground" },
};

export default function UroExamField({ value, onChange, groups }) {
  const all = asObject(value);
  const keys = Array.isArray(groups) && groups.length ? groups : URO_EXAM_GROUPS.map((g) => g.key);
  const offered = URO_EXAM_GROUPS.filter((g) => keys.includes(g.key));

  const set = (elementKey, patch) =>
    onChange({ ...all, [elementKey]: { ...asObject(all[elementKey]), ...patch } });

  return (
    <div className="space-y-3">
      {offered.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-lg border border-border">
          <div className="bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary">{group.label}</div>
          <div className="divide-y divide-border">
            {group.elements.map((element) => {
              const entry = asObject(all[element.key]);
              const state = entry.state || "";
              const style = STATE_STYLE[state];
              const Icon = style ? style.icon : null;
              return (
                <div key={element.key} className="space-y-1.5 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${style.cls}`} /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/50" />}
                      {element.label}
                    </span>
                    <div className="w-full sm:w-[190px]">
                      <Select value={state || undefined} onValueChange={(next) => set(element.key, { state: next })}>
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue placeholder="Not documented" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_STATES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(state === "Abnormal" || entry.detail) && (
                    <Input
                      className="h-8 text-xs"
                      placeholder={element.detail || "Detail"}
                      value={entry.detail || ""}
                      onChange={(e) => set(element.key, { detail: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">
        An element left blank is recorded as <span className="font-medium">not documented</span>. Only an element marked{" "}
        <span className="font-medium">Normal</span> reads as a normal examination.
      </p>
    </div>
  );
}