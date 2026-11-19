import React from "react";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";

// A clinical Textarea with the AMedix dictation control attached, used by the
// specialty structured documentation fields (cardiology, pulmonology,
// ophthalmology, surgery, paediatrics, …). It accepts exactly the same props
// as the plain Textarea — including an event-based onChange — so a specialty
// field adopts dictation by importing this module instead of the base one.
// The doctor's own verified specialty is resolved automatically by the
// dictation control, so every specialty gets specialty-aware correction.
export function Textarea({ value, onChange, dictationContext, specialty, ...props }) {
  return (
    <div className="space-y-1">
      <BaseTextarea value={value} onChange={onChange} {...props} />
      <MedicalDictationButton
        value={value ?? ""}
        onChange={(text) => onChange && onChange({ target: { value: text } })}
        specialty={specialty}
        contextLabel={dictationContext || props.placeholder || "clinical documentation"}
      />
    </div>
  );
}

export default Textarea;