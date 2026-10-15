import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FlaskConical, Loader2, RefreshCw, Sparkles } from "lucide-react";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700",
  overdue: "bg-amber-100 text-amber-700",
  pending_approval: "bg-blue-100 text-blue-700",
  suspended: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

// Administrator view of every partner advertising subscription: approve new
// requests, suspend/reinstate, cancel, and record payments in the billing
// ledger (including refunds and adjustments).
export default function AdminPartnerSubscriptions({ settings, onChanged }) {
  const { toast } = useToast();
  const [subs, setSubs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(null); // {id, mode}
  const [reason, setReason] = useState("");
  const [pay, setPay] = useState({ amount: "", method: "bank_transfer", note: "", entry_type: "payment", applies_to: "subscription" });

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("adminPartnerManage", { action: "list" });
      setSubs(res.data.subscriptions || []);
    } catch (err) {
      console.error(err);
      setSubs([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (payload, successMsg, resetId = null) => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminPartnerManage", payload);
      if (successMsg) toast({ title: successMsg });
      setExpanded(resetId ? null : expanded);
      setReason("");
      setPay({ amount: "", method: "bank_transfer", note: "", entry_type: "payment", applies_to: "subscription" });
      await load();
      onChanged?.();
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (subs === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (subs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">No partner subscriptions yet. Pharmacies and laboratories subscribe from their portals.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>
      {subs.map((s) => {
        const effective = s.effective_status || s.status;
        const open = expanded?.id === s.id;
        return (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {s.partner_type === "pharmacy" ? <Building2 className="w-5 h-5 text-primary" /> : <FlaskConical className="w-5 h-5 text-primary" />}
                <div className="min-w-0">
                  <p className="font-semibold truncate flex items-center gap-1.5">
                    {s.partner_name}
                    {s.tier === "premium" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5">
                        <Sparkles className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.partner_number || "—"} · {s.tier === "premium" ? "Premium" : "Standard"}
                    {s.price_amount != null ? ` · ${s.price_amount} ${s.currency || ""} /${s.billing_interval === "year" ? "year" : "month"}` : ""}
                    {s.next_billing_datetime ? ` · next billing ${new Date(s.next_billing_datetime).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[effective] || STATUS_STYLE.cancelled}`}>
                {effective === "overdue" ? "Overdue" : effective === "pending_approval" ? "Pending approval" : effective.charAt(0).toUpperCase() + effective.slice(1)}
              </span>
            </div>

            {(s.suspension_reason || s.admin_notes) && (
              <p className="text-xs text-muted-foreground">{s.suspension_reason ? `Reason: ${s.suspension_reason}` : ""}{s.admin_notes ? ` · Notes: ${s.admin_notes}` : ""}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {s.status === "pending_approval" && (
                <Button size="sm" disabled={busy} onClick={() => act({ action: "approve", subscription_id: s.id }, "Subscription approved")}>
                  Approve
                </Button>
              )}
              {["active", "pending_approval"].includes(s.status) && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setExpanded(open && expanded?.mode === "suspend" ? null : { id: s.id, mode: "suspend" })}>
                  Suspend
                </Button>
              )}
              {s.status === "suspended" && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "reinstate", subscription_id: s.id }, "Subscription reinstated")}>
                  Reinstate
                </Button>
              )}
              {!["cancelled"].includes(s.status) && (
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => setExpanded(open && expanded?.mode === "cancel" ? null : { id: s.id, mode: "cancel" })}>
                  Cancel
                </Button>
              )}
              {s.status === "active" && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setExpanded(open && expanded?.mode === "pay" ? null : { id: s.id, mode: "pay" })}>
                  Record payment
                </Button>
              )}
              {(s.payments || []).length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setExpanded(open && expanded?.mode === "history" ? null : { id: s.id, mode: "history" })}>
                  Billing history ({s.payments.length})
                </Button>
              )}
            </div>

            {open && expanded.mode === "suspend" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the subscription being suspended?" />
                <Button size="sm" disabled={busy || !reason.trim()} onClick={() => act({ action: "suspend", subscription_id: s.id, reason }, "Subscription suspended", s.id)}>
                  Confirm suspension
                </Button>
              </div>
            )}
            {open && expanded.mode === "cancel" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button size="sm" variant="destructive" disabled={busy || !reason.trim()} onClick={() => act({ action: "cancel", subscription_id: s.id, reason }, "Subscription cancelled", s.id)}>
                  Confirm cancellation
                </Button>
              </div>
            )}
            {open && expanded.mode === "pay" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <div className="grid sm:grid-cols-4 gap-2">
                  <Input type="number" min="0" step="0.01" placeholder="Amount" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
                  <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <select value={pay.entry_type} onChange={(e) => setPay({ ...pay, entry_type: e.target.value })} className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
                    <option value="payment">Payment</option>
                    <option value="refund">Refund</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                  <select value={pay.applies_to} onChange={(e) => setPay({ ...pay, applies_to: e.target.value })} className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
                    <option value="subscription">Subscription</option>
                    {(s.pending_upgrade_fee || 0) > 0 && <option value="upgrade_fee">Upgrade fee</option>}
                  </select>
                </div>
                <Input placeholder="Note (optional)" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
                <Button size="sm" disabled={busy || !pay.amount} onClick={() => act({ action: "record_payment", subscription_id: s.id, ...pay, amount: Number(pay.amount) }, "Payment recorded", s.id)}>
                  Save
                </Button>
              </div>
            )}
            {open && expanded.mode === "history" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                {[...(s.payments || [])].reverse().map((p) => (
                  <div key={p.payment_id} className="flex justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="min-w-0">
                      {p.entry_type} · {p.method} · {p.applies_to === "upgrade_fee" ? "upgrade fee" : "subscription"}
                      <span className="text-xs text-muted-foreground block">
                        {new Date(p.datetime).toLocaleString()} · {p.recorded_by_name}{p.note ? ` · ${p.note}` : ""}
                      </span>
                    </span>
                    <span className="font-semibold shrink-0">{p.amount} {s.currency || ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}