import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Siren } from "lucide-react";
import { EMERGENCY_REASONS } from "@/lib/emergencyQr";

// The patient-specific justification that must be recorded before any
// emergency information is released.
export default function EmergencyJustificationForm({ patient, onSubmit, onBack, busy, error }) {
  const [reason, setReason] = useState("");
  const [justification, setJustification] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = () => {
    if (!reason) return setLocalError("Select the emergency reason.");
    if (justification.trim().length < 10) return setLocalError("Give a brief clinical justification (at least 10 characters).");
    if (!confirmed) return setLocalError("Confirm that this is immediate emergency care.");
    setLocalError("");
    onSubmit({ reason, justification: justification.trim(), confirmed: true });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Siren className="w-5 h-5 text-red-600" />
        <div>
          <p className="font-semibold">Emergency access — {patient?.name || "patient"}</p>
          <p className="text-xs text-muted-foreground">CIN {patient?.cin || "—"} · expires automatically</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Emergency reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select the emergency reason" />
          </SelectTrigger>
          <SelectContent>
            {EMERGENCY_REASONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Brief clinical justification</Label>
        <Textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="e.g. Unresponsive patient brought in by ambulance, needs allergy and medication history before treatment."
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
        <span>I confirm this request is for immediate emergency care of this patient.</span>
      </label>

      {(localError || error) && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{localError || error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={submit} disabled={busy} className="bg-red-600 hover:bg-red-700">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
          Grant emergency access
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
      </div>
    </div>
  );
}