import React from "react";
import { GraduationCap, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

// One verified AMedix physician in the directory. Only what the doctor's own
// professional profile publishes is shown — never a CIN, phone number or any
// clinical information.
export default function DoctorCard({ doctor, hospitalName, onOpen }) {
  const { t } = usePatientLanguage();
  const credentials = (doctor.education || [])
    .map((entry) => entry.title)
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
  const specialty = doctor.specialty || doctor.hospitals?.[0]?.department || "";

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {doctor.photo_url ? (
            <Image
              src={doctor.photo_url}
              alt={doctor.full_name}
              fittingType="fill"
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-7 w-7 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold leading-snug line-clamp-2">
            {doctor.full_name}
          </h3>
          {specialty && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{specialty}</span>
            </p>
          )}
          {doctor.professional_title && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{doctor.professional_title}</p>
          )}
        </div>
      </div>

      {credentials && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
          <span className="line-clamp-2">{credentials}</span>
        </p>
      )}

      {hospitalName && <p className="text-xs text-muted-foreground line-clamp-1">{hospitalName}</p>}

      <div className="mt-auto pt-1">
        <Button variant="outline" className="w-full" onClick={() => onOpen(doctor)}>
          {t("View Profile")}
        </Button>
      </div>
    </article>
  );
}