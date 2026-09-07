import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText } from "lucide-react";

export default function PatientDocuments({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.MedicalDocument.filter({ patient_id: patientId }, "-date");
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
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No medical documents</p>
        </div>
      ) : (
        items.map((doc) => (
          <div key={doc.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {doc.type} · {doc.doctor_name || "Self"} · {doc.date}
              </p>
            </div>
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex-shrink-0">
                View
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}