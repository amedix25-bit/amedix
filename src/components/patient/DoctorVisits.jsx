import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Stethoscope, ChevronLeft, MapPin, Clock, FileText, ClipboardList, ChevronRight } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";
import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";
import { Button } from "@/components/ui/button";

// Patient Portal → Doctor Visits. Lists every doctor visit the patient had,
// showing the doctor, the place they were seen and the visit time. Clicking a
// visit opens its visit notes and the doctor's clinical notes.
export default function DoctorVisits({ patientId }) {
  const { t } = usePatientLanguage();
  const [visits, setVisits] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Encounter.filter({ patient_id: patientId }, "-encounter_datetime");
        setVisits(data);
      } catch (err) {
        console.error(err);
        setVisits([]);
      }
    };
    if (patientId) load();
  }, [patientId]);

  if (selected) {
    return <DoctorVisitDetail visit={selected} onBack={() => setSelected(null)} />;
  }

  if (visits === null) {
    return (
      <div className="flex items-center py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
        {t("Loading...")}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("No doctor visits yet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("Every doctor visit appears here. Click a visit to see its notes.")}</p>
      {visits.map((visit) => (
        <button
          key={visit.id}
          type="button"
          onClick={() => setSelected(visit)}
          className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{t("Dr.")} {visit.doctor_name}</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{visit.hospital}{visit.department ? ` · ${visit.department}` : ""}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {formatVisitTime(visit.encounter_datetime)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
          </div>
        </button>
      ))}
    </div>
  );
}

function DoctorVisitDetail({ visit, onBack }) {
  const { t, locale } = usePatientLanguage();
  const [notes, setNotes] = useState(null);
  const ar = useDoctorTextAr(visit.patient_id, (notes || []).map((n) => n.diagnosis));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ClinicalNote.filter(
          { patient_id: visit.patient_id, encounter_id: visit.id },
          "-date"
        );
        setNotes(data);
      } catch (err) {
        console.error(err);
        setNotes([]);
      }
    };
    load();
  }, [visit.id]);

  const openPdf = (note) => {
    const doc = generateClinicalNotePdf(note);
    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="rtl:flex-row-reverse">
        <ChevronLeft className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to Visits")}
      </Button>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="font-semibold">{t("Dr.")} {visit.doctor_name}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {visit.hospital}{visit.department ? ` · ${visit.department}` : ""}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {formatVisitTime(visit.encounter_datetime)}
        </p>
        {visit.chief_complaint && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">{t("Visit Notes")}</p>
            <p className="text-sm mt-1">{ar(visit.chief_complaint)}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          {t("Doctor's Clinical Notes")}
        </p>
        {notes === null ? (
          <div className="flex items-center py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Loading...")}
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            {t("No clinical notes for this visit")}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{note.document_type_label || t("Clinical Note")}</p>
                  <Button variant="outline" size="sm" onClick={() => openPdf(note)}>
                    <FileText className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                    {t("View PDF")}
                  </Button>
                </div>
                {note.diagnosis && <NoteField label={t("Diagnosis")} value={ar(note.diagnosis)} />}
                {note.history && <NoteField label={t("History")} value={ar(note.history)} />}
                {note.physical_examination && <NoteField label={t("Physical Examination")} value={ar(note.physical_examination)} />}
                {note.notes && <NoteField label={t("Notes")} value={ar(note.notes)} />}
                {note.prescription && <NoteField label={t("Prescription")} value={ar(note.prescription)} />}
                {note.recommendations && <NoteField label={t("Recommendations")} value={ar(note.recommendations)} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function formatVisitTime(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch (err) {
    return dt;
  }
}