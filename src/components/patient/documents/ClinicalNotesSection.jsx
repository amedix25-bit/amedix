import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";

// Documents → Clinical Notes. The patient sees ONLY the diagnosis recorded on
// each note — the note itself is never shown. Diagnosis-only entries are
// served by the backend after a permission check.
export default function ClinicalNotesSection({ patient }) {
  const { t, locale } = usePatientLanguage();
  const [notes, setNotes] = useState(null);
  const ar = useDoctorTextAr(patient?.id, (notes || []).map((n) => n.diagnosis));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("patientNoteDiagnoses", { patient_id: patient.id });
        setNotes(res.data.notes || []);
      } catch (err) {
        console.error(err);
        setNotes([]);
      }
    };
    if (patient?.id) load();
  }, [patient?.id]);

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
    } catch (err) {
      return d;
    }
  };

  if (notes === null) {
    return (
      <div className="flex items-center py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
        {t("Loading...")}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <FileText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">{t("No clinical notes yet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("Diagnoses recorded by your doctors appear here. Clinical note contents are visible to your doctors only.")}</p>
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{fmtDate(note.date)} — {t("Dr.")} {note.doctor_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Provisional Diagnosis")}: {ar(note.diagnosis)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}