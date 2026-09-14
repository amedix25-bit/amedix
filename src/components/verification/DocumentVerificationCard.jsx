import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";

// One document inside the Verification Process section of profile creation.
// The user uploads a document to private storage and (when the fields are
// editable) enters the identifying information; the OCR extraction and the
// exact comparison run in the backend — this component only displays the
// backend's verdict, it never decides it.
//
// fields: [{ key, label, placeholder?, type?, readOnly? }]
// values: { [key]: currentValue } — readOnly fields are rendered as text and
// are edited elsewhere (e.g. in the registration form above).
// result: { status: "verified" | "failed", reason? } | null (backend verdict)
// onResult: called with the backend result, or null when state is reset.
export default function DocumentVerificationCard({
  profileType, documentType, title, description, fields, values, onValueChange, result, onResult, t,
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const allFieldsFilled = fields.every((f) => (values?.[f.key] || "").toString().trim() !== "");

  const handleFile = async (e) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    setUploading(true);
    setError("");
    onResult(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: selected });
      setFile({ uri: file_uri, name: selected.name });
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async () => {
    if (!file || !allFieldsFilled) return;
    setVerifying(true);
    setError("");
    try {
      const expected = {};
      fields.forEach((f) => { expected[f.key] = values[f.key]; });
      const res = await base44.functions.invoke("verifyIdentityDocument", {
        profile_type: profileType,
        document_type: documentType,
        file_uri: file.uri,
        file_name: file.name,
        expected,
      });
      onResult(res.data);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="text-sm font-semibold">{title}</h4>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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

        <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
            <p className="text-sm truncate">{file.name}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => { setFile(null); onResult(null); }}
            >
              {t("Change file")}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            )}
            {t("Upload a clear photo or PDF")}
          </Button>
        )}

        {!allFieldsFilled && (
          <p className="text-xs text-muted-foreground">{t("Enter the required information first.")}</p>
        )}

        <Button type="button" className="w-full" disabled={!file || !allFieldsFilled || verifying} onClick={handleVerify}>
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
              {t("Verifying...")}
            </>
          ) : (
            t("Verify")
          )}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result?.status === "verified" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t("Verified ✓")}</p>
          </div>
        )}

        {result?.status === "failed" && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm font-semibold text-destructive">{t("Verification Failed")}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {result.reason === "unreadable"
                ? t("We could not read the document. Please upload a clearer photo or PDF.")
                : t("The information you entered does not match the document. Please correct your information or upload the correct document.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}