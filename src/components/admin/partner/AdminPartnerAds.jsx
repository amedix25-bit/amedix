import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPartnerPlans from "@/components/admin/partner/AdminPartnerPlans";
import AdminPartnerSubscriptions from "@/components/admin/partner/AdminPartnerSubscriptions";
import AdminPartnerAnalytics from "@/components/admin/partner/AdminPartnerAnalytics";
import AdminAdTemplates from "@/components/admin/partner/AdminAdTemplates";
import { Building2, FlaskConical, Stethoscope, Loader2 } from "lucide-react";

// Admin section for the partner advertising and subscription system. Three
// separate partner areas — pharmacies, laboratories and hospitals — each with
// the same views: plan settings, ad library, subscription management and
// analytics.
export default function AdminPartnerAds() {
  const [partnerType, setPartnerType] = useState("pharmacy");
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

  const typeOptions = [
    { key: "pharmacy", label: "Pharmacy Ads", sub: "Shown in the patient Prescriptions tab", icon: Building2 },
    { key: "laboratory", label: "Laboratory Ads", sub: "Shown in the patient Labs tab", icon: FlaskConical },
    { key: "hospital", label: "Hospital Ads", sub: "Hospital partnership plans", icon: Stethoscope },
  ];

  const tabs = [
    { key: "plans", label: "Plans & Pricing" },
    { key: "library", label: "Ad Library" },
    { key: "subs", label: "Subscriptions" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="space-y-4">
      {/* Two separate partner ad areas — pick one, the same three tabs follow */}
      <div className="grid sm:grid-cols-3 gap-3">
        {typeOptions.map(({ key, label, sub, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setPartnerType(key); setView("plans"); }}
            className={`flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors ${
              partnerType === key ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
            }`}
          >
            <span className={`rounded-lg p-2.5 shrink-0 ${partnerType === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground truncate">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${view === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "plans" && <AdminPartnerPlans settings={settings} partnerType={partnerType} onSaved={load} />}
      {view === "library" && <AdminAdTemplates key={partnerType} partnerType={partnerType} />}
      {view === "subs" && <AdminPartnerSubscriptions key={partnerType} settings={settings} fixedPartnerType={partnerType} onChanged={load} />}
      {view === "analytics" && <AdminPartnerAnalytics refreshKey={settings?.updated_datetime} partnerType={partnerType} />}
    </div>
  );
}