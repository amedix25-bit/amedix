import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, AlertTriangle, Phone, MessageSquare, Mail, CheckCircle2, ArrowUpRight, CircleCheck, ShieldAlert,
} from "lucide-react";

const STATUS_STYLES = {
  notified: "bg-red-500/10 text-red-600",
  delivered: "bg-amber-500/15 text-amber-700",
  acknowledged: "bg-emerald-500/15 text-emerald-700",
  escalated: "bg-purple-500/15 text-purple-700",
  resolved: "bg-muted text-muted-foreground",
};
const STATUS_LABELS = {
  notified: "Alert Generated",
  delivered: "Delivered",
  acknowledged: "Acknowledged",
  escalated: "Escalated",
  resolved: "Resolved",
};
const METHODS = [
  ["in_app", "In-app notification"],
  ["phone", "Phone call"],
  ["messenger", "Messaging"],
  ["email", "Email"],
  ["other", "Other"],
];

// Critical findings communication (Phase 6) — the radiologist documents the
// communication of a critical finding with the responsible clinician. The
// trail distinguishes alert generated, delivered, clinician acknowledgment
// and escalation, and stays traceable even after the report is finalized.
// An in-app notification alone is never assumed sufficient — the clinician
// must acknowledge, and unacknowledged alerts escalate automatically.
export default function CriticalCommunicationPanel({ study, user, onChanged }) {
  const { toast } = useToast();
  const [logs, setLogs] = useState(null);
  const [busy, setBusy] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    finding_summary: "", recipient_name: study.doctor_name || "",
    notification_method: "phone", notes: "", escalation_hours: "24",
  });

  const load = async () => {
    try {
      const res = await base44.functions.invoke("radiologyCriticalComm", { action: "list", request_id: study.id });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  };

  useEffect(() => {
    if (study.is_critical) load();
  }, [study.id, study.is_critical]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key, fn, okTitle) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: okTitle });
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      toast({ title: "Action failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const create = () =>
    run("create", () => base44.functions.invoke("radiologyCriticalComm", {
      action: "create",
      request_id: study.id,
      ...form,
      escalation_hours: Number(form.escalation_hours) || 24,
    }), "Communication documented — awaiting clinician acknowledgment");

  const recordDelivery = (log) =>
    run(`d-${log.id}`, () => base44.functions.invoke("radiologyCriticalComm", {
      action: "record_delivery", log_id: log.id, delivery_method: log.notification_method,
    }), "Delivery recorded");

  const escalate = (log) =>
    run(`e-${log.id}`, () => base44.functions.invoke("radiologyCriticalComm", {
      action: "escalate", log_id: log.id,
    }), "Escalated — the responsible clinician will be contacted again");

  const resolve = (log) =>
    run(`r-${log.id}`, () => base44.functions.invoke("radiologyCriticalComm", {
      action: "resolve", log_id: log.id, note: "Closed by the radiology team.",
    }), "Communication resolved");

  if (!study.is_critical) return null;

  const spinner = (key) => busy === key && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />;
  const openLogs = (logs || []).filter((l) => ["notified", "delivered", "escalated"].includes(l.status));

  return (
    <div className="pt-3 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5 text-red-600">
          <ShieldAlert className="w-4 h-4" /> Critical Findings Communication
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(!showForm)}>
          Document Communication
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Critical Finding</Label>
            <Textarea rows={2} value={form.finding_summary} onChange={(e) => setForm({ ...form, finding_summary: e.target.value })}
              placeholder="Summarize the critical finding communicated..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Responsible Clinician</Label>
              <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Communication Method</Label>
              <Select value={form.notification_method} onValueChange={(v) => setForm({ ...form, notification_method: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Escalation Window (hours)</Label>
              <Input type="number" min="1" value={form.escalation_hours}
                onChange={(e) => setForm({ ...form, escalation_hours: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Communication Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Who was contacted, when, outcome..." />
            </div>
          </div>
          <Button size="sm" disabled={!!busy || !form.finding_summary.trim()} onClick={create}>
            {spinner("create")} Save Communication Record
          </Button>
        </div>
      )}

      {logs !== null && logs.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">
          The finding is flagged as critical — document the communication with the responsible clinician.
        </p>
      )}

      {(logs || []).map((log) => (
        <div key={log.id} className="rounded-lg border border-border p-3 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[log.status] || "bg-muted"}`}>
              {STATUS_LABELS[log.status] || log.status}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {log.notified_datetime ? new Date(log.notified_datetime).toLocaleString() : ""}
            </span>
          </div>
          <p className="text-sm font-medium whitespace-pre-wrap">{log.finding_summary}</p>
          <p className="text-xs text-muted-foreground">
            Recipient: {log.recipient_name || "—"} · Method: {log.notification_method}
            {log.escalation_level > 0 ? ` · escalated ×${log.escalation_level}` : ""}
          </p>
          {log.delivered_datetime && (
            <p className="text-xs text-muted-foreground">Delivered: {new Date(log.delivered_datetime).toLocaleString()}</p>
          )}
          {log.acknowledged_datetime ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1">
              <CircleCheck className="w-3.5 h-3.5" />
              Acknowledged by {log.acknowledged_by_name || "the clinician"} — {new Date(log.acknowledged_datetime).toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Awaiting clinician acknowledgment{log.escalation_deadline ? ` — escalation due ${new Date(log.escalation_deadline).toLocaleString()}` : ""}
            </p>
          )}
          {log.communication_notes && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{log.communication_notes}</p>
          )}
          {!log.acknowledged_datetime && log.status !== "resolved" && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!log.delivered_datetime && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => recordDelivery(log)} disabled={!!busy}>
                  {spinner(`d-${log.id}`)} <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Record Delivery
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => escalate(log)} disabled={!!busy}>
                {spinner(`e-${log.id}`)} <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Escalate
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => resolve(log)} disabled={!!busy}>
                {spinner(`r-${log.id}`)} Resolve
              </Button>
            </div>
          )}
        </div>
      ))}

      {openLogs.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Acknowledgment is completed by the responsible clinician in the Doctor Portal. Unacknowledged alerts escalate
          automatically every {openLogs[0].escalation_hours || 24}h with an email fallback.
        </p>
      )}
    </div>
  );
}