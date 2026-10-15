import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, StickyNote } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
  { value: "counseling", label: "Counseling given" },
  { value: "adverse_reaction", label: "Adverse reaction reported" },
  { value: "intervention", label: "Pharmacist intervention" },
  { value: "other", label: "Other" },
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const CATEGORY_STYLES = {
  counseling: "bg-emerald-100 text-emerald-800",
  adverse_reaction: "bg-destructive/10 text-destructive",
  intervention: "bg-accent text-accent-foreground",
  other: "bg-muted text-muted-foreground",
};

// Pharmacy clinical notes for one patient — the pharmacist records counseling,
// adverse reactions or interventions at the counter and reviews previous notes.
export default function PharmacyPatientNotes({ session, patient }) {
  const [notes, setNotes] = useState(null);
  const [category, setCategory] = useState("counseling");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacyNoteManage", {
        action: "list",
        cin: patient.cin,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setNotes(res.data.notes || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load the notes.");
      setNotes([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.cin, session?.pharmacist_id, session?.session_token]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("pharmacyNoteManage", {
        action: "create",
        cin: patient.cin,
        patient_id: patient.id || "",
        patient_name: patient.full_name || "",
        category,
        content: content.trim(),
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setContent("");
      setCategory("counseling");
      toast({ title: "Note recorded", description: "The clinical note was saved to the patient's pharmacy record." });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not save the note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-primary" /> Clinical Notes
      </h3>

      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Write the note — what happened, what was advised or observed..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={saving || !content.trim()}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Note
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Previous Notes</p>
        {notes === null ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading notes...
          </p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 rounded-xl border border-border bg-card">
            No previous notes for this patient at your pharmacy.
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[n.category] || CATEGORY_STYLES.other}`}>
                    {CATEGORY_LABELS[n.category] || n.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{n.note_id}</span>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.created_datetime ? new Date(n.created_datetime).toLocaleString() : "—"}
                  {n.pharmacist_name ? ` · ${n.pharmacist_name}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}