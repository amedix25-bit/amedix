import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LabPatientProfileView from "@/components/lab/LabPatientProfileView";
import { Loader2, Users } from "lucide-react";

// Lab Portal — patients who have authorized this laboratory.
export default function LabPatientsSection({ profile, selectedPatientId, onSelectPatient }) {
  const [patients, setPatients] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selectedPatientId) setSelected(selectedPatientId);
  }, [selectedPatientId]);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await base44.entities.LabRequest.filter({ lab_id: profile.id }, "-created_date", 200);
        const map = new Map();
        requests
          .filter((r) => r.authorized_by_patient === true)
          .forEach((r) => {
            if (!map.has(r.patient_id)) {
              map.set(r.patient_id, {
                patient_id: r.patient_id,
                patient_name: r.patient_name,
                patient_cin: r.patient_cin,
                request_count: 0,
              });
            }
            map.get(r.patient_id).request_count += 1;
          });
        setPatients([...map.values()]);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.id]);

  if (selected) {
    return (
      <LabPatientProfileView
        patientId={selected}
        onBack={() => {
          setSelected(null);
          onSelectPatient?.(null);
        }}
      />
    );
  }

  if (patients === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No patients have authorized your laboratory yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {patients.map((p) => (
        <button
          key={p.patient_id}
          type="button"
          onClick={() => setSelected(p.patient_id)}
          className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{p.patient_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.patient_cin} · {p.request_count} request{p.request_count === 1 ? "" : "s"}
            </p>
          </div>
          <span className="text-xs text-primary font-medium shrink-0">View Profile</span>
        </button>
      ))}
    </div>
  );
}