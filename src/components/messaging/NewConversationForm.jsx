import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import MessageComposer from "@/components/messaging/MessageComposer";
import { MESSAGING_CATEGORIES } from "@/lib/messaging";

// Opening a new conversation. The server re-verifies the hospital–doctor
// affiliation; this form can never widen access by itself.
export default function NewConversationForm({ mode, hospitals = [], doctors = [], defaultDoctor, onClose, onCreated }) {
  const [hospitalUserId, setHospitalUserId] = useState(hospitals[0]?.hospital_user_id || "");
  const [doctorId, setDoctorId] = useState(defaultDoctor?.doctor_id || doctors[0]?.doctor_id || "");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general_administration");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (text, attachments) => {
    setError("");
    if (!subject.trim()) {
      setError("Enter a subject for the conversation.");
      return;
    }
    if (mode === "doctor" && !hospitalUserId) {
      setError("Select the hospital you are writing to.");
      return;
    }
    if (mode === "hospital" && !doctorId) {
      setError("Select the doctor you are writing to.");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "send",
        thread_id: "",
        subject: subject.trim(),
        category,
        body: text,
        attachments,
        ...(mode === "doctor" ? { hospital_user_id: hospitalUserId } : { doctor_id: doctorId }),
      });
      onCreated(res.data.thread);
    } catch (e) {
      setError(e?.response?.data?.error || "The conversation could not be started.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-heading text-sm font-semibold">New Conversation</h3>
      </div>
      <div className="space-y-3 p-4">
        {mode === "doctor" ? (
          <div>
            <Label className="text-xs">Hospital</Label>
            <select
              value={hospitalUserId}
              onChange={(e) => setHospitalUserId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select hospital…</option>
              {hospitals.map((h) => (
                <option key={h.hospital_user_id || h.hospital_name} value={h.hospital_user_id}>
                  {h.hospital_name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <Label className="text-xs">Doctor</Label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  Dr. {d.doctor_name} — {d.specialization || "General"}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="text-xs">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. On-call rota for next week" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {MESSAGING_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-critical">{error}</p>}
      </div>
      <MessageComposer
        onSend={submit}
        sending={sending}
        placeholder="Write the first message…"
      />
    </div>
  );
}