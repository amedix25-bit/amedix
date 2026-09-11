import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText, TranslatingPlaceholder } from "@/lib/doctorMedicalTranslations";

export default function ConditionsSection({ number, title, category, patient, emptyText, doctorView }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.MedicalCondition.filter(
        { patient_id: patient.id, category },
        "-date"
      );
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id, category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionCard number={number} title={title}>
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">
                  {doctorView
                    ? doctorText("MedicalCondition", item, "name", item.name) ?? <TranslatingPlaceholder />
                    : item.name_ar || item.name}
                </p>
                {(() => {
                  const details = doctorView
                    ? doctorText("MedicalCondition", item, "details", item.details)
                    : item.details;
                  return details ? <p className="text-muted-foreground text-xs mt-0.5">{details}</p> : null;
                })()}
              </div>
              {item.date && <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}