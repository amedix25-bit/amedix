import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CircleSlash, CheckCircle2, MinusCircle } from "lucide-react";

const ABNORMAL = "Abnormal";
const NOT_ASSESSED = "Not Assessed";
const NOT_APPLICABLE = "Not Applicable";

// One structured examination field row — Normal / Abnormal / Not Assessed /
// Not Applicable are always distinguishable, and a finding that is absent
// ("Normal" / "None") never looks like one that was not assessed.
export default function ObgynExamField({ field, value, onChange }) {
  const val = value || "";
  const isAbnormal = val.startsWith(ABNORMAL);
  const isNotAssessed = val === NOT_ASSESSED;
  const isNotApplicable = val === NOT_APPLICABLE;

  return (
    <div
      className={`rounded-lg p-2.5 border ${
        isAbnormal
          ? "border-amber-400 bg-amber-50/50 border-l-4"
          : isNotAssessed
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
                  {o !== NOT_ASSESSED && o !== NOT_APPLICABLE && o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "number" ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              className="w-full sm:w-40 h-8 text-xs shrink-0"
              value={val}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
            <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
          </div>
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
      {isAbnormal && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <AlertTriangle className="w-3 h-3" /> Abnormal finding — flagged for clinical review
        </span>
      )}
      {isNotAssessed && !isAbnormal && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <CircleSlash className="w-3 h-3" /> Not assessed — distinct from a normal finding
        </span>
      )}
      {isNotApplicable && !isAbnormal && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <MinusCircle className="w-3 h-3" /> Not applicable to this encounter
        </span>
      )}
      {val === "Normal" && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> Normal — documented by the clinician
        </span>
      )}
    </div>
  );
}