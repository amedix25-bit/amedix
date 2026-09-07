import React from "react";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { SMOKING_LABELS, ALCOHOL_LABELS, PREGNANCY_LABELS } from "@/lib/patientUtils";

export default function LifestyleSection({ number, patient, onEdit }) {
  const female = patient?.gender === "female";
  const pregnant = patient?.pregnancy_status === "pregnant";

  return (
    <SectionCard
      number={number}
      title="Lifestyle and Pregnancy"
      action={onEdit && <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>}
    >
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        <InfoRow label="Smoking Status" value={SMOKING_LABELS[patient?.smoking_status] || "Not specified"} />
        <InfoRow label="Alcohol Use" value={ALCOHOL_LABELS[patient?.alcohol_use] || "Not specified"} />
        <InfoRow label="Other Substance Use" value={patient?.substance_use} />
      </div>
      {female && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <InfoRow label="Pregnancy Status" value={PREGNANCY_LABELS[patient?.pregnancy_status] || "Not specified"} />
            {pregnant && (
              <>
                <InfoRow label="Gestational Age" value={patient?.gestational_age} />
                <InfoRow label="Estimated Due Date" value={patient?.estimated_due_date} />
              </>
            )}
            <InfoRow label="Pregnancy History" value={patient?.pregnancy_history} />
          </div>
        </div>
      )}
    </SectionCard>
  );
}