import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PartnerAdForm from "@/components/partner/PartnerAdForm";
import PartnerAdAnalytics from "@/components/partner/PartnerAdAnalytics";
import PartnerAdLibraryPicker from "@/components/partner/PartnerAdLibraryPicker";
import {
  Building2, CheckCircle2, Clock, FlaskConical, Loader2, Sparkles, AlertTriangle, XCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw, Ban, FileCheck, BarChart3, Wallet, CalendarClock, Eye,
} from "lucide-react";
import PartnerSubscriptionDetailsDialog from "@/components/partner/PartnerSubscriptionDetailsDialog";

const TIER_LABEL = { standard: "Standard Partner", premium: "Premium Partner" };
const METHOD_LABEL = { cash: "Cash", bank_transfer: "Bank transfer", card: "Card", other: "Other" };
const CHANGE_LABEL = {
  upgrade: "Upgrade to Premium", downgrade: "Downgrade to Standard",
  renewal: "Renewal", cancellation: "Cancellation",
};
const AD_STATUS_LABEL = {
  draft: "Draft", pending_review: "Pending review", approved: "Approved",
  scheduled: "Scheduled", published: "Published", paused: "Paused",
  rejected: "Rejected", expired: "Expired",
};

// Partner-facing subscription section shared by the Pharmacy Portal and the
// Lab Portal. The representative reviews the plans and billing terms, confirms
// them and submits a request (subscription enters pending approval); the
// administrator then verifies affiliation/ownership and reviews the
// advertisement content separately. Payment, affiliation approval, ad approval
// and subscription status are distinct: partners can see their billing history
// but cannot record payments or approve their own advertisement.
export default function PartnerSubscriptionSection({ partnerType, profile }) {
  const { toast } = useToast();
  const [plans, setPlans] = useState(null);
  const [sub, setSub] = useState(undefined); // undefined = loading, null = none
  const [ad, setAd] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [changeType, setChangeType] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [chosenTemplate, setChosenTemplate] = useState(null); // admin library ad chosen before subscribing

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("partnerSubscriptionManage", {
        action: "get", partner_type: partnerType,
      });
      setPlans(res.data.plans);
      setSub(res.data.subscription);
      setAd(res.data.advertisement);
    } catch (err) {
      console.error(err);
      setSub(null);
    }
  }, [partnerType]);

  useEffect(() => { load(); }, [load]);

  // Keep plans and subscription state in sync with administrator changes:
  // refetch on window focus and on a light interval while the section is open.
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const timer = setInterval(load, 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [load]);

  const act = async (payload, successMsg) => {
    setBusy(true);
    try {
      await base44.functions.invoke("partnerSubscriptionManage", { partner_type: partnerType, ...payload });
      if (successMsg) toast({ title: successMsg });
      setChangeType(null);
      setChangeNote("");
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

  // Maps an administrator library advertisement onto the partner's own
  // advertisement content (the offer text is folded into the description).
  const templateAd = (t) => ({
    title: t.title,
    description: t.offer ? `${t.description || ""}\n\nOffer: ${t.offer}`.trim() : t.description || "",
    cover_url: t.image_url || "",
    services: t.services || [],
  });

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
  const pendingChange = sub?.pending_change && sub.pending_change.status === "pending" ? sub.pending_change : null;

  // ---- Plans & billing terms: subscribe flow ----
  if (showPlans) {
    const tier = selectedTier || "standard";
    const plan = plans?.[tier];
    const priceSet = plan?.price != null;
    return (
      <div className="space-y-4">
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
        <PartnerAdLibraryPicker
          partnerType={partnerType}
          mode="choose"
          selectedId={chosenTemplate?.id}
          onSelect={setChosenTemplate}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          {["standard", "premium"].map((t) => {
            const p = plans?.[t];
            const pSet = p?.price != null;
            return (
              <button
                key={t}
                type="button"
                disabled={!pSet || !p?.available}
                onClick={() => { setSelectedTier(t); setConfirmed(false); }}
                className={`text-left rounded-xl border bg-card p-5 space-y-3 transition-colors ${selectedTier === t ? "border-primary ring-1 ring-primary" : t === "premium" ? "border-amber-300/60" : "border-border"} ${!pSet || !p?.available ? "opacity-60" : "hover:border-primary/60"}`}
              >
                <div className="flex items-center gap-2">
                  {t === "premium" ? <Sparkles className="w-4 h-4 text-amber-500" /> : <Building2 className="w-4 h-4 text-primary" />}
                  <p className="font-semibold">{TIER_LABEL[t]}</p>
                </div>
                <p className="text-2xl font-bold">
                  {pSet ? fmt(p.price, plans.currency) : <span className="text-sm text-muted-foreground font-normal">Pricing not set yet</span>}
                  {pSet && <span className="text-sm text-muted-foreground font-normal"> /{intervalLabel}</span>}
                </p>
                {p?.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {(plans?.plan_features || []).length > 0 && (
                  <ul className="space-y-1">
                    {plans.plan_features.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {!p?.available && <p className="text-xs text-muted-foreground">Not accepting new subscriptions</p>}
              </button>
            );
          })}
        </div>

        {plans?.[selectedTier || "standard"]?.price != null && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="font-semibold flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> Billing terms — {TIER_LABEL[tier]}</p>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p><span className="text-muted-foreground">Price:</span> {fmt(plans[tier].price, plans.currency)} /{intervalLabel}</p>
              <p><span className="text-muted-foreground">Billing interval:</span> {intervalLabel}</p>
              <p><span className="text-muted-foreground">Grace period after the billing date:</span> {plans.grace_days} days</p>
              {tier === "premium" && (plans.premium_upgrade_fee || 0) > 0 && (
                <p><span className="text-muted-foreground">One-time upgrade fee:</span> {fmt(plans.premium_upgrade_fee, plans.currency)}</p>
              )}
            </div>
            {plans.intro_offer_enabled && (plans.intro_discount_percent || 0) > 0 && (
              <p className="text-xs text-amber-600">
                Introductory offer: {plans.intro_discount_percent}% off the first {plans.intro_duration_months || 1} payment(s).
              </p>
            )}
            {plans.overdue_policy && <p className="text-xs text-muted-foreground">Overdue policy: {plans.overdue_policy}</p>}
            <p className="text-xs text-muted-foreground">
              After you submit, the AMedix administrator verifies your organization and subscription terms, then reviews your advertisement content. Your advertisement goes live only after both approvals.
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
              <span>I have reviewed and confirm the billing terms above.</span>
            </label>
            <Button
              disabled={busy || !confirmed}
              onClick={() => act({
                action: "subscribe",
                tier,
                confirmed: true,
                ...(chosenTemplate ? { ad: templateAd(chosenTemplate) } : {}),
              }, "Subscription request submitted — awaiting administrator approval")}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit subscription request
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ---- Existing subscription view ----
  return (
    <div className="space-y-4">
      {sub.status === "pending_approval" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Awaiting administrator approval</p>
            <p className="text-sm text-amber-800">
              The AMedix administrator is verifying your organization affiliation, ownership and subscription terms. Draft your advertisement below and submit it for content review.
            </p>
          </div>
        </div>
      )}

      {sub.status === "pending_payment" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-2">
          <Wallet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Affiliation approved — awaiting first payment</p>
            <p className="text-sm text-blue-800">
              The administrator verified your organization and locked your billing terms. Your subscription becomes active, and your advertisement can go live, once the administrator records and verifies your first payment.
            </p>
          </div>
        </div>
      )}

      {sub.status === "cancellation_pending" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <CalendarClock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Cancellation pending — active until {sub.cancellation_effective_datetime ? new Date(sub.cancellation_effective_datetime).toLocaleDateString() : "the end of the paid period"}</p>
            <p className="text-sm text-amber-800">
              Your cancellation was approved under the end-of-period policy: your subscription and advertisement remain active until the end of the current paid period, then end automatically.
            </p>
          </div>
        </div>
      )}

      {sub.status === "suspended" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-2">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Subscription suspended</p>
            <p className="text-sm text-muted-foreground">{sub.suspension_reason || "The administrator paused this subscription."}</p>
          </div>
        </div>
      )}

      {status === "past_due" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Payment past due</p>
            <p className="text-sm text-amber-800">
              Your billing date has passed. Your advertisement keeps running during the grace period ({plans?.grace_days} days); if it ends without a verified payment, the advertising entitlement is suspended per the configured policy.
            </p>
            {plans?.overdue_policy && <p className="text-xs text-amber-700 mt-1">{plans.overdue_policy}</p>}
          </div>
        </div>
      )}

      {pendingChange && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">{CHANGE_LABEL[pendingChange.request_type]} requested</p>
            <p className="text-sm text-blue-800">
              Awaiting the administrator's decision, requested {new Date(pendingChange.requested_datetime).toLocaleString()}.
            </p>
            {pendingChange.note && <p className="text-xs text-blue-700 mt-1">Your note: {pendingChange.note}</p>}
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              status === "active" ? "bg-emerald-100 text-emerald-700"
              : ["past_due"].includes(status) ? "bg-amber-100 text-amber-700"
              : ["pending_approval", "pending_payment", "cancellation_pending"].includes(sub.status) ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"}`}
            >
              {status === "past_due" ? "Past due" : sub.status === "pending_payment" ? "Pending payment"
                : sub.status === "cancellation_pending" ? "Cancellation pending"
                : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowDetails(true)}>
              <Eye className="w-4 h-4" /> View subscription
            </Button>
          </div>
        </div>
        {["active", "past_due"].includes(sub.status) && (
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <p><span className="text-muted-foreground">Subscription:</span> {fmt(sub.price_amount, sub.currency)} /{sub.billing_interval === "year" ? "year" : "month"}</p>
            <p><span className="text-muted-foreground">Renewal date:</span> {sub.next_billing_datetime ? new Date(sub.next_billing_datetime).toLocaleDateString() : "—"}</p>
            {(sub.intro_months_remaining || 0) > 0 && (
              <p className="sm:col-span-2 text-xs text-amber-600">
                Introductory offer active: {sub.intro_discount_percent}% off the next {sub.intro_months_remaining} payment(s).
              </p>
            )}
            {sub.price_effective_datetime && sub.scheduled_tier && (
              <p className="sm:col-span-2 text-xs text-blue-700">
                Scheduled plan change: {sub.scheduled_tier === "premium" ? "Premium" : "Standard"} pricing of {fmt(sub.scheduled_price_amount, sub.currency)} takes effect on {new Date(sub.price_effective_datetime).toLocaleDateString()} — your current paid period keeps its terms.
              </p>
            )}
          </div>
        )}
        {(sub.pending_upgrade_fee || 0) > 0 && (
          <p className="text-sm text-amber-700">
            Upgrade fee due: {fmt(sub.pending_upgrade_fee, sub.currency)} — the administrator records payments against the billing ledger.
          </p>
        )}
        {["active", "past_due"].includes(sub.status) && !pendingChange && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => setShowAnalytics((v) => !v)}>
              <BarChart3 className="w-4 h-4" /> {showAnalytics ? "Hide analytics" : "Advertisement analytics"}
            </Button>
            {!isPremium && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => { setChangeType("upgrade"); setChangeNote(""); }}>
                <ArrowUpRight className="w-4 h-4" /> Request upgrade to Premium
              </Button>
            )}
            {isPremium && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => { setChangeType("downgrade"); setChangeNote(""); }}>
                <ArrowDownRight className="w-4 h-4" /> Request downgrade to Standard
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => { setChangeType("renewal"); setChangeNote(""); }}>
              <RefreshCw className="w-4 h-4" /> Request renewal
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" disabled={busy}
              onClick={() => { setChangeType("cancellation"); setChangeNote(""); }}>
              <Ban className="w-4 h-4" /> Request cancellation
            </Button>
          </div>
        )}
      </div>

      {changeType && ["active", "past_due"].includes(sub.status) && !pendingChange && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="font-semibold">{CHANGE_LABEL[changeType]}</p>
          <p className="text-xs text-muted-foreground">
            {changeType === "upgrade" && "Subject to the configured terms — the administrator may apply a one-time upgrade fee. Your advertisement placement updates after approval."}
            {changeType === "downgrade" && "The downgrade takes effect once the administrator approves it. Premium featured placement is removed at that point."}
            {changeType === "renewal" && "The administrator will record your renewal payment against the billing ledger."}
            {changeType === "cancellation" && "Your advertisement stops showing once the cancellation is approved. This is subject to the configured subscription terms."}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => act({ action: "request_change", change_type: changeType, note: changeNote }, "Change request submitted")}>
              Submit request
            </Button>
            <Button variant="ghost" onClick={() => setChangeType(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <PartnerSubscriptionDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        sub={sub}
      />

      <PartnerAdLibraryPicker
        partnerType={partnerType}
        mode="use"
        disabled={busy || sub.status === "cancelled"}
        onUse={(t) => act({
          action: "update_ad",
          ad_id: ad?.id,
          ...templateAd(t),
          contact_phone: ad?.contact_phone || "",
          hours: ad?.hours || "",
        }, "Advertisement set from the library — submit it for review from the editor below")}
      />

      <PartnerAdForm subscription={sub} advertisement={ad} partnerType={partnerType} onSaved={load} />

      {showAnalytics && <PartnerAdAnalytics partnerType={partnerType} />}

      {(sub.payments || []).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-semibold mb-3">Payment history</p>
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
    </div>
  );
}

export { AD_STATUS_LABEL };