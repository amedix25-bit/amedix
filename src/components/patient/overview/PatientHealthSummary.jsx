import React from "react";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";

const HEART_ILLUSTRATION =
  "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/08e7777d9_generated_image.png";

const Chip = ({ children }) => (
  <span className="rounded-full bg-patient-accent/10 px-2.5 py-1 text-xs font-medium text-patient-accent">
    {children}
  </span>
);

const Empty = () => <span className="text-xs font-medium text-patient-muted">—</span>;

// A short read of the patient's clinical picture — who they are, what they are
// known to have, and what they are taking right now.
export default function PatientHealthSummary({ age, gender, nationality, conditions, medications, allergies }) {
  const { t } = usePatientLanguage();

  return (
    <div className="pp-glass flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-patient-ink">{t("Health Summary")}</h2>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: t("Age"), value: age === null || age === undefined ? "—" : age },
            { label: t("Sex"), value: gender ? t(gender) : "—" },
            { label: t("Nationality"), value: nationality || "—" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-patient-muted">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-patient-ink">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-patient-muted">
            {t("Known Conditions")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {conditions.length === 0 ? <Empty /> : conditions.map((c) => <Chip key={c.id}>{c.name}</Chip>)}
          </div>
        </div>

        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-patient-muted">
            {t("Current Medication")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {medications.length === 0 ? <Empty /> : medications.map((m) => <Chip key={m.id}>{m.name}</Chip>)}
          </div>
        </div>

        {allergies && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-patient-muted">{t("Allergies")}</p>
            <p className="mt-1 text-xs font-medium text-patient-red">{allergies}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center sm:w-40">
        <Image
          src={HEART_ILLUSTRATION}
          alt=""
          fittingType="fit"
          className="h-32 w-32 object-contain sm:h-40 sm:w-40"
        />
      </div>
    </div>
  );
}