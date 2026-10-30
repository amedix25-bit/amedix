import React from "react";
import NeurosurgeryStructuredSections from "@/components/doctor/notes/NeurosurgeryStructuredSections";
import { operativeSections, procedureFor } from "@/lib/neurosurgeryOperative";

// The operation record: the shared pre-operative, team, procedure, findings,
// implant and recovery sections, followed by the block that belongs to the
// procedure actually performed.
export default function OperativeRecordField({ value, onChange }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const specific = v.specific && typeof v.specific === "object" ? v.specific : {};
  const procedure = procedureFor(v.procedure_type);

  return (
    <div className="space-y-2">
      <NeurosurgeryStructuredSections value={v} onChange={onChange} sections={operativeSections(v.procedure_type)} />
      {procedure && procedure.key !== "other" && (
        <NeurosurgeryStructuredSections
          value={specific}
          onChange={(next) => onChange({ ...v, specific: next })}
          sections={[
            {
              title: `${procedure.label} — procedure-specific record`,
              note: "Shown because this procedure was selected. A field left blank is recorded as not documented, not as absent.",
              fields: procedure.fields,
            },
          ]}
        />
      )}
    </div>
  );
}