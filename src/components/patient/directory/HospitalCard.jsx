import React from "react";
import { Building2, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

// One AMedix hospital in the patient directory. Every value comes from the
// hospital's own record — the hospital maintains its name, logo, location and
// operating hours; the doctor count is derived from its active affiliations.
export default function HospitalCard({ hospital, onViewDoctors }) {
  const { t } = usePatientLanguage();
  const doctors = hospital.doctor_count || 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3 border-b border-border/70 bg-muted/40 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {hospital.photo_url ? (
            <Image
              src={hospital.photo_url}
              alt={hospital.hospital_name}
              fittingType="fit"
              className="h-full w-full"
            />
          ) : (
            <Building2 className="h-6 w-6 text-primary/40" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold leading-snug line-clamp-2">
            {hospital.hospital_name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {doctors === 1 ? t("1 doctor") : t("{count} doctors", { count: doctors })}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 p-4 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
          <span className="line-clamp-2">{hospital.location || t("Location not listed")}</span>
        </p>
        <p className="flex items-start gap-2 text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
          <span className="line-clamp-2">{hospital.operating_hours || t("Operating hours not listed")}</span>
        </p>
      </div>

      <div className="border-t border-border/70 p-4">
        <Button className="w-full" onClick={() => onViewDoctors(hospital)}>
          {t("View Doctors")}
        </Button>
      </div>
    </article>
  );
}