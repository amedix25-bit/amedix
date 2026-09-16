import React from "react";
import { format } from "date-fns";

// Read-only view of a saved surgical record: every documented field with a
// value, in template order.
export default function SurgicalRecordView({ record }) {
  const entries = Object.entries(record.data || {}).filter(
    ([, value]) => value !== null && String(value).trim() !== ""
  );
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="border-b border-border pb-4">
        <h3 className="font-semibold text-lg">{record.record_type_title || record.record_type}</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
          <p>Patient: <span className="text-foreground font-medium">{record.patient_name}</span></p>
          <p>CIN: <span className="text-foreground font-medium">{record.patient_cin}</span></p>
          <p>Surgeon: <span className="text-foreground font-medium">Dr. {record.doctor_name}</span></p>
          {record.record_datetime && (
            <p>{format(new Date(record.record_datetime), "MMMM d, yyyy 'at' HH:mm")}</p>
          )}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No documented fields.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entries.map(([key, value]) => (
            <div key={key} className={String(value).length > 120 ? "md:col-span-2" : ""}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm whitespace-pre-wrap mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}