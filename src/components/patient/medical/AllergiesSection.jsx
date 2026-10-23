import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, Pencil, Trash2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText, TranslatingPlaceholder } from "@/lib/doctorMedicalTranslations";

const TYPES = ["drug", "food", "latex", "contrast", "environmental", "other"];
const SEVERITIES = ["mild", "moderate", "severe"];

const severityClass = (s) =>
  s === "severe"
    ? "px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium shrink-0"
    : s === "moderate"
      ? "px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium shrink-0"
      : "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0";

// My Health point 7 — Allergies. Read-only for the patient; the doctor may
// add, edit or remove entries during an active visit (check-in gated,
// recorded with their name).
export default function AllergiesSection({ number, patient, doctorView, editable }) {
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
      const results = await base44.entities.Allergy.filter({ patient_id: patient.id });
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setError("");
    setForm({ id: null, allergen: "", allergy_type: "drug", reaction: "", severity: "mild" });
    setOpen(true);
  };

  const startEdit = (a) => {
    setError("");
    setForm({
      id: a.id,
      allergen: a.allergen || "",
      allergy_type: a.allergy_type || "drug",
      reaction: a.reaction || "",
      severity: a.severity || "mild",
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.allergen.trim()) return;
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "allergy",
        patient_id: patient.id,
        action: form.id ? "update" : "create",
        record: {
          id: form.id || undefined,
          allergen: form.allergen.trim(),
          allergy_type: form.allergy_type,
          entry_type: "confirmed_allergy",
          reaction: form.reaction,
          severity: form.severity,
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

  const remove = async (a) => {
    if (!window.confirm(t("Remove this entry?"))) return;
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "allergy",
        patient_id: patient.id,
        action: "delete",
        record: { id: a.id },
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
      title={t("Allergies")}
      open={open}
      onOpenChange={setOpen}
      patient={patient}
      sectionKey="allergies"
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
            <p className="text-sm font-medium">{form.id ? t("Edit Allergy") : t("Add Allergy")}</p>
            <button type="button" onClick={() => setForm(null)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("Allergen")} *</Label>
              <Input value={form.allergen} onChange={(e) => setForm({ ...form, allergen: e.target.value })} placeholder={t("Allergen, e.g. Penicillin")} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Allergy type")}</Label>
              <select
                value={form.allergy_type}
                onChange={(e) => setForm({ ...form, allergy_type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(capitalize(ty))}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Reaction")}</Label>
              <Input value={form.reaction} onChange={(e) => setForm({ ...form, reaction: e.target.value })} placeholder={t("Reaction, e.g. Rash")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Severity")}</Label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{t(capitalize(s))}</option>
                ))}
              </select>
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
        <p className="text-sm text-muted-foreground">{t("No allergies were recorded.")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const allergen = doctorView
              ? doctorText("Allergy", a, "allergen", a.allergen) ?? <TranslatingPlaceholder />
              : a.allergen;
            const reaction = doctorView
              ? doctorText("Allergy", a, "reaction", a.reaction)
              : a.reaction;
            return (
              <div key={a.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{allergen}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {[a.allergy_type && t(capitalize(a.allergy_type)), reaction].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.severity && <span className={severityClass(a.severity)}>{t(capitalize(a.severity))}</span>}
                  {editable && (
                    <>
                      <button type="button" onClick={() => startEdit(a)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => remove(a)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}