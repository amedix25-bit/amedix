import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { MESSAGING_CATEGORIES, displayDoctor, formatMessageTime } from "@/lib/messaging";

// Hospital-wide and department announcements, with delivery tracking per
// recipient doctor (delivered until the doctor reads it, then read).
export default function HospitalAnnouncementsPanel({ departments = [] }) {
  const [scope, setScope] = useState("hospital");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general_administration");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "listThreads", announcement_only: true });
      setDeliveries(res.data.threads || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Delivery records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDeliveries(); }, [loadDeliveries]);

  const submit = async () => {
    setError("");
    setResult("");
    if (!subject.trim() || !body.trim()) {
      setError("A subject and a message are required.");
      return;
    }
    if (scope === "department" && !department) {
      setError("Select the department to notify.");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "announcement",
        subject: subject.trim(),
        category,
        body: body.trim(),
        scope,
        department: scope === "department" ? department : "",
      });
      setResult(`Announcement delivered to ${res.data.created} of ${res.data.recipients} doctors.`);
      setSubject("");
      setBody("");
      loadDeliveries();
    } catch (e) {
      setError(e?.response?.data?.error || "The announcement could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold"><Megaphone className="w-4 h-4" /> New Announcement</h3>
        <div className="flex gap-1.5">
          {[{ key: "hospital", label: "All doctors" }, { key: "department", label: "One department" }].map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${scope === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {scope === "department" && (
          <div>
            <Label className="text-xs">Department</Label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="">Select department…</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="text-xs">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. Updated infection-control policy" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
            {MESSAGING_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Message</Label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={5000}
            className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Write the announcement…"
          />
        </div>
        {error && <p className="text-xs text-critical">{error}</p>}
        {result && <p className="text-xs text-success">{result}</p>}
        <Button onClick={submit} disabled={sending} className="w-full">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />} Send announcement
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Each recipient doctor receives the announcement in their own secure conversation with your hospital.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="font-heading text-sm font-semibold">Delivery tracking</p>
          <p className="text-[11px] text-muted-foreground">Delivered = not yet read by the doctor.</p>
        </div>
        <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
          {!loading && deliveries.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">No announcements sent yet.</p>
          )}
          {deliveries.map((d) => (
            <div key={d.id} className="px-4 py-2.5">
              <p className="truncate text-xs font-medium">{d.subject}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{displayDoctor(d.doctor_name)}</span>
                {d.target_department && <span>· {d.target_department}</span>}
                <span>· {formatMessageTime(d.last_activity_datetime)}</span>
                {d.doctor_unread_count > 0 ? (
                  <span className="rounded border border-info/30 bg-info/10 px-1.5 py-0.5 text-info">Delivered</span>
                ) : (
                  <span className="flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-success">
                    <CheckCircle2 className="w-3 h-3" /> Read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}