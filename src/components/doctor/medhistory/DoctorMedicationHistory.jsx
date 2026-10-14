import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle, Activity, ClipboardList } from "lucide-react";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import StopMedicationDialog from "@/components/doctor/medhistory/StopMedicationDialog";
import { useAppLanguage } from "@/lib/appLanguage";

// Status badge for the unified medication-history view.
const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_dispensing: "bg-amber-50 text-amber-700 border-amber-200",
  partially_dispensed: "bg-amber-50 text-amber-700 border-amber-200",
  fully_dispensed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  discontinued: "bg-slate-100 text-slate-600 border-slate-200",
  patient_reported: "bg-violet-50 text-violet-700 border-violet-200",
};

export function HistoryStatusBadge({ status }) {
  const style = STATUS_STYLES[status];
  if (!style) return null;
  return (
    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MedRow({ entry, onReconciled }) {
  const isOpen = entry.status?.is_active !== false;
  const [expanded, setExpanded] = useState(false);
  const med = entry;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold">{med.name}{med.dose ? ` · ${med.dose}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {med.active_ingredient ? `${med.active_ingredient} · ` : ""}
            {med.frequency || "—"}{med.duration ? ` · ${med.duration}` : ""} · {med.route || "oral"}
            {med.start_date ? ` · from ${med.start_date}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {med.source === "patient_reported" ? "Reported by the patient" : "Recorded by the doctor"}
            {med.reason ? ` · For: ${med.reason}` : ""}
            {med.stop_reason ? ` · Stopped: ${med.stop_reason}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {med.source === "patient_reported" && <HistoryStatusBadge status="patient_reported" />}
          <HistoryStatusBadge status={med.history_status} />
          {med.history_status === "active" && <StopMedicationDialog med={med} onDone={onReconciled} />}
        </div>
      </div>
      {med.patient_notes && <p className="text-xs text-muted-foreground mt-2">Patient note: {med.patient_notes}</p>}
    </div>
  );
}

function PrescriptionRow({ rx, onReconciled }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold">{rx.medication_name}{rx.strength ? ` ${rx.strength}` : ""}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rx.prescription_id} · {rx.active_ingredient || "—"} · {rx.dosage || "—"} · {rx.frequency || "—"} · {rx.route || "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prescribed by {rx.doctor_name || "—"} on {rx.date_prescribed} · Quantity {rx.quantity || "—"} · Refills {rx.refills_used || 0}/{rx.refills_authorized || 0}
          </p>
        </div>
        <PrescriptionStatusBadge status={rx.status} />
      </div>
      {rx.status === "cancelled" && (rx.cancellation_reason || rx.rejected_reason) && (
        <p className="text-xs text-destructive mt-2">
          Discontinued: {rx.cancellation_reason || rx.rejected_reason} ({rx.cancelled_by_name || rx.rejected_by_name || "—"})
        </p>
      )}
      <DispensingHistory prescription={rx} />
    </div>
  );
}

// Longitudinal medication history for one patient — prescribed, dispensed,
// discontinued and patient-reported medications in one place, with
// duplicate-therapy flags, dispensing traceability, adherence reports and
// reconciliation actions. Doctors review this during consultations,
// admissions and discharge.
export default function DoctorMedicationHistory({ patient, onReconciled }) {
  const { t } = useAppLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("patientMedicationHistory", { patient_id: patient.id });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load the medication history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading medication history...
      </div>
    );
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const { prescriptions, medications, duplicate_groups, adherence, dose_logs, feedback } = data;

  const isCurrentMed = (m) => m.history_status === "active";
  const isCurrentRx = (rx) => ["pending_dispensing", "partially_dispensed", "fully_dispensed"].includes(rx.history_status);
  const currentMeds = medications.filter(isCurrentMed);
  const currentRxs = prescriptions.filter(isCurrentRx);
  const pastMeds = medications.filter((m) => !isCurrentMed(m));
  const pastRxs = prescriptions.filter((rx) => !isCurrentRx(rx));

  const feedbackLabels = {
    side_effect: "Side effect",
    difficulty_following: "Difficulty following the plan",
    problem_obtaining: "Problem obtaining the medication",
    treatment_changed: "Treatment changed by clinician",
    treatment_stopped: "Treatment stopped by clinician",
  };

  return (
    <div className="space-y-6">
      {/* Duplicate-therapy flags from reconciliation */}
      {duplicate_groups.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Duplicate treatment flagged
          </p>
          {duplicate_groups.map((g) => (
            <p key={g.key} className="text-xs text-amber-800">
              {g.entries.map((e) => e.label + (e.kind === "medication" ? " (record)" : " (prescription)")).join(" + ")}
              {" — "}same active ingredient ({g.key}). Review whether the patient should stay on both.
            </p>
          ))}
        </div>
      )}

      {/* Adherence reports */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" />
          Adherence Reports
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Patient-reported doses from the last 30 days — distinct from pharmacy-confirmed dispensing. Dispensing proves collection, not that doses were taken.
        </p>
        {adherence.total > 0 ? (
          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
            <div className="rounded-lg border border-border p-2">
              <p className="font-bold text-emerald-700">{adherence.taken}</p>
              <p className="text-muted-foreground">Taken</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="font-bold text-amber-700">{adherence.missed}</p>
              <p className="text-muted-foreground">Missed</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="font-bold text-slate-600">{adherence.skipped}</p>
              <p className="text-muted-foreground">Skipped</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="font-bold">{adherence.rate !== null ? `${adherence.rate}%` : "—"}</p>
              <p className="text-muted-foreground">Adherence</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">No dose reports in the last 30 days.</p>
        )}
        {dose_logs.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent dose reports</p>
            {dose_logs.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-xs">
                <span>{d.medication_name}{d.scheduled_time ? ` · ${d.scheduled_time}` : ""} · {d.dose_date}</span>
                <span className={d.status === "taken" ? "text-emerald-700" : d.status === "missed" ? "text-amber-700" : "text-slate-600"}>
                  {d.status}
                  {d.notes ? ` · ${d.notes}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
        {feedback.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient reports</p>
            {feedback.slice(0, 8).map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-2 text-xs">
                <p className="font-medium">
                  {feedbackLabels[f.category] || f.category}
                  {f.severity ? ` · ${f.severity}` : ""} — {f.medication_name}
                </p>
                {f.details && <p className="text-muted-foreground mt-0.5">{f.details}</p>}
                <p className="text-muted-foreground mt-0.5">{new Date(f.reported_datetime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current */}
      <div>
        <p className="text-sm font-semibold flex items-center gap-1.5 mb-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Current Medications
        </p>
        {currentMeds.length === 0 && currentRxs.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border bg-card p-6 text-center">
            No current medications or in-flight prescriptions.
          </p>
        ) : (
          <div className="space-y-3">
            {currentRxs.map((rx) => <PrescriptionRow key={"rx-" + rx.id} rx={rx} />)}
            {currentMeds.map((m) => <MedRow key={"med-" + m.id} med={m} onReconciled={() => { load(); onReconciled?.(); }} />)}
          </div>
        )}
      </div>

      {/* Past — traceable, never deleted */}
      {(pastMeds.length > 0 || pastRxs.length > 0) && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">Past Medications (discontinued, completed and cancelled — fully traceable)</p>
          <div className="space-y-3 opacity-90">
            {pastRxs.map((rx) => <PrescriptionRow key={"rx-" + rx.id} rx={rx} />)}
            {pastMeds.map((m) => <MedRow key={"med-" + m.id} med={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}