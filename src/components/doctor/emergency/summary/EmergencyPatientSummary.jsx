import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Info, Loader2 } from "lucide-react";
import DoctorPatientRecordView from "@/components/doctor/DoctorPatientRecordView";
import EmergencyIdentityHeader from "./EmergencyIdentityHeader";
import EmergencyCriticalOverview from "./EmergencyCriticalOverview";
import EmergencyAllergySection from "./EmergencyAllergySection";
import EmergencyMedicationSection from "./EmergencyMedicationSection";
import EmergencyProblemSection from "./EmergencyProblemSection";
import EmergencyProcedureSection from "./EmergencyProcedureSection";
import EmergencyImmunizationSection from "./EmergencyImmunizationSection";
import EmergencyVitalsSection from "./EmergencyVitalsSection";
import EmergencyTransfusionSection from "./EmergencyTransfusionSection";
import EmergencyPregnancySection from "./EmergencyPregnancySection";
import EmergencySocialSection from "./EmergencySocialSection";
import EmergencyAdvanceCareSection from "./EmergencyAdvanceCareSection";
import EmergencyRecentSection from "./EmergencyRecentSection";
import EmergencySummaryActions from "./EmergencySummaryActions";
import EmergencyCachedSnapshot from "./EmergencyCachedSnapshot";

const errText = (err) =>
  (err && err.response && err.response.data && err.response.data.error) || (err && err.message) || "The emergency summary could not be retrieved.";

// The Emergency Patient Summary. It appears automatically once patient-specific
// emergency access is granted and is assembled server-side for this session only.
export default function EmergencyPatientSummary({ record, doctorProfile, onStartEncounter }) {
  const sessionId = record?.session_id;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fullPatient, setFullPatient] = useState(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("emergencyPatientSummary", { session_id: sessionId });
      setSummary(res.data.summary);
    } catch (err) {
      setError(errText(err));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadPatient = async () => {
    const rows = await base44.entities.PatientProfile.filter({ id: summary?.identity?.patient_id });
    return rows[0] || null;
  };

  const handleEncounter = async () => {
    setActionError("");
    setBusy(true);
    try {
      const patient = await loadPatient();
      if (!patient) throw new Error("The patient profile could not be opened.");
      if (!onStartEncounter) throw new Error("Open the patient from the doctor portal to start an encounter.");
      onStartEncounter(patient);
    } catch (err) {
      setActionError(err.message || "The emergency encounter could not be started.");
    } finally {
      setBusy(false);
    }
  };

  const handleFullRecord = async () => {
    setActionError("");
    setBusy(true);
    try {
      const patient = await loadPatient();
      if (!patient) throw new Error("The patient profile could not be opened.");
      setFullPatient(patient);
    } catch (err) {
      setActionError(err.message || "The full record could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Assembling the Emergency Patient Summary…
      </div>
    );
  }

  if (!summary) {
    return <EmergencyCachedSnapshot record={record} reason={error} onRetry={load} busy={loading} />;
  }

  if (fullPatient) {
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setFullPatient(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Emergency Patient Summary
        </Button>
        <DoctorPatientRecordView patient={fullPatient} onBack={() => setFullPatient(null)} doctorProfile={doctorProfile} />
      </div>
    );
  }

  const statusOf = (key) => (summary.sections || []).find((s) => s.key === key)?.status;
  const metaOf = (key) => (summary.sections || []).find((s) => s.key === key);
  const missing = (summary.sections || []).filter((s) => s.status === "not_documented").map((s) => s.label);
  const hasAnyHistory = (summary.sections || []).some((s) => ["documented", "outdated"].includes(s.status));

  return (
    <div className="space-y-3">
      <EmergencyIdentityHeader identity={summary.identity} meta={summary.meta} />
      <EmergencyCriticalOverview critical={summary.critical} allergies={summary.allergies} />

      {(summary.meta?.unavailable_sources || []).length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not be retrieved at this time: {(summary.meta.unavailable_sources || []).join(", ")}. Those sections are not confirmed as empty.</span>
        </div>
      )}

      <div className="space-y-2">
        <EmergencyAllergySection data={summary.allergies} section={metaOf("allergies")} />
        <EmergencyMedicationSection data={summary.medications} section={metaOf("medications")} />
        <EmergencyProblemSection data={summary.problems} section={metaOf("problems")} />
        <EmergencyProcedureSection data={summary.procedures} section={metaOf("procedures")} />
        <EmergencyImmunizationSection data={summary.immunizations} section={metaOf("immunizations")} />
        <EmergencyVitalsSection data={summary.vitals} onDocumentVitals={handleEncounter} />
        <EmergencyTransfusionSection data={summary.transfusion} />
        <EmergencyPregnancySection data={summary.womens_health} />
        <EmergencySocialSection data={summary.social} section={metaOf("social")} />
        <EmergencyAdvanceCareSection data={summary.advance_care} />
        <EmergencyRecentSection data={summary.recent} />
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
        <p className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {hasAnyHistory
              ? `Not documented for this patient: ${missing.length ? missing.join(", ") : "nothing further"}. An empty section means no record exists in AMedix, not that the finding is negative.`
              : summary.meta?.empty_statement}
          </span>
        </p>
        <p>
          Status: {statusOf("allergies") === "no_known_allergies" ? "allergies explicitly assessed as none" : `allergy status ${statusOf("allergies")}`} · Summary version{" "}
          {summary.meta?.summary_version} · {summary.interoperability?.standard}
        </p>
        <p>{summary.access_policy}</p>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {actionError}
        </div>
      )}

      <EmergencySummaryActions
        authorized={summary.full_record_authorized === true}
        onStartEncounter={handleEncounter}
        onOpenFullRecord={handleFullRecord}
        busy={busy}
      />
    </div>
  );
}