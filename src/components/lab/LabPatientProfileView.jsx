import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import VisitStatusBadge from "@/components/lab/VisitStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { AlertCircle, ArrowLeft, Calendar, Droplet, FileText, Loader2, ShieldCheck, User } from "lucide-react";

// The authorized patient profile view — the SAME component and the SAME backend data
// for both the Lab Portal and the Lab Technician Portal. The backend refuses to
// return anything unless the patient explicitly authorized the laboratory.
export default function LabPatientProfileView({ session, patientId, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setData(null);
      setError(null);
      try {
        const payload = { patient_id: patientId };
        if (session) {
          payload.technician_id = session.technician_id;
          payload.session_token = session.session_token;
        }
        const res = await base44.functions.invoke("labGetPatientProfile", payload);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };
    load();
  }, [patientId, session]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium">{error}</p>
        {onBack && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading patient profile...
      </div>
    );
  }

  const { patient, requests, visits } = data;

  return (
    <div className="space-y-5">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{patient.patient_name}</h2>
            <p className="text-sm text-muted-foreground">CIN: {patient.patient_cin}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {patient.patient_dob && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> DOB: {patient.patient_dob}
                </span>
              )}
              {patient.patient_gender && <span className="capitalize">{patient.patient_gender}</span>}
              {patient.patient_blood_type && (
                <span className="inline-flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5" /> Blood: {patient.patient_blood_type}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Laboratory Requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No laboratory requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{r.request_ref}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested{" "}
                      {r.created_date ? new Date(r.created_date).toLocaleString() : r.date_requested}
                      {r.doctor_name ? ` · Dr. ${r.doctor_name}` : ""}
                    </p>
                  </div>
                  <LabStatusBadge status={normalizeLabStatus(r.status)} />
                </div>
                <p className="text-xs text-muted-foreground">Tests: {r.tests.join(", ") || "—"}</p>
                {r.pdf_url && (
                  <Button size="sm" variant="outline" onClick={() => window.open(r.pdf_url, "_blank")}>
                    <FileText className="w-4 h-4 mr-1" /> View Lab Request PDF
                  </Button>
                )}
                {r.status === "results" && (
                  <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                    <p className="text-xs font-semibold">Laboratory Results</p>
                    {r.result_file_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(r.result_file_url, "_blank")}
                      >
                        <FileText className="w-4 h-4 mr-1" /> Results PDF
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Results file unavailable.</p>
                    )}
                    {r.date_completed && (
                      <p className="text-xs text-muted-foreground">Completed: {r.date_completed}</p>
                    )}
                    {r.payment_amount && (
                      <p className="text-xs text-muted-foreground">Amount paid: {r.payment_amount}</p>
                    )}
                    {r.payment_method && (
                      <p className="text-xs text-muted-foreground">Payment method: {r.payment_method}</p>
                    )}
                    {r.result_submitted_by_name && (
                      <p className="text-xs text-muted-foreground">
                        Submitted by: {r.result_submitted_by_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {visits.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Laboratory Visits</h3>
          <div className="space-y-2">
            {visits.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{v.request_ref || "Lab visit"}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.request_date || ""}
                    {v.results_ready_at
                      ? ` · Results ready ${new Date(v.results_ready_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VisitStatusBadge status={v.status} />
                  {v.result_file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(v.result_file_url, "_blank")}
                    >
                      Results PDF
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" /> This information is visible only because the patient
        authorized this laboratory. All access is logged.
      </p>
    </div>
  );
}