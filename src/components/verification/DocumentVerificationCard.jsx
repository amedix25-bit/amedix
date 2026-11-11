import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Clock, ShieldX } from "lucide-react";
import DocumentScanUpload from "@/components/verification/DocumentScanUpload";
import { verificationState } from "@/components/verification/verificationStatus";

// One identity document inside the Verification Process section. The user
// photographs or uploads the document and submits it; the submission is stored
// privately and enters the administrator review queue. Submitting never
// verifies the account — this card only shows the state AMedix administration
// has recorded for it, and lets the user resubmit after a rejection.
//
// fields: [{ key, label, placeholder?, type?, readOnly? }]
// values: { [key]: currentValue } — readOnly fields are shown as text
// result: { status, verification_id?, reason?, review_reason? } | null
export default function DocumentVerificationCard({
  profileType, documentType, title, description, fields, values, onValueChange, result, onResult, t, twoSided = false,
}) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  // An existing submission (from an earlier session) is shown with its real
  // state — pending review, approved or rejected with the administrator's reason.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const page = await base44.entities.IdentityVerification.filter(
          { user_id: me.id, profile_type: profileType, document_type: documentType },
          { sort: "-created_date", limit: 1 }
        );
        const latest = (page.items || [])[0];
        if (!cancelled && latest) {
          onResult({
            status: latest.status,
            verification_id: latest.id,
            reason: latest.reason || "",
            review_reason: latest.review_reason || "",
            submitted_datetime: latest.attempted_datetime || "",
            reviewed_datetime: latest.reviewed_datetime || "",
          });
        }
      } catch (err) {
        // A missing status must never block the form.
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType, documentType]);

  const state = verificationState(result?.status);
  const allFieldsFilled = fields.every((f) => (values?.[f.key] || "").toString().trim() !== "");
  const alreadySubmitted = state.key === "pending" || state.key === "verified";
  const formVisible = !alreadySubmitted || resubmitting;
  const readyToSubmit = !!file && allFieldsFilled && !submitting;

  const handleSubmit = async () => {
    if (!readyToSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const expected = {};
      fields.forEach((f) => { expected[f.key] = values[f.key]; });
      const res = await base44.functions.invoke("verifyIdentityDocument", {
        profile_type: profileType,
        document_type: documentType,
        file_uri: file.uri,
        file_name: file.name,
        file_mime: file.mime || "",
        file_size: file.size || 0,
        page_count: file.page_count || 1,
        source: file.source || "gallery",
        original_file_uri: file.original_uri || "",
        original_file_name: file.original_name || "",
        expected,
      });
      const data = res.data || {};
      if (data.error) {
        setError(data.error);
        return;
      }
      onResult({
        status: data.status || "pending",
        verification_id: data.verification_id,
        submitted_datetime: data.submitted_datetime,
        reason: "",
        read: data.read,
        auto_check: data.auto_check,
      });
      setFile(null);
      setResubmitting(false);
    } catch (err) {
      console.error(err);
      setError(t("We could not submit your document. Check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const stateIcon =
    state.key === "verified" ? <ShieldCheck className="w-4 h-4 shrink-0" />
      : state.key === "rejected" ? <ShieldX className="w-4 h-4 shrink-0" />
        : <Clock className="w-4 h-4 shrink-0" />;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shrink-0 ${state.box} ${state.text}`}>
          {stateIcon}
          {t(state.label)}
        </span>
      </div>

      {state.key !== "none" && (
        <div className={`mt-3 rounded-lg border px-3 py-2.5 ${state.box}`}>
          <p className={`text-sm font-semibold ${state.text}`}>{t(state.label)}</p>
          {state.key === "pending" && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("Your document was received and is waiting for AMedix administration to review it. You do not need to do anything else.")}
            </p>
          )}
          {state.key === "verified" && (
            <p className="text-xs text-muted-foreground mt-1">{t("Your identity document was reviewed and approved.")}</p>
          )}
          {state.key === "rejected" && (
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {result?.review_reason || t("Your document was not accepted. Please submit a new one below.")}
            </p>
          )}
          {result?.verification_id && (
            <p className="text-[11px] text-muted-foreground mt-1 break-all">
              {t("Reference")}: {result.verification_id}
            </p>
          )}
          {alreadySubmitted && !resubmitting && (
            <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2" onClick={() => setResubmitting(true)}>
              {t("Submit a different document")}
            </Button>
          )}
        </div>
      )}

      {formVisible && (
        <div className="mt-3 space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              {f.readOnly ? (
                <p className="text-sm font-medium px-3 py-2 rounded-lg bg-muted min-h-[2.25rem] flex items-center">
                  {(values?.[f.key] || "").toString().trim() !== "" ? values[f.key] : "—"}
                </p>
              ) : (
                <Input
                  value={values?.[f.key] || ""}
                  onChange={(e) => onValueChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  type={f.type || "text"}
                />
              )}
            </div>
          ))}

          <DocumentScanUpload
            documentType={documentType}
            sides={twoSided ? "both" : "single"}
            patientName={values?.full_name || ""}
            hint={twoSided
              ? t("Photograph both sides — front first, then the back. You can also choose two photos or upload one PDF containing both sides.")
              : t("Photograph the document, choose a photo from your gallery, or upload a PDF.")}
            file={file}
            onFile={(f) => { setFile(f); setError(""); }}
            t={t}
          />

          {!allFieldsFilled && (
            <p className="text-xs text-muted-foreground">{t("Enter the required information first.")}</p>
          )}

          <Button type="button" className="w-full" disabled={!readyToSubmit} onClick={handleSubmit}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                {t("Submitting…")}
              </>
            ) : (
              t("Submit for review")
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {t("Your document is stored privately and reviewed by AMedix administration. Submitting does not verify your account by itself.")}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}