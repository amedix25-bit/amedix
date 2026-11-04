import React from "react";
import { Button } from "@/components/ui/button";
import { GitCompare, ShieldAlert } from "lucide-react";
import { ageFrom, formatDate, formatDateTime } from "@/lib/radiologistWorklist";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2 text-xs py-0.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right break-words font-medium">{value || "—"}</span>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="pt-2.5 mt-2.5 border-t border-border first:border-0 first:mt-0 first:pt-0 space-y-0.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/70 mb-1">{title}</p>
      {children}
    </div>
  );
}

// Left panel — patient and clinical context for interpretation, compact enough
// that the imaging workspace keeps the screen.
export default function CasePatientPanel({ request, patient, conditions, priorStudies, priorResults, onLoadComparison }) {
  const priors = priorStudies || [];
  const results = priorResults || [];
  return (
    <div className="rounded-xl border border-border bg-card p-3 overflow-y-auto lg:max-h-[calc(100vh-215px)]">
      <Block title="Patient">
        <Row label="Name" value={patient?.full_name || request.patient_name} />
        <Row label="CIN" value={<span className="font-mono">{patient?.cin || request.patient_cin}</span>} />
        <Row label="Age / Sex" value={[ageFrom(patient?.date_of_birth), patient?.gender].filter(Boolean).join(" · ")} />
        <Row label="Date of birth" value={patient?.date_of_birth ? formatDate(patient.date_of_birth) : ""} />
        <Row label="Blood type" value={patient?.blood_type} />
      </Block>

      <Block title="Imaging request">
        <Row label="Request" value={<span className="font-mono">{request.request_id}</span>} />
        <Row label="Examination" value={`${request.scan_type} — ${request.examination}`} />
        <Row label="Body region" value={request.body_part} />
        <Row label="Priority" value={request.priority} />
        <Row label="Requested" value={formatDateTime(request.request_datetime)} />
        <Row label="Performed" value={formatDateTime(request.performed_datetime)} />
        <Row label="Hospital" value={request.routed_hospital || request.doctor_hospital} />
        <Row label="Department" value={request.doctor_specialization || "Radiology"} />
      </Block>

      <Block title="Ordering doctor">
        <Row label="Doctor" value={request.doctor_name} />
        <Row label="Specialty" value={request.doctor_specialization} />
      </Block>

      <Block title="Clinical information">
        <p className="text-xs whitespace-pre-wrap">{request.clinical_indication || "No clinical indication recorded."}</p>
        {request.working_diagnosis && (
          <p className="text-[11px] text-muted-foreground mt-1">Working diagnosis: {request.working_diagnosis}</p>
        )}
      </Block>

      <Block title="Relevant medical history">
        {conditions && conditions.length ? (
          conditions.slice(0, 8).map((c, i) => (
            <p key={i} className="text-xs">
              <span className="font-medium">{c.name}</span>
              {c.date ? <span className="text-muted-foreground"> · {c.date}</span> : null}
              {c.details ? <span className="block text-[11px] text-muted-foreground">{c.details}</span> : null}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No recorded conditions.</p>
        )}
      </Block>

      <Block title="Previous imaging">
        {priors.length === 0 && results.length === 0 && (
          <p className="text-xs text-muted-foreground">No previous imaging on record.</p>
        )}
        {priors.slice(0, 5).map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-2 mb-1.5">
            <p className="text-xs font-medium">{p.scan_type} — {p.examination}</p>
            <p className="text-[11px] text-muted-foreground">
              {p.request_id} · {formatDate(p.finalized_datetime)}
            </p>
            {(p.images || []).length > 0 && (
              <Button size="sm" variant="outline" className="h-6 text-[11px] mt-1 px-2"
                onClick={() => onLoadComparison(p)}>
                <GitCompare className="w-3 h-3 mr-1" /> Compare
              </Button>
            )}
          </div>
        ))}
        {results.slice(0, 3).map((r) => (
          <p key={r.id} className="text-[11px] text-muted-foreground">
            {r.scan_type}{r.examination ? ` — ${r.examination}` : ""} · {formatDate(r.date_completed)}
          </p>
        ))}
      </Block>

      <Block title="Safety">
        {patient?.allergies && (
          <p className="text-[11px] rounded-md bg-red-500/10 text-red-700 p-1.5 flex items-start gap-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Allergies: {patient.allergies}
          </p>
        )}
        <Row label="Contrast" value={request.contrast} />
        <Row label="Contrast allergy" value={request.contrast_allergy} />
        <Row label="Previous reaction" value={request.previous_contrast_reaction} />
      </Block>
    </div>
  );
}