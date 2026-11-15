import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Building2, GraduationCap, Loader2, MapPin, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

// A physician's public professional profile, exactly as the doctor publishes it.
// The server applies the doctor's own privacy settings, so a section the doctor
// keeps to colleagues simply never arrives here.
export default function DoctorProfileDialog({ doctorId, onClose }) {
  const { t } = usePatientLanguage();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) return;
    let active = true;
    setDoctor(null);
    setError("");
    base44.functions
      .invoke("patientDirectory", { action: "doctor", doctor_id: doctorId })
      .then((res) => {
        if (active) setDoctor(res.data?.doctor || null);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.error || t("This profile could not be opened."));
      });
    return () => {
      active = false;
    };
  }, [doctorId]);

  const group = (type) =>
    (doctor?.education || []).filter((entry) => (entry.type || "degree") === type);

  return (
    <Dialog open={!!doctorId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Professional Profile")}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-critical">{error}</p>}

        {!doctor && !error && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("Loading profile...")}
          </div>
        )}

        {doctor && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                {doctor.photo_url ? (
                  <Image src={doctor.photo_url} alt={doctor.full_name} fittingType="fill" className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-xl font-semibold leading-tight">{doctor.full_name}</h3>
                {doctor.specialty && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
                    <Stethoscope className="h-4 w-4 shrink-0" />
                    {doctor.specialty}
                  </p>
                )}
                {doctor.professional_title && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{doctor.professional_title}</p>
                )}
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("Verified AMedix physician")}
                </p>
              </div>
            </div>

            {(doctor.workplace || doctor.location) && (
              <div className="space-y-1 text-sm text-muted-foreground">
                {doctor.workplace && (
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-primary/60" />
                    {doctor.workplace}
                  </p>
                )}
                {doctor.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
                    {doctor.location}
                  </p>
                )}
              </div>
            )}

            {doctor.bio && (
              <section className="space-y-1.5">
                <h4 className="text-sm font-semibold">{t("About")}</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
              </section>
            )}

            {(doctor.education || []).length > 0 && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {t("Qualifications & Credentials")}
                </h4>
                <ul className="space-y-2">
                  {["degree", "residency", "fellowship", "certification"].flatMap((type) =>
                    group(type).map((entry, index) => (
                      <li key={`${type}-${index}`} className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[entry.institution, entry.field, entry.country, entry.end_year].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            )}

            {(doctor.achievements || []).length > 0 && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Award className="h-4 w-4 text-primary" />
                  {t("Achievements & Experience")}
                </h4>
                <ul className="space-y-2">
                  {doctor.achievements.map((entry, index) => (
                    <li key={index} className="rounded-xl border border-border bg-muted/30 p-3">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[entry.organization, entry.year].filter(Boolean).join(" · ")}
                      </p>
                      {entry.detail && <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(doctor.hospitals || []).length > 0 && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-primary" />
                  {t("Hospital Affiliations")}
                </h4>
                <ul className="space-y-1.5">
                  {doctor.hospitals.map((hospital) => (
                    <li
                      key={hospital.hospital_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{hospital.hospital_name}</span>
                      {hospital.department && (
                        <span className="text-xs text-muted-foreground">{hospital.department}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {doctor.restricted && (
              <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {t("This physician shares additional profile details only within the AMedix professional network.")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}