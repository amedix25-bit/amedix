import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pill } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Medication reconciliation action — the doctor records that the patient
// reports no longer taking a medication. The record is never deleted: it is
// marked discontinued with a documented reason, keeping the longitudinal
// history traceable. Gated on the patient's active check-in server-side.
export default function StopMedicationDialog({ med, onDone }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason.trim()) {
      setError(t("Documented reason is required."));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("stopPatientMedication", {
        medication_id: med.id,
        reason: reason.trim(),
      });
      setOpen(false);
      setReason("");
      toast({ title: t("Medication discontinued"), description: t("The history keeps the full record with your documented reason.") });
      onDone?.();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || t("Could not discontinue the medication.");
      setError(msg === "checkin_required" ? t("Patient is not checked in — reconciliation stays locked until reception checks the patient in.") : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5 shrink-0">
        <Pill className="w-3.5 h-3.5" />
        {t("No Longer Taking")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Reconcile: No Longer Taking")}</DialogTitle>
            <DialogDescription>
              {t("{med} will be marked discontinued with your documented reason. The record stays in the history — it is never deleted.", { med: med.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="stop-reason">{t("Reason")} *</Label>
              <Textarea
                id="stop-reason"
                rows={3}
                placeholder={t("e.g. patient reports stopped, treatment completed, adverse effect...")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={submit} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Discontinue")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}