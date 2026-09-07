import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Loader2, Stethoscope } from "lucide-react";

export default function PatientHealth({ patientId, profile }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await base44.entities.ClinicalNote.filter({ patient_id: patientId }, "-date");
        setNotes(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading your health summary...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Medical Summary</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Blood Type</p>
            <p className="font-semibold mt-1">{profile?.blood_type || "Unknown"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Allergies</p>
            <p className="font-semibold mt-1">{profile?.allergies || "None recorded"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Emergency Contact</p>
            <p className="font-semibold mt-1">
              {profile?.emergency_contact_name || "—"}
              {profile?.emergency_contact_phone ? ` · ${profile.emergency_contact_phone}` : ""}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Date of Birth</p>
            <p className="font-semibold mt-1">{profile?.date_of_birth || "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Clinical History</h3>
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No clinical notes yet. Notes added by your authorized doctors will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{note.diagnosis}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      {note.doctor_name || "Doctor"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{note.date}</span>
                </div>
                {note.notes && <p className="text-sm text-muted-foreground mt-3">{note.notes}</p>}
                {note.prescription && (
                  <div className="mt-3 p-3 rounded-lg bg-accent text-sm">
                    <span className="font-medium">Prescription: </span>
                    {note.prescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}