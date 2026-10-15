import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PartnerAdForm from "@/components/partner/PartnerAdForm";
import {
  Building2, CheckCircle2, Clock, CreditCard, FlaskConical, Loader2, Sparkles, AlertTriangle, XCircle,
} from "lucide-react";

const TIER_LABEL = { standard: "Standard Partner", premium: "Premium Partner" };
const METHOD_LABEL = { cash: "Cash", bank_transfer: "Bank transfer", card: "Card", other: "Other" };

// Partner-facing subscription section shared by the Pharmacy Portal and the
// Lab Portal. Shows the administrator-configured plans, manages the partner's
// subscription lifecycle (subscribe → approval → billing ledger) and the
// advertisement content. The partner's existing profile is reused everywhere.
export default function PartnerSubscriptionSection({ partnerType, profile }) {
  const { toast } = useToast();
  const [plans, setPlans] = useState(null);
  const [sub, setSub] = useState(undefined); // undefined = loading, null = none
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payNote, setPayNote] = useState("");
  const [payTarget, setPayTarget] = useState("subscription");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("partnerSubscriptionManage", {
        action: "get", partner_type: partnerType,
      });
      setPlans(res.data.plans);
      setSub(res.data.subscription);
    } catch (err) {
      console.error(err);
      setSub(null);
    }
  }, [partnerType]);

  useEffect(() => { load(); }, [load]);

  const act = async (payload, successMsg) => {
    setBusy(true);
    try {
      await base44.functions.invoke("partnerSubscriptionManage", { partner_type: partnerType, ...payload });
      if (successMsg) toast({ title: successMsg });
      await load();
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

  const fmt = (amount, currency) => `${amount} ${currency || plans?.currency || ""}`;
  const intervalLabel = plans?.billing_interval === "year" ? "year" : "month";

  const openPay = () => {
    setShowPay(true);
    setPayTarget((sub?.pending_upgrade_fee || 0) > 0 ? "upgrade_fee" : "subscription");
    setPayAmount("");
  };

  const recordPayment = () =>
    act(
      {
        action: "record_payment",
        amount: Number(payAmount),
        method: payMethod,
        note: payNote,
        applies_to: payTarget,
      },
      "Payment recorded"
    );

  if (sub === undefined) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const status = sub?.effective_status || sub?.status;
  const showPlans = !sub || sub.status === "cancelled";
  const isPremium = sub?.tier === "premium";

  return (
    <div className="space-y-4">
      {sub && sub.status === "pending_approval" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Awaiting administrator approval</p>
            <p className="text-sm text-amber-800">
              Your {TIER_LABEL[sub.tier]} subscription and advertisement will go live once the AMedix administrator approves it.
            </p>
          </div>
        </div>
      )}

      {sub && sub.status === "suspended" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-2">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Subscription suspended</p>
            <p className="text-sm text-muted-foreground">{sub.suspension_reason || "The administrator paused this subscription."}</p>
          </div>
        </div>
      )}

      {status === "overdue" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Payment overdue</p>
            <p className="text-sm text-amber-800">
              Your billing date has passed. Record the payment within the grace period ({plans?.grace_days} days) to keep your advertisement live.
            </p>
            {plans?.overdue_policy && <p className="text-xs text-amber-700 mt-1">{plans.overdue_policy}</p>}
          </div>
        </div>
      )}

      {showPlans ? (
        <div className="space-y-3">
          {sub?.status === "cancelled" && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm">
                Your previous subscription was cancelled{sub.cancelled_datetime ? ` on ${new Date(sub.cancelled_datetime).toLocaleDateString()}` : ""}. You can subscribe again below.
              </p>
              {sub.suspension_reason && <p className="text-xs text-muted-foreground mt-1">Reason: {sub.suspension_reason}</p>}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Become an AMedix partner: an approved partner profile and an advertisement for patients, shown only inside your section of the Patient Portal.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {["standard", "premium"].map((tier) => {
              const plan = plans?.[tier];
              const priceSet = plan?.price != null;
              return (
                <div key={tier} className={`rounded-xl border bg-card p-5 space-y-3 ${tier === "premium" ? "border-amber-300/60" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    {tier === "premium" ? <Sparkles className="w-4 h-4 text-amber-500" /> : <Building2 className="w-4 h-4 text-primary" />}
                    <p className="font-semibold">{TIER_LABEL[tier]}</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {priceSet ? fmt(plan.price, plans.currency) : <span className="text-sm text-muted-foreground font-normal">Pricing not set yet</span>}
                    {priceSet && <span className="text-sm text-muted-foreground font-normal"> /{intervalLabel}</span>}
                  </p>
                  {plan?.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                  {(plans?.plan_features || []).length > 0 && (
                    <ul className="space-y-1">
                      {plans.plan_features.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    disabled={busy || !priceSet || !plan?.available}
                    onClick={() => act({ action: "subscribe", tier }, "Subscription request submitted")}
                  >
                    {tier === "premium" ? "Subscribe to Premium" : "Subscribe to Standard"}
                  </Button>
                  {!plan?.available && <p className="text-xs text-muted-foreground text-center">Not accepting new subscriptions</p>}
                </div>
              );
            })}
          </div>
          {plans?.intro_offer_enabled && (plans.intro_discount_percent || 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              Introductory offer: {plans.intro_discount_percent}% off the first {plans.intro_duration_months || 1} payment(s).
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {partnerType === "pharmacy" ? <Building2 className="w-5 h-5 text-primary" /> : <FlaskConical className="w-5 h-5 text-primary" />}
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {TIER_LABEL[sub.tier]}
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5">
                        <Sparkles className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sub.partner_name} · {sub.partner_number}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                status === "active" ? "bg-emerald-100 text-emerald-700"
                : status === "overdue" ? "bg-amber-100 text-amber-700"
                : sub.status === "pending_approval" ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"}`}
              >
                {status === "overdue" ? "Overdue" : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
              </span>
            </div>
            {sub.status === "active" && (
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Subscription:</span> {fmt(sub.price_amount, sub.currency)} /{sub.billing_interval === "year" ? "year" : "month"}</p>
                <p><span className="text-muted-foreground">Next billing date:</span> {sub.next_billing_datetime ? new Date(sub.next_billing_datetime).toLocaleDateString() : "—"}</p>
                {(sub.intro_months_remaining || 0) > 0 && (
                  <p className="sm:col-span-2 text-xs text-amber-600">
                    Introductory offer active: {sub.intro_discount_percent}% off the next {sub.intro_months_remaining} payment(s).
                  </p>
                )}
              </div>
            )}
            {(sub.pending_upgrade_fee || 0) > 0 && (
              <p className="text-sm text-amber-700">
                Upgrade fee due: {fmt(sub.pending_upgrade_fee, sub.currency)} — record a payment to settle it.
              </p>
            )}
            {sub.status === "active" && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={openPay}>
                  <CreditCard className="w-4 h-4" /> Record a payment
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "change_tier", tier: isPremium ? "standard" : "premium" }, "Plan changed")}>
                  {isPremium ? "Switch to Standard" : "Upgrade to Premium"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => act({ action: "cancel" }, "Subscription cancelled")}>
                  Cancel subscription
                </Button>
              </div>
            )}
          </div>

          {showPay && sub.status === "active" && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="font-semibold">Record a payment</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input type="number" min="0" step="0.01" value={payAmount}
                    placeholder={payTarget === "upgrade_fee" ? String(sub.pending_upgrade_fee) : String(expectedAmount(sub))}
                    onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Method</Label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    {Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Applies to</Label>
                  <select value={payTarget} onChange={(e) => setPayTarget(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="subscription">Subscription</option>
                    {(sub.pending_upgrade_fee || 0) > 0 && <option value="upgrade_fee">Upgrade fee</option>}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Note (optional)</Label>
                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={recordPayment} disabled={busy || !payAmount}>Save payment</Button>
                <Button variant="ghost" onClick={() => setShowPay(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <PartnerAdForm subscription={sub} partnerType={partnerType} onSaved={load} />

          {(sub.payments || []).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-semibold mb-3">Billing history</p>
              <div className="space-y-2">
                {[...sub.payments].reverse().map((p) => (
                  <div key={p.payment_id} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {p.entry_type === "payment" ? "Payment" : p.entry_type === "refund" ? "Refund" : "Adjustment"}
                        {p.applies_to === "upgrade_fee" ? " · upgrade fee" : ""} · {METHOD_LABEL[p.method] || p.method}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.datetime).toLocaleString()} · {p.recorded_by_name}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <p className="font-semibold shrink-0">{fmt(p.amount, sub.currency)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function expectedAmount(sub) {
  const base = sub.price_amount || 0;
  if ((sub.intro_months_remaining || 0) > 0 && (sub.intro_discount_percent || 0) > 0) {
    return Math.round(base * (1 - sub.intro_discount_percent / 100) * 100) / 100;
  }
  return base;
}