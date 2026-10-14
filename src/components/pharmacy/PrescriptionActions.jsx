import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PackageCheck, Pill, XCircle, ClipboardList } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";
import SubstitutionRequestDialog, { PendingSubstitutionNote } from "@/components/pharmacy/SubstitutionRequestDialog";

function parseQty(value) {
  const n = parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function unitWord(qtyStr) {
  const m = String(qtyStr || "").replace(/[^0-9.]/g, " ").trim().split(/\s+/)[1];
  return m || "unit(s)";
}

// Computes how much of the authorized quantity remains to be dispensed,
// mirroring the server-side logic (including legacy prescriptions).
export function prescriptionRemaining(prescription) {
  const authorized = parseQty(prescription.quantity);
  if (authorized <= 0) return 0;
  const events = prescription.dispensing_events || [];
  let dispensed = events.reduce(
    (sum, ev) => sum + (parseQty(ev.quantity) || Number(ev.quantity_number) || 0),
    0
  );
  if (events.length === 0 && prescription.status === "dispensed" && (prescription.dispensed_datetime || prescription.dispensed_quantity)) {
    dispensed = authorized;
  }
  // Each consumed refill re-opens the full authorized quantity.
  const capacity = authorized * (1 + (prescription.refills_used || 0));
  return Math.max(0, capacity - dispensed);
}

// Reserve / Fill Prescription / Reject actions for a prescription authorized
// to a pharmacy. Fill Prescription records the medication and quantity
// actually dispensed — full or partial. Used in the Pharmacy Portal
// prescriptions queue and the patient lookup view.
export default function PrescriptionActions({ prescription, onChanged }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const authorized = parseQty(prescription.quantity);
  const unit = unitWord(prescription.quantity);
  const remaining = prescriptionRemaining(prescription);
  const refillsLeft = (prescription.refills_authorized || 0) - (prescription.refills_used || 0);
  const canReserve = prescription.status === "authorized";
  const canFill = ["authorized", "reserved", "dispensed"].includes(prescription.status) &&
    (authorized <= 0 || remaining > 0 || refillsLeft > 0);
  const canReject = ["authorized", "reserved"].includes(prescription.status);

  const reserve = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("pharmacyReservePrescription", {
        prescription_id: prescription.id,
      });
      toast({ title: t("Reservation confirmed"), description: `${t("Code")} ${res.data.reservation_code} — ${t("the patient has been notified.")}` });
      onChanged?.();
    } catch (err) {
      toast({ title: t("Could not reserve"), description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const openFill = () => {
    setQty(remaining > 0 ? String(remaining) : "1");
    setFillOpen(true);
  };

  const fill = async () => {
    const n = parseFloat(qty);
    if (!Number.isFinite(n) || n <= 0) {
      toast({ title: t("Could not dispense"), description: t("Enter the quantity actually dispensed."), variant: "destructive" });
      return;
    }
    if (remaining > 0 && n > remaining) {
      toast({
        title: t("Could not dispense"),
        description: t("Only {count} {unit} remain — dispense {count2} or less.", { count: remaining, unit, count2: remaining }),
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("pharmacyDispensePrescription", {
        prescription_id: prescription.id,
        dispensed_quantity: n,
      });
      setFillOpen(false);
      toast({
        title: res.data.consumed_refill ? t("Refill dispensed") : t("Medication dispensed"),
        description: res.data.remaining > 0
          ? t("Partial fill recorded — {count} {unit} remain.", { count: res.data.remaining, unit })
          : t("The patient and the prescribing doctor have been notified."),
      });
      onChanged?.();
    } catch (err) {
      toast({ title: t("Could not dispense"), description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("pharmacyRejectPrescription", {
        prescription_id: prescription.id,
        reason: reason.trim() || "Medication unavailable at this pharmacy",
      });
      setRejectOpen(false);
      toast({ title: t("Prescription rejected"), description: t("The patient and the prescribing doctor have been notified.") });
      onChanged?.();
    } catch (err) {
      toast({ title: t("Could not reject"), description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!canReserve && !canFill && !canReject) return null;

  return (
    <div>
      <PendingSubstitutionNote prescription={prescription} />
      <div className="flex items-center gap-2 flex-wrap">
      {canReserve && (
        <Button size="sm" onClick={reserve} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
          {t("Confirm Reservation")}
        </Button>
      )}
      {canFill && (
        <Button size="sm" variant="outline" onClick={openFill} disabled={busy} className="gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          {remaining > 0 && prescription.status === "dispensed" ? t("Fill Remaining") : t("Fill Prescription")}
        </Button>
      )}
      {canReject && (
        <Button size="sm" variant="ghost" onClick={() => setRejectOpen(true)} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
          <XCircle className="w-3.5 h-3.5" />
          {t("Reject")}
        </Button>
      )}
      {canFill && (
        <SubstitutionRequestDialog prescription={prescription} onChanged={onChanged} />
      )}

      <Dialog open={fillOpen} onOpenChange={setFillOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              {t("Fill Prescription")}
            </DialogTitle>
            <DialogDescription>
              {prescription.medication_name}{prescription.strength ? ` ${prescription.strength}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-border p-2">
                <p className="text-muted-foreground">{t("Authorized")}</p>
                <p className="font-semibold mt-0.5">{authorized > 0 ? `${authorized} ${unit}` : t("Not specified")}</p>
              </div>
              <div className="rounded-lg border border-border p-2">
                <p className="text-muted-foreground">{t("Already dispensed")}</p>
                <p className="font-semibold mt-0.5">{prescription.total_dispensed_quantity || `0 ${unit}`}</p>
              </div>
              <div className="rounded-lg border border-border p-2">
                <p className="text-muted-foreground">{t("Remaining")}</p>
                <p className="font-semibold mt-0.5">{remaining > 0 ? `${remaining} ${unit}` : t("—")}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Refills")}: {prescription.refills_used || 0}/{prescription.refills_authorized || 0} {t("used")}
            </p>
            {remaining > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="dispense-qty">
                  {t("Quantity actually dispensed")} ({unit})
                </Label>
                <Input
                  id="dispense-qty"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("Dispense less than the remaining quantity for a partial fill — the rest can be filled later.")}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFillOpen(false)} disabled={busy}>{t("Cancel")}</Button>
              <Button onClick={fill} disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Confirm Fill")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Reject Prescription")}</DialogTitle>
            <DialogDescription>
              {t("The prescription will be cancelled and the patient and prescribing doctor will be notified with your reason.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">{t("Reason")}</Label>
              <Textarea
                id="reject-reason"
                placeholder={t("e.g. Medication unavailable at this pharmacy")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={busy}>{t("Cancel")}</Button>
              <Button variant="destructive" onClick={reject} disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Reject Prescription")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}