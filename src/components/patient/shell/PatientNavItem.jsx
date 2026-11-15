import React from "react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientNavItem({ item, activeKey, onClick, nested = false }) {
  const { t } = usePatientLanguage();
  const Icon = item.icon;
  return <button type="button" onClick={() => onClick(item.key)} aria-current={activeKey === item.key ? "page" : undefined} className={`pp-nav-item ${nested ? "pp-nav-nested" : ""} ${activeKey === item.key ? "is-active" : ""}`}><Icon /><span>{t(item.label)}</span></button>;
}