import React, { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, BellRing, FileCheck2, Info, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  OBGYN_SAFETY_CONCERNS,
  OBGYN_SAFETY_PROVENANCE,
  buildObgynSafetyPrompts,
} from "@/lib/obgynSafetyRules";

// Conditional safety prompts for the Obstetrics & Gynecology notes.
//
// A prompt appears only when the clinician raised a concern here or documented a
// structured finding that raises it. Nothing is derived from an unanswered
// field, and an empty panel says explicitly that it is not reassurance. Prompts
// never diagnose, prescribe or order — they record what was documented, how
// time-sensitive it is, and the action taken. No field here is required: urgent
// care is never delayed for documentation.
//
// Stored shape: { concerns: [rule keys], prompts: [recorded prompts] }. The
// prompts are snapshotted into the note as soon as they appear, so the signed
// note and the PDF carry what the clinician saw — not a later re-computation.

const LEVEL_CHIP = {
  immediate: "bg-destructive/10 text-destructive",
  same_day: "bg-amber-100 text-amber-800",
  documented: "bg-primary/10 text-primary",
};

const LevelIcon = ({ level }) =>
  level === "immediate" ? (
    <AlertTriangle className="w-3 h-3" />
  ) : level === "same_day" ? (
    <BellRing className="w-3 h-3" />
  ) : (
    <FileCheck2 className="w-3 h-3" />
  );

const LEVEL_LABEL = { immediate: "Act now", same_day: "Same day", documented: "Documented" };

export default function ObgynSafetyPromptsField({ value, values, onChange }) {
  const stored = value && !Array.isArray(value) ? value : { concerns: [], prompts: Array.isArray(value) ? value : [] };
  const concerns = Array.isArray(stored.concerns) ? stored.concerns : [];

  const prompts = useMemo(() => buildObgynSafetyPrompts(values || {}, concerns), [values, concerns]);
  const signature = prompts.map((p) => `${p.rule_key}:${p.level}`).join("|");

  // Keep the note's stored snapshot in step with what is on screen. The guard on
  // the signature stops this from re-writing on every keystroke elsewhere.
  const lastSignature = useRef(null);
  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    const previous = (stored.prompts || []).reduce((acc, p) => {
      acc[p.rule_key] = p;
      return acc;
    }, {});
    const merged = prompts.map((p) => ({
      ...p,
      action_taken: previous[p.rule_key]?.action_taken || "",
      acknowledged_datetime: previous[p.rule_key]?.acknowledged_datetime || "",
    }));
    onChange({ ...stored, prompts: merged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const toggleConcern = (key) => {
    const next = concerns.includes(key) ? concerns.filter((k) => k !== key) : [...concerns, key];
    lastSignature.current = null; // the prompt set changes with the concern
    onChange({ ...stored, concerns: next });
  };

  const setAction = (prompt, action) => {
    const entries = (stored.prompts || []).filter((p) => p.rule_key !== prompt.rule_key);
    if (action.trim()) {
      entries.push({
        ...prompt,
        action_taken: action,
        acknowledged_datetime: new Date().toISOString(),
      });
    } else {
      entries.push({ ...prompt, action_taken: "", acknowledged_datetime: "" });
    }
    // keep the engine order
    const order = prompts.map((p) => p.rule_key);
    entries.sort((a, b) => order.indexOf(a.rule_key) - order.indexOf(b.rule_key));
    onChange({ ...stored, prompts: entries });
  };

  const storedByKey = (stored.prompts || []).reduce((acc, p) => {
    acc[p.rule_key] = p;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-2.5">
        <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {OBGYN_SAFETY_PROVENANCE.source} · {OBGYN_SAFETY_PROVENANCE.build}.{" "}
          {OBGYN_SAFETY_PROVENANCE.note} Nothing is inferred from an unanswered field, and no prompt is required
          before the note can be signed.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-primary">Concerns raised by the clinician at this encounter</Label>
        <div className="flex flex-wrap gap-1.5">
          {OBGYN_SAFETY_CONCERNS.map((c) => {
            const active = concerns.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleConcern(c.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? "border-destructive/40 bg-destructive/10 text-destructive font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-border p-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No safety prompt raised by the findings documented in this note. This is not a statement that no urgent
            problem is present — undocumented findings cannot raise a prompt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((p) => {
            const entry = storedByKey[p.rule_key] || {};
            return (
              <div key={p.rule_key} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                      LEVEL_CHIP[p.level] || LEVEL_CHIP.documented
                    }`}
                  >
                    <LevelIcon level={p.level} />
                    {LEVEL_LABEL[p.level] || p.level}
                  </span>
                  <p className="text-sm font-medium leading-snug">{p.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.message}</p>
                <p className="text-[10px] leading-snug">
                  <span className="text-muted-foreground">Reference: {p.reference_label || "not stated"} — </span>
                  <span className={p.reference_verified ? "text-emerald-700" : "text-amber-700"}>
                    {p.reference_verified
                      ? "verified at source"
                      : "not verified in this build — confirm before relying on it"}
                  </span>
                </p>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Action taken (recorded with this prompt)</Label>
                  <Textarea
                    rows={2}
                    value={entry.action_taken || ""}
                    onChange={(e) => setAction(p, e.target.value)}
                    placeholder="What was done, by whom, and when"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}