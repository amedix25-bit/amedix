import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Building2, CalendarDays, Loader2, ShieldAlert, ShieldCheck, UserCheck, Users,
} from "lucide-react";

const STATUS = {
  granted: { label: "Access Granted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: ShieldCheck },
  expired: { label: "Access Expired", cls: "bg-muted text-muted-foreground border-border", Icon: ShieldAlert },
  revoked: { label: "Access Revoked", cls: "bg-red-50 text-red-700 border-red-200", Icon: ShieldAlert },
  suspended: { label: "Access Suspended", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: ShieldAlert },
  none: { label: "No Access", cls: "bg-muted text-muted-foreground border-border", Icon: ShieldAlert },
};

const ageOf = (dob) => {
  if (!dob) return "";
  const born = new Date(dob);
  if (isNaN(born.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? `${age} yrs` : "";
};

const dateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

// MY ASSIGNED PATIENTS — the patients a hospital receptionist checked in and
// assigned to this doctor. The doctor never searches or requests access for
// them: opening the record goes through the normal server-side authorization,
// so a revoked or expired access is blocked with a clear explanation.
export default function MyAssignedPatients({ onSelectPatient }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("doctorAssignedPatients", {});
      setRows(res.data.assigned || []);
      setError("");
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.error || "Could not load your assigned patients.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (rows === null) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your assigned patients…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          My Assigned Patients
        </h3>
        <span className="text-xs text-muted-foreground">{rows.length} checked in</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm rounded-xl border border-border bg-card">
          <Users className="w-9 h-10 mx-auto mb-2 opacity-30" />
          <p>No patients are currently assigned to you.</p>
          <p className="text-xs mt-1">A patient appears here once hospital reception checks them in and selects you as the treating doctor.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {rows.map((r) => {
            const s = STATUS[r.access_status] || STATUS.none;
            const active = r.access_status === "granted";
            return (
              <div key={r.checkin_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    CIN: {r.patient_cin || "—"}
                    {ageOf(r.date_of_birth) ? ` · ${ageOf(r.date_of_birth)}` : ""}
                    {r.gender ? ` · ${r.gender}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {r.hospital_name || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {dateTime(r.checkin_datetime)}
                    </span>
                    {r.encounter_ref && <span>Encounter {r.encounter_ref}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 ${s.cls}`}>
                    <s.Icon className="w-3 h-3" /> {s.label}
                  </span>
                  <Button
                    size="sm"
                    variant={active ? "default" : "outline"}
                    disabled={!active}
                    onClick={() =>
                      onSelectPatient &&
                      onSelectPatient({
                        id: r.patient_id,
                        cin: r.patient_cin,
                        full_name: r.patient_name,
                        date_of_birth: r.date_of_birth,
                        gender: r.gender,
                      })
                    }
                  >
                    Open Record
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Access comes from the hospital check-in for that visit only. It ends when the visit is closed, and the patient can
        remove it at any time — a revoked or expired authorization cannot be opened.
      </p>
    </div>
  );
}