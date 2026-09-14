import React from "react";
import { Building2 } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function HospitalProfileCard({ profile }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      {profile.photo_url ? (
        <Image src={profile.photo_url} alt={profile.hospital_name} fittingType="fill" className="w-14 h-14 rounded-full shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold truncate">{profile.hospital_name}</p>
        <p className="text-xs text-muted-foreground truncate">{profile.location}</p>
      </div>
    </div>
  );
}