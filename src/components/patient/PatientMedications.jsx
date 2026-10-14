import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Pill, Loader2, Plus, CheckCircle2, Info } from "lucide-react";
import MedicationCard from "@/components/patient/medications/MedicationCard";
import PatientMedicationForm from "@/components/patient/medications/PatientMedicationForm";
import AdherencePanel from "@/components/patient/medications/AdherencePanel";
import { medicationStatus, todayStr } from "@/lib/medicationUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientMedications({ patient }) {
  const { t } = usePatientLanguage();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [infoCompleted, setInfoCompleted] = useState(!!patient?.medication_info_completed);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Medication.filter({ patient_id: patient.id }, "-start_date");
      setMeds(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayStr();
  const statusOf = (m) => medicationStatus(m, today);
  const current = meds.filter((m) => statusOf(m) === "active");
  const history = meds.filter((m) => statusOf(m) !== "active");

  const markInfoComplete = async () => {
    setInfoCompleted(true);
    try {
      if (!patient.medication_info_completed) {
        await base44.entities.PatientProfile.update(patient.id, { medication_info_completed: true });
      }
      await base44.entities.PatientNotification.updateMany(
        { patient_id: patient.id, type: "medication_update" },
        { $set: { is_read: true } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEditClick = (med) => {
    setEditing(med);
    setShowForm(true);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      const data = {
        patient_id: patient.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        name: form.name.trim(),
        dose: form.dose.trim(),
        route: form.route,
        frequency: form.frequency.trim(),
        meal_timing: form.meal_timing,
        duration: form.duration ? form.duration.trim() : "",
        patient_notes: form.patient_notes.trim(),
        source: "patient_reported",
        is_active: true,
      };
      if (editing) {
        await base44.entities.Medication.update(editing.id, data);
      } else {
        await base44.entities.Medication.create({ ...data, start_date: today });
      }
      setShowForm(false);
      setEditing(null);
      await markInfoComplete();
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!infoCompleted && !showForm && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{t("Update Your Medication Information")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Please add your current medication information to keep your medical record up to date.")}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={handleAddClick}>
                  <Plus className="w-4 h-4 mr-1" /> {t("Add Medication Information")}
                </Button>
                <Button size="sm" variant="outline" onClick={markInfoComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {t("I'm not taking any medications")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <PatientMedicationForm
          initial={editing}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t("Current Medication")}</h3>
          {!showForm && infoCompleted && (
            <Button size="sm" variant="outline" onClick={handleAddClick}>
              <Plus className="w-4 h-4 mr-1" /> {t("Add Medication")}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("Loading medications...")}
          </div>
        ) : current.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("No current medications.")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {current.map((m) => (
              <div key={m.id}>
                <MedicationCard
                  med={m}
                  today={today}
                  onEdit={m.source === "patient_reported" ? handleEditClick : undefined}
                />
                <AdherencePanel med={m} patient={patient} onChanged={load} />
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && history.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">{t("Medication History")}</h3>
          <div className="space-y-3 opacity-80">
            {history.map((m) => (
              <MedicationCard key={m.id} med={m} today={today} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}