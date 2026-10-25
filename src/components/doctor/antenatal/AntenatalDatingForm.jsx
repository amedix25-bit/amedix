import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Dating + obstetric history form. Used both to START an antenatal record
// (initial = null) and to CORRECT pregnancy dating (initial = record, with a
// mandatory documented reason — existing orders, results and completed
// investigations are preserved and never repeated).
const COMPLICATIONS = [
  ["previous_cesarean", "Previous cesarean delivery"],
  ["previous_preeclampsia", "Previous pre-eclampsia"],
  ["previous_gestational_diabetes", "Previous gestational diabetes"],
  ["previous_preterm_birth", "Previous preterm birth"],
  ["previous_fgr", "Previous fetal growth restriction"],
];

export default function AntenatalDatingForm({ patient, initial, requireReason, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    lmp_date: initial?.lmp_date || "",
    edd_date: initial?.edd_date || "",
    dating_method: initial?.dating_method || "lmp",
    ultrasound_dating_date: initial?.ultrasound_dating_date || "",
    ultrasound_dating_weeks: initial?.ultrasound_dating_weeks ?? "",
    ultrasound_dating_days: initial?.ultrasound_dating_days ?? "",
    gravida: initial?.gravida ?? "",
    parity: initial?.parity ?? "",
    ...(COMPLICATIONS.reduce((acc, [key]) => ({ ...acc, [key]: initial?.[key] === true })), {}),
    risk_factors_text: (initial?.risk_factors || []).map((r) => (r.category ? `${r.category}: ${r.detail}` : r.detail)).join("\n"),
    outcomes_text: (initial?.previous_outcomes || []).map((o) => [o.outcome, o.year, o.notes].filter(Boolean).join(", ")).join("\n"),
    initial_assessment_done: initial?.initial_assessment_done === true,
    dating_change_reason: "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onLmpChange = (v) => {
    const updates = { lmp_date: v };
    if (v && form.dating_method !== "ultrasound") {
      try {
        const d = new Date(v + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + 280);
        updates.edd_date = d.toISOString().slice(0, 10);
      } catch (e) { /* leave EDD as entered */ }
    }
    setForm((f) => ({ ...f, ...updates }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (requireReason && !form.dating_change_reason.trim()) {
      setError("A documented reason is required when correcting pregnancy dating.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "save_pregnancy",
        patient_id: patient.id,
        record: {
          lmp_date: form.lmp_date || null,
          edd_date: form.edd_date || null,
          dating_method: form.dating_method,
          ultrasound_dating_date: form.ultrasound_dating_date || null,
          ultrasound_dating_weeks: form.ultrasound_dating_weeks === "" ? null : Number(form.ultrasound_dating_weeks),
          ultrasound_dating_days: form.ultrasound_dating_days === "" ? null : Number(form.ultrasound_dating_days),
          gravida: form.gravida === "" ? null : Number(form.gravida),
          parity: form.parity === "" ? null : Number(form.parity),
          previous_cesarean: form.previous_cesarean,
          previous_preeclampsia: form.previous_preeclampsia,
          previous_gestational_diabetes: form.previous_gestational_diabetes,
          previous_preterm_birth: form.previous_preterm_birth,
          previous_fgr: form.previous_fgr,
          previous_outcomes: form.outcomes_text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
            const [outcome, year, ...rest] = l.split(",").map((s) => s.trim());
            return { outcome, year: year || "", notes: rest.join(", ") || "" };
          }),
          risk_factors: form.risk_factors_text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
            const i = l.indexOf(":");
            return i > 0 && i < 30 ? { category: l.slice(0, i).trim(), detail: l.slice(i + 1).trim() } : { category: "", detail: l };
          }),
          initial_assessment_done: form.initial_assessment_done,
          notes: "",
        },
        dating_change_reason: form.dating_change_reason.trim(),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save the pregnancy record.");
    } finally {
      setSaving(false);
    }
  };

  const input = "bg-background";
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>Last menstrual period (LMP)</Label><Input type="date" className={input} value={form.lmp_date} onChange={(e) => onLmpChange(e.target.value)} /></div>
        <div><Label>Estimated due date (EDD)</Label><Input type="date" className={input} value={form.edd_date} onChange={(e) => set("edd_date", e.target.value)} /></div>
        <div>
          <Label>Dating method</Label>
          <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.dating_method} onChange={(e) => set("dating_method", e.target.value)}>
            <option value="lmp">LMP</option>
            <option value="ultrasound">Ultrasound</option>
            <option value="edd">EDD</option>
            <option value="clinical_assessment">Clinical assessment</option>
          </select>
        </div>
      </div>
      {form.dating_method === "ultrasound" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-border p-3">
          <div><Label>Ultrasound date</Label><Input type="date" className={input} value={form.ultrasound_dating_date} onChange={(e) => set("ultrasound_dating_date", e.target.value)} /></div>
          <div><Label>Weeks</Label><Input type="number" min="0" max="42" className={input} value={form.ultrasound_dating_weeks} onChange={(e) => set("ultrasound_dating_weeks", e.target.value)} /></div>
          <div><Label>Days</Label><Input type="number" min="0" max="6" className={input} value={form.ultrasound_dating_days} onChange={(e) => set("ultrasound_dating_days", e.target.value)} /></div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><Label>Gravida</Label><Input type="number" min="1" className={input} value={form.gravida} onChange={(e) => set("gravida", e.target.value)} /></div>
        <div><Label>Parity</Label><Input type="number" min="0" className={input} value={form.parity} onChange={(e) => set("parity", e.target.value)} /></div>
      </div>
      <div>
        <Label>Previous pregnancy outcomes (one per line: outcome, year, notes)</Label>
        <textarea className="flex min-h-[64px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.outcomes_text} onChange={(e) => set("outcomes_text", e.target.value)} placeholder={"Live birth, 2022\nMiscarriage, 2024"} />
      </div>
      <div>
        <Label>Previous obstetric complications</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {COMPLICATIONS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} /> {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Risk factors (one per line, e.g. "medical: chronic hypertension")</Label>
        <textarea className="flex min-h-[64px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.risk_factors_text} onChange={(e) => set("risk_factors_text", e.target.value)} />
      </div>
      {!initial && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.initial_assessment_done} onChange={(e) => set("initial_assessment_done", e.target.checked)} />
          Initial antenatal assessment completed today
        </label>
      )}
      {requireReason && (
        <div>
          <Label className="text-red-700">Reason for correcting the dating (required)</Label>
          <Input className={input} value={form.dating_change_reason} onChange={(e) => set("dating_change_reason", e.target.value)} placeholder="e.g. First-trimester ultrasound CRL dating" />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? "Save changes" : "Create antenatal record"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4" /> Cancel</Button>
      </div>
    </form>
  );
}