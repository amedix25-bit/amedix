import React from "react";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";

// Category of a prescription for the doctor's previous-prescription lists:
// PENDING — not yet dispensed (issued, authorized or reserved).
// DISPENSED — partially dispensed, more units still to be collected.
// COMPLETE — fully dispensed (all authorized units collected).
// CANCELLED — voided by the doctor or rejected by the pharmacy.
export function prescriptionStatusGroup(prescription) {
  if (prescription.status === "cancelled") return "cancelled";
  if (prescription.status === "dispensed") {
    return prescriptionRemaining(prescription) > 0 ? "dispensed" : "complete";
  }
  return "pending";
}

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "dispensed", label: "Dispensed" },
  { key: "complete", label: "Complete" },
  { key: "cancelled", label: "Cancelled" },
];

// Status category chips for a list of previous prescriptions — All, Pending,
// Dispensed, Complete, Cancelled, each showing its count.
export default function PrescriptionStatusFilter({ items, value, onChange }) {
  const counts = { all: items.length, pending: 0, dispensed: 0, complete: 0, cancelled: 0 };
  for (const p of items) {
    counts[prescriptionStatusGroup(p)] += 1;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onClick={() => onChange(cat.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            value === cat.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
          }`}
        >
          {cat.label} ({counts[cat.key]})
        </button>
      ))}
    </div>
  );
}