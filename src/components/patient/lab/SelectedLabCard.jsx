import React from "react";
import { Image } from "@/components/ui/image";
import { Building2, MapPin } from "lucide-react";

// Compact summary of the laboratory the patient selected, shown before they
// confirm and assign it to the lab request.
export default function SelectedLabCard({ lab }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border bg-background flex items-center justify-center">
        {lab.logo_url ? (
          <Image src={lab.logo_url} fittingType="fit" className="w-14 h-14" alt={lab.lab_name} />
        ) : (
          <Building2 className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{lab.lab_name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">A&M Lab Number: {lab.lab_number || "—"}</p>
        <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
          {lab.address || "—"}
        </p>
      </div>
    </div>
  );
}