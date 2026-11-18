import React from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Loader2, Lock, Siren } from "lucide-react";

// The two actions under the summary. "Open Full Medical Record" is only usable
// when the server confirmed the doctor holds the patient's authorization; the
// emergency summary itself never widens the doctor's normal permissions.
export default function EmergencySummaryActions({ authorized, onStartEncounter, onOpenFullRecord, busy }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onStartEncounter} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
          Start Emergency Encounter
        </Button>
        <Button variant="outline" onClick={onOpenFullRecord} disabled={!authorized || busy} className="gap-2">
          {authorized ? <FolderOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Open Full Medical Record
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {authorized
          ? "You hold authorized access to this patient's full record. Starting an encounter opens the existing AMedix emergency documentation and audit workflow."
          : "The full medical record needs the patient's own authorization and stays closed during emergency access. Start the emergency encounter to document care; the summary above is the minimum necessary information for treatment."}
      </p>
    </div>
  );
}