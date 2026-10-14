import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Ban } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// The prescribing doctor cancels a prescription that has not been dispensed
// yet. The patient — and the authorized pharmacy, when there is one — are
// notified and any held reservation stock is released.
export default function CancelPrescriptionButton({ prescription, onDone }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  if (!["issued", "authorized", "reserved"].includes(prescription.status)) return null;

  const cancel = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("cancelPrescription", {
        prescription_id: prescription.id,
        reason: reason.trim(),
      });
      setOpen(false);
      toast({ title: t("Prescription cancelled"), description: t("The patient has been notified and any reserved stock was released.") });
      onDone?.();
    } catch (err) {
      toast({ title: t("Could not cancel"), description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5" onClick={() => setOpen(true)}>
        <Ban className="w-3.5 h-3.5" />
        {t("Cancel Prescription")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Cancel Prescription")}</DialogTitle>
            <DialogDescription>
              {t("The prescription can no longer be dispensed. The patient will be notified with your reason.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">{t("Reason")}</Label>
              <Textarea
                id="cancel-reason"
                placeholder={t("e.g. Changed treatment plan")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{t("Cancel")}</Button>
              <Button variant="destructive" onClick={cancel} disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Cancel Prescription")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}