import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateField from "@/components/ui/date-field";
import { Loader2, Pencil, X } from "lucide-react";
import GynaeHistoryView from "@/components/patient/gynae/GynaeHistoryView";
import { usePatientLanguage } from "@/lib/patientLanguage";

// My Health point 9 — the patient's one Gynaecological & Obstetric History
// section (female patients only): current pregnancy, menstrual history, past
// gynaecological history, previous pregnancies and menopause. It reads the
// history recorded at registration from the patient record, so an authorized
// treating doctor sees exactly the same information. A doctor may update the
// current pregnancy status during an active visit; the edit is recorded.
export default function GynaeObstetricSection({ number, patient, doctorView, editable }) {
  const { t } = usePatientLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState(null);
  const [logRefresh, setLogRefresh] = useState(0);
  const [form, setForm] = useState(null);

  if (!patient || patient.gender !== "female") return null;

  const p = local || patient;

  const startEdit = () => {
    setError("");
    setForm({
      pregnancy_status:
        p.pregnancy_status === "pregnant" || p.pregnancy_status === "not_pregnant" ? p.pregnancy_status : "unknown",
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
      title={t("Gynaecological & Obstetric History")}
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setEditing(false);
      }}
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
            <p className="text-sm font-medium">{t("Update current pregnancy")}</p>
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
                <option value="pregnant">{t("Pregnant")}</option>
                <option value="not_pregnant">{t("Not pregnant")}</option>
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
              <DateField
                value={form.estimated_due_date}
                onChange={(estimated_due_date) => setForm({ ...form, estimated_due_date })}
              />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {t("Save changes")}
          </Button>
        </form>
      ) : (
        <GynaeHistoryView gynae={p.gynae_obstetric_history} profile={p} />
      )}
    </SectionCard>
  );
}