import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RadiologistSubmitResults from "@/components/radiologist/RadiologistSubmitResults";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}

// Radiologist view of ONE specific imaging request the patient authorized.
// The read succeeds only through Row Level Security — the patient's acceptance
// added this radiologist's id to this request's authorized list. No other
// patient data (profile, history, notes, diagnoses, medications, labs) is
// ever loaded here.
export default function RadiologistImagingRequestDetail({ requestId, user, radiologistProfile, onBack }) {
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await base44.entities.ImagingRequest.get(requestId);
        setRequest(r);
      } catch (err) {
        console.error(err);
        setError("You are not authorized to view this imaging request.");
      }
    };
    load();
  }, [requestId, reloadKey]);

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center text-muted-foreground text-sm py-8">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading request...
      </div>
    );
  }

  const isMri = request.scan_type === "MRI";

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">{request.scan_type} — {request.examination}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {request.patient_name} · CIN: {request.patient_cin}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized by patient
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <Field label="Request Reference" value={request.request_id} />
          <Field label="Ordering Doctor" value={`${request.doctor_name}${request.doctor_specialization ? ` — ${request.doctor_specialization}` : ""}`} />
          <Field label="Priority" value={request.priority} />
          <Field label="Requested On" value={request.date_requested} />
          <Field label="Contrast" value={request.contrast} />
          {request.contrast_allergy && <Field label="Contrast Allergy" value={request.contrast_allergy} />}
          {request.previous_contrast_reaction && <Field label="Previous Contrast Reaction" value={request.previous_contrast_reaction} />}
          <Field label="Status" value={request.status} />
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <Field label="Clinical Indication" value={request.clinical_indication} />
          <Field label="Working Diagnosis / Clinical Question" value={request.working_diagnosis} />
        </div>

        {isMri && (
          <div className="pt-4 border-t border-border grid sm:grid-cols-2 gap-4">
            <Field label="Metal / Metallic Implant" value={request.mri_metal_implant} />
            <Field label="Pacemaker / Cardiac Device" value={request.mri_pacemaker} />
            <Field label="Other Implanted Device" value={request.mri_other_device} />
            <Field label="Metallic Foreign Body (eye)" value={request.mri_metallic_foreign_body} />
            {request.mri_other_concern && <Field label="Other MRI Concern" value={request.mri_other_concern} />}
          </div>
        )}

        {request.pdf_url && (
          <div className="pt-4 border-t border-border">
            <a href={request.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Written Request (PDF)
              </Button>
            </a>
          </div>
        )}

        {user && (
          <div className="pt-4 border-t border-border">
            <RadiologistSubmitResults
              request={request}
              user={user}
              radiologistProfile={radiologistProfile}
              onSubmitted={() => setReloadKey((k) => k + 1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}