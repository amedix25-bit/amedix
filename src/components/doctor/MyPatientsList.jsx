import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, User, Users } from "lucide-react";

export default function MyPatientsList({ doctorProfile, onSelect }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const accessReqs = await base44.entities.AccessRequest.filter({ doctor_id: doctorProfile.id, status: "approved" });
        const seen = new Set();
        const profiles = [];
        await Promise.all(
          accessReqs.map(async (r) => {
            if (seen.has(r.patient_id)) return;
            seen.add(r.patient_id);
            const result = await base44.entities.PatientProfile.filter({ id: r.patient_id });
            if (result.length > 0) profiles.push(result[0]);
          })
        );
        setPatients(profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading your patients...
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No patients have granted you access yet</p>
        <p className="text-xs mt-1">Use the New Patient tab to request access via a patient's CIN.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {patients.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/50 transition-colors"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              p.gender === "male" ? "bg-blue-100 text-blue-700" : p.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">CIN: {p.cin}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
              {p.gender && <span>{p.gender === "male" ? "Male" : p.gender === "female" ? "Female" : p.gender}</span>}
              {p.date_of_birth && <span>DOB: {p.date_of_birth}</span>}
              {p.blood_type && p.blood_type !== "Unknown" && <span>Blood: {p.blood_type}</span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}