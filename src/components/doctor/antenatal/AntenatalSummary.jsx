import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText, Loader2, Printer } from "lucide-react";

// Structured antenatal summary for continuity of care — dating, obstetric
// history, maternal risk, contact history, screening / laboratory history,
// abnormal findings with their review status, ultrasound reports, the current
// management plan, outstanding investigations and delivery planning. The
// original clinical records and audit trail are preserved; the generation is
// audit-logged server-side.
export default function AntenatalSummary({ patientId, doctorId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setOpen(true);
    if (summary) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("antenatalCare", { action: "get_summary", patient_id: patientId, doctor_id: doctorId });
      setSummary(res.data.summary);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not generate the antenatal summary.");
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ k, title, children }) => (
    <div className="rounded-lg border border-border">
      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/50" onClick={() => setExpanded((e) => ({ ...e, [k]: !e[k] }))}>
        {expanded[k] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="text-sm font-medium">{title}</span>
      </button>
      {expanded[k] && <div className="px-3 py-2 border-t border-border text-sm space-y-1.5">{children}</div>}
    </div>
  );

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" /> Antenatal summary (continuity of care)</h4>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={load}>
          {summary ? "Refresh summary" : "Generate summary"}
        </Button>
      </div>
      {open && loading && <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</div>}
      {open && error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {open && summary && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Generated {new Date(summary.generated_datetime).toLocaleString()} · {summary.patient.full_name} · {summary.patient.cin}
            {summary.dating.complete ? ` · GA ${summary.dating.gestational_age} · EDD ${summary.dating.edd}` : ""}
          </p>
          <Section k="obstetric" title="Pregnancy dating and obstetric history">
            {summary.dating.complete
              ? <p>LMP {summary.dating.lmp} · EDD {summary.dating.edd} · GA {summary.dating.gestational_age} · method: {summary.dating.method}</p>
              : <p className="text-amber-800">Pregnancy dating incomplete.</p>}
            <p>Gravida {summary.obstetric_history.gravida ?? "—"} · Para {summary.obstetric_history.parity ?? "—"}{summary.obstetric_history.previous_cesarean ? " · previous cesarean" : ""}</p>
            {(summary.obstetric_history.previous_outcomes || []).map((o, i) => (
              <p key={i} className="text-muted-foreground">{o.outcome}{o.year ? ` (${o.year})` : ""}{o.notes ? ` — ${o.notes}` : ""}</p>
            ))}
          </Section>
          <Section k="risk" title="Maternal risk factors and classification">
            <p>Risk level: <span className="font-medium">{summary.maternal_risk.risk_level}</span></p>
            {(summary.maternal_risk.factors || []).map((f, i) => (
              <p key={i} className="text-muted-foreground">{f.label}{f.detail ? ` — ${f.detail}` : ""}</p>
            ))}
          </Section>
          <Section k="contacts" title="Antenatal contacts">
            <p>{summary.contacts.completed_count} of {summary.contacts.total} standard contacts completed</p>
            {summary.contacts.contacts.filter((c) => c.state !== "completed").slice(0, 4).map((c) => (
              <p key={c.contact_no} className="text-muted-foreground">{c.label} — {c.state.replace(/_/g, " ")}</p>
            ))}
          </Section>
          <Section k="screening" title="Screening and laboratory history">
            {(summary.screening_history || []).length === 0 && <p className="text-muted-foreground">No recorded investigations yet.</p>}
            {(summary.screening_history || []).map((s, i) => (
              <p key={i} className="text-muted-foreground">
                {s.item} ({s.window}) — {String(s.status).replace(/_/g, " ")}
                {s.result_value ? ` · ${s.result_value}${s.result_units ? ` ${s.result_units}` : ""}` : ""}
                {s.interpretation ? ` · ${s.interpretation}` : ""}
                {s.review_status === "awaiting_review" ? " · review outstanding" : ""}
              </p>
            ))}
          </Section>
          <Section k="abnormal" title="Abnormal findings and review status">
            {(summary.abnormal_findings || []).length === 0 && <p className="text-muted-foreground">No abnormal findings recorded.</p>}
            {(summary.abnormal_findings || []).map((a, i) => (
              <p key={i} className={a.review_status === "awaiting_review" ? "text-red-800" : "text-muted-foreground"}>
                {a.item} — outcome {a.outcome} · {a.review_status === "awaiting_review" ? "clinical review OUTSTANDING" : "reviewed"}{a.followup_plan ? ` · plan: ${a.followup_plan}` : ""}
              </p>
            ))}
          </Section>
          <Section k="ultrasound" title="Ultrasound reports">
            {(summary.ultrasound_reports || []).length === 0 && <p className="text-muted-foreground">No finalized ultrasound reports linked.</p>}
            {(summary.ultrasound_reports || []).map((u, i) => (
              <p key={i} className="text-muted-foreground">{u.request_id} · {u.scan_type} — {u.examination} · {u.workflow_status.replace(/_/g, " ")}{u.report ? ` · ${u.report.slice(0, 120)}${u.report.length > 120 ? "…" : ""}` : ""}</p>
            ))}
          </Section>
          <Section k="plan" title="Current management plan">
            {(summary.current_plan || []).length === 0 && <p className="text-muted-foreground">No documented management plans.</p>}
            {(summary.current_plan || []).map((p, i) => <p key={i} className="text-muted-foreground">{p.item} — {p.plan}</p>)}
          </Section>
          <Section k="outstanding" title="Outstanding investigations and referrals">
            {(summary.outstanding_investigations || []).length === 0 && <p className="text-muted-foreground">Nothing outstanding.</p>}
            {(summary.outstanding_investigations || []).map((o, i) => (
              <p key={i} className="text-muted-foreground">{o.item} ({o.window}) — {o.state.replace(/_/g, " ")}</p>
            ))}
          </Section>
          <Section k="delivery" title="Delivery planning">
            {(summary.delivery_planning || []).length === 0 && <p className="text-muted-foreground">Delivery planning not yet due.</p>}
            {(summary.delivery_planning || []).map((d, i) => <p key={i} className="text-muted-foreground">{d.item} — {d.state.replace(/_/g, " ")}</p>)}
          </Section>
          <div className="pt-1">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</Button>
          </div>
        </div>
      )}
    </div>
  );
}