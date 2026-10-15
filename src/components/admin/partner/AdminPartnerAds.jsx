import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPartnerPlans from "@/components/admin/partner/AdminPartnerPlans";
import AdminPartnerSubscriptions from "@/components/admin/partner/AdminPartnerSubscriptions";
import AdminPartnerAnalytics from "@/components/admin/partner/AdminPartnerAnalytics";
import { Loader2 } from "lucide-react";

// Admin section for the partner advertising and subscription system: plan
// settings, subscription management and aggregated analytics.
export default function AdminPartnerAds() {
  const [view, setView] = useState("plans");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("adminPartnerManage", { action: "get_plans" });
      setSettings(res.data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("plans")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${view === "plans" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Plans & Pricing
        </button>
        <button
          type="button"
          onClick={() => setView("subs")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${view === "subs" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Subscriptions
        </button>
        <button
          type="button"
          onClick={() => setView("analytics")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${view === "analytics" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Analytics
        </button>
      </div>
      {view === "plans" && <AdminPartnerPlans settings={settings} onSaved={load} />}
      {view === "subs" && <AdminPartnerSubscriptions settings={settings} onChanged={load} />}
      {view === "analytics" && <AdminPartnerAnalytics refreshKey={settings?.updated_datetime} />}
    </div>
  );
}