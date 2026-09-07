import React from "react";
import { LAB_STATUS, normalizeLabStatus } from "@/lib/labRequestUtils";

export default function LabStatusBadge({ status }) {
  const cfg = LAB_STATUS[normalizeLabStatus(status)];
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide shrink-0 ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}