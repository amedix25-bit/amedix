import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";

// Shown at the top of a patient's record: makes it unmistakable to the doctor
// that the patient has granted them access to this record, and since when.
export default function PatientAccessBanner({ patientId, doctorId }) {
  const [granted, setGranted] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const requests = await base44.entities.AccessRequest.filter({
          patient_id: patientId,
          doctor_id: doctorId,
          status: "approved",
        });
        if (active) setGranted(requests[0] || null);
      } catch (err) {
        console.error(err);
      }
    };
    if (patientId && doctorId) load();
    return () => {
      active = false;
    };
  }, [patientId, doctorId]);

  if (!granted) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
      <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold text-sm text-emerald-900">Access granted to you</p>
        <p className="text-xs text-emerald-800 mt-1">
          This patient has approved your access — you can view and work in their full medical record.
        </p>
        {granted.date_responded && (
          <p className="text-xs text-emerald-700 mt-1">Granted on {granted.date_responded}</p>
        )}
      </div>
    </div>
  );
}