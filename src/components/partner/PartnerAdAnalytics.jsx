import React from "react";
import { base44 } from "@/api/base44Client";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { BarChart3, Eye, MousePointerClick, Phone, MapPin } from "lucide-react";

// Partner-facing advertisement analytics for the partner's OWN organization
// only (the backend scopes every query to the signed-in partner account).
// Shows deduplicated impressions, detail views, contact and direction clicks,
// a 30-day impression trend, a per-advertisement breakdown and the
// subscription context. The analytics contain no patient identities or health
// information — only anonymized, deduplicated counts.
export default function PartnerAdAnalytics({ partnerType }) {
  const { t } = usePatientLanguage();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await base44.functions.invoke("partnerAdAnalytics", { partner_type: partnerType });
        if (!cancelled) setData(res.data.analytics);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partnerType]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        <span className="w-5 h-5 mr-2 border-2 border-muted border-t-primary rounded-full animate-spin" /> Loading...
      </div>
    );
  }

  const totals = data.totals_by_type || {};
  const sub = data.subscription || {};
  const maxDaily = Math.max(1, ...(data.daily_impressions || []).map((d) => d.impressions));

  const cards = [
    { label: t("Impressions"), value: totals.impression || 0, icon: Eye },
    { label: t("Detail views"), value: totals.detail_view || 0, icon: MousePointerClick },
    { label: t("Contact clicks"), value: totals.contact_click || 0, icon: Phone },
    { label: t("Direction clicks"), value: totals.direction_click || 0, icon: MapPin },
  ];

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

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> {t("Impressions — last 30 days")}</p>
        {(data.daily_impressions || []).length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("No impressions recorded yet")}</p>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {data.daily_impressions.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.impressions}`}>
                <div className="w-full bg-primary/70 rounded-t" style={{ height: `${Math.max(4, (d.impressions / maxDaily) * 80)}px` }} />
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-2">{t("Impressions are counted at most once per advertisement per viewer per day")}</p>
      </div>

      {(data.ads || []).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold mb-3">{t("Advertisement performance")}</p>
          <div className="space-y-2">
            {data.ads.map((ad, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium truncate">{ad.title || ad.ad_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {ad.status} · {ad.placement === "premium" ? t("Premium") : t("Standard")}
                    {ad.campaign_start_date ? ` · ${ad.campaign_start_date}${ad.campaign_end_date ? ` → ${ad.campaign_end_date}` : ""}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{ad.impressions} {t("impressions")}</p>
                  <p className="text-xs text-muted-foreground">{ad.total_interactions} {t("total events")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-2 gap-2 text-sm">
        <p><span className="text-muted-foreground">{t("Plan")}:</span> {sub.tier === "premium" ? t("Premium") : t("Standard")}</p>
        <p><span className="text-muted-foreground">{t("Status")}:</span> {sub.effective_status === "past_due" ? t("Past due") : sub.status}</p>
        {sub.price_amount != null && (
          <p><span className="text-muted-foreground">{t("Next payment")}:</span> {sub.next_payment_amount} {sub.currency} /{sub.billing_interval === "year" ? t("year") : t("month")}</p>
        )}
        {sub.next_billing_datetime && (
          <p><span className="text-muted-foreground">{t("Renewal date")}:</span> {new Date(sub.next_billing_datetime).toLocaleDateString()}</p>
        )}
        {sub.price_effective_datetime && sub.scheduled_tier && (
          <p className="sm:col-span-2 text-xs text-amber-600">
            {t("Scheduled plan change")}: {sub.scheduled_tier === "premium" ? t("Premium") : t("Standard")} — {t("effective")} {new Date(sub.price_effective_datetime).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}