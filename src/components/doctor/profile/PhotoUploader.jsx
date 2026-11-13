import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2 } from "lucide-react";
import DoctorAvatar from "@/components/DoctorAvatar";
import { useToast } from "@/components/ui/use-toast";

// The physician's professional photograph. It is uploaded once and stored on the
// doctor's profile, so the same face appears on the profile, the directory and
// every place the doctor is shown.
export default function PhotoUploader({ profile, onUploaded }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Choose an image file" });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.DoctorProfile.update(profile.id, { photo_url: file_url });
      onUploaded({ ...profile, photo_url: file_url });
      toast({ title: "Profile picture updated" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "The picture could not be uploaded" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <DoctorAvatar photoUrl={profile?.photo_url} name={profile?.full_name} className="h-20 w-20 text-xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Upload profile picture"
          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground disabled:opacity-70"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{profile?.full_name || "Physician"}</p>
        <p className="text-xs text-muted-foreground">
          A clear professional photograph builds trust with colleagues who open your profile.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1 text-xs font-semibold text-doctor-blue hover:underline disabled:opacity-60"
        >
          {uploading ? "Uploading…" : profile?.photo_url ? "Change picture" : "Upload picture"}
        </button>
      </div>
    </div>
  );
}