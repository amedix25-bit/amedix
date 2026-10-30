import React from "react";
import NeurosurgeryStructuredSections from "@/components/doctor/notes/NeurosurgeryStructuredSections";
import { emergencySections, emergencyPresentationFor } from "@/lib/neurosurgeryEmergency";

// The time-critical pathway. The red flags and actions offered follow the
// emergency being documented, so a cauda equina presentation is not prompted
// with pupillary findings.
export default function EmergencyPathwayField({ value, onChange }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const presentation = emergencyPresentationFor(v.presentation);

  return (
    <NeurosurgeryStructuredSections
      value={v}
      onChange={onChange}
      sections={emergencySections(v)}
      footer={
        presentation
          ? presentation.note
          : "Nothing here blocks treatment. Where treatment came first, record that and complete the pathway immediately afterwards."
      }
    />
  );
}