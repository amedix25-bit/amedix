import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

import GestationalAgeBanner from "@/components/doctor/antenatal/GestationalAgeBanner";
import AntenatalWindows from "@/components/doctor/antenatal/AntenatalWindows";
import AntenatalAutomations from "@/components/doctor/antenatal/AntenatalAutomations";
import AntenatalItemDialog from "@/components/doctor/antenatal/AntenatalItemDialog";
import AntenatalDatingForm from "@/components/doctor/antenatal/AntenatalDatingForm";
import AntenatalContacts from "@/components/doctor/antenatal/AntenatalContacts";
import AntenatalRiskCard from "@/components/doctor/antenatal/AntenatalRiskCard";
import AntenatalTracker from "@/components/doctor/antenatal/AntenatalTracker";
import AntenatalSummary from "@/components/doctor/antenatal/AntenatalSummary";
import { AlertTriangle, Baby, Loader2, Pencil, RefreshCw } from "lucide-react";

// Gestational-age-based antenatal care and screening — doctor side. Shows the
// prominent gestational age, the automated WHO / Libyan-protocol screening
// timeline (due / approaching / overdue items), computed risk flags and the
// dating editor. Data comes from the antenatalCare backend function, which
// enforces approved-doctor access and keeps the full audit trail.
export default function DoctorAntenatalSection({ patient, doctorProfile }) {
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const [busyContact, setBusyContact] = useState(null);
  const [busyAck, setBusyAck] = useState(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [dialog, setDialog] = useState(null); // { item, windowKey, mode }

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("antenatalCare", {
        action: "get_overview",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
      });
      setOv(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not load the antenatal record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patient.id]);

  // Completing an item opens the outcome dialog (an abnormal finding requires
  // a documented management / follow-up plan); ordering an imaging item opens
  // the link dialog so the request and its final report flow back to the
  // pregnancy record through the existing radiology workflow.
  const recordItem = (item, windowKey, status) => {
    if (status === "completed" || status === "status") {
      setDialog({ item, windowKey, mode: status });
      return;
    }
    if (status === "ordered" && item.category === "imaging") {
      setDialog({ item, windowKey, mode: "ordered" });
      return;
    }
    doRecord(item, windowKey, status, {});
  };

  const doRecord = async (item, windowKey, status, extras) => {
    setBusyKey(item.key);
    setError("");
    try {
      const effectiveStatus = extras.status || status;
      delete extras.status;
      await base44.functions.invoke("antenatalCare", {
        action: "record_item",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        item_key: item.key,
        item_label: item.label,
        window_key: windowKey,
        status: effectiveStatus,
        ...extras,
      });
      setDialog(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not record the item.");
    } finally {
      setBusyKey(null);
    }
  };

  // Documented clinical review of an abnormal / inconclusive result.
  const doReview = async (item, windowKey, extras) => {
    setBusyKey(item.key);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "review_item",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        item_key: item.key,
        ...extras,
      });
      setDialog(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not save the review.");
    } finally {
      setBusyKey(null);
    }
  };

  // Document a completed antenatal contact — requires the qualifying
  // encounter evidence; reminders and ordered tests never complete a contact.
  const doRecordContact = async (payload, dialogEntry) => {
    setBusyContact(dialogEntry === "additional" ? "additional" : dialogEntry.contact_no);
    setError("");
    try {
      const invoke = { action: "record_contact", patient_id: patient.id, doctor_id: doctorProfile?.id, ...payload };
      if (payload.contact_no == null) {
        // Additional contact: sequence number beyond the standard schedule.
        delete invoke.contact_no;
        invoke.contact_no = ov?.contacts?.next_additional_no || 9;
      }
      await base44.functions.invoke("antenatalCare", invoke);
      setDialog(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not document the contact.");
    } finally {
      setBusyContact(null);
    }
  };

  // Open the review dialog for an abnormal / inconclusive finding.
  const recordReview = (item, windowKey) => setDialog({ item, windowKey, mode: "review" });

  const doAck = async (ruleKey, actionTaken) => {
    setBusyAck(ruleKey);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "acknowledge_alert",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        rule_key: ruleKey,
        action_taken: actionTaken,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not acknowledge the alert.");
    } finally {
      setBusyAck(null);
    }
  };

  const saveRisk = async (level, reason, factorKeys) => {
    if (!level) return;
    setSavingRisk(true);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "set_risk_level",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        risk_level: level,
        reason,
        factor_keys: factorKeys,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not save the risk level.");
    } finally {
      setSavingRisk(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading antenatal record…</div>;
  }
  if (error && !ov) {
    return <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  }
  if (!ov) return null;
  const pregnancy = ov.pregnancy;

  if (!pregnancy) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Baby className="w-4 h-4" /> No active antenatal record for this patient yet. Start one by recording the pregnancy dating and obstetric history.</p>
        <AntenatalDatingForm patient={patient} initial={null} requireReason={false} onSaved={load} onCancel={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="rounded-xl border border-border p-4">
          <h4 className="font-semibold mb-3">Pregnancy dating and history</h4>
          <AntenatalDatingForm patient={patient} initial={pregnancy} requireReason onSaved={() => { setEditing(false); load(); }} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <GestationalAgeBanner dating={ov.dating} pregnancy={pregnancy} />
      )}

      {ov.flags.map((f) => (
        <div key={f.key} className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${f.severity === "high" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{f.message}</span>
        </div>
      ))}

      {!editing && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /> Update dating / history</Button>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh schedule</Button>
        </div>
      )}

      <AntenatalAutomations automations={ov.automations} onAcknowledge={doAck} busyAck={busyAck} />

      <AntenatalContacts contacts={ov.contacts} upcomingAppointments={ov.upcoming_appointments} onRecordContact={doRecordContact} busyContact={busyContact} />

      <AntenatalWindows schedule={ov.schedule} onRecordItem={recordItem} busyKey={busyKey} />

      <AntenatalTracker schedule={ov.schedule} onRecordStatus={recordItem} onReviewItem={recordReview} busyKey={busyKey} />

      <AntenatalItemDialog
        open={!!dialog}
        item={dialog?.item}
        mode={dialog?.mode}
        patientId={patient.id}
        doctorId={doctorProfile?.id}
        busy={dialog ? busyKey === dialog.item.key : false}
        onClose={() => setDialog(null)}
        onSubmit={(extras) => {
          if (dialog.mode === "review") doReview(dialog.item, dialog.windowKey, extras);
          else doRecord(dialog.item, dialog.windowKey, dialog.mode === "completed" ? "completed" : dialog.mode === "ordered" ? "ordered" : "status", extras);
        }}
      />

      <AntenatalRiskCard risk={ov.risk} pregnancy={pregnancy} onSave={saveRisk} savingRisk={savingRisk} />

      <AntenatalSummary patientId={patient.id} doctorId={doctorProfile?.id} />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}