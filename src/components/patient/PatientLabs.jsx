import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, CheckCircle2, Clock, Building2 } from "lucide-react";

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

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((lab) => {
      const key = lab.request_group_id || lab.id;
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
      {groups.map((group) => {
        const first = group[0];
        const allCompleted = group.every((l) => l.status === "completed");
        return (
          <div key={first.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">
                  Lab Request — {group.length} test{group.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Requested by {first.doctor_name}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{first.date_requested}</span>
                  {first.lab_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {first.lab_name}
                    </span>
                  )}
                </p>
                {first.indication && (
                  <p className="text-xs text-muted-foreground mt-1">Indication: {first.indication}</p>
                )}
                {first.instructions && (
                  <p className="text-xs text-muted-foreground mt-0.5">Instructions: {first.instructions}</p>
                )}
              </div>
              <StatusBadge status={allCompleted ? "completed" : "requested"} />
            </div>

            <div className="mt-3 pt-3 border-t border-border space-y-2.5">
              {group.map((lab) => (
                <div key={lab.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{lab.test_name}</p>
                    {lab.status === "completed" && lab.result && (
                      <p className="text-xs text-emerald-700 mt-0.5">{lab.result}</p>
                    )}
                    {lab.result_file_url && (
                      <a
                        href={lab.result_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline mt-0.5 inline-block"
                      >
                        View result file
                      </a>
                    )}
                  </div>
                  {lab.status === "completed" ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    requested: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
  };
  const label = status === "requested" ? "Pending" : "Completed";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${styles[status] || ""}`}>
      {label}
    </span>
  );
}