import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ArrowLeft, EyeOff, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Radiologist Portal → Find Patient → My Patients.
// Patients who authorized this radiologist's access, searchable by name or CIN.
export default function RadiologistMyPatients({ user, onBack, onSelect }) {
  const [requests, setRequests] = useState(null);
  const [query, setQuery] = useState("");
  const [openingId, setOpeningId] = useState(null);

  const load = async () => {
    try {
      const reqs = await base44.entities.RadiologistAccessRequest.filter({
        radiologist_user_id: user.id,
      });
      // Only patients who granted (or suspended) access — patient-authorized associations.
      setRequests(reqs.filter((r) => r.status === "approved" || r.status === "suspended"));
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openPatient = async (req) => {
    if (req.status !== "approved") return;
    setOpeningId(req.id);
    try {
      const p = await base44.entities.PatientProfile.get(req.patient_id);
      onSelect(p);
    } catch (err) {
      console.error(err);
    } finally {
      setOpeningId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = (requests || []).filter(
    (r) =>
      !q ||
      (r.patient_name || "").toLowerCase().includes(q) ||
      (r.patient_cin || "").toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name or CIN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {requests === null ? (
        <div className="flex items-center text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No authorized patients yet</p>
          <p className="text-xs mt-1">
            Patients appear here once they approve your access request from Add New.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const granted = r.status === "approved";
            return (
              <button
                key={r.id}
                onClick={() => openPatient(r)}
                disabled={!granted || openingId === r.id}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  granted
                    ? "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                    : "border-border bg-muted/40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.patient_name}</p>
                    <p className="text-sm text-muted-foreground">CIN: {r.patient_cin}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access granted on {r.date_responded || "—"}
                    </p>
                  </div>
                  {granted ? (
                    openingId === r.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Access Granted
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <EyeOff className="w-3 h-3" />
                      Access Suspended
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}