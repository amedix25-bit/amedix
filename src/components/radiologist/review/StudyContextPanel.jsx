import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, GitCompare, ShieldAlert } from "lucide-react";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="pt-3 border-t border-border space-y-2.5 first:border-0 first:pt-0">
      <p className="text-xs font-bold text-foreground/80">{title}</p>
      {children}
    </div>
  );
}

function ageFrom(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d)) return "";
  const diff = Date.now() - d.getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} yrs`;
}

// Left panel — patient and clinical context for interpretation. Only the
// authorized minimum is shown (served by the radiologyStudyContext endpoint),
// never the entire patient record.
export default function StudyContextPanel({ request, patient, conditions, priorStudies, priorResults, onLoadComparison }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-0 overflow-y-auto xl:max-h-[calc(100vh-220px)]">
      <Section title="Patient">
        <Field label="Name" value={patient?.full_name || request.patient_name} />
        <Field label="CIN" value={patient?.cin || request.patient_cin} />
        <Field label="Age / Sex" value={[ageFrom(patient?.date_of_birth), patient?.gender].filter(Boolean).join(" · ")} />
        <Field label="Blood Type" value={patient?.blood_type} />
      </Section>

      <Section title="Study">
        <Field label="Request Reference" value={request.request_id} />
        {request.encounter_id && <Field label="Encounter" value={request.encounter_id} />}
        <Field label="Examination" value={`${request.scan_type} — ${request.examination}`} />
        <Field label="Scheduled" value={request.scheduled_datetime ? new Date(request.scheduled_datetime).toLocaleString() : ""} />
        <Field label="Examination Completed" value={request.performed_datetime ? new Date(request.performed_datetime).toLocaleString() : ""} />
        <Field label="Preparation Notes" value={request.preparation_notes} />
      </Section>

      <Section title="Referral">
        <Field label="Referring Doctor" value={request.doctor_name} />
        <Field label="Specialty" value={request.doctor_specialization} />
        <Field label="Facility" value={request.routed_hospital || request.doctor_hospital} />
        <Field label="Requested On" value={request.request_datetime ? new Date(request.request_datetime).toLocaleString() : ""} />
      </Section>

      <Section title="Clinical Information">
        <Field label="Clinical Indication" value={request.clinical_indication} />
        <Field label="Working Diagnosis / Clinical Question" value={request.working_diagnosis} />
      </Section>

      <Section title="Safety Information">
        {patient?.allergies && (
          <div className="flex items-start gap-1.5 rounded-lg bg-red-500/10 p-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 whitespace-pre-wrap">Allergies: {patient.allergies}</p>
          </div>
        )}
        <Field label="Contrast" value={request.contrast} />
        <Field label="Contrast Allergy" value={request.contrast_allergy} />
        <Field label="Previous Contrast Reaction" value={request.previous_contrast_reaction} />
        {(request.mri_metal_implant || request.mri_pacemaker || request.mri_other_device || request.mri_metallic_foreign_body || request.mri_other_concern) && (
          <>
            <Field label="Metal / Metallic Implant" value={request.mri_metal_implant} />
            <Field label="Pacemaker / Cardiac Device" value={request.mri_pacemaker} />
            <Field label="Other Implanted Device" value={request.mri_other_device} />
            <Field label="Metallic Foreign Body (eye)" value={request.mri_metallic_foreign_body} />
            {request.mri_other_concern && <Field label="Other MRI Concern" value={request.mri_other_concern} />}
          </>
        )}
      </Section>

      {conditions && conditions.length > 0 && (
        <Section title="Relevant Medical History">
          {conditions.map((c, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{c.name}</span>
              {c.category && <span className="text-muted-foreground text-xs"> · {c.category === "known_case" ? "Known case" : "Past history"}</span>}
              {c.date && <span className="text-muted-foreground text-xs"> · {c.date}</span>}
              {c.details && <p className="text-xs text-muted-foreground">{c.details}</p>}
            </div>
          ))}
        </Section>
      )}

      {(priorStudies?.length > 0 || priorResults?.length > 0) && (
        <Section title="Previous Imaging">
          {priorStudies.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-2.5 space-y-1.5">
              <p className="text-sm font-medium">{p.scan_type} — {p.examination}</p>
              <p className="text-xs text-muted-foreground">
                {p.request_id} · {p.finalized_datetime ? new Date(p.finalized_datetime).toLocaleDateString() : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(p.images || []).length > 0 && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onLoadComparison(p)}>
                    <GitCompare className="w-3 h-3 mr-1" /> Compare Images
                  </Button>
                )}
                {p.report && (
                  <span className="text-xs text-muted-foreground self-center line-clamp-1 max-w-[180px]" title={p.report}>
                    {p.report.slice(0, 60)}…
                  </span>
                )}
                {p.report_file_url && (
                  <a href={p.report_file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" /> Report
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
          {priorResults.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-2.5 space-y-1">
              <p className="text-sm font-medium">{r.scan_type}{r.examination ? ` — ${r.examination}` : ""}</p>
              <p className="text-xs text-muted-foreground">
                {r.date_completed ? new Date(r.date_completed).toLocaleDateString() : ""}
                {r.radiologist_name ? ` · Dr. ${r.radiologist_name}` : ""}
              </p>
              {r.report_pdf_url && (
                <a href={r.report_pdf_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open report PDF
                </a>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}