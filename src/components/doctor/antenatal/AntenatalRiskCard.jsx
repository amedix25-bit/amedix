import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Scale } from "lucide-react";

// Structured maternal risk assessment. Each factor is traced to an approved,
// documented rule (rule key, source, version, effective date) and carries the
// configured assessment / monitoring / referral recommendations for clinician
// review. Risk classification is always a clinician decision — the system
// never assigns a level and never labels a pregnancy low risk simply because
// routine screening results are normal.
export default function AntenatalRiskCard({ risk, pregnancy, onSave, savingRisk }) {
  const [level, setLevel] = useState((pregnancy && pregnancy.risk_level) || "pending_assessment");
  const [reason, setReason] = useState("");
  const factors = (risk && risk.factors) || [];
  const rules = (risk && risk.rules) || {};
  const assessed = (pregnancy && pregnancy.risk_assessment) || null;

  return (
    <div className="rounded-xl border border-border p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Scale className="w-4 h-4" /> Maternal risk assessment</h4>

      {factors.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-3">
          No documented risk factors. Missing information is never treated as low risk — the risk level stays pending until assessed by an authorized clinician.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {factors.map((f, i) => (
            <div key={f.key + i} className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
              {f.detail && <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>}
              <ul className="mt-1.5 space-y-0.5">
                {f.recommendations.map((r, j) => (
                  <li key={j} className="text-xs text-amber-900 flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full bg-amber-600 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Rule: {f.rule_key} · {f.rule_source} · v{f.rule_version} · effective {f.rule_effective_date}
              </p>
            </div>
          ))}
        </div>
      )}

      {assessed && (
        <p className="text-xs text-muted-foreground mb-3">
          Last clinician assessment: {assessed.level} risk · {assessed.by_name} · {assessed.assessed_datetime ? new Date(assessed.assessed_datetime).toLocaleString() : ""}
          {assessed.factor_keys && assessed.factor_keys.length > 0 ? ` · based on documented factors: ${assessed.factor_keys.join(", ")}` : ""}
          {` · rules: ${assessed.rules_source || ""} v${assessed.rules_version ?? ""}`}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-xs">Clinician-assigned risk level</Label>
          <select className="flex h-9 rounded-md border border-border bg-background px-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="pending_assessment">Pending assessment</option>
            <option value="low">Low</option>
            <option value="intermediate">Intermediate</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs">Reason / notes</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. chronic hypertension + age 38" />
        </div>
        <Button size="sm" onClick={() => onSave(level, reason, factors.map((f) => f.key))} disabled={savingRisk || !level}>
          {savingRisk ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save risk assessment"}
        </Button>
      </div>
    </div>
  );
}