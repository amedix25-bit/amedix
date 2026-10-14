import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";

const STATUS_STYLES = {
  issued: "bg-slate-100 text-slate-700 border-slate-200",
  authorized: "bg-sky-50 text-sky-700 border-sky-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  dispensed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  issued: "Awaiting Pharmacy",
  authorized: "Authorized",
  reserved: "Reserved",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
};

// Shared prescription dispensing-status badge, used in the Doctor, Patient and
// Pharmacy portals. Renders nothing for an unrecognized status.
export default function PrescriptionStatusBadge({ status }) {
  const { t } = useAppLanguage();
  if (!STATUS_STYLES[status]) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[status]}`}>
      {t(STATUS_LABELS[status])}
    </span>
  );
}