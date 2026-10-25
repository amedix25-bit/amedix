import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CalendarCheck, CalendarDays, CalendarPlus, CheckCircle2, Loader2 } from "lucide-react";

const CHIP = {
  completed: "bg-green-100 text-green-800 border-green-200",
  due_now: "bg-blue-100 text-blue-800 border-blue-200",
  due_soon: "bg-amber-100 text-amber-800 border-amber-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  upcoming: "bg-muted text-muted-foreground border-border",
  awaiting_dating: "bg-muted text-muted-foreground border-border",
};
const LABEL = {
  completed: "Completed",
  due_now: "Due now",
  due_soon: "Due soon",
  overdue: "Missed / overdue",
  upcoming: "Upcoming",
  awaiting_dating: "Awaiting dating",
};

// WHO eight-contact antenatal schedule tracking. Completed contacts, the next
// recommended contact, upcoming appointments and missed / overdue contacts.
// A contact is completed ONLY when the qualifying encounter is documented —
// reminders and ordered tests never complete a contact.
export default function AntenatalContacts({ contacts, upcomingAppointments, onRecordContact, busyContact }) {
  const [dialog, setDialog] = useState(null); // { contact_no, additional } | "additional"
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const openDialog = (entry) => {
    setDialog(entry); setEvidence(""); setNotes(""); setReason("");
  };

  const submit = () => {
    if (!evidence.trim()) return;
    const additional = dialog === "additional" || dialog.additional;
    onRecordContact(
      {
        contact_no: dialog === "additional" ? null : dialog.contact_no,
        additional,
        additional_reason: additional ? reason.trim() : "",
        encounter_evidence: evidence.trim(),
        notes: notes.trim(),
      },
      dialog
    );
  };

  if (!contacts) return null;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" /> Antenatal contacts</h4>
        <div className="flex items-center gap-2">
          {contacts.overdue_count > 0 && (
            <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-semibold">{contacts.overdue_count} missed / overdue</span>
          )}
          <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">{contacts.completed_count} of {contacts.total} completed</span>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openDialog("additional")}>
            <CalendarPlus className="w-3.5 h-3.5" /> Additional contact
          </Button>
        </div>
      </div>

      {contacts.next && contacts.next.state !== "completed" && (
        <div className={`rounded-lg border p-3 mb-3 text-sm ${contacts.next.state === "overdue" ? "border-red-300 bg-red-50 text-red-900" : contacts.next.state === "due_now" ? "border-blue-300 bg-blue-50 text-blue-900" : "border-border bg-muted/40"}`}>
          <span className="font-semibold">Next recommended contact:</span> {contacts.next.label}
          {contacts.next.state !== "awaiting_dating" && <span className="ml-1">({LABEL[contacts.next.state]})</span>}
        </div>
      )}

      <div className="space-y-1.5">
        {contacts.contacts.map((c) => (
          <div key={c.contact_no} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
            <span className="text-sm font-medium flex-1 min-w-[160px]">{c.label}</span>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${CHIP[c.state]}`}>{LABEL[c.state]}</span>
            {c.completed && (
              <span className="text-xs text-muted-foreground w-full">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-green-700" />
                Documented {new Date(c.completed.completed_datetime).toLocaleDateString()} · {c.completed.completed_by_name}
                {c.completed.encounter_evidence ? ` · Evidence: ${c.completed.encounter_evidence}` : ""}
              </span>
            )}
            {!c.completed && ["due_now", "due_soon", "overdue"].includes(c.state) && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={busyContact === c.contact_no}
                onClick={() => openDialog({ contact_no: c.contact_no, additional: false })}>
                {busyContact === c.contact_no ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CalendarDays className="w-3.5 h-3.5" /> Document contact</>}
              </Button>
            )}
          </div>
        ))}
      </div>

      {contacts.additional.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Additional contacts (high-risk / clinical indication)</p>
          <div className="space-y-1.5">
            {contacts.additional.map((c, i) => (
              <div key={i} className="rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-medium">Additional contact #{c.contact_no}</span> · {new Date(c.completed_datetime).toLocaleDateString()} · {c.completed_by_name}
                {c.reason && <span className="text-xs text-muted-foreground block">Indication: {c.reason}</span>}
                {c.encounter_evidence && <span className="text-xs text-muted-foreground block">Evidence: {c.encounter_evidence}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(upcomingAppointments || []).length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Upcoming appointments</p>
          <div className="space-y-1">
            {upcomingAppointments.map((a) => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.date}{a.time ? ` ${a.time}` : ""} — {a.reason || "Antenatal appointment"}{a.doctor_name ? ` · ${a.doctor_name}` : ""}</p>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(v) => { if (!v) setDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {dialog === "additional" ? "Document an additional contact" : `Document contact ${dialog?.contact_no} as completed`}
            </DialogTitle>
          </DialogHeader>
          {dialog === "additional" && (
            <p className="text-xs text-muted-foreground -mt-1 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              Additional contacts are supported for high-risk pregnancies and other clinical indications — the indication is required and documented.
            </p>
          )}
          {dialog !== "additional" && (
            <p className="text-xs text-muted-foreground -mt-1">The contact counts as completed only when the qualifying encounter is documented here. Reminders and ordered tests do not complete a contact.</p>
          )}
          <div className="space-y-3">
            {dialog === "additional" && (
              <div>
                <Label className="text-xs">Clinical indication <span className="text-red-600">required</span></Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. high-risk pregnancy — hypertension surveillance" className="mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs">Encounter evidence <span className="text-red-600">required</span></Label>
              <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="e.g. CN-20260916-8F3K / ENC-20260916-8F3K / documented review" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={submit}
              disabled={busyContact != null || !evidence.trim() || (dialog === "additional" && !reason.trim())}>
              {busyContact != null && <Loader2 className="w-4 h-4 animate-spin" />} Document contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}