import React from "react";

const STATUS_CONFIG = {
  testing_pending: { label: "Testing Pending", classes: "bg-amber-100 text-amber-800 border-amber-200" },
  tests_completed: {
    label: "Tests Completed — Waiting for Results",
    classes: "bg-blue-100 text-blue-800 border-blue-200",
  },
  results_uploaded: { label: "Results Uploaded", classes: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  patient_notified: { label: "Patient Notified", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function VisitStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.testing_pending;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}