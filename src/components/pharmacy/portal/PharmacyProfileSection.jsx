import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Building2, Loader2, Upload } from "lucide-react";

export default function PharmacyProfileSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.PharmacyProfile.update(profile.id, { logo_url: res.file_url });
      onUpdate?.({ ...profile, logo_url: res.file_url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const rows = [
    { label: "A&M Pharmacy Number / ID", value: profile.pharmacy_number },
    { label: "Location / Address", value: profile.address },
    { label: "Phone Number", value: profile.phone },
    { label: "WhatsApp Number", value: profile.whatsapp_number },
    { label: "Email", value: profile.email },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-4">
        {profile.logo_url ? (
          <Image
            src={profile.logo_url}
            alt={`${profile.pharmacy_name} logo`}
            className="w-16 h-16 rounded-full border border-border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-border">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{profile.pharmacy_name}</p>
          <p className="text-xs text-muted-foreground">Pharmacy Portal account</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {profile.logo_url ? "Change Logo" : "Upload Logo"}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="text-sm font-medium text-right">{r.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}