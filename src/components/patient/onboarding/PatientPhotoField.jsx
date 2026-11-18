import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The patient's own photograph, uploaded during registration. It is stored
// privately — shown through a short-lived signed link, never a public URL — and
// saved on the patient profile as photo_uri, so the same picture appears on the
// AMedix Medical ID card. Optional: registration is never blocked by it.
export default function PatientPhotoField({ value, onChange }) {
  const { t } = usePatientLanguage();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreview("");
      return undefined;
    }
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: value, expires_in: 3600 })
      .then((res) => {
        if (!cancelled) setPreview(res.signed_url || "");
      })
      .catch(() => {
        if (!cancelled) setPreview("");
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleFile = async (file) => {
    if (!file || uploading) return;
    if (!file.type.startsWith("image/")) {
      setError(t("Choose an image file."));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onChange(file_uri);
    } catch (err) {
      console.error(err);
      setError(t("Could not upload your picture. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
        {preview ? (
          <Image src={preview} alt={t("Your photo")} fittingType="fill" className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <UserRound className="h-8 w-8" />
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-muted-foreground">
          {t(
            "Add a recent photo of yourself. It appears on your AMedix Medical ID card. This is optional — you can add it later."
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
            {value ? t("Change photo") : t("Add a photo")}
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange("")} disabled={uploading}>
              <Trash2 className="h-4 w-4" />
              {t("Remove photo")}
            </Button>
          )}
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}