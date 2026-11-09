import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MessageComposer from "@/components/messaging/MessageComposer";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PATIENT_MESSAGE_TYPES } from "@/lib/messaging";

// Compose a one-way message to a patient under the doctor's authorized care.
// The care relationship is re-verified on the server before anything is stored.
export default function NewPatientMessage({ patient, onSent, onClose }) {
  const [messageType, setMessageType] = useState("follow_up");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const preset = PATIENT_MESSAGE_TYPES.find((t) => t.key === messageType);
    if (!subject.trim() && preset) setSubject(preset.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageType]);

  const submit = async (text, attachments) => {
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "send",
        channel: "patient",
        patient_id: patient.patient_id,
        patient_message_type: messageType,
        subject: subject.trim(),
        body: text,
        attachments,
      });
      onSent(res.data.thread);
    } catch (e) {
      setError(e?.response?.data?.error || "The message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground lg:hidden" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold">{patient.full_name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {patient.cin ? `CIN ${patient.cin} · ` : ""}One-way message from you to the patient
          </p>
        </div>
        <span className="flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
          <ShieldCheck className="w-3 h-3" /> One-way
        </span>
      </div>

      <div className="space-y-3 p-4">
        {error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="patient-msg-type">Message type</Label>
            <select
              id="patient-msg-type"
              value={messageType}
              onChange={(e) => { setMessageType(e.target.value); setSubject(""); }}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {PATIENT_MESSAGE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="patient-msg-subject">Subject</Label>
            <Input id="patient-msg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Shown in the patient's message list" />
          </div>
        </div>
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          The patient can read this message and its attachments in their portal, but cannot reply here. Messages are not for emergencies.
        </p>
      </div>

      <MessageComposer onSend={submit} sending={sending} placeholder="Write the instruction you want the patient to receive…" />
    </div>
  );
}