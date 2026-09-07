import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "lucide-react";

export default function PatientImaging({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.ImagingRequest.filter({ patient_id: patientId }, "-date_requested");
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
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No imaging requests</p>
        </div>
      ) : (
        items.map((img) => (
          <div key={img.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{img.scan_type} — {img.body_part}</p>
                <p className="text-sm text-muted-foreground mt-1">Requested by {img.doctor_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{img.date_requested}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${img.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {img.status}
              </span>
            </div>
            {img.status === "completed" && img.report && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800">{img.report}</p>
                {img.report_file_url && (
                  <a href={img.report_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline mt-2 inline-block">
                    View report file
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