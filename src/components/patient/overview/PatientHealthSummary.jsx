import React from "react";
import { Heart, CalendarDays, UserRound, Globe2, Pill } from "lucide-react";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientHealthSummary({ age, gender, nationality, conditions = [], medications = [], onNavigate }) {
  const { t, lang } = usePatientLanguage();
  const libyan = /^(libya|libyan|ليبيا|ليبي|ليبية)$/i.test(String(nationality || "").trim());
  const female = String(gender).toLowerCase() === "female";
  // Only the first entry is named, followed by an ellipsis — the full lists
  // live in the Details view, so this card never becomes crowded.
  const firstPlus = (list, pick) => {
    const names = (list || []).map(pick).filter(Boolean);
    if (!names.length) return "—";
    return names.length > 1 ? `${names[0]} …` : names[0];
  };
  const rows = [
    { label: "Age", icon: CalendarDays, color: "pp-icon-purple", value: age === null || age === undefined ? "—" : t("{age} years", { age }) },
    { label: "Sex", icon: UserRound, color: "pp-icon-red", value: gender ? t(gender) : "—", female },
    { label: "Nationality", icon: Globe2, color: "pp-icon-green", value: libyan && lang === "ar" ? "ليبيا" : nationality || "—", flag: libyan },
    { label: "Known Conditions", icon: Heart, color: "pp-icon-red", value: firstPlus(conditions, (item) => (lang === "ar" ? item.name_ar || item.name : item.name)) },
    { label: "Current Medication", icon: Pill, color: "pp-icon-purple", value: firstPlus(medications, (item) => item.name) },
  ];
  return <section className="pp-panel pp-health">
    <div className="pp-health-header"><h2 className="pp-panel-heading"><Heart />{t("Health Summary")}</h2><div className="pp-summary-switch"><button type="button" aria-pressed="true" onClick={() => onNavigate?.("overview")}>{t("Overview")}</button><button type="button" onClick={() => onNavigate?.("health")}>{t("Details")}</button></div></div>
    <div className="pp-health-body">
      <dl className="pp-health-rows">{rows.map(({ label, icon: Icon, color, value, flag, female: femaleIcon }) => <div key={label} className="pp-health-row">{flag ? <span className="pp-libya-flag" role="img" aria-label={t("Libya")}>🇱🇾</span> : femaleIcon ? <PatientReferenceArt kind="femaleIcon" className="pp-sex-icon" /> : <Icon className={color} />}<dt>{t(label)}</dt><dd title={value} className="line-clamp-2">{value}</dd></div>)}</dl>
      <PatientReferenceArt kind="heart" className="pp-health-art" />
    </div>
  </section>;
}