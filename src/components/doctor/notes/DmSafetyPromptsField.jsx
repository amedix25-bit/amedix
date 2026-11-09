import React from "react";
import SafetyPromptsReview from "@/components/doctor/notes/SafetyPromptsReview";
import { buildDmSafetyPrompts } from "@/lib/dmSafetyRules";

// The dermatology safety review: suspicious lesions, severe drug reactions, blistering
// disease, necrotising infection, isotretinoin safeguards and documented severity.
export default function DmSafetyPromptsField(props) {
  return <SafetyPromptsReview {...props} build={buildDmSafetyPrompts} />;
}