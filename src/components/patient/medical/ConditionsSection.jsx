import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateField from "@/components/ui/date-field";
import { Loader2, Plus, X, Pencil, Trash2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText, TranslatingPlaceholder } from "@/lib/doctorMedicalTranslations";

const STATUSES = ["active", "resolved", "being_monitored", "unknown"];

// My Health conditions section (points 2 "Known Case Of" and 4 "Past Medical
// History"). Read-only for the patient; the doctor may add, edit or remove
// entries during an active visit (check-in gated, recorded with their name).
export default function ConditionsSection({ number, title, category, patient, emptyText, doctorView, editable }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logRefresh, setLogRefresh] = useState(0);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.MedicalCondition.filter(
        { patient_id: patient.id, category },
        "-date"
      );
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id, category]);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setError("");
    setForm({ id: null, name: "", date: "", current_status: "active", details: "" });
    setOpen(true);
  };

  const startEdit = (item) => {
    setError("");
    setForm({
      id: item.id,
      name: item.name || "",
      date: item.date || "",
      current_status: item.current_status || "active",
      details: item.details || "",
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "condition",
        patient_id: patient.id,
        action: form.id ? "update" : "create",
        record: {
          id: form.id || undefined,
          name: form.name.trim(),
          category,
          current_status: form.current_status,
          details: form.details,
          date: form.date || new Date().toISOString().slice(0, 10),
        },
      });
      setForm(null);
      setLogRefresh((v) => v + 1);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(t("Remove this entry?"))) return;
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "condition",
        patient_id: patient.id,
        action: "delete",
        record: { id: item.id },
      });
      setLogRefresh((v) => v + 1);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SectionCard
      number={number}
      title={title}
      open={open}
      onOpenChange={setOpen}
      patient={patient}
      sectionKey={category}
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
            <p className="text-sm font-medium">{form.id ? t("Edit Condition") : t("Add Condition")}</p>
            <button type="button" onClick={() => setForm(null)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("Condition name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("Condition, e.g. Hypertension")} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Status")}</Label>
              <select
                value={form.current_status}
                onChange={(e) => setForm({ ...form, current_status: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(capitalize(s))}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Date")}</Label>
              <DateField value={form.date} onChange={(date) => setForm({ ...form, date })} disableFuture />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Details (optional)")}</Label>
              <Input value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
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
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">
                  {doctorView
                    ? doctorText("MedicalCondition", item, "name", item.name) ?? <TranslatingPlaceholder />
                    : item.name_ar || item.name}
                </p>
                {(() => {
                  const details = doctorView
                    ? doctorText("MedicalCondition", item, "details", item.details)
                    : item.details;
                  return details ? <p className="text-muted-foreground text-xs mt-0.5">{details}</p> : null;
                })()}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.date && <span className="text-xs text-muted-foreground">{item.date}</span>}
                {editable && (
                  <>
                    <button type="button" onClick={() => startEdit(item)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => remove(item)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}