import React from "react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";
import BrandLogo from "@/components/BrandLogo";
import PatientNavItem from "@/components/patient/shell/PatientNavItem";
import PatientSidebarGroup from "@/components/patient/shell/PatientSidebarGroup";
import { NAV_SECTIONS } from "@/components/patient/shell/patientNavigation";
export { NAV_SECTIONS, patientNavLabel } from "@/components/patient/shell/patientNavigation";

export default function PatientSidebar({ activeKey, onNavClick, close }) {
  const { t } = usePatientLanguage();
  const go = (key) => { onNavClick(key); close?.(); };
  return <div className="pp-sidebar">
    <PatientReferenceArt kind="sidebarWave" className="pp-sidebar-wave" />
    <div className="pp-brand"><BrandLogo className="pp-brand-mark" /><div><strong>AMedix</strong><small>{t("Patient Portal")}</small></div></div>
    <nav aria-label={t("Patient Portal")}>
      {NAV_SECTIONS.map((section) => section.type === "group"
        ? <PatientSidebarGroup key={section.key} group={section} activeKey={activeKey} onClick={go} />
        : <PatientNavItem key={section.key} item={section} activeKey={activeKey} onClick={go} />)}
    </nav>
  </div>;
}