import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MessageComposer from "@/components/messaging/MessageComposer";
import { ArrowLeft, Building2, Loader2, Search, ShieldCheck, Stethoscope } from "lucide-react";
import { initials } from "@/lib/messaging";

// Start a private doctor ↔ doctor conversation. The server re-verifies that both
// accounts are verified doctors — this list can never widen access by itself.
export default function NewDoctorMessage({ onClose, onSent }) {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "doctorDirectory", search });
        if (!cancelled) setDoctors(res.data.doctors || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || "The doctor directory is unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  const submit = async (text, attachments) => {
    if (!target) { setError("Select the doctor you are writing to."); return; }
    if (!subject.trim()) { setError("Enter a subject for the conversation."); return; }
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "send",
        channel: "doctor",
        peer_user_id: target.doctor_user_id,
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
          <p className="font-heading text-sm font-semibold">New colleague message</p>
          <p className="text-[11px] text-muted-foreground">Verified doctors across AMedix — two-way and private.</p>
        </div>
        <span className="flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
          <ShieldCheck className="w-3 h-3" /> Verified only
        </span>
      </div>

      <div className="space-y-3 p-4">
        {error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>}

        {target ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {initials(target.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{target.full_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {[target.specialization, target.hospital].filter(Boolean).join(" · ")}
              </p>
            </div>
            <button onClick={() => setTarget(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Change</button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, specialty or hospital…" className="pl-8" />
            </div>
            <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {loading && (
                <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
              )}
              {!loading && doctors.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">No verified doctor matches that search.</p>
              )}
              {!loading && doctors.map((d) => (
                <button
                  key={d.doctor_id}
                  onClick={() => setTarget(d)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                    {initials(d.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {d.full_name}
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Verified and active doctor" />
                    </p>
                    <p className="flex items-center gap-2 truncate text-[11px] text-muted-foreground">
                      {d.specialization && <span className="inline-flex items-center gap-1"><Stethoscope className="w-3 h-3" />{d.specialization}</span>}
                      {d.hospital && <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{d.hospital}</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="doctor-msg-subject">Subject</Label>
          <Input
            id="doctor-msg-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Cardiology opinion on a shared case"
          />
        </div>
      </div>

      <MessageComposer
        onSend={submit}
        sending={sending}
        disabled={!target}
        placeholder={target ? `Write your message to ${target.full_name}…` : "Select a doctor first…"}
      />
    </div>
  );
}