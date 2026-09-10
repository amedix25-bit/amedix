import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2 } from "lucide-react";
import DoctorAvatar from "@/components/DoctorAvatar";

// Doctor Portal header avatar. Click to upload / change the profile
// picture — it is saved on the doctor's profile and shown wherever the
// doctor appears to other users.
export default function DoctorProfilePicture({ profile, onUpdated }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.DoctorProfile.update(profile.id, { photo_url: file_url });
      onUpdated({ ...profile, photo_url: file_url });
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Change profile picture"
        className="block rounded-full focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
      >
        <DoctorAvatar photoUrl={profile?.photo_url} name={profile?.full_name} className="w-14 h-14 text-lg" />
        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}