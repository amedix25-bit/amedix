import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  NEURO_APPROVAL_DOMAINS,
  NEURO_DEPLOYMENT_GATE_NOTE,
  NEURO_REVIEW_SPECIALTY,
  NEURO_REVIEW_STATUSES,
  neurologyApprovalState,
} from "@/lib/neurologyApproval";

// Formal review register for the neurology decision-support layer.
//
// Records the decision of each required reviewer. It never approves anything on its
// own: a decision is only ever the one a named specialist recorded, and the
// deployment gate stays closed until both domains carry an approving decision and the
// Head of Neurology confirmation.

const initialForm = () => ({
  domain: "",
  status: "approved",
  reviewer_name: "",
  reviewer_title: "",
  reviewer_registration: "",
  head_confirmed: false,
  comment: "",
});

export default function NeurologyApprovalPanel({ reviews = [], onRecorded }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const state = neurologyApprovalState(reviews);
  const set = (key, v) => setForm((f) => ({ ...f, [key]: v }));

  const save = async () => {
    setError("");
    if (!form.domain) return setError("Select which review the decision belongs to.");
    if (!form.reviewer_name.trim() || !form.reviewer_title.trim())
      return setError("Record the reviewer's name and the capacity in which they are reviewing.");
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await base44.entities.NeurologyClinicalReview.create({
        specialty: NEURO_REVIEW_SPECIALTY,
        domain: form.domain,
        status: form.status,
        reviewer_name: form.reviewer_name.trim(),
        reviewer_title: form.reviewer_title.trim(),
        reviewer_registration: form.reviewer_registration.trim(),
        head_confirmed: form.domain === "neurology" ? Boolean(form.head_confirmed) : false,
        decision_datetime: now,
        comments: form.comment.trim()
          ? [{ author_name: form.reviewer_name.trim(), author_title: form.reviewer_title.trim(), datetime: now, text: form.comment.trim() }]
          : [],
        change_history: [
          {
            datetime: now,
            action: `review_${form.status}`,
            by_name: form.reviewer_name.trim(),
            note: form.comment.trim(),
          },
        ],
      });
      setForm(initialForm());
      if (onRecorded) await onRecorded();
    } catch (e) {
      setError(e?.message || "The review decision could not be recorded.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5" /> Clinical review and deployment gate
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{NEURO_DEPLOYMENT_GATE_NOTE}</p>
      </div>

      <div className="space-y-2">
        {state.domains.map((d) => (
          <div key={d.key} className="rounded-lg border border-border p-2.5 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold text-foreground">{d.label}</p>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                  d.approved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}
              >
                {d.status ? d.status.label : "No decision recorded"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{d.detail}</p>
            {d.review ? (
              <p className="text-[10px] text-foreground">
                {d.reviewer_name || "Reviewer not named"}
                {d.reviewer_title ? ` — ${d.reviewer_title}` : ""}
                {d.decision_datetime ? ` · ${d.decision_datetime.slice(0, 16).replace("T", " ")}` : ""}
                {d.key === "neurology" ? (d.head_confirmed ? " · Head of Neurology confirmed" : " · Head authority not confirmed") : ""}
              </p>
            ) : (
              <p className="text-[10px] text-warning">No review has been recorded yet.</p>
            )}
            {d.comments.length > 0 && (
              <p className="text-[10px] text-muted-foreground">Last comment: {d.comments[d.comments.length - 1].text}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border p-2.5 space-y-2">
        <p className="text-xs font-semibold text-foreground">Record a review decision</p>
        <p className="text-[10px] text-muted-foreground">
          Recorded decisions are append-only: a later decision is a new entry, so the review trail is preserved.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Review</Label>
            <Select value={form.domain || undefined} onValueChange={(v) => set("domain", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select the review…" />
              </SelectTrigger>
              <SelectContent>
                {NEURO_APPROVAL_DOMAINS.map((d) => (
                  <SelectItem key={d.key} value={d.key} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Decision</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NEURO_REVIEW_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Reviewer name</Label>
            <Input value={form.reviewer_name} onChange={(e) => set("reviewer_name", e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Capacity / title</Label>
            <Input
              value={form.reviewer_title}
              onChange={(e) => set("reviewer_title", e.target.value)}
              placeholder="e.g. Consultant Neurologist, Head of Neurology"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">Registration or licence reference</Label>
            <Input
              value={form.reviewer_registration}
              onChange={(e) => set("reviewer_registration", e.target.value)}
              placeholder="Where the institution records it"
              className="h-8 text-xs"
            />
          </div>
          {form.domain === "neurology" && (
            <label className="flex items-start gap-1.5 text-[11px] text-foreground sm:col-span-2">
              <Checkbox
                checked={form.head_confirmed}
                onCheckedChange={(v) => set("head_confirmed", Boolean(v))}
                className="mt-0.5"
              />
              I confirm that I hold the authority of Head of Neurology to approve this content for the department.
            </label>
          )}
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">Comments</Label>
            <Textarea
              value={form.comment}
              onChange={(e) => set("comment", e.target.value)}
              rows={2}
              className="text-xs min-h-[52px]"
              placeholder="Findings, conditions of approval or changes requested"
            />
          </div>
        </div>

        {error && <p className="text-[11px] text-destructive">{error}</p>}

        <Button type="button" size="sm" className="h-7 text-xs gap-1" onClick={save} disabled={saving}>
          {saving ? "Recording…" : "Record decision"}
        </Button>
      </div>

      {state.canDeploy ? (
        <div className="rounded-md border border-success/40 bg-success/5 p-2 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground">
            The recorded reviews approve both domains and the Head of Neurology confirmation is present. Deployment remains
            the institution's decision, and the register continues to hold every earlier decision.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="text-[11px] text-foreground">
            <p className="font-medium">Outstanding before clinical deployment:</p>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
              {state.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}