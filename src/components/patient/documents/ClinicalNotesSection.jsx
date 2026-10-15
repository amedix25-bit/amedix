import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";
import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";

// Documents → Clinical Notes. Read-only list of every clinical note saved by
// the patient's doctors. Each note can be opened as a PDF directly from here.
export default function ClinicalNotesSection({ patient }) {
  const { t, locale } = usePatientLanguage();
  const [notes, setNotes] = useState(null);
  const ar = useDoctorTextAr(patient?.id, (notes || []).map((n) => n.diagnosis));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ClinicalNote.filter({ patient_id: patient.id }, "-date");
        setNotes(data);
      } catch (err) {
        console.error(err);
        setNotes([]);
      }
    };
    if (patient?.id) load();
  }, [patient?.id]);

  const openPdf = (note) => {
    const doc = generateClinicalNotePdf(note);
    window.open(doc.output("bloburl"), "_blank");
  };

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
      <p className="text-xs text-muted-foreground">{t("Clinical notes saved by your doctors appear here automatically.")}</p>
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{fmtDate(note.date)} — {t("Dr.")} {note.doctor_name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {t("Provisional Diagnosis")}: {ar(note.diagnosis)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openPdf(note)}>
            <FileText className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {t("View PDF")}
          </Button>
        </div>
      ))}
    </div>
  );
}