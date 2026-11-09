import React from "react";
import { ExternalLink, ShieldAlert, ShieldCheck, Info, AlertTriangle } from "lucide-react";
import { evaluateUroSafety, URO_SAFETY_RULES, URO_SAFETY_NOTE } from "@/lib/uroSafetyRules";
import { asObject } from "@/lib/uroFieldKit";

// The advisory safety review, computed from what this note actually documents.
// Nothing here prescribes, discontinues or changes a medication, and a prompt
// that does not fire means the finding was NOT documented — never that it is
// absent. The clinician's acknowledgement is recorded with its timestamp.

const STYLE = {
  critical: { icon: ShieldAlert, box: "border-critical/40 bg-critical/5", head: "text-critical", label: "Time-critical" },
  warning: { icon: AlertTriangle, box: "border-warning/40 bg-warning/5", head: "text-warning", label: "Review" },
  info: { icon: Info, box: "border-border bg-muted/40", head: "text-foreground", label: "Advisory" },
};

export default function UroSafetyPromptsField({ value, values, onChange }) {
  const state = asObject(value);
  const alerts = evaluateUroSafety(values);
  const review = asObject(state.review);
  const reviewed = review.recorded_datetime
    ? `${new Date(review.recorded_datetime).toLocaleString()} — ${review.alerts?.length ?? 0} prompt(s) recorded as reviewed`
    : "";

  const recordReview = () =>
    onChange({
      ...state,
      review: {
        recorded_datetime: new Date().toISOString(),
        alerts: alerts.map((a) => ({ key: a.key, title: a.title, severity: a.severity })),
        clinician_acknowledged: true,
      },
    });

  return (
    <div className="space-y-2">
      {alerts.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            No prompt has fired for this note. That means none of the documented findings matched a rule — it does not
            mean the findings are absent. Document the findings and this panel re-evaluates.
          </p>
        </div>
      ) : (
        alerts.map((alert) => {
          const style = STYLE[alert.severity] || STYLE.info;
          const Icon = style.icon;
          return (
            <div key={alert.key} className={`rounded-lg border p-2.5 ${style.box}`}>
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.head}`} />
                <div className="min-w-0 space-y-1">
                  <p className={`text-xs font-semibold ${style.head}`}>
                    {alert.title} <span className="font-normal text-muted-foreground">· {style.label}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-foreground">{alert.detail}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{alert.action}</p>
                  {alert.source?.organization ? (
                    <a
                      href={alert.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {alert.source.organization} — {alert.source.title}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          {alerts.length} of {URO_SAFETY_RULES.length} rules fired · advisory only
        </p>
        <button
          type="button"
          onClick={recordReview}
          className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-primary hover:bg-muted/60"
        >
          Record that I reviewed these prompts
        </button>
      </div>
      {reviewed ? <p className="text-[10px] text-muted-foreground">Recorded: {reviewed}</p> : null}
      <p className="text-[11px] leading-relaxed text-muted-foreground">{URO_SAFETY_NOTE}</p>
    </div>
  );
}