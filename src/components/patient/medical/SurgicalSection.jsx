import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Loader2 } from "lucide-react";

export default function SurgicalSection({ number, patient }) {
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
    <SectionCard number={number} title="Past Surgical History">
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No previous surgeries were recorded.</p>
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
                  <p className="font-semibold text-sm">{s.surgery_type}</p>
                  {s.surgery_date && <span className="text-xs text-muted-foreground shrink-0">{s.surgery_date}</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label="Reason / Indication" value={s.reason} />
                  <InfoRow label="Complications" value={s.complications} />
                  <InfoRow label="Recovery / Outcome" value={s.outcome} />
                  <InfoRow label="Hospitalization Duration" value={s.hospitalization_duration} />
                </div>
                {hasAnesthesia && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anesthesia</p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label="Anesthesia History" value={s.anesthesia_history} />
                      <InfoRow label="Anesthesia Complications" value={s.anesthesia_complications} />
                    </div>
                  </div>
                )}
                {(s.other_procedures || s.implants_devices) && (
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow label="Other Procedures" value={s.other_procedures} />
                    <InfoRow label="Implants / Medical Devices" value={s.implants_devices} />
                  </div>
                )}
                {hasTransfusion && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Blood Transfusion History
                    </p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <InfoRow label="Number of Transfusions" value={s.transfusion_count} />
                      <InfoRow label="Blood / Component Type" value={s.transfusion_type} />
                      <InfoRow label="Amount" value={s.transfusion_amount} />
                      <InfoRow label="Reason" value={s.transfusion_reason} />
                      <InfoRow label="Timing (relative to surgery)" value={s.transfusion_timing} />
                      <InfoRow label="Reactions / Complications" value={s.transfusion_reactions} />
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