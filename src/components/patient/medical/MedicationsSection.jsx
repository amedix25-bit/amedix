import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";

export default function MedicationsSection({ number, patient }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Medication.filter({ patient_id: patient.id }, "-start_date");
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
    <SectionCard number={number} title="Medications">
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No medications were recorded.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-sm">{m.name}</p>
                {m.start_date && <span className="text-xs text-muted-foreground shrink-0">{m.start_date}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {m.dose && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{m.dose}</span>}
                {m.frequency && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{m.frequency}</span>}
                {m.route && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{capitalize(m.route)}</span>}
              </div>
              {m.reason && <p className="text-xs text-muted-foreground mt-2">Reason: {m.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}