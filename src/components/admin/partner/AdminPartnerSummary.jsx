import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle, Clock, Wallet, Megaphone, Building2, FlaskConical, XCircle } from "lucide-react";

const AD_STATUS_LABEL = {
  draft: "Draft", pending_review: "Pending review", approved: "Approved",
  scheduled: "Scheduled", published: "Published", paused: "Paused",
  rejected: "Rejected", expired: "Expired",
};

// Administrator summary of the partner advertising system: subscription
// counts, revenue (administrator-verified payments only), pending-verification
// amount, outstanding upgrade fees, overdue subscriptions and advertisement
// performance by status. Payment processing is a manual, administrator-verified
// ledger — no automated collection is implied.
export default function AdminPartnerSummary({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("adminPartnerManage", { action: "summary" });
      setSummary(res.data.summary);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (error) {
    return <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {error}</p>;
  }
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading summary...
      </div>
    );
  }

  const cur = (v) => `${v} ${summary.currency}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Active subscriptions</p>
          <p className="text-2xl font-bold mt-1">{summary.counts.active}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {summary.counts.pending_approval} approval · {summary.counts.pending_payment || 0} payment · {summary.counts.past_due || 0} past due · {summary.counts.suspended} suspended · {summary.counts.cancellation_pending || 0} cancelling
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Revenue (verified)</p>
          <p className="text-2xl font-bold mt-1">{cur(summary.revenue.total)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {cur(summary.revenue.last30)} last 30 days · pharmacy {cur(summary.revenue.pharmacy)} · lab {cur(summary.revenue.laboratory)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Awaiting verification</p>
          <p className="text-2xl font-bold mt-1">{cur(summary.revenue.pending_verification)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {cur(summary.outstanding_upgrade_fees)} in outstanding upgrade fees
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Overdue subscriptions</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{summary.overdue_count}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Past the grace period, ads hidden</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><Megaphone className="w-3.5 h-3.5" /> Advertisement performance (all-time counts by status)</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.ad_counts).length === 0 && (
            <p className="text-xs text-muted-foreground">No advertisements yet.</p>
          )}
          {Object.entries(summary.ad_counts).map(([status, count]) => (
            <span key={status} className="text-[11px] rounded-full bg-secondary text-secondary-foreground px-2.5 py-1">
              {AD_STATUS_LABEL[status] || status}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}