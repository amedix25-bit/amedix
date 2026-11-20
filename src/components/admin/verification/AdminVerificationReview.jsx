import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Check, X, RefreshCw, AlertTriangle } from "lucide-react";

// Manual review of identity documents that the automated engine could not
// decide. The document is opened through a short-lived signed link minted on the
// server for the click, and that opening is written to the record's own audit
// trail.
const DOCUMENT_LABELS = {
  passport: "Passport",
  national_id: "National ID",
  personal_card: "Personal card",
  drivers_licence: "Driver's licence",
  birth_certificate: "Birth certificate",
  medical_license: "Medical licence",
  professional_card: "Professional card",
};

const STATE_LABELS = {
  manual_review: "Needs review",
  processing_failed: "Check interrupted",
  pending_approval: "Awaiting approval",
};

export default function AdminVerificationReview() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verificationAdminReview", { action: "list" });
      const data = res.data || {};
      if (data.error) setError(data.error);
      setItems(Array.isArray(data.items) ? data.items : []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error(err);
      setError("The review queue could not be loaded.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDocument = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const res = await base44.functions.invoke("verificationAdminReview", { action: "document", verification_id: id });
      if (res.data?.signed_url) {
        window.open(res.data.signed_url, "_blank", "noopener,noreferrer");
      } else {
        setError(res.data?.error || "The document could not be opened.");
      }
    } catch (err) {
      setError("The document could not be opened.");
    } finally {
      setBusyId("");
    }
  };

  const decide = async (id, decision) => {
    setBusyId(id);
    setError("");
    try {
      const res = await base44.functions.invoke("verificationAdminReview", {
        action: "decide",
        verification_id: id,
        decision,
        notes: notes[id] || "",
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      setItems((prev) => prev.filter((row) => row.verification_id !== id));
    } catch (err) {
      setError("The decision could not be saved.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            Needs review: {counts.manual_review || 0}
          </span>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Interrupted: {counts.processing_failed || 0}
          </span>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No identity documents are waiting for review.
        </p>
      )}

      {items.map((row) => (
        <div key={row.verification_id} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {row.user_name || "Account"} · {DOCUMENT_LABELS[row.document_type] || row.document_type}
              </p>
              <p className="text-[11px] text-muted-foreground break-all">
                {row.job_id} · {row.profile_type} · submitted {row.submitted_datetime ? new Date(row.submitted_datetime).toLocaleString() : "—"}
                {row.attempts ? ` · ${row.attempts} attempt(s)` : ""}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 shrink-0">
              {STATE_LABELS[row.job_status] || row.job_status}
            </span>
          </div>

          <p className="text-xs text-muted-foreground break-words">
            {row.message || row.reason || "No automated reading was recorded."}
            {row.last_error ? ` · ${row.last_error}` : ""}
          </p>

          {row.document_retained ? (
            <Button variant="outline" size="sm" disabled={busyId === row.verification_id} onClick={() => openDocument(row.verification_id)}>
              {busyId === row.verification_id
                ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                : <FileText className="w-3.5 h-3.5 mr-1.5" />}
              Open document
            </Button>
          ) : (
            <p className="text-[11px] text-amber-700">
              This submission predates document storage, so there is no document to open. Approve only if the identity was established another way.
            </p>
          )}

          <Input
            placeholder="Reviewer notes (optional)"
            value={notes[row.verification_id] || ""}
            onChange={(e) => setNotes((prev) => ({ ...prev, [row.verification_id]: e.target.value }))}
            className="h-9"
          />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busyId === row.verification_id} onClick={() => decide(row.verification_id, "approve")}>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Approve document
            </Button>
            <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:text-destructive"
              disabled={busyId === row.verification_id} onClick={() => decide(row.verification_id, "reject")}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}