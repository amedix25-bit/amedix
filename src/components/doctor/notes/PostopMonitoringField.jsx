import React from "react";
import NeurosurgeryStructuredSections from "@/components/doctor/notes/NeurosurgeryStructuredSections";
import { postopSections } from "@/lib/neurosurgeryPostop";

// Post-operative monitoring: observation interval, neurological trend, wound and
// drain, the complications being watched for, and the documented thresholds for
// calling for help — with the responsible clinician and the review plan.
export default function PostopMonitoringField({ value, onChange, variant }) {
  return (
    <NeurosurgeryStructuredSections
      value={value}
      onChange={onChange}
      sections={postopSections(variant)}
      footer="A threshold being reached prompts a review; it is never a diagnosis and never replaces the clinician's decision."
    />
  );
}