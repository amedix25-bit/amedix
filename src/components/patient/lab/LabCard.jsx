import React from "react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Professional laboratory card shown in the patient's real-time search results:
// logo (from the image uploaded at registration), name, A&M Lab Number and address.
export default function LabCard({ lab, onSelect }) {
  const { t } = usePatientLanguage();
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border bg-secondary flex items-center justify-center">
        {lab.logo_url ? (
          <Image src={lab.logo_url} fittingType="fit" className="w-14 h-14" alt={lab.lab_name} />
        ) : (
          <Building2 className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-medium truncate">{lab.lab_name}</p>
          <Badge variant="outline" className="gap-1 h-5 px-1.5 text-[10px] font-normal text-emerald-700 border-emerald-200 bg-emerald-50">
            <ShieldCheck className="w-3 h-3" /> {t("Registered")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t("A&M Lab Number:")} {lab.lab_number || "—"}</p>
        {lab.address && (
          <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{lab.address}</span>
          </p>
        )}
      </div>
      <Button size="sm" onClick={() => onSelect(lab)} className="shrink-0">
        {t("Select")}
      </Button>
    </div>
  );
}