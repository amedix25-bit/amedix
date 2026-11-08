import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, Info } from "lucide-react";
import { PULM_INSTRUMENTS, pulmScore, pulmScoreValue, goldAbe } from "@/lib/pulmonologyScores";

const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// Documented respiratory instruments. The components are added exactly as each
// instrument defines them and the total is shown with the instrument's own band.
// An instrument is scored only when every item is answered: an unanswered item is
// never counted as zero, and the total never stands in for the clinician's
// documented interpretation.
export default function PulmonologyScoresField({ value, values, onChange, instruments = [] }) {
  const state = asObject(value);
  const [open, setOpen] = useState(instruments[0] || "");
  const keys = instruments.length ? instruments : Object.keys(PULM_INSTRUMENTS);

  const setAnswer = (instrumentKey, itemKey, answer) => {
    const current = asObject(state[instrumentKey]);
    onChange({
      ...state,
      [instrumentKey]: pulmScoreValue(instrumentKey, { ...(current.answers || {}), [itemKey]: answer }),
    });
  };

  // GOLD grouping shown ONLY when the clinician already documented the inputs it
  // needs. It is presented as a derivation of what was recorded — the group the
  // clinician assigns is the one they record in the COPD block.
  const catResult = pulmScore("cat", state.cat);
  const mmrcResult = pulmScore("mmrc", state.mmrc);
  const exacerbations = asObject(values?.pulm_exacerbation).frequency || "";
  const abe = goldAbe({
    exacerbations,
    catTotal: catResult.complete ? catResult.total : undefined,
    mmrcGrade: mmrcResult.complete ? mmrcResult.total : undefined,
  });

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const spec = PULM_INSTRUMENTS[key];
        if (!spec) return null;
        const result = pulmScore(key, state[key]);
        const answers = asObject(state[key]).answers || {};
        const isOpen = open === key;
        return (
          <div key={key} className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : key)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{spec.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {result.complete
                    ? `Total ${result.total}${key === "act" || key === "cat" ? `/${spec.total}` : ""} · ${result.answered} of ${result.of} answered`
                    : `${result.answered} of ${result.of} items answered — not scored`}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-border px-3 py-2.5">
                {spec.items.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-[11px] leading-snug">{item.label}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {item.options.map((o) => {
                        const on = answers[item.key] === o.label;
                        return (
                          <button
                            key={o.label}
                            type="button"
                            onClick={() => setAnswer(key, item.key, on ? "" : o.label)}
                            aria-pressed={on}
                            className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                              on
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {result.complete ? (
                  <p className="rounded-md bg-muted/60 px-2 py-1.5 text-[11px]">
                    <span className="font-medium">Total {result.total}.</span> {result.band}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" /> {spec.incomplete}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">Source: {spec.source}</p>
              </div>
            )}
          </div>
        );
      })}

      {abe.group && (
        <p className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[11px]">
          <span className="font-medium">GOLD grouping from the documented inputs:</span> Group {abe.group} — {abe.reason} The group the clinician assigns is the one recorded in the COPD assessment block.
        </p>
      )}
    </div>
  );
}