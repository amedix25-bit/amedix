import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X, Receipt } from "lucide-react";

export const METHODS = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "insurance", label: "Insurance" },
  { key: "mobile_wallet", label: "Mobile Wallet" },
  { key: "other", label: "Other" },
];

// Modal for recording a payment — against a specific dispensing transaction,
// against an outstanding balance on an existing transaction, or before
// dispensing (a prepayment). Non-cash methods are recorded as pending
// verification.
export default function PaymentRecordDialog({ dialog, busy, error, onSubmit, onClose }) {
  const [form, setForm] = useState({ prescription_ref: "", amount_due: "", amount: "", method: "cash", note: "" });
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!dialog) return;
    setSelectedId(dialog.prescription?.id || "");
    setForm({
      prescription_ref: dialog.prescription?.prescription_id || "",
      amount_due: dialog.prefill?.amount_due != null && dialog.prefill.amount_due !== "" ? String(dialog.prefill.amount_due) : "",
      amount: dialog.prefill?.amount != null && dialog.prefill.amount !== "" ? String(dialog.prefill.amount) : "",
      method: "cash",
      note: "",
    });
  }, [dialog]);

  if (!dialog) return null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const pickPrescription = (id) => {
    setSelectedId(id);
    const p = (dialog.prescriptions || []).find((x) => x.id === id);
    set({ prescription_ref: p?.prescription_id || "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Record Payment</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {dialog.prescription ? (
          <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs">
            <p className="font-semibold">
              {dialog.prescription.patient_name} · CIN {dialog.prescription.patient_cin}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {dialog.prescription.medication_name}
              {dialog.prescription.strength ? ` ${dialog.prescription.strength}` : ""} · {dialog.prescription.prescription_id}
            </p>
            {dialog.event && (
              <p className="text-muted-foreground mt-0.5">
                Dispensed {new Date(dialog.event.datetime).toLocaleString()} · {dialog.event.quantity}
              </p>
            )}
            {!dialog.event && <p className="text-muted-foreground mt-0.5">Payment recorded before dispensing</p>}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Prescription</Label>
            <select
              value={selectedId}
              onChange={(e) => pickPrescription(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select a prescription...</option>
              {(dialog.prescriptions || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prescription_id} · {p.patient_name} · {p.medication_name}
                  {p.strength ? ` ${p.strength}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Amount due</Label>
            <Input type="number" min="0" step="0.01" value={form.amount_due} onChange={(e) => set({ amount_due: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Amount paid</Label>
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Payment method</Label>
          <select
            value={form.method}
            onChange={(e) => set({ method: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          {form.method !== "cash" && (
            <p className="text-[11px] text-muted-foreground">Non-cash payments stay pending until you verify them.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Note (optional)</Label>
          <Input value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="e.g. part payment agreed with the patient" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={() => onSubmit(form)} disabled={busy || !form.prescription_ref}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
}