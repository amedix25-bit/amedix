import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
const TIER_LABEL = { standard: "Standard Partner", premium: "Premium Partner" };
const METHOD_LABEL = { cash: "Cash", bank_transfer: "Bank transfer", card: "Card", other: "Other" };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");
const fmtMoney = (amount, currency) => `${amount} ${currency || ""}`;

// Partner-facing "View subscription" details: what was paid, how, when,
// and the next payment date. Read-only — payments are recorded by the
// administrator, this view simply explains the billing ledger.
export default function PartnerSubscriptionDetailsDialog({ open, onOpenChange, sub }) {
  if (!sub) return null;
  const intervalLabel = sub.billing_interval === "year" ? "year" : "month";
  const payments = [...(sub.payments || [])].reverse();
  const totalPaid = (sub.payments || [])
    .filter((p) => p.entry_type === "payment" && p.verification !== "rejected")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const Row = ({ label, children }) => (
    <div className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium min-w-0">{children}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription details</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <Row label="Plan">
              {TIER_LABEL[sub.tier] || sub.tier} · {fmtMoney(sub.price_amount, sub.currency)} /{intervalLabel}
            </Row>
            <Row label="Status">{(sub.effective_status || sub.status || "").replace(/_/g, " ")}</Row>
            <Row label="Subscription start">{fmtDateTime(sub.start_datetime)}</Row>
            <Row label="Next payment">
              {sub.next_billing_datetime ? fmtDateTime(sub.next_billing_datetime) : "—"}
            </Row>
            <Row label="Total paid">{fmtMoney(totalPaid, sub.currency)}</Row>
            {(sub.intro_months_remaining || 0) > 0 && (
              <Row label="Introductory offer">
                {sub.intro_discount_percent}% off the next {sub.intro_months_remaining} payment(s)
              </Row>
            )}
            {sub.price_effective_datetime && sub.scheduled_tier && (
              <Row label="Scheduled plan change">
                {sub.scheduled_tier === "premium" ? "Premium" : "Standard"} at{" "}
                {fmtMoney(sub.scheduled_price_amount, sub.currency)} from {fmtDate(sub.price_effective_datetime)}
              </Row>
            )}
            {(sub.pending_upgrade_fee || 0) > 0 && (
              <Row label="Upgrade fee due">{fmtMoney(sub.pending_upgrade_fee, sub.currency)}</Row>
            )}
          </div>

          <div>
            <p className="font-semibold mb-2 text-sm">Payments</p>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet. Your subscription becomes active once the administrator records and verifies your first payment.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.payment_id} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {p.entry_type === "payment" ? "Payment" : p.entry_type === "refund" ? "Refund" : "Adjustment"}
                        {p.applies_to === "upgrade_fee" ? " · upgrade fee" : ""}
                        {" · "}{METHOD_LABEL[p.method] || "Not specified"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid {fmtDateTime(p.datetime)}
                        {p.payment_date ? ` (dated ${fmtDate(p.payment_date)})` : ""}
                        {` · recorded by ${p.recorded_by_name || "administrator"}`}
                        {p.verification === "confirmed" ? " · verified" : " · pending verification"}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <p className="font-semibold shrink-0">{fmtMoney(p.amount, sub.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}