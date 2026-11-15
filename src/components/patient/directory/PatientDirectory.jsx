import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Loader2, Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatientLanguage } from "@/lib/patientLanguage";
import HospitalCard from "./HospitalCard";
import DoctorCard from "./DoctorCard";
import HospitalDoctorsView from "./HospitalDoctorsView";
import DoctorProfileDialog from "./DoctorProfileDialog";

// Patient Portal → Hospitals & Doctors.
//
// The directory is generated live from the existing AMedix records — hospital
// accounts, their active affiliations and verified doctor profiles — so a
// doctor who joins a hospital with its AMedix Hospital Code appears here
// automatically, and one whose affiliation ends disappears automatically.
const HOSPITAL_PREVIEW = 6;
const DOCTOR_PREVIEW = 6;

export default function PatientDirectory() {
  const { t } = usePatientLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [hospitalQuery, setHospitalQuery] = useState("");
  const [showAllHospitals, setShowAllHospitals] = useState(false);
  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("all");
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [openHospital, setOpenHospital] = useState(null);
  const [openDoctorId, setOpenDoctorId] = useState(null);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("patientDirectory", { action: "directory" })
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.error || t("The directory could not be loaded."));
      });
    return () => {
      active = false;
    };
  }, []);

  const hospitals = data?.hospitals || [];
  const doctors = data?.doctors || [];
  const specialties = data?.specialties || [];

  const filteredHospitals = useMemo(() => {
    const term = hospitalQuery.trim().toLowerCase();
    if (!term) return hospitals;
    return hospitals.filter((hospital) =>
      [hospital.hospital_name, hospital.location].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [hospitals, hospitalQuery]);

  const filteredDoctors = useMemo(() => {
    const term = doctorQuery.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesTerm =
        !term ||
        [doctor.full_name, doctor.specialty, ...(doctor.specialties || [])].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );
      const matchesSpecialty =
        doctorSpecialty === "all" ||
        doctor.specialty === doctorSpecialty ||
        (doctor.specialties || []).includes(doctorSpecialty);
      return matchesTerm && matchesSpecialty;
    });
  }, [doctors, doctorQuery, doctorSpecialty]);

  if (openHospital) {
    return (
      <>
        <HospitalDoctorsView
          hospital={openHospital}
          doctors={doctors}
          onBack={() => setOpenHospital(null)}
          onOpenDoctor={(doctor) => setOpenDoctorId(doctor.doctor_id)}
        />
        <DoctorProfileDialog doctorId={openDoctorId} onClose={() => setOpenDoctorId(null)} />
      </>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-critical">{error}</div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t("Loading hospitals and doctors...")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------------- AMedix Hospitals ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Building2 className="h-5 w-5 text-primary" />
              {t("AMedix Hospitals")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Hospitals registered and approved on AMedix")}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={hospitalQuery}
              onChange={(event) => setHospitalQuery(event.target.value)}
              placeholder={t("Search by hospital name, city or address")}
              className="ps-9"
            />
          </div>
        </div>

        {filteredHospitals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
            {t("No hospitals match your search.")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(showAllHospitals ? filteredHospitals : filteredHospitals.slice(0, HOSPITAL_PREVIEW)).map((hospital) => (
                <HospitalCard key={hospital.hospital_id} hospital={hospital} onViewDoctors={setOpenHospital} />
              ))}
            </div>
            {filteredHospitals.length > HOSPITAL_PREVIEW && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowAllHospitals((value) => !value)}>
                  {showAllHospitals ? t("Show Fewer Hospitals") : t("See All Hospitals")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------------- Find a Doctor ---------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Stethoscope className="h-5 w-5 text-primary" />
            {t("Find a Doctor")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Verified AMedix physicians across all hospitals")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={doctorQuery}
              onChange={(event) => setDoctorQuery(event.target.value)}
              placeholder={t("Search doctors by name")}
              className="ps-9"
            />
          </div>
          <select
            value={doctorSpecialty}
            onChange={(event) => setDoctorSpecialty(event.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm outline-none"
          >
            <option value="all">{t("All specialties")}</option>
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Stethoscope className="mx-auto mb-3 h-10 w-10 opacity-30" />
            {t("No doctors match your search.")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(showAllDoctors ? filteredDoctors : filteredDoctors.slice(0, DOCTOR_PREVIEW)).map((doctor) => (
                <DoctorCard
                  key={doctor.doctor_id}
                  doctor={doctor}
                  hospitalName={
                    doctor.hospitals.length > 1
                      ? `${doctor.hospitals[0].hospital_name} +${doctor.hospitals.length - 1}`
                      : doctor.hospitals[0]?.hospital_name
                  }
                  onOpen={(selected) => setOpenDoctorId(selected.doctor_id)}
                />
              ))}
            </div>
            {filteredDoctors.length > DOCTOR_PREVIEW && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowAllDoctors((value) => !value)}>
                  {showAllDoctors ? t("Show Fewer Doctors") : t("See All Doctors")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <DoctorProfileDialog doctorId={openDoctorId} onClose={() => setOpenDoctorId(null)} />
    </div>
  );
}