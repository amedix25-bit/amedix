import React from "react";
import { LAB_STATUS, normalizeLabStatus } from "@/lib/labRequestUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function LabStatusBadge({ status }) {
  const { t } = usePatientLanguage();
  const cfg = LAB_STATUS[normalizeLabStatus(status)];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.className}`}
    >
      {t(cfg.label)}
    </span>
  );
}