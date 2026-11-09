import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Info, Loader2, Search, User } from "lucide-react";
import ConversationThread from "@/components/messaging/ConversationThread";
import NewPatientMessage from "@/components/doctor/messaging/NewPatientMessage";
import useMessagingChannel from "@/hooks/useMessagingChannel";
import { formatMessageTime, initials } from "@/lib/messaging";

// Doctor → patient: strictly one-way. Only patients who have granted this doctor
// access to their record are listed, and the server re-checks that relationship
// on every send. The patient can never reply in this channel.
export default function PatientsChannel() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [compose, setCompose] = useState(null);
  const [error, setError] = useState("");

  const channel = useMessagingChannel({ channel: "patient" });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "patientDirectory", search });
        if (!cancelled) setPatients(res.data.patients || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || "The patient list is unavailable.");
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  // Each patient has one continuous message history; the row shows its latest
  // message so the doctor can see what was last sent.
  const rows = useMemo(() => {
    const byPatient = new Map();
    channel.threads.forEach((t) => { if (t.patient_id) byPatient.set(t.patient_id, t); });
    return patients.map((p) => ({ patient: p, thread: byPatient.get(p.patient_id) || null }));
  }, [patients, channel.threads]);

  const openPatient = (row) => {
    setError("");
    if (row.thread) {
      setCompose(null);
      channel.openThread(row.thread);
    } else {
      channel.clearSelection();
      setCompose(row.patient);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-base font-semibold">Patient Messages</h2>
          <p className="text-[11px] text-muted-foreground">One-way — the patient receives and reads, and cannot reply here.</p>
        </div>
        <span className="flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
          <Info className="w-3 h-3" /> Strictly one-way
        </span>
      </div>

      {(error || channel.error) && (
        <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error || channel.error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className={`min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card ${channel.selected || compose ? "hidden lg:block" : ""}`}>
          <div className="border-b border-border p-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients by name or CIN…"
                className="pl-8"
              />
            </div>
            <p className="mt-1.5 px-0.5 text-[10px] text-muted-foreground">Patients who granted you access to their record.</p>
          </div>
          <div className="max-h-[510px] overflow-y-auto">
            {loadingPatients && (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            )}
            {!loadingPatients && rows.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No patients have granted you access yet, so there is nobody to message.
              </p>
            )}
            {rows.map(({ patient, thread }) => {
              const active = channel.selected?.patient_id === patient.patient_id || compose?.patient_id === patient.patient_id;
              const unread = thread?.patient_unread_count || 0;
              return (
                <button
                  key={patient.patient_id}
                  onClick={() => openPatient({ patient, thread })}
                  className={`flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors ${active ? "bg-accent" : "hover:bg-muted/60"}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                    {initials(patient.full_name) || <User className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${unread > 0 ? "font-semibold" : "font-medium"}`}>{patient.full_name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {thread ? formatMessageTime(thread.last_activity_datetime) : ""}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {patient.cin ? `CIN ${patient.cin}` : ""}
                      {thread?.last_message_preview ? ` · ${thread.last_message_preview}` : " · No messages yet"}
                    </span>
                    {thread && (
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className="rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          {unread > 0 ? "Not yet read" : "Read by patient"}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`min-h-[420px] ${channel.selected || compose ? "" : "hidden lg:block"}`}>
          {compose ? (
            <NewPatientMessage
              patient={compose}
              onClose={() => setCompose(null)}
              onSent={(thread) => { setCompose(null); channel.openThread(thread); }}
            />
          ) : channel.selected ? (
            <ConversationThread
              thread={channel.threadMeta.thread || channel.selected}
              messages={channel.messages}
              audit={channel.audit}
              side="doctor"
              oneWay
              counterpart={channel.threadMeta.counterpart}
              sending={channel.sending}
              onSend={(text, attachments) => channel.send({ body: text, attachments })}
              onBack={channel.clearSelection}
              composerPlaceholder="Send another instruction to this patient…"
            />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="text-sm font-medium">Select a patient</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Send follow-up instructions, appointment reminders, medication guidance or preparation notes. The patient cannot reply in this channel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}