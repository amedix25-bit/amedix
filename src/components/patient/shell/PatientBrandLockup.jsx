import React from "react";
import BrandLogo from "@/components/BrandLogo";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The original AMedix logo, untouched, beside the brand name and portal name.
// Shared by the sidebar and the phone header so the two can never drift apart.
export default function PatientBrandLockup({ className = "" }) {
  const { t } = usePatientLanguage();
  return (
    <div className={`pp-brand ${className}`.trim()}>
      <BrandLogo className="pp-brand-mark" />
      <div className="pp-brand-copy">
        <strong>AMedix</strong>
        <small>{t("Patient Portal")}</small>
      </div>
    </div>
  );
}