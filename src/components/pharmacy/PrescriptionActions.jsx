import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PackageCheck, Pill } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Reserve / Dispense actions for a prescription authorized to a pharmacy.
// Used in the Pharmacy Portal prescriptions queue and the patient lookup view.
export default function PrescriptionActions({ prescription, onChanged }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const canReserve = prescription.status === "authorized";
  const canDispense = ["authorized", "reserved", "dispensed"].includes(prescription.status);

  const reserve = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("pharmacyReservePrescription", {
        prescription_id: prescription.id,
      });
      toast({ title: "Reservation confirmed", description: `Code ${res.data.reservation_code} — the patient has been notified.` });
      onChanged?.();
    } catch (err) {
      toast({ title: "Could not reserve", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const dispense = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("pharmacyDispensePrescription", {
        prescription_id: prescription.id,
      });
      toast({ title: "Medication dispensed", description: "The patient has been notified." });
      onChanged?.();
    } catch (err) {
      toast({ title: "Could not dispense", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!canReserve && !canDispense) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canReserve && (
        <Button size="sm" onClick={reserve} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
          {t("Confirm Reservation")}
        </Button>
      )}
      {canDispense && (
        <Button size="sm" variant="outline" onClick={dispense} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pill className="w-3.5 h-3.5" />}
          {t("Dispense Medication")}
        </Button>
      )}
    </div>
  );
}