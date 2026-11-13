import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldX, AlertTriangle, RefreshCw } from "lucide-react";
import DocumentScanUpload from "@/components/verification/DocumentScanUpload";
import { verificationState } from "@/components/verification/verificationStatus";

// One identity document inside the Verification Process section.
//
// The user photographs or uploads the document and submits it; the AMedix
// automated engine reads the number printed on it and compares it with the
// number entered here, immediately. The result is final and automatic — there
// is no review queue and nobody approves it:
//   MATCH      → verified, the registration continues
//   MISMATCH   → refused, with both numbers shown so the user can correct it
//   UNREADABLE → refused, with a request for a clearer photo or PDF
//
// fields: [{ key, label, placeholder?, type?, readOnly? }]
// values: { [key]: currentValue } — readOnly fields are shown as text
// result: { status, outcome?, verification_id?, message?, entered_number?, read_number? } | null
export default function DocumentVerificationCard({
  profileType, documentType, title, description, fields, values, onValueChange, result, onResult, t, twoSided = false,
}) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  // An existing submission from an earlier session is shown with its recorded
  // automated outcome.
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
            outcome: latest.verification_outcome || latest.auto_check?.outcome || "",
            verification_id: latest.id,
            message: latest.review_reason || latest.auto_check?.note || "",
            entered_number: latest.auto_check?.entered_number || "",
            read_number: latest.auto_check?.read_number || "",
            auto_check: latest.auto_check || null,
            submitted_datetime: latest.attempted_datetime || "",
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

  const state = verificationState(result?.status, result?.auto_check);
  const allFieldsFilled = fields.every((f) => (values?.[f.key] || "").toString().trim() !== "");
  const retryable = state.key === "rejected" || state.key === "unreadable";
  const alreadyVerified = state.key === "verified";
  const formVisible = !alreadyVerified || resubmitting;
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
        // The pages travel as base64 inside this request. The document is read in
        // memory and never uploaded — there is nothing stored to keep or delete.
        pages: file.pages || [],
        source: file.source || "gallery",
        expected,
      });
      const data = res.data || {};
      if (data.error) {
        setError(data.error);
        return;
      }
      const outcome = data.outcome || "";
      onResult({
        status: data.status,
        outcome,
        verification_id: data.verification_id,
        submitted_datetime: data.submitted_datetime,
        message: data.message || "",
        entered_number: data.entered_number || "",
        read_number: data.read_number || "",
        auto_check: { outcome },
      });
      setFile(null);
      setResubmitting(false);
    } catch (err) {
      console.error(err);
      setError(t("We could not check your document. Check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const stateIcon =
    state.key === "verified" ? <ShieldCheck className="w-4 h-4 shrink-0" />
      : state.key === "rejected" ? <ShieldX className="w-4 h-4 shrink-0" />
        : state.key === "unreadable" ? <AlertTriangle className="w-4 h-4 shrink-0" />
          : <RefreshCw className="w-4 h-4 shrink-0" />;

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

          {state.key === "verified" && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("The number printed on the document matches the number you entered. Verified automatically.")}
            </p>
          )}

          {retryable && (
            <>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                {result?.message || t(state.description)}
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <p className="text-muted-foreground break-all">
                  {t("You entered")}: <span className="font-medium text-foreground">{result?.entered_number || "—"}</span>
                </p>
                <p className="text-muted-foreground break-all">
                  {t("On the document")}: <span className="font-medium text-foreground">
                    {result?.read_number || t("could not be read")}
                  </span>
                </p>
              </div>
            </>
          )}

          {state.key === "pending" && (
            <p className="text-xs text-muted-foreground mt-1">{t(state.description)}</p>
          )}

          {alreadyVerified && !resubmitting && (
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
                {t("Reading the document…")}
              </>
            ) : (
              t(retryable ? "Check this document" : "Verify document")
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {t("The number on your document is read and compared with the number you entered, automatically. No copy of the document is kept — only the result and the masked number.")}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}