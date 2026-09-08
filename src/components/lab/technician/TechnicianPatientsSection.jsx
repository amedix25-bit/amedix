import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LabPatientProfileView from "@/components/lab/LabPatientProfileView";
import { Loader2, Search } from "lucide-react";

// Technician Portal — search patients by name or CIN among those who authorized
// the laboratory, then open the shared authorized patient profile view.
export default function TechnicianPatientsSection({ session, selectedPatientId }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selectedPatientId) setSelected(selectedPatientId);
  }, [selectedPatientId]);

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const res = await base44.functions.invoke("labFindPatientByName", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        name: q,
        include_completed: true,
      });
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  if (selected) {
    return <LabPatientProfileView session={session} patientId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Only patients who explicitly authorized your laboratory can be found here.
      </p>
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Patient name or CIN"
        />
        <Button type="submit" disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
        </Button>
      </form>

      {matches !== null &&
        (matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No authorized patients found for your laboratory with that name or CIN.
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const openCount = m.requests.filter((r) => ["authorized", "pending"].includes(r.status)).length;
              return (
                <button
                  key={m.patient_id}
                  type="button"
                  onClick={() => setSelected(m.patient_id)}
                  className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
                >
                  <p className="text-sm font-medium">{m.patient_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.patient_cin} · {m.requests.length} request
                    {m.requests.length === 1 ? "" : "s"} ({openCount} open)
                  </p>
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}