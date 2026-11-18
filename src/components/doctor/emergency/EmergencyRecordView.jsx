import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Droplet, Loader2, RefreshCw, ShieldAlert, Square } from "lucide-react";
import { dateTimeLabel } from "@/lib/emergencyQr";
import EmergencyPatientSummary from "./summary/EmergencyPatientSummary";

// The live emergency screen: the session banner (who, how long, how to stop) and
// the Emergency Patient Summary assembled for this one patient-bound session.
// Access has no short countdown — it stays open, 24/7, until the patient is
// checked out or the doctor ends it.
export default function EmergencyRecordView({ record, onRefresh, onEnd, busy, error, doctorProfile, onStartEncounter }) {
  const [reload, setReload] = useState(0);

  const patient = (record && record.bundle && record.bundle.patient) || {};

  const refreshAll = () => {
    setReload((n) => n + 1);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 font-semibold text-red-800">
              <ShieldAlert className="w-4 h-4" /> Emergency access active
            </p>
            <p className="font-heading text-xl font-bold text-primary mt-1" dir="auto">
              {patient.name || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              CIN {patient.cin || "—"} · DOB {patient.date_of_birth || "—"} · {patient.gender || "—"}
            </p>
          </div>
          <div className="text-sm text-red-900 space-y-1 text-right">
            <p className="font-mono text-xs">{record?.session_ref}</p>
            <p className="font-semibold">Open until the patient is checked out</p>
            <p className="text-xs opacity-80">Started {dateTimeLabel(record?.access_start)}</p>
            <p className="text-xs opacity-80">Available 24/7 — end it yourself with &ldquo;End access now&rdquo;.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-card border-red-300 text-red-800">
            <Droplet className="w-3 h-3 mr-1" /> Blood group {patient.blood_type || "Unknown"}
          </Badge>
          {((record && record.bundle && record.bundle.categories) || []).map((c) => (
            <Badge key={c} variant="secondary" className="text-[11px]">
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEnd()} disabled={busy}>
            <Square className="w-4 h-4" /> End access now
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <EmergencyPatientSummary
        key={`${record?.session_id || ""}:${reload}`}
        record={record}
        doctorProfile={doctorProfile}
        onStartEncounter={onStartEncounter}
      />
    </div>
  );
}