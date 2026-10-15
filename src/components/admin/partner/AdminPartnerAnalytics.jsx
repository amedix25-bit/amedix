import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Eye, MousePointerClick, Phone, MapPin, Wallet, AlertTriangle } from "lucide-react";

// Administrator analytics for the partner advertising system: aggregated
// totals per event type, premium vs standard performance, and authorized
// organization-level detail (impressions, interactions, verified revenue,
// outstanding upgrade fees, effective status). Ad analytics events carry no
// patient identities or health information — only anonymized, deduplicated
// counts.
export default function AdminPartnerAnalytics({ refreshKey, partnerType }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("adminPartnerManage", { action: "analytics", partner_type: partnerType });
      setData(res.data.analytics);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <span className="w-5 h-5 mr-2 border-2 border-muted border-t-primary rounded-full animate-spin" /> Loading...
      </div>
    );
  }

  const totals = data.totals_by_type || {};
  const cards = [
    { label: "Impressions", value: totals.impression || 0, icon: Eye },
    { label: "Detail views", value: totals.detail_view || 0, icon: MousePointerClick },
    { label: "Contact clicks", value: totals.contact_click || 0, icon: Phone },
    { label: "Direction clicks", value: totals.direction_click || 0, icon: MapPin },
  ];
  const pv = data.premium_vs_standard || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {["premium", "standard"].map((tier) => {
          const block = pv[tier] || {};
          return (
            <div key={tier} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold flex items-center gap-2 capitalize">
                {tier === "premium" ? <BarChart3 className="w-4 h-4 text-amber-500" /> : <BarChart3 className="w-4 h-4 text-primary" />} {tier} partners
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <p><span className="text-muted-foreground">Organizations:</span> {block.partners || 0}</p>
                <p><span className="text-muted-foreground">Impressions:</span> {block.impressions || 0}</p>
                <p><span className="text-muted-foreground">Total events:</span> {block.total_events || 0}</p>
                <p><span className="text-muted-foreground">Verified revenue:</span> {block.verified_revenue || 0} {data.currency}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Outstanding and overdue</p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <p className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">Outstanding upgrade fees:</span> {data.outstanding_upgrade_fees} {data.currency}</p>
          <p className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">Overdue subscriptions:</span> {data.overdue_count}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Per-organization performance</p>
        {(data.partners || []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No partner organizations yet.</p>
        ) : (
          <div className="space-y-2">
            {data.partners.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium truncate flex items-center gap-1.5">
                    {p.partner_name}
                    <span className="text-[10px] rounded-full bg-secondary text-secondary-foreground px-1.5 py-0.5 capitalize">{p.partner_type}</span>
                    {p.tier === "premium" && <span className="text-[10px] rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.5 font-bold">Premium</span>}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{p.effective_status === "past_due" ? "past due" : p.effective_status}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{p.impressions} impressions</p>
                  <p className="text-xs text-muted-foreground">
                    {p.total_events} events · {p.verified_revenue} {data.currency}
                    {p.outstanding_upgrade_fee > 0 ? ` · ${p.outstanding_upgrade_fee} ${data.currency} fee due` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}