import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PatientHealth from "@/components/patient/PatientHealth";
import DoctorPatientLabResultsView from "@/components/doctor/DoctorPatientLabResultsView";
import PatientDocumentsList from "@/components/documents/PatientDocumentsList";
import { Stethoscope, Image as ImageIcon, FlaskConical, CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import resolveClinicalFile from "@/lib/clinicalFileUrl";
import resolveRadiologyFile from "@/lib/radiologyFileUrl";

const ICONS = {
  seen: <Stethoscope className="w-4 h-4" />,
  imaging: <ImageIcon className="w-4 h-4" />,
  lab: <FlaskConical className="w-4 h-4" />,
  appointment: <CalendarDays className="w-4 h-4" />,
};

// Patient History column of the patient profile. Shows the full medical history
// (diagnoses, medications, allergies, surgeries, lifestyle), then a single
// chronological timeline of encounters, imaging, laboratory results and
// previous appointments — newest first — followed by the patient-submitted
// laboratory results.
export default function DoctorPatientHistorySection({ patient }) {
  const [events, setEvents] = useState(null);
  // The authorized clinical payload — the doctor cannot read the patient's
  // condition, allergy, medication, surgical, family-history or note records
  // directly, so every section is fed from this one verified backend read.
  const [recordData, setRecordData] = useState(null);
  // Significant medical events the patient reported at registration.
  const [reportedEvents, setReportedEvents] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(async () => {
    setReloadKey((v) => v + 1);
  }, []);

  useEffect(() => {
    // Switching patient clears the previous patient's record immediately, so
    // nothing from the patient just closed is visible while the next loads.
    setEvents(null);
    setRecordData(null);
    setReportedEvents([]);
    let cancelled = false;
    const load = async () => {
      if (!patient?.id) return;
      try {
        const [payload, appts] = await Promise.all([
          base44.functions.invoke("doctorPatientMedicalData", { patient_id: patient.id }),
          base44.entities.Appointment.filter({ patient_id: patient.id }),
        ]);
        if (cancelled) return;
        const data = payload.data || {};
        setRecordData(data);
        const history = data.medical_history || [];
        setReportedEvents(data.medical_events || []);
        const imaging = data.imaging || [];
        const labs = data.lab_results || [];
        setEvents(
          [
            ...history.map((h) => ({
              id: `h-${h.id}`,
              kind: "seen",
              date: h.date,
              title: `Seen by ${h.doctor_name}${h.location ? ` — ${h.location}` : ""}`,
              detail: h.appointment_reason || h.status || "",
            })),
            ...imaging.map((r) => ({
              id: `i-${r.id}`,
              kind: "imaging",
              date: r.date_requested,
              title: `Imaging: ${r.scan_type}${r.examination ? ` — ${r.examination}` : ""}`,
              detail: `Requested by ${r.doctor_name || "—"}${r.status ? ` · ${r.status}` : ""}`,
              url: r.pdf_url,
              file: r.pdf_url ? { kind: "radiology", id: r.id } : null,
            })),
            ...labs.map((l) => ({
              id: `l-${l.id}`,
              kind: "lab",
              date: l.test_date,
              title: `Laboratory Result: ${l.test_type}`,
              detail: l.lab_name ? `Performed at ${l.lab_name}` : "",
              url: l.file_url,
              file: l.file_url ? { kind: "patient_lab_result", id: l.id } : null,
            })),
            ...appts.map((a) => ({
              id: `a-${a.id}`,
              kind: "appointment",
              date: a.date,
              title: `Appointment with ${a.doctor_name || "doctor"}`,
              detail: [a.time, a.status, a.patient_response].filter(Boolean).join(" · "),
            })),
          ].sort((x, y) => (y.date || "").localeCompare(x.date || ""))
        );
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setEvents([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [patient?.id, reloadKey]);

  return (
    <div className="space-y-6">
      <PatientHealth
        profile={patient}
        doctorView
        registrationEvents={reportedEvents}
        doctorData={recordData}
        onRefreshData={reload}
      />

      <PatientDocumentsList
        documents={(recordData?.documents || []).filter((d) => !d.doctor_id)}
        title="Reports & Documents added by the patient"
        emptyText="No documents added by the patient yet."
        limit={50}
      />

      <div>
        <h4 className="font-semibold text-sm mb-3">Chronological History</h4>
        {events === null ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recorded history yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {ICONS[e.kind]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium flex flex-wrap items-center gap-2">
                    {e.title}
                    <span className="text-xs font-normal text-muted-foreground">{e.date || "—"}</span>
                  </p>
                  {e.detail && <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>}
                  {e.url && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!e.url) return;
                        let url = e.url;
                        if (!/^https?:/i.test(e.url) && e.file) {
                          url = e.file.kind === "radiology"
                            ? await resolveRadiologyFile(e.file.id, e.url)
                            : await resolveClinicalFile(e.file.kind, e.file.id, e.url);
                        }
                        if (url) window.open(url, "_blank");
                      }}
                      className="text-xs text-primary underline inline-flex items-center gap-0.5 mt-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DoctorPatientLabResultsView patientId={patient.id} />
    </div>
  );
}