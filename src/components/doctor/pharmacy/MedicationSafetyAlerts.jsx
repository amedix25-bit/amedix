import React from "react";
import { AlertTriangle, Bot, Lock, Loader2, ShieldCheck } from "lucide-react";

const SEVERITY = {
  critical: {
    label: "Critical",
    card: "border-red-300 bg-red-50",
    text: "text-red-900",
    badge: "bg-red-600 text-white",
  },
  high: {
    label: "High",
    card: "border-orange-300 bg-orange-50",
    text: "text-orange-900",
    badge: "bg-orange-500 text-white",
  },
  moderate: {
    label: "Moderate",
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    badge: "bg-amber-400 text-amber-950",
  },
  low: {
    label: "Low",
    card: "border-sky-200 bg-sky-50",
    text: "text-sky-900",
    badge: "bg-sky-500 text-white",
  },
};

const TYPE_LABELS = {
  allergy_conflict: "Allergy Conflict",
  duplicate_therapy: "Duplicate Therapy",
  adverse_reaction: "Reported Adverse Reaction",
  interaction_review: "Interaction Review",
};

// Renders the medication safety check result for the prescribing doctor:
// every alert with its severity, explanation and guidance. Deterministic
// record-based checks and AI-assisted interaction advisories are labeled
// differently, and blocking alerts are shown with a lock.
export default function MedicationSafetyAlerts({ result, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking the medication against the patient's record...
      </div>
    );
  }
  if (!result) return null;

  const alerts = result.alerts || [];

  if (alerts.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2 text-sm text-emerald-900">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            No safety conflicts found. Checked against {result.checked_against?.allergies ?? 0} documented
            allergy record(s), {result.checked_against?.active_medications ?? 0} active medication(s)
            {result.checked_against?.adverse_reactions
              ? ` and ${result.checked_against.adverse_reactions} reported reaction(s)`
              : ""}.
          </span>
        </div>
        {result.limitations && (
          <p className="text-[11px] text-muted-foreground px-1">{result.limitations}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" /> Medication Safety Check — {alerts.length} alert(s) found
      </p>
      {alerts.map((a, i) => {
        const s = SEVERITY[a.severity] || SEVERITY.low;
        return (
          <div key={i} className={`rounded-lg border p-2.5 space-y-1.5 ${s.card}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${s.badge}`}>
                {s.label}
              </span>
              <span className={`text-xs font-semibold ${s.text}`}>
                {TYPE_LABELS[a.type] || a.type}
              </span>
              {a.ai_assisted && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-white/70">
                  <Bot className="w-3 h-3" /> AI-assisted advisory
                </span>
              )}
              {a.blocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-700 rounded px-1.5 py-0.5">
                  <Lock className="w-3 h-3" /> Prescription blocked
                </span>
              )}
            </div>
            <p className={`text-sm font-semibold ${s.text}`}>{a.title}</p>
            <p className="text-xs text-foreground/80">{a.explanation}</p>
            <p className="text-xs italic text-muted-foreground">{a.guidance}</p>
          </div>
        );
      })}
      {result.ai_error && (
        <p className="text-[11px] text-muted-foreground">{result.ai_error}</p>
      )}
      {result.limitations && (
        <p className="text-[11px] text-muted-foreground">{result.limitations}</p>
      )}
    </div>
  );
}