import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";

// One document inside the Verification Process section of profile creation.
// The user uploads documents to private storage and (when the fields are
// editable) enters the identifying information; the OCR extraction and the
// exact comparison run in the backend — this component only displays the
// backend's verdict, it never decides it.
//
// twoSided (Personal Card): the front is always required; the back is required
// too unless the uploaded front file is a single PDF containing both sides.
//
// fields: [{ key, label, placeholder?, type?, readOnly? }]
// values: { [key]: currentValue } — readOnly fields are rendered as text and
// are edited elsewhere (e.g. in the registration form above).
// result: { status: "verified" | "failed", reason? } | null (backend verdict)
// onResult: called with the backend result, or null when state is reset.
export default function DocumentVerificationCard({
  profileType, documentType, title, description, fields, values, onValueChange, result, onResult, t, twoSided = false, frontSlot = null,
}) {
  const [file, setFile] = useState(null);
  const [fileBack, setFileBack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const allFieldsFilled = fields.every((f) => (values?.[f.key] || "").toString().trim() !== "");
  const frontIsPdf = !!file && /\.pdf$/i.test(file.name);
  const backRequired = twoSided && !frontIsPdf;
  const readyToVerify = !!file && (!backRequired || !!fileBack) && allFieldsFilled;

  const handleFile = (slot) => async (e) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    setUploading(true);
    setError("");
    onResult(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: selected });
      const uploaded = { uri: file_uri, name: selected.name };
      if (slot === "back") setFileBack(uploaded);
      else setFile(uploaded);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async () => {
    if (!readyToVerify) return;
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
        file_uri_back: twoSided && fileBack ? fileBack.uri : "",
        file_name_back: twoSided && fileBack ? fileBack.name : "",
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

  const renderSlot = (slot, label, uploadLabel) => {
    const f = slot === "back" ? fileBack : file;
    const ref = slot === "back" ? backInputRef : frontInputRef;
    return (
      <div className="space-y-1.5">
        {twoSided && <Label>{label}</Label>}
        <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile(slot)} />
        {f ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
            <p className="text-sm truncate">{f.name}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => { (slot === "back" ? setFileBack : setFile)(null); onResult(null); }}
            >
              {t("Change file")}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => ref.current?.click()}>
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            )}
            {uploadLabel}
          </Button>
        )}
      </div>
    );
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

        {frontSlot ? (
          frontSlot({ file, setFile: (f) => { setFile(f); onResult(null); } })
        ) : (
          renderSlot("front", t("Front side"), twoSided ? t("Upload a clear photo or PDF of the front side") : t("Upload a clear photo or PDF"))
        )}
        {twoSided && !frontIsPdf && renderSlot("back", t("Back side"), t("Upload a clear photo or PDF of the back side"))}
        {twoSided && frontIsPdf && (
          <p className="text-xs text-muted-foreground">{t("One PDF containing both sides")}</p>
        )}

        {!allFieldsFilled && (
          <p className="text-xs text-muted-foreground">{t("Enter the required information first.")}</p>
        )}
        {backRequired && !fileBack && (
          <p className="text-xs text-muted-foreground">
            {t("Please upload the back side of your Personal Card, or upload one PDF containing both sides.")}
          </p>
        )}

        <Button type="button" className="w-full" disabled={!readyToVerify || verifying} onClick={handleVerify}>
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
                : result.reason === "card_mismatch"
                  ? t("The front and back photos do not belong to the same card. Please upload both sides of your Personal Card.")
                  : t("The information you entered does not match the document. Please correct your information or upload the correct document.")}
            </p>
            {result.reason === "mismatch" && result.read && (
              <p className="text-xs text-muted-foreground mt-1 break-words">
                {t("Read from your document")}:{" "}
                {fields
                  .filter((f) => result.read[f.key])
                  .map((f) => `${f.label}: ${result.read[f.key]}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}