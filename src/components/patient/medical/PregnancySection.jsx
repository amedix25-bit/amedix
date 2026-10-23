import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, X } from "lucide-react";
import { PREGNANCY_LABELS } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

// My Health point 9 — Pregnancy. Shown for female patients only; the patient
// cannot edit it. The doctor may update it during an active visit (check-in
// gated) and the edit is recorded as "Dr. <name> edited <datetime>".
export default function PregnancySection({ number, patient, doctorView, editable }) {
  const { t } = usePatientLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState(null);
  const [logRefresh, setLogRefresh] = useState(0);
  const [form, setForm] = useState(null);

  // Female patients only — never rendered for males.
  if (!patient || patient.gender !== "female") return null;

  const p = local || patient;
  const pregnant = p.pregnancy_status === "pregnant";

  const startEdit = () => {
    setError("");
    setForm({
      pregnancy_status: p.pregnancy_status || "not_applicable",
      gestational_age: p.gestational_age || "",
      estimated_due_date: p.estimated_due_date || "",
      pregnancy_history: p.pregnancy_history || "",
    });
    setEditing(true);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const record = {
        pregnancy_status: form.pregnancy_status,
        gestational_age: form.gestational_age,
        estimated_due_date: form.estimated_due_date,
        pregnancy_history: form.pregnancy_history,
      };
      await base44.functions.invoke("createClinicalRecord", {
        kind: "pregnancy",
        patient_id: patient.id,
        record,
      });
      setLocal({ ...p, ...record });
      setEditing(false);
      setLogRefresh((v) => v + 1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Could not save the pregnancy information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      number={number}
      title={t("Pregnancy")}
      open={open}
      onOpenChange={(v) => { setOpen(v); if (!v) setEditing(false); }}
      patient={patient}
      sectionKey="pregnancy"
      editLogRefresh={logRefresh}
      action={
        editable && !editing ? (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> {t("Edit")}
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("Edit Pregnancy")}</p>
            <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("Pregnancy status")}</Label>
              <select
                value={form.pregnancy_status}
                onChange={(e) => setForm({ ...form, pregnancy_status: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="not_applicable">{t("Not applicable")}</option>
                <option value="not_pregnant">{t("Not pregnant")}</option>
                <option value="pregnant">{t("Pregnant")}</option>
                <option value="unknown">{t("Unknown")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Gestational age")}</Label>
              <Input
                value={form.gestational_age}
                onChange={(e) => setForm({ ...form, gestational_age: e.target.value })}
                placeholder={t("e.g. 18 weeks")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Estimated due date")}</Label>
              <Input
                type="date"
                value={form.estimated_due_date}
                onChange={(e) => setForm({ ...form, estimated_due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Pregnancy history")}</Label>
            <textarea
              value={form.pregnancy_history}
              onChange={(e) => setForm({ ...form, pregnancy_history: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {t("Save changes")}
          </Button>
        </form>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label={t("Pregnancy status")} value={t(PREGNANCY_LABELS[p.pregnancy_status] || "Not specified")} />
          {pregnant && (
            <>
              <InfoRow label={t("Gestational age")} value={p.gestational_age} />
              <InfoRow label={t("Estimated due date")} value={p.estimated_due_date} />
            </>
          )}
          <InfoRow label={t("Pregnancy history")} value={p.pregnancy_history} />
        </div>
      )}
    </SectionCard>
  );
}