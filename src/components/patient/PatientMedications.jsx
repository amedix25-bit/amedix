import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Pill, Loader2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";

export default function PatientMedications({ patient }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Medication.filter({ patient_id: patient.id }, "-start_date");
      setMedications(results);
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
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No medications were recorded at registration. Your medication list is managed by your doctor or an administrator.
          </p>
        </div>
      ) : (
        medications.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {m.dose && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{m.dose}</span>}
                    {m.frequency && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{m.frequency}</span>}
                    {m.route && <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{capitalize(m.route)}</span>}
                  </div>
                </div>
              </div>
              {m.start_date && <span className="text-xs text-muted-foreground shrink-0">Started {m.start_date}</span>}
            </div>
            {m.reason && <p className="text-xs text-muted-foreground mt-3">Reason: {m.reason}</p>}
          </div>
        ))
      )}
    </div>
  );
}