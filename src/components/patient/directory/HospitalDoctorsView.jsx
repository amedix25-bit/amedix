import React, { useMemo, useState } from "react";
import { Building2, ChevronLeft, Clock, MapPin, Search, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";
import DoctorCard from "./DoctorCard";

// Hospital-specific doctor directory: ONLY the physicians who hold an active
// affiliation with this hospital. A doctor affiliated elsewhere can never
// appear here, and a doctor whose affiliation ended disappears immediately.
export default function HospitalDoctorsView({ hospital, doctors, onBack, onOpenDoctor }) {
  const { t } = usePatientLanguage();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");

  const hospitalDoctors = useMemo(
    () =>
      (doctors || [])
        .map((doctor) => ({
          doctor,
          affiliation: doctor.hospitals.find((h) => h.hospital_id === hospital.hospital_id),
        }))
        .filter((entry) => entry.affiliation),
    [doctors, hospital.hospital_id]
  );

  const specialties = useMemo(
    () =>
      [...new Set(hospitalDoctors.map(({ affiliation }) => affiliation.department).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [hospitalDoctors]
  );

  const visible = hospitalDoctors.filter(({ doctor, affiliation }) => {
    const term = query.trim().toLowerCase();
    const matchesTerm = !term || doctor.full_name.toLowerCase().includes(term);
    const matchesSpecialty = specialty === "all" || affiliation.department === specialty;
    return matchesTerm && matchesSpecialty;
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="rtl:flex-row-reverse">
        <ChevronLeft className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0 rtl:rotate-180" />
        {t("Back to Hospitals & Doctors")}
      </Button>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {hospital.photo_url ? (
              <Image src={hospital.photo_url} alt={hospital.hospital_name} fittingType="fit" className="h-full w-full" />
            ) : (
              <Building2 className="h-7 w-7 text-primary/40" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold leading-tight">{hospital.hospital_name}</h2>
            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              {hospital.location && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                  <span>{hospital.location}</span>
                </p>
              )}
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                <span>{hospital.operating_hours || t("Operating hours not listed")}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search doctors by name")}
            className="ps-9"
          />
        </div>
        <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3">
          <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            className="h-9 min-w-0 bg-transparent text-sm outline-none"
          >
            <option value="all">{t("All specialties")}</option>
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-muted-foreground">
        {visible.length === 1 ? t("1 doctor at this hospital") : t("{count} doctors at this hospital", { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Stethoscope className="mx-auto mb-3 h-10 w-10 opacity-30" />
          {t("No doctors match your search at this hospital.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ doctor, affiliation }) => (
            <DoctorCard
              key={doctor.doctor_id}
              doctor={doctor}
              hospitalName={affiliation.department}
              onOpen={onOpenDoctor}
            />
          ))}
        </div>
      )}
    </div>
  );
}