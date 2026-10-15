import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import AdminPartnerSummary from "@/components/admin/partner/AdminPartnerSummary";
import {
  Building2, FlaskConical, Loader2, RefreshCw, Sparkles, CheckCircle2, XCircle, Clock,
  CalendarClock, Eye, EyeOff, Megaphone, ArrowUpDown, ShieldCheck, ScrollText,
} from "lucide-react";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700",
  overdue: "bg-amber-100 text-amber-700",
  pending_approval: "bg-blue-100 text-blue-700",
  suspended: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};
const AD_STATUS_LABEL = {
  draft: { label: "Draft", style: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending review", style: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", style: "bg-emerald-100 text-emerald-700" },
  scheduled: { label: "Scheduled", style: "bg-indigo-100 text-indigo-700" },
  published: { label: "Published", style: "bg-emerald-100 text-emerald-700" },
  paused: { label: "Paused", style: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", style: "bg-red-100 text-red-700" },
  expired: { label: "Expired", style: "bg-muted text-muted-foreground" },
};
const CHANGE_LABEL = {
  upgrade: "Upgrade to Premium", downgrade: "Downgrade to Standard",
  renewal: "Renewal", cancellation: "Cancellation",
};
const METHOD_LABEL = { cash: "Cash", bank_transfer: "Bank transfer", card: "Card", other: "Other" };

// Administrator view of every partner advertising subscription: filters
// (organization, partner type, plan, status, renewal date), affiliation
// approval, advertisement content review, partner change requests,
// suspend/reinstate/cancel, the administrator-verified payment ledger
// (payments with reference and verification, refunds, adjustments) and the
// payment audit trail.
export default function AdminPartnerSubscriptions({ settings, onChanged }) {
  const { toast } = useToast();
  const [subs, setSubs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(null); // {id, mode}
  const [reason, setReason] = useState("");
  const [sched, setSched] = useState({ start: "", end: "" });
  const [pay, setPay] = useState({
    amount: "", method: "bank_transfer", note: "", entry_type: "payment",
    applies_to: "subscription", payment_date: "", payment_reference: "",
  });
  const [filters, setFilters] = useState({ q: "", partner_type: "all", tier: "all", status: "all", renewal_before: "" });

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
      setPay({ amount: "", method: "bank_transfer", note: "", entry_type: "payment", applies_to: "subscription", payment_date: "", payment_reference: "" });
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

  const filtered = useMemo(() => {
    if (!subs) return [];
    return subs.filter((s) => {
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = `${s.partner_name || ""} ${s.partner_number || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.partner_type !== "all" && s.partner_type !== filters.partner_type) return false;
      if (filters.tier !== "all" && s.tier !== filters.tier) return false;
      if (filters.status !== "all") {
        const effective = s.effective_status || s.status;
        if (filters.status !== effective && filters.status !== s.status) return false;
      }
      if (filters.renewal_before) {
        if (!s.next_billing_datetime || new Date(s.next_billing_datetime) > new Date(`${filters.renewal_before}T23:59:59`)) return false;
      }
      return true;
    });
  }, [subs, filters]);

  if (subs === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AdminPartnerSummary refreshKey={subs.length} />

      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="grid sm:grid-cols-5 gap-2">
          <Input placeholder="Search organization..." value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <select value={filters.partner_type} onChange={(e) => setFilters({ ...filters, partner_type: e.target.value })}
            className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
            <option value="all">All partner types</option>
            <option value="pharmacy">Pharmacies</option>
            <option value="laboratory">Laboratories</option>
          </select>
          <select value={filters.tier} onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
            className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
            <option value="all">All plans</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm">
            <option value="all">All statuses</option>
            <option value="pending_approval">Pending approval</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Input type="date" value={filters.renewal_before}
            onChange={(e) => setFilters({ ...filters, renewal_before: e.target.value })}
            title="Show subscriptions renewing before this date" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {subs.length} subscription{subs.length === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            {(filters.q || filters.partner_type !== "all" || filters.tier !== "all" || filters.status !== "all" || filters.renewal_before) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ q: "", partner_type: "all", tier: "all", status: "all", renewal_before: "" })}>
                Clear filters
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          </div>
        </div>
      </div>

      {subs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">No partner subscriptions yet. Pharmacies and laboratories subscribe from their portals.</p>
      )}
      {subs.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">No subscriptions match the current filters.</p>
      )}

      {filtered.map((s) => {
        const effective = s.effective_status || s.status;
        const ad = s.advertisement;
        const adBadge = ad ? (AD_STATUS_LABEL[ad.status] || AD_STATUS_LABEL.draft) : null;
        const pendingPayments = (s.payments || []).filter((p) => p.verification === "pending_verification");
        const change = s.pending_change && s.pending_change.status === "pending" ? s.pending_change : null;
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
                    {s.start_datetime ? ` · started ${new Date(s.start_datetime).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {adBadge && ad && !["draft", "expired"].includes(ad.status) && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${adBadge.style}`}>
                    Ad: {adBadge.label}
                  </span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[effective] || STATUS_STYLE.cancelled}`}>
                  {effective === "overdue" ? "Overdue" : effective === "pending_approval" ? "Pending approval" : effective.charAt(0).toUpperCase() + effective.slice(1)}
                </span>
              </div>
            </div>

            {pendingPayments.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {pendingPayments.length} payment(s) awaiting verification
                </p>
                <p className="text-xs text-amber-800">Verified payments advance the renewal date; a partner-submitted receipt alone never does.</p>
              </div>
            )}

            {change && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <p className="text-sm font-medium text-blue-900 flex items-center gap-1.5">
                  <ArrowUpDown className="w-4 h-4" /> {CHANGE_LABEL[change.request_type] || change.request_type} requested
                </p>
                <p className="text-xs text-blue-800">
                  Requested by {change.requested_by_name} · {new Date(change.requested_datetime).toLocaleString()}
                  {change.note ? ` · Note: ${change.note}` : ""}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => act({ action: "approve_change", subscription_id: s.id }, "Change request approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "reject_change", subscription_id: s.id }, "Change request rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {(s.suspension_reason || s.admin_notes) && (
              <p className="text-xs text-muted-foreground">{s.suspension_reason ? `Reason: ${s.suspension_reason}` : ""}{s.admin_notes ? ` · Notes: ${s.admin_notes}` : ""}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {s.status === "pending_approval" && (
                <Button size="sm" disabled={busy} onClick={() => act({ action: "approve", subscription_id: s.id }, "Subscription approved — affiliation and terms verified")}>
                  Approve subscription
                </Button>
              )}
              {ad && !["expired"].includes(ad.status) && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setExpanded(open && expanded?.mode === "ad" ? null : { id: s.id, mode: "ad" })}>
                  <Megaphone className="w-4 h-4" /> Review advertisement
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
              {(s.payment_audit || []).length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setExpanded(open && expanded?.mode === "audit" ? null : { id: s.id, mode: "audit" })}>
                  <ScrollText className="w-4 h-4" /> Payment audit ({s.payment_audit.length})
                </Button>
              )}
            </div>

            {open && expanded.mode === "ad" && ad && (
              <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-primary" /> {ad.title || "Untitled advertisement"}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(AD_STATUS_LABEL[ad.status] || AD_STATUS_LABEL.draft).style}`}>
                    {(AD_STATUS_LABEL[ad.status] || AD_STATUS_LABEL.draft).label}
                  </span>
                </div>
                {ad.description && <p className="text-sm text-muted-foreground">{ad.description}</p>}
                {ad.cover_url && <Image src={ad.cover_url} fittingType="fill" className="w-full h-28 rounded-lg border border-border" alt="Cover" />}
                {(ad.services || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ad.services.map((srv, i) => <span key={i} className="text-[11px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5">{srv}</span>)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {ad.contact_phone ? `Contact: ${ad.contact_phone}` : ""}{ad.hours ? ` · Hours: ${ad.hours}` : ""}
                  {ad.placement ? ` · Placement: ${ad.placement}` : ""}
                </p>
                {(ad.campaign_start_date || ad.campaign_end_date) && (
                  <p className="text-xs text-muted-foreground">
                    Campaign: {ad.campaign_start_date || "—"} to {ad.campaign_end_date || "—"}
                  </p>
                )}
                {ad.status === "rejected" && ad.rejection_reason && (
                  <p className="text-xs text-destructive">Rejected: {ad.rejection_reason}</p>
                )}
                {ad.reviewed_by_name && (
                  <p className="text-xs text-muted-foreground">
                    Last reviewed by {ad.reviewed_by_name} · {ad.reviewed_datetime ? new Date(ad.reviewed_datetime).toLocaleString() : ""}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {["pending_review"].includes(ad.status) && (
                    <Button size="sm" disabled={busy} onClick={() => act({ action: "approve_ad", ad_id: ad.id }, "Advertisement approved")}>
                      <CheckCircle2 className="w-4 h-4" /> Approve content
                    </Button>
                  )}
                  {["pending_review", "approved", "scheduled"].includes(ad.status) && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setExpanded({ id: s.id, mode: "ad_reject" })}>
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  )}
                  {["approved", "scheduled"].includes(ad.status) && s.status === "active" && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setExpanded({ id: s.id, mode: "ad_schedule" })}>
                      <CalendarClock className="w-4 h-4" /> Schedule
                    </Button>
                  )}
                  {["approved", "scheduled"].includes(ad.status) && s.status === "active" && (
                    <Button size="sm" disabled={busy} onClick={() => act({ action: "publish_ad", ad_id: ad.id }, "Advertisement published")}>
                      <Eye className="w-4 h-4" /> Publish now
                    </Button>
                  )}
                  {ad.status === "published" && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "pause_ad", ad_id: ad.id }, "Advertisement paused")}>
                      <EyeOff className="w-4 h-4" /> Pause
                    </Button>
                  )}
                  {ad.status === "paused" && s.status === "active" && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "resume_ad", ad_id: ad.id }, "Advertisement resumed")}>
                      <Eye className="w-4 h-4" /> Resume
                    </Button>
                  )}
                </div>

                {expanded?.mode === "ad_reject" && (
                  <div className="space-y-2 rounded-lg bg-card p-3">
                    <Label className="text-xs">Rejection reason (required)</Label>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the advertisement content rejected?" />
                    <Button size="sm" variant="destructive" disabled={busy || !reason.trim()}
                      onClick={() => act({ action: "reject_ad", ad_id: ad.id, reason }, "Advertisement rejected", s.id)}>
                      Confirm rejection
                    </Button>
                  </div>
                )}
                {expanded?.mode === "ad_schedule" && (
                  <div className="space-y-2 rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">The ad will appear to patients from the start date and stop after the end date.</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input type="date" value={sched.start} onChange={(e) => setSched({ ...sched, start: e.target.value })} />
                      <Input type="date" value={sched.end} onChange={(e) => setSched({ ...sched, end: e.target.value })} />
                    </div>
                    <Button size="sm" disabled={busy || !sched.start}
                      onClick={() => act({ action: "schedule_ad", ad_id: ad.id, campaign_start_date: sched.start, campaign_end_date: sched.end }, "Advertisement scheduled", s.id)}>
                      Confirm schedule
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                <p className="text-xs text-muted-foreground">
                  Cash payments are confirmed immediately; transfer, card and other payments are recorded as pending verification until you verify them. A payment never publishes an unapproved advertisement.
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
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
                  <Input type="date" placeholder="Payment date" value={pay.payment_date} onChange={(e) => setPay({ ...pay, payment_date: e.target.value })} />
                  <Input placeholder="Reference (receipt / transfer no.)" value={pay.payment_reference} onChange={(e) => setPay({ ...pay, payment_reference: e.target.value })} />
                </div>
                <Input placeholder="Note (optional)" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
                <Button size="sm" disabled={busy || !pay.amount}
                  onClick={() => act(
                    {
                      action: "record_payment", subscription_id: s.id,
                      amount: Number(pay.amount), method: pay.method, note: pay.note,
                      entry_type: pay.entry_type, applies_to: pay.applies_to,
                      payment_date: pay.payment_date, payment_reference: pay.payment_reference,
                      idempotency_key: `adm-${s.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    },
                    "Payment recorded", s.id
                  )}>
                  Save
                </Button>
              </div>
            )}
            {open && expanded.mode === "history" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                {(s.payments || []).length === 0 && <p className="text-xs text-muted-foreground">No payment entries yet.</p>}
                {[...(s.payments || [])].reverse().map((p) => (
                  <div key={p.payment_id} className="space-y-1 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0">
                        {p.entry_type} · {METHOD_LABEL[p.method] || p.method} · {p.applies_to === "upgrade_fee" ? "upgrade fee" : "subscription"}
                        <span className="text-xs text-muted-foreground block">
                          {new Date(p.datetime).toLocaleString()} · {p.recorded_by_name}
                          {p.payment_reference ? ` · ref ${p.payment_reference}` : ""}
                          {p.note ? ` · ${p.note}` : ""}
                        </span>
                      </span>
                      <span className="font-semibold shrink-0">{p.amount} {s.currency || ""}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.verification === "pending_verification" ? (
                        <>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending verification</span>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ action: "verify_payment", subscription_id: s.id, payment_id: p.payment_id }, "Payment verified")}>
                            <ShieldCheck className="w-3.5 h-3.5" /> Verify
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => setExpanded({ id: s.id, mode: "reject_payment", paymentId: p.payment_id })}>
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Verified{p.verified_by_name ? ` by ${p.verified_by_name}` : ""}
                        </span>
                      )}
                    </div>
                    {expanded?.mode === "reject_payment" && expanded?.paymentId === p.payment_id && (
                      <div className="space-y-2 rounded-lg bg-card p-2">
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejecting this payment" />
                        <Button size="sm" variant="destructive" disabled={busy || !reason.trim()}
                          onClick={() => act({ action: "reject_payment", subscription_id: s.id, payment_id: p.payment_id, reason }, "Payment rejected", s.id)}>
                          Confirm rejection
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {open && expanded.mode === "audit" && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                {[...(s.payment_audit || [])].reverse().map((a, i) => (
                  <div key={i} className="border-b border-border/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-medium capitalize">{a.action}</span>
                    {a.payment_id ? <span className="text-xs text-muted-foreground"> · {a.payment_id}</span> : ""}
                    {a.details ? <span className="text-xs text-muted-foreground"> · {a.details}</span> : ""}
                    <span className="text-xs text-muted-foreground block">
                      {new Date(a.datetime).toLocaleString()} · {a.by_name}
                    </span>
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