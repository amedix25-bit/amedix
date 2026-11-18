import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateField from "@/components/ui/date-field";
import { Loader2, Plus, X, Pencil, Trash2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText, TranslatingPlaceholder } from "@/lib/doctorMedicalTranslations";
import ProcedurePicker from "@/components/surgery/ProcedurePicker";

// My Health point 5 — Past Surgical History. Read-only for the patient; the
// doctor may add, edit or remove entries during an active visit (check-in
// gated, recorded with their name).
export default function SurgicalSection({ number, patient, doctorView, editable, preloadedItems, onRefresh }) {
  const { t, isArabic } = usePatientLanguage();
  const doctorText = useDoctorText();
  const dv = (s, field) => (doctorView ? doctorText("SurgicalHistory", s, field, s[field]) : s[field]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logRefresh, setLogRefresh] = useState(0);

  // Doctor Portal: previous operations arrive from the authorized backend
  // payload — the doctor cannot read the surgical records directly.
  useEffect(() => {
    if (!preloadedItems) return;
    setItems(preloadedItems);
    setLoading(false);
  }, [preloadedItems]);

  const load = useCallback(async () => {
    if (!patient?.id || preloadedItems) return;
    try {
      const results = await base44.entities.SurgicalHistory.filter({ patient_id: patient.id }, "-surgery_date");
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id, preloadedItems]);

  const refresh = useCallback(async () => {
    if (preloadedItems) {
      if (onRefresh) await onRefresh();
      return;
    }
    await load();
  }, [preloadedItems, onRefresh, load]);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setError("");
    setForm({
      id: null,
      surgery_type: "",
      surgery_type_ar: "",
      procedure_code: "",
      procedure_specialty: "",
      surgery_date: "",
      reason: "",
      complications: "",
      outcome: "",
    });
    setOpen(true);
  };

  const startEdit = (s) => {
    setError("");
    setForm({
      id: s.id,
      surgery_type: s.surgery_type || "",
      surgery_type_ar: s.surgery_type_ar || "",
      procedure_code: s.procedure_code || "",
      procedure_specialty: s.procedure_specialty || "",
      surgery_date: s.surgery_date || "",
      reason: s.reason || "",
      complications: s.complications || "",
      outcome: s.outcome || "",
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.surgery_type.trim()) return;
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "surgery",
        patient_id: patient.id,
        action: form.id ? "update" : "create",
        record: {
          id: form.id || undefined,
          surgery_type: form.surgery_type.trim(),
          surgery_type_ar: form.surgery_type_ar || undefined,
          procedure_code: form.procedure_code || undefined,
          procedure_specialty: form.procedure_specialty || undefined,
          procedure_status: "previous",
          surgery_date: form.surgery_date || undefined,
          reason: form.reason,
          complications: form.complications,
          outcome: form.outcome,
        },
      });
      setForm(null);
      setLogRefresh((v) => v + 1);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(t("Remove this entry?"))) return;
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "surgery",
        patient_id: patient.id,
        action: "delete",
        record: { id: s.id },
      });
      setLogRefresh((v) => v + 1);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SectionCard
      number={number}
      title={t("Past Surgical History")}
      open={open}
      onOpenChange={setOpen}
      patient={patient}
      sectionKey="surgical_history"
      editLogRefresh={logRefresh}
      action={
        editable && !form ? (
          <Button size="sm" variant="outline" onClick={startAdd}>
            <Plus className="w-4 h-4 mr-1" /> {t("Add")}
          </Button>
        ) : undefined
      }
    >
      {form && (
        <form onSubmit={save} className="mb-4 rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{form.id ? t("Edit Surgery") : t("Add Surgery")}</p>
            <button type="button" onClick={() => setForm(null)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("Surgery type")} *</Label>
              <ProcedurePicker
                status="previous"
                onPick={(p) =>
                  setForm({
                    ...form,
                    surgery_type: p.name,
                    surgery_type_ar: p.nameAr || "",
                    procedure_code: p.code || "",
                    procedure_specialty: p.specialty || "",
                  })
                }
              />
              {form.surgery_type && (
                <p className="text-sm font-medium">
                  {isArabic && form.surgery_type_ar ? form.surgery_type_ar : form.surgery_type}
                  {form.procedure_code ? <span className="text-xs text-muted-foreground"> · {form.procedure_code}</span> : null}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("Date")}</Label>
              <DateField value={form.surgery_date} onChange={(surgery_date) => setForm({ ...form, surgery_date })} disableFuture />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Reason / Indication")}</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Complications")}</Label>
              <Input value={form.complications} onChange={(e) => setForm({ ...form, complications: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Recovery / Outcome")}</Label>
              <Input value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            {t("Save")}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No previous surgeries were recorded.")}</p>
      ) : (
        <div className="space-y-4">
          {items.map((s) => {
            const hasAnesthesia = s.anesthesia_history || s.anesthesia_complications;
            const hasTransfusion =
              s.transfusion_count || s.transfusion_type || s.transfusion_amount ||
              s.transfusion_reason || s.transfusion_timing || s.transfusion_reactions;
            return (
              <div key={s.id} className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm">
                    {doctorView
                      ? doctorText("SurgicalHistory", s, "surgery_type", s.surgery_type) ?? <TranslatingPlaceholder />
                      : s.surgery_type_ar || s.surgery_type}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.surgery_date && <span className="text-xs text-muted-foreground">{s.surgery_date}</span>}
                    {editable && (
                      <>
                        <button type="button" onClick={() => startEdit(s)} className="text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => remove(s)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label={t("Reason / Indication")} value={dv(s, "reason")} />
                  <InfoRow label={t("Complications")} value={dv(s, "complications")} />
                  <InfoRow label={t("Recovery / Outcome")} value={dv(s, "outcome")} />
                  <InfoRow label={t("Hospitalization Duration")} value={dv(s, "hospitalization_duration")} />
                </div>
                {hasAnesthesia && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("Anesthesia")}</p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label={t("Anesthesia History")} value={dv(s, "anesthesia_history")} />
                      <InfoRow label={t("Anesthesia Complications")} value={dv(s, "anesthesia_complications")} />
                    </div>
                  </div>
                )}
                {(s.other_procedures || s.implants_devices) && (
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow label={t("Other Procedures")} value={dv(s, "other_procedures")} />
                    <InfoRow label={t("Implants / Medical Devices")} value={dv(s, "implants_devices")} />
                  </div>
                )}
                {hasTransfusion && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {t("Blood Transfusion History")}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label={t("Number of Transfusions")} value={dv(s, "transfusion_count")} />
                      <InfoRow label={t("Blood / Component Type")} value={dv(s, "transfusion_type")} />
                      <InfoRow label={t("Amount")} value={dv(s, "transfusion_amount")} />
                      <InfoRow label={t("Reason")} value={dv(s, "transfusion_reason")} />
                      <InfoRow label={t("Timing (relative to surgery)")} value={dv(s, "transfusion_timing")} />
                      <InfoRow label={t("Reactions / Complications")} value={dv(s, "transfusion_reactions")} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}