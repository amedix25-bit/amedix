import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CircleSlash, MinusCircle, Lock } from "lucide-react";

const NOT_ASSESSED = "Not Assessed";
const NOT_APPLICABLE = "Not Applicable";
const PNTA = "Prefers Not to Answer";

// One structured history field row. A positive / concerning answer is flagged
// with an icon and text (never colour alone); "Not Assessed", "Not Applicable"
// and "Prefers Not to Answer" stay visibly distinct from an answered value.
export default function ObgynSrhField({ field, value, onChange }) {
  const val = value || "";
  const isConcern = ["Concern", "Present", "Multiple Symptoms", "Multiple Concerns", "No —", "Concerns Identified", "Concern Reported"].some((p) => val.startsWith(p));

  return (
    <div
      className={`rounded-lg p-2.5 border ${
        isConcern
          ? "border-amber-400 bg-amber-50/50 border-l-4"
          : val === NOT_ASSESSED
            ? "border-border bg-muted/20"
            : "border-border bg-card"
      }`}
    >
      <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-2 sm:items-center">
        <Label className="text-xs font-normal leading-snug">{field.label}</Label>
        {field.type === "select" ? (
          <Select value={val} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger className="w-full sm:w-56 shrink-0 h-8 text-xs">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {field.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o === NOT_ASSESSED && <span className="inline-flex items-center gap-1.5"><CircleSlash className="w-3 h-3" />{o}</span>}
                  {o === NOT_APPLICABLE && <span className="inline-flex items-center gap-1.5"><MinusCircle className="w-3 h-3" />{o}</span>}
                  {o === PNTA && <span className="inline-flex items-center gap-1.5"><Lock className="w-3 h-3" />{o}</span>}
                  {o !== NOT_ASSESSED && o !== NOT_APPLICABLE && o !== PNTA && o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "textarea" ? (
          <div className="sm:col-span-2">
            <Textarea
              rows={2}
              className="text-xs"
              placeholder={field.placeholder || ""}
              value={val}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        ) : (
          <Input
            className="w-full sm:w-56 h-8 text-xs shrink-0"
            placeholder={field.placeholder || ""}
            value={val}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        )}
      </div>
      {isConcern && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <AlertTriangle className="w-3 h-3" /> Concerning answer — flagged for clinical review
        </span>
      )}
      {val === NOT_ASSESSED && !isConcern && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <CircleSlash className="w-3 h-3" /> Not assessed — distinct from a negative answer
        </span>
      )}
      {val === NOT_APPLICABLE && !isConcern && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <MinusCircle className="w-3 h-3" /> Not applicable to this encounter
        </span>
      )}
      {val === PNTA && !isConcern && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Patient prefers not to answer — documented respectfully
        </span>
      )}
    </div>
  );
}