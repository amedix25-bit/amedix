import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

// Modal for a refund or an authorized financial adjustment on an existing
// payment transaction. Every correction carries a reason and stays in the
// transaction's traceable history.
export default function PaymentCorrectionDialog({ dialog, busy, error, onSubmit, onClose }) {
  const [form, setForm] = useState({ amount: "", reason: "" });

  useEffect(() => {
    if (!dialog) return;
    setForm({ amount: "", reason: "" });
  }, [dialog]);

  if (!dialog) return null;
  const isRefund = dialog.mode === "refund";
  const tx = dialog.tx || {};

  const submit = () => onSubmit({ amount: Number(form.amount), reason: form.reason.trim() });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{isRefund ? "Refund Payment" : "Financial Adjustment"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs">
          <p className="font-semibold">{tx.prescription_ref || tx.transaction_id} · {tx.patient_name || ""}</p>
          <p className="text-muted-foreground mt-0.5">
            Paid {tx.amount_paid ?? 0} of {tx.amount_due ?? 0} · Balance {tx.outstanding_balance ?? 0}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>{isRefund ? "Refund amount" : "Adjustment amount (negative to reduce)"}</Label>
          <Input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
          />
          {isRefund && (
            <p className="text-[11px] text-muted-foreground">Cannot exceed the amount paid ({tx.amount_paid ?? 0}).</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Reason (required)</Label>
          <Input
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder={isRefund ? "e.g. medication returned unopened" : "e.g. price correction agreed with the patient"}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || !form.reason.trim()}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}