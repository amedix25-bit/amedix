import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Loader2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText, TranslatingPlaceholder } from "@/lib/doctorMedicalTranslations";

export default function SurgicalSection({ number, patient, doctorView }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  // Doctor Portal display value — English translation of patient-entered
  // Arabic text; unchanged for English values and in the Patient Portal.
  const dv = (s, field) => (doctorView ? doctorText("SurgicalHistory", s, field, s[field]) : s[field]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.SurgicalHistory.filter({ patient_id: patient.id }, "-surgery_date");
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionCard number={number} title={t("Past Surgical History")}>
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No previous surgeries were recorded.")}</p>
      ) : (
        <div className="space-y-4">
          {items.map((s) => {
            const hasAnesthesia = s.anesthesia_history || s.anesthesia_complications;
            const hasTransfusion =
              s.transfusion_count || s.transfusion_type || s.transfusion_amount ||
              s.transfusion_reason || s.transfusion_timing || s.transfusion_reactions;
            return (
              <div key={s.id} className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm">
                    {doctorView
                      ? doctorText("SurgicalHistory", s, "surgery_type", s.surgery_type) ?? <TranslatingPlaceholder />
                      : s.surgery_type_ar || s.surgery_type}
                  </p>
                  {s.surgery_date && <span className="text-xs text-muted-foreground shrink-0">{s.surgery_date}</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label={t("Reason / Indication")} value={dv(s, "reason")} />
                  <InfoRow label={t("Complications")} value={dv(s, "complications")} />
                  <InfoRow label={t("Recovery / Outcome")} value={dv(s, "outcome")} />
                  <InfoRow label={t("Hospitalization Duration")} value={dv(s, "hospitalization_duration")} />
                </div>
                {hasAnesthesia && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("Anesthesia")}</p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label={t("Anesthesia History")} value={dv(s, "anesthesia_history")} />
                      <InfoRow label={t("Anesthesia Complications")} value={dv(s, "anesthesia_complications")} />
                    </div>
                  </div>
                )}
                {(s.other_procedures || s.implants_devices) && (
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow label={t("Other Procedures")} value={dv(s, "other_procedures")} />
                    <InfoRow label={t("Implants / Medical Devices")} value={dv(s, "implants_devices")} />
                  </div>
                )}
                {hasTransfusion && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {t("Blood Transfusion History")}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label={t("Number of Transfusions")} value={dv(s, "transfusion_count")} />
                      <InfoRow label={t("Blood / Component Type")} value={dv(s, "transfusion_type")} />
                      <InfoRow label={t("Amount")} value={dv(s, "transfusion_amount")} />
                      <InfoRow label={t("Reason")} value={dv(s, "transfusion_reason")} />
                      <InfoRow label={t("Timing (relative to surgery)")} value={dv(s, "transfusion_timing")} />
                      <InfoRow label={t("Reactions / Complications")} value={dv(s, "transfusion_reactions")} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}