import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Family history — the conditions the patient reported in their family. In the
// Doctor Portal the records arrive in `records` from the authorized backend
// payload (the doctor cannot read them directly); in the Patient Portal the
// section reads them for the patient's own account.
export default function FamilyHistorySection({ number, patient, records, doctorView }) {
  const { t } = usePatientLanguage();
  const [items, setItems] = useState(records || null);

  useEffect(() => {
    if (records) setItems(records);
  }, [records]);

  useEffect(() => {
    if (records || !patient?.id) return;
    let active = true;
    const load = async () => {
      try {
        const data = await base44.entities.FamilyHistory.filter({ patient_id: patient.id });
        if (active) setItems(data);
      } catch (err) {
        console.error(err);
        if (active) setItems([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [patient?.id, records]);

  if (items !== null && items.length === 0) return null;

  return (
    <SectionCard number={number} title={t("Family History")}>
      {items === null ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const condition = doctorView
              ? item.condition || item.condition_ar
              : item.condition_ar || item.condition;
            const details = [
              item.age_at_diagnosis ? `${t("Age at diagnosis")}: ${item.age_at_diagnosis}` : "",
              item.notes,
            ].filter(Boolean);
            return (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-sm">{condition || "—"}</p>
                  {item.relation && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      {t(capitalize(item.relation))}
                    </span>
                  )}
                </div>
                {details.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{details.join(" · ")}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}