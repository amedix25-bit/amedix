import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import PatientLabRequestCard from "@/components/patient/PatientLabRequestCard";
import { FlaskConical } from "lucide-react";

export default function PatientLabs({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.LabRequest.filter({ patient_id: patientId }, "-date_requested");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Consolidated requests render as one card each; older per-test records stay grouped by their original submission.
  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((lab) => {
      const key = Array.isArray(lab.tests) && lab.tests.length > 0 ? lab.id : (lab.request_group_id || lab.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(lab);
    });
    return [...map.values()];
  }, [items]);

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No laboratory requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PatientLabRequestCard key={group[0].id} group={group} onRequestUpdated={load} />
      ))}
    </div>
  );
}