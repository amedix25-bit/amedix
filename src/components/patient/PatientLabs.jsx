import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, CheckCircle2, Clock } from "lucide-react";

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

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No laboratory requests</p>
        </div>
      ) : (
        items.map((lab) => (
          <div key={lab.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{lab.test_name}</p>
                {lab.test_code && <p className="text-xs text-muted-foreground mt-0.5">Code: {lab.test_code}</p>}
                <p className="text-sm text-muted-foreground mt-1">Requested by {lab.doctor_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{lab.date_requested}</p>
              </div>
              <StatusBadge status={lab.status} />
            </div>
            {lab.status === "completed" && lab.result && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800">{lab.result}</p>
                {lab.result_file_url && (
                  <a href={lab.result_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline mt-2 inline-block">
                    View result file
                  </a>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    requested: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ""}`}>
      {status}
    </span>
  );
}