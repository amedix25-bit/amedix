import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Repeat, CircleAlert } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Mirrors the server's dispensability rule: quarantined or expired batches
// are never proposed as substitutes.
function isDispensable(item) {
  if (!item || item.is_quarantined) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (item.expiry_date && item.expiry_date < today) return false;
  return true;
}

const norm = (v) => String(v || "").toLowerCase().trim();

// Pharmacy action — request prescriber approval for a substitution. Lists the
// pharmacy's own dispensable stock that contains the SAME active ingredient
// and strength as the prescription (a different brand or generic). A
// clinically different drug is never proposed. The original prescription is
// unchanged until the doctor approves through AMedix.
export default function SubstitutionRequestDialog({ prescription, onChanged, session }) {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadCandidates = async () => {
    setItems(null);
    setSelected(null);
    try {
      const page = await base44.entities.PharmacyInventory.filter(
        { pharmacy_id: prescription.authorized_pharmacy_id },
        { limit: 200 }
      );
      const list = (page.items || page).filter((item) => {
        if (!isDispensable(item) || item.quantity_in_stock <= 0) return false;
        if (norm(item.medication_name) === norm(prescription.medication_name)) return false;
        if (prescription.active_ingredient && norm(item.active_ingredient) !== norm(prescription.active_ingredient)) return false;
        if (prescription.strength && item.strength && norm(item.strength) !== norm(prescription.strength)) return false;
        return true;
      });
      setItems(list);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    if (open) loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = async () => {
    if (!selected) {
      setError(t("Select the product you propose to dispense."));
      return;
    }
    if (!reason.trim()) {
      setError(t("Reason is required — the prescriber reviews it."));
      return;
    }
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("pharmacyRequestSubstitution", {
        prescription_id: prescription.id,
        inventory_id: selected.id,
        reason: reason.trim(),
        ...(session
          ? { pharmacist_id: session.pharmacist_id, pharmacist_session_token: session.session_token }
          : {}),
      });
      setOpen(false);
      setReason("");
      toast({ title: t("Substitution sent for approval"), description: t("The prescription is unchanged until the doctor approves.") });
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("Could not send the request."));
    } finally {
      setSending(false);
    }
  };

  if (!prescription.active_ingredient) return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Repeat className="w-3.5 h-3.5" />
        {t("Request Substitution")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Request Substitution Approval")}</DialogTitle>
            <DialogDescription>
              {t("Propose an equivalent product with the same active ingredient and strength. The doctor approves or rejects it through AMedix before you dispense it.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {items === null ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Checking your stock...")}
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">
                {t("No equivalent product (same active ingredient and strength) found in your dispensable stock.")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      selected?.id === item.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.medication_name}{item.strength ? ` ${item.strength}` : ""}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.active_ingredient || "—"} · {item.dosage_form || "—"}
                      {item.batch_number ? ` · Batch ${item.batch_number}` : ""} · {item.quantity_in_stock} in stock
                    </p>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="subst-reason">{t("Reason")} *</Label>
              <Textarea
                id="subst-reason"
                rows={2}
                placeholder={t("e.g. prescribed product unavailable, equivalent generic in stock...")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>{t("Cancel")}</Button>
              <Button onClick={send} disabled={sending || !selected || items?.length === 0} className="gap-1.5">
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Send for Approval")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PendingSubstitutionNote({ prescription }) {
  const { t } = useAppLanguage();
  const pending = prescription.pending_substitution;
  if (!pending || !pending.medication_name) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
      <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        {t("Substitution pending prescriber approval: {product} — requested by {pharmacy}. Do not dispense the replacement until the doctor approves.", {
          product: `${pending.medication_name}${pending.strength ? ` ${pending.strength}` : ""}`,
          pharmacy: pending.requested_by_pharmacy || "—",
        })}
      </span>
    </div>
  );
}