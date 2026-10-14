import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Repeat } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// The prescribing doctor's review of a pharmacy substitution request —
// approve or reject. The original prescription is unchanged until the doctor
// approves; every approved substitution is recorded with the original
// medication, the replacement, the reason, the approver and the timestamp.
export default function SubstitutionReview({ prescription, onChanged }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState("");
  const pending = prescription.pending_substitution;
  const history = prescription.substitution_history || [];

  const decide = async (decision) => {
    setBusy(decision);
    try {
      await base44.functions.invoke("respondMedicationSubstitution", {
        prescription_id: prescription.id,
        decision,
      });
      toast({
        title: decision === "approve" ? t("Substitution approved") : t("Substitution declined"),
        description: t("The pharmacy and the patient have been notified."),
      });
      onChanged?.();
    } catch (err) {
      toast({
        title: t("Could not record the decision"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("Substitution History")}
          </p>
          <div className="mt-1.5 space-y-1">
            {history.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <Repeat className="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />
                {s.original_medication_name}{s.original_strength ? ` ${s.original_strength}` : ""} → {s.replacement_medication_name}{s.replacement_strength ? ` ${s.replacement_strength}` : ""}
                {s.reason ? ` · ${s.reason}` : ""}
                {s.approved_by_name ? ` · ${t("approved by")} ${s.approved_by_name}` : ""}
                {s.approved_datetime ? ` · ${new Date(s.approved_datetime).toLocaleString()}` : ""}
              </p>
            ))}
          </div>
        </div>
      )}
      {pending && pending.medication_name && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
            <Repeat className="w-4 h-4" />
            {t("Substitution Approval Requested")}
          </p>
          <p className="text-xs text-amber-900">
            {pending.requested_by_pharmacy || "Pharmacy"} proposes{" "}
            <span className="font-semibold">{pending.medication_name}{pending.strength ? ` ${pending.strength}` : ""}</span>{" "}
            instead of {prescription.medication_name}{prescription.strength ? ` ${prescription.strength}` : ""} —
            same active ingredient, awaiting your review. The prescription is unchanged.
          </p>
          {pending.reason && <p className="text-xs text-amber-900">{t("Reason")}: {pending.reason}</p>}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => decide("approve")} disabled={!!busy} className="gap-1.5">
              {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t("Approve Substitution")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("reject")} disabled={!!busy} className="gap-1.5">
              {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              {t("Reject")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}