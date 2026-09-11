import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RadiologistProfileCard from "./RadiologistProfileCard";

// Radiologist Portal Overview tab — welcome card with the radiologist's
// photo and name, plus activity stats from their radiology work.
export default function RadiologistOverview({ profile, onProfileUpdate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [records, results] = await Promise.all([
          base44.entities.RadiologyRecord.filter({ radiologist_id: profile.id }),
          base44.entities.ImagingResult.filter({ radiologist_id: profile.id }),
        ]);
        if (!cancelled) {
          setStats({
            patients: new Set(records.map((r) => r.patient_id)).size,
            reports: records.length + results.length,
          });
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setStats({ patients: 0, reports: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  return <RadiologistProfileCard profile={profile} onProfileUpdate={onProfileUpdate} stats={stats} />;
}