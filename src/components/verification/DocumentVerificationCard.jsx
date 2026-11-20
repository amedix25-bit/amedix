import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldX, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import DocumentScanUpload from "@/components/verification/DocumentScanUpload";
import { verificationState } from "@/components/verification/verificationStatus";

// One identity document inside the Verification Process section.
//
// The document is saved to private storage first and then checked by a job, so
// this card never depends on one long request: if the check is interrupted, the
// job is still there, the status is still known, and "Try again" re-checks the
// SAME stored document instead of asking for another photo.
//
// fields: [{ key, label, placeholder?, type?, readOnly? }]
// values: { [key]: currentValue } — readOnly fields are shown as text
// result: the job view returned by the verification functions
// Only a job that a worker is actually holding is worth polling; a saved job
// that no worker has started yet is resumed with "Start check".
const OPEN_STATUSES = ["processing"];
const POLL_MS = 4000;

export default function DocumentVerificationCard({
  profileType, documentType, title, description, fields, values, onValueChange, result, onResult, t, twoSided = false,
}) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replacing, setReplacing] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((verificationId) => {
    if (!verificationId) return;
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("verificationJobStatus", { verification_id: verificationId });
        const view = res.data?.job;
        if (!view) return;
        onResult(view);
        if (!OPEN_STATUSES.includes(view.job_status)) stopPolling();
      } catch (err) {
        // A failed poll is not a failed check — keep asking until the job settles.
      }
    }, POLL_MS);
  }, [onResult, stopPolling]);

  // Resume: whatever the server already knows about this document is shown, so
  // closing the browser mid-check never loses the submission.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("verificationJobStatus", {
          profile_type: profileType,
          document_type: documentType,
        });
        const view = res.data?.job;
        if (!cancelled && view) {
          onResult(view);
          if (OPEN_STATUSES.includes(view.job_status)) startPolling(view.verification_id);
        }
      } catch (err) {
        // A missing status must never block the form.
      }
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType, documentType]);

  const state = verificationState(result);
  const isRunning = result?.job_status === "processing";
  const isUploaded = result?.job_status === "uploaded";
  const isOpen = isRunning || isUploaded;
  const isVerified = state.key === "verified";
  const formVisible = replacing || !result;

  const numberField = fields.find((f) => /_number$/.test(f.key))?.key || "";
  const allFieldsFilled = fields.every((f) => (values?.[f.key] || "").toString().trim() !== "");
  const readyToSubmit = !!file?.uri && allFieldsFilled && !busy;

  const settle = (view) => {
    if (!view || typeof view !== "object") return;
    onResult(view);
    if (OPEN_STATUSES.includes(view.job_status)) startPolling(view.verification_id);
    else stopPolling();
  };

  const runWorker = async (verificationId, correctedNumber) => {
    const res = await base44.functions.invoke("processVerificationJob", {
      verification_id: verificationId,
      ...(correctedNumber ? { expected_number: correctedNumber } : {}),
    });
    return res.data;
  };

  const handleSubmit = async () => {
    if (!readyToSubmit) return;
    setBusy(true);
    setError("");
    try {
      const expected = {};
      fields.forEach((f) => { expected[f.key] = values[f.key]; });

      const created = await base44.functions.invoke("submitVerificationDocument", {
        profile_type: profileType,
        document_type: documentType,
        expected,
        file: {
          uri: file.uri,
          name: file.name,
          mime: file.mime,
          size: file.size,
          page_count: file.page_count,
        },
        source: file.source || "gallery",
      });
      const submitted = created.data || {};
      if (submitted.error) {
        setError(submitted.error);
        return;
      }
      settle(submitted);
      setFile(null);
      setReplacing(false);

      try {
        const processed = await runWorker(submitted.verification_id);
        if (processed?.error) setError(processed.error);
        else settle(processed);
      } catch (err) {
        // The document is saved and the job exists — only the check was cut
        // off, so the user resumes it instead of uploading anything again.
        setError(t('Your document is saved. Press "Start check" to continue — you do not need to upload it again.'));
      }
    } catch (err) {
      console.error(err);
      setError(t("We could not save your document. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    if (!result?.verification_id) return;
    setBusy(true);
    setError("");
    try {
      const processed = await runWorker(result.verification_id);
      if (processed?.error) {
        setError(processed.error);
        return;
      }
      settle(processed);
    } catch (err) {
      setError(t("Your document is saved. The check is continuing — you can leave this page."));
      startPolling(result.verification_id);
    } finally {
      setBusy(false);
    }
  };

  const handleCorrectedNumber = async () => {
    if (!result?.verification_id || !numberField) return;
    const corrected = String(values?.[numberField] || "").trim();
    if (!corrected) {
      setError(t("Enter the number printed on the document."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const processed = await runWorker(result.verification_id, corrected);
      if (processed?.error) {
        setError(processed.error);
        return;
      }
      settle(processed);
    } catch (err) {
      setError(t("Your document is saved. The check is continuing — you can leave this page."));
      startPolling(result.verification_id);
    } finally {
      setBusy(false);
    }
  };

  const stateIcon =
    isVerified ? <ShieldCheck className="w-4 h-4 shrink-0" />
      : state.key === "rejected" ? <ShieldX className="w-4 h-4 shrink-0" />
        : state.key === "processing" ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          : state.key === "uploaded" ? <Clock className="w-4 h-4 shrink-0" />
            : state.key === "review" ? <Clock className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />;

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

      {result && (
        <div className={`mt-3 rounded-lg border px-3 py-2.5 ${state.box}`}>
          <p className={`text-sm font-semibold ${state.text}`}>{t(state.label)}</p>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {result.message || t(state.description)}
          </p>

          {result.job_id && (
            <p className="text-[11px] text-muted-foreground mt-1 break-all">
              {t("Reference")}: <span className="font-medium text-foreground">{result.job_id}</span>
              {result.page_count ? ` · ${result.page_count} ${result.page_count > 1 ? t("pages") : t("page")}` : ""}
            </p>
          )}

          {state.key === "rejected" && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              <p className="text-muted-foreground break-all">
                {t("You entered")}: <span className="font-medium text-foreground">{result.entered_number || "—"}</span>
              </p>
              <p className="text-muted-foreground break-all">
                {t("On the document")}: <span className="font-medium text-foreground">
                  {result.read_number || t("could not be read")}
                </span>
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {isUploaded && result.can_resume && (
              <Button type="button" size="sm" className="h-8" disabled={busy} onClick={handleRetry}>
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                {t("Start check")}
              </Button>
            )}
            {state.key === "retry" && result.can_retry && (
              <Button type="button" size="sm" variant="outline" className="h-8" disabled={busy} onClick={handleRetry}>
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                {t("Check again")}
              </Button>
            )}
            {result.job_status === "manual_review" && result.can_retry && (
              <Button type="button" size="sm" variant="outline" className="h-8" disabled={busy} onClick={handleRetry}>
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                {t("Check again")}
              </Button>
            )}
            {isRunning && (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("You can close this page — the check continues.")}
              </span>
            )}
            {!isOpen && !replacing && (
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setReplacing(true)}>
                {t("Submit a different document")}
              </Button>
            )}
          </div>

          {state.key === "rejected" && numberField && !replacing && (
            <div className="mt-3 space-y-1.5">
              <Label className="text-[11px]">{t("Correct the number and check the same document again")}</Label>
              <div className="flex gap-2">
                <Input
                  value={values?.[numberField] || ""}
                  onChange={(e) => onValueChange(numberField, e.target.value)}
                  className="h-9"
                />
                <Button type="button" size="sm" className="h-9 shrink-0" disabled={busy} onClick={handleCorrectedNumber}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("Re-check")}
                </Button>
              </div>
            </div>
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
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                {t("Saving and checking the document…")}
              </>
            ) : (
              t("Save and check document")
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {t("Your document is stored privately and checked automatically. If a check is interrupted it is never lost — you will not have to upload it again.")}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}