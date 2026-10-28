import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Info, ShieldAlert, Pill } from "lucide-react";

// Contextual alerts for the documented treatment plan. Each alert states what
// was detected, why it matters, what the clinician must do, and its source —
// the system never acts on them by itself.
const LEVEL_STYLE = {
  high: { wrap: "border-destructive/40 bg-destructive/5", head: "text-destructive", icon: AlertTriangle },
  moderate: { wrap: "border-amber-500/40 bg-amber-500/5", head: "text-amber-700", icon: ShieldAlert },
  info: { wrap: "border-primary/30 bg-primary/5", head: "text-primary", icon: Info },
};

const TRIGGERS = [
  { key: "infection", label: "Suspected infection" },
  { key: "toxicity", label: "Possible medication toxicity" },
  { key: "organThreatening", label: "Possible organ-threatening manifestation" },
];

export default function RheumAlertPanel({
  alerts = [],
  triggers = {},
  onTriggers,
  nextAssessment = "",
  onNextAssessment,
  medications = [],
  allergies = [],
  prescriptions = [],
  loading = false,
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border p-3 space-y-2">
        <p className="text-xs font-medium">Clinical triggers documented at this assessment</p>
        <div className="flex flex-wrap gap-1.5">
          {TRIGGERS.map((t) => {
            const active = !!triggers[t.key];
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={active}
                onClick={() => onTriggers({ ...triggers, [t.key]: !active })}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  active ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-card text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {active && <Check className="w-3 h-3" />} {t.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Next disease-activity assessment planned</Label>
          <Input type="date" value={nextAssessment} onChange={(e) => onNextAssessment(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Pill className="w-3 h-3" /> AMedix medication list:</span>
          {loading && <span className="text-[11px] text-muted-foreground">reading…</span>}
          {!loading && medications.length === 0 && <span className="text-[11px] text-muted-foreground">no active medication recorded</span>}
          {medications.map((m) => <Badge key={m.id} variant="secondary" className="text-[10px]">{m.name}</Badge>)}
        </div>
        {prescriptions.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {prescriptions.length} prescription{prescriptions.length === 1 ? "" : "s"} currently in progress, included in the interaction check.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Allergies on record:</span>
          {allergies.length === 0 && <span className="text-[11px] text-muted-foreground">none recorded</span>}
          {allergies.map((a, i) => <Badge key={`${a.allergen}-${i}`} variant="outline" className="text-[10px]">{a.allergen}</Badge>)}
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-muted-foreground">No safety alert is raised from the information documented so far.</p>
      ) : (
        alerts.map((a, i) => {
          const style = LEVEL_STYLE[a.level] || LEVEL_STYLE.info;
          const Icon = style.icon;
          return (
            <div key={`${a.title}-${i}`} className={`rounded-lg border p-3 space-y-1 ${style.wrap}`}>
              <p className={`text-xs font-semibold flex items-start gap-1.5 ${style.head}`}>
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {a.title}
              </p>
              <p className="text-xs text-foreground/90">{a.detail}</p>
              <p className="text-xs"><span className="font-medium">Action: </span>{a.action}</p>
              <p className="text-[10px] text-muted-foreground">Reference: {a.reference}</p>
            </div>
          );
        })
      )}
    </div>
  );
}