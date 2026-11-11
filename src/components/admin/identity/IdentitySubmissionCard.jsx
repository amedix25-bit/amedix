import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, FileText, Loader2, Clock, ShieldCheck, ShieldX, ExternalLink, AlertTriangle,
} from "lucide-react";
import { verificationState } from "@/components/verification/verificationStatus";

const DOCUMENT_LABELS = {
  passport: "Passport",
  drivers_licence: "Driver's Licence",
  birth_certificate: "Birth Certificate",
  personal_card: "Personal Card",
  national_id: "National ID",
  medical_license: "Medical Licence",
};

// One submitted identity document in the administrator review queue: the
// document opens through a short-lived signed link, the automatic readability
// note is shown, and the decision (approve / reject with a reason) is what
// actually verifies or refuses the account.
export default function IdentitySubmissionCard({ item, onDone, t }) {
  const [busy, setBusy] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");
  const [openedUrl, setOpenedUrl] = useState("");
  const state = verificationState(item.status);

  const openDocument = async (side = "front") => {
    setBusy("document");
    setError("");
    try {
      const res = await base44.functions.invoke("adminIdentityReview", { action: "document", id: item.id, side });
      const url = res.data?.signed_url;
      if (!url) {
        setError(res.data?.error || t("The document could not be opened."));
        return;
      }
      setOpenedUrl(url);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(t("The document could not be opened."));
    } finally {
      setBusy("");
    }
  };

  const decide = async (decision) => {
    setBusy(decision);
    setError("");
    try {
      const res = await base44.functions.invoke("adminIdentityReview", {
        action: "decide",
        id: item.id,
        decision,
        reason: decision === "reject" ? reason.trim() : "",
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      onDone?.();
    } catch (err) {
      setError(t("The decision could not be saved."));
    } finally {
      setBusy("");
    }
  };

  const checks = item.auto_check?.checks || [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{item.user_name || item.user_email || t("Unknown account")}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.user_email} · {t(item.profile_type === "doctor" ? "Doctor" : "Patient")}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${state.box} ${state.text}`}>
          {state.key === "verified" ? <ShieldCheck className="w-3.5 h-3.5" /> : state.key === "rejected" ? <ShieldX className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {t(state.label)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">{t("Document")}</p>
          <p className="font-medium">{t(DOCUMENT_LABELS[item.document_type] || item.document_type)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("Submitted")}</p>
          <p className="font-medium">{item.submitted_datetime ? new Date(item.submitted_datetime).toLocaleString() : "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("Source")}</p>
          <p className="font-medium capitalize">{item.source || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("Pages")}</p>
          <p className="font-medium">{item.page_count || 1}</p>
        </div>
      </div>

      {item.auto_check?.outcome && (
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium">
            {t("Automatic readability check")}:{" "}
            {item.auto_check.outcome === "match"
              ? t("details matched")
              : item.auto_check.outcome === "mismatch"
                ? t("some details differ")
                : t("could not read the document")}
          </p>
          {checks.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {checks.map((c) => (
                <p key={c.field} className="text-[11px] text-muted-foreground break-words">
                  {c.label}: {c.read || "—"} {c.matched ? "✓" : "•"} <span className="opacity-70">({c.entered})</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {item.review_reason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive break-words">{item.review_reason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => openDocument("front")} disabled={!!busy}>
          {busy === "document" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
          {t("Open document")}
        </Button>
        {item.has_back && (
          <Button type="button" size="sm" variant="ghost" onClick={() => openDocument("back")} disabled={!!busy}>
            {t("Open back side")}
          </Button>
        )}
        {openedUrl && (
          <a href={openedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline self-center">
            <ExternalLink className="w-3 h-3" />
            {t("Open again")}
          </a>
        )}
      </div>

      {item.status === "pending" && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={() => decide("approve")} disabled={!!busy}>
              {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
              {t("Approve")}
            </Button>
            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setRejecting((v) => !v)} disabled={!!busy}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              {t("Reject")}
            </Button>
          </div>
          {rejecting && (
            <div className="space-y-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("Why is this document not accepted? The reason is shown to the user.")}
                rows={2}
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => decide("reject")}
                disabled={!!busy || reason.trim().length < 5}
              >
                {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ShieldX className="w-3.5 h-3.5 mr-1.5" />}
                {t("Confirm rejection")}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}