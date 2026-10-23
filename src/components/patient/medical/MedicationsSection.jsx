import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, Ban, RotateCcw } from "lucide-react";
import { medicationStatus, mealLabel, routeLabel, todayStr } from "@/lib/medicationUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText } from "@/lib/doctorMedicalTranslations";

export default function MedicationsSection({ number, patient, editable, doctorView }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  // Doctor Portal display value — patient-entered Arabic text shown in
  // English. Medication NAMES are never translated (English-only by rule).
  const dv = (m, field) => (doctorView ? doctorText("Medication", m, field, m[field]) : m[field]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Medication.filter({ patient_id: patient.id }, "-start_date");
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "medication",
        patient_id: patient.id,
        record: {
          name: name.trim(),
          start_date: startDate || new Date().toISOString().slice(0, 10),
          is_active: true,
        },
      });
      setName("");
      setStartDate("");
      setShowAdd(false);
      setLogRefresh((v) => v + 1);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m, makeActive) => {
    try {
      await base44.entities.Medication.update(
        m.id,
        makeActive
          ? { is_active: true, stopped_date: "" }
          : { is_active: false, stopped_date: new Date().toISOString().slice(0, 10) }
      );
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const active = items.filter((m) => m.is_active !== false && (!m.end_date || m.end_date >= today));
  const stopped = items.filter((m) => !(m.is_active !== false && (!m.end_date || m.end_date >= today)));

  return (
    <SectionCard
      number={number}
      title={t("Medications")}
      open={open}
      onOpenChange={setOpen}
      patient={patient}
      sectionKey="medications"
      editLogRefresh={logRefresh}
      action={
        editable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAdd(true);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> {t("Add")}
          </Button>
        ) : undefined
      }
    >
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("Add Medication")}</p>
            <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("Medication name *")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("e.g. Metformin")} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Start date")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            {t("Save Medication")}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No medications were recorded.")}</p>
      ) : (
        <div className="space-y-3">
          {[...active, ...stopped].map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 ${
                m.is_active === false ? "opacity-60" : ""
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm">{m.name}</p>
                  {m.source === "doctor_prescribed" ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {t("Doctor-Prescribed")}
                    </span>
                  ) : m.source === "patient_reported" ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {t("Patient-Reported")}
                    </span>
                  ) : null}
                </div>
                {(m.dose || m.route || m.frequency || m.meal_timing || m.duration) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[
                      dv(m, "dose"),
                      m.route && t(routeLabel(m.route)),
                      m.prn ? t("PRN — as needed") : dv(m, "frequency"),
                      m.meal_timing && t(mealLabel(m.meal_timing)),
                      dv(m, "duration"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {medicationStatus(m, todayStr()) !== "active" && (
                  <p className="text-xs text-muted-foreground">
                    {m.stopped_date === m.end_date && m.end_date
                      ? `${t("Completed")}${m.stopped_date ? ` — ${m.stopped_date}` : ""}`
                      : `${t("Stopped")}${m.stopped_date ? ` — ${m.stopped_date}` : ""}`}
                  </p>
                )}
              </div>
              {editable &&
                (m.is_active === false ? (
                  <Button size="sm" variant="outline" onClick={() => toggleActive(m, true)}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> {t("Restart")}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleActive(m, false)}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> {t("Stop")}
                  </Button>
                ))}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}