import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function CurrentDiagnosisSection({ number, patient }) {
  const { t } = usePatientLanguage();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!patient?.id) return;
      try {
        // Diagnosis only — the clinical note itself is never exposed to the patient.
        const res = await base44.functions.invoke("patientNoteDiagnoses", { patient_id: patient.id });
        setLatest((res.data.notes || [])[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patient?.id]);

  return (
    <SectionCard number={number} title={t("Current Diagnosis")}>
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : !latest ? (
        <p className="text-sm text-muted-foreground">
          {t("No active diagnosis recorded. Diagnoses from your clinical visits will appear here.")}
        </p>
      ) : (
        <div>
          <p className="font-medium text-sm">{latest.diagnosis}</p>
          {(latest.icd11 || []).length > 0 && (
            <div className="mt-2 space-y-1">
              {latest.icd11.map((d, i) => (
                <div key={`${d.code}-${i}`} className="flex items-start gap-1.5 text-xs">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground shrink-0">
                    {d.code || t("No code")}
                  </span>
                  <span className="text-muted-foreground">
                    {d.display}
                    {d.mapping_state !== "verified" && (
                      <span className="block text-[11px] text-amber-700 dark:text-amber-400">
                        {t("Coding review in progress")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t("Diagnosed on")} {latest.date} · {latest.doctor_name || t("Attending doctor")}
          </p>
        </div>
      )}
    </SectionCard>
  );
}