import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, UserRound } from "lucide-react";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The patient's own picture on the Medical ID card. The picture is stored
// privately: it is shown through a short-lived signed link and never as a
// public URL. The patient uploads or replaces it themselves.
export default function PatientCardPhoto({ profile }) {
  const { t } = usePatientLanguage();
  const inputRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(profile?.photo_uri || "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!photoUri) {
      setPhotoUrl("");
      return undefined;
    }
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: photoUri, expires_in: 3600 })
      .then((res) => {
        if (!cancelled) setPhotoUrl(res.signed_url || "");
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  const handleFile = async (file) => {
    if (!file || uploading || !profile?.id) return;
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.PatientProfile.update(profile.id, { photo_uri: file_uri });
      setPhotoUri(file_uri);
    } catch (err) {
      setError(t("Could not save your picture. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={photoUri ? t("Change your picture") : t("Add your picture")}
        className="relative block w-24 h-28 rounded-xl overflow-hidden border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
      >
        {photoUrl ? (
          <Image src={photoUrl} alt={profile?.full_name || ""} fittingType="fill" className="w-full h-full" />
        ) : (
          <span className="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground">
            <UserRound className="w-7 h-7" />
            <span className="text-[10px] leading-tight px-1 text-center">{t("Add your picture")}</span>
          </span>
        )}
        <span className="absolute bottom-1 end-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
        </span>
      </button>
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
      {error && <p role="alert" className="text-[10px] text-destructive mt-1 max-w-24">{error}</p>}
    </div>
  );
}