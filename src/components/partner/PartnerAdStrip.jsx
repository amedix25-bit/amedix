import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PartnerAdCard from "@/components/partner/PartnerAdCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The partner advertising strip for ONE Patient Portal tab. A `section` of
// "pharmacy" renders pharmacy ads only and belongs in the Prescriptions tab;
// "laboratory" renders laboratory ads only and belongs in the Labs tab. It is
// never placed on the dashboard, other tabs or other portals, and renders
// nothing at all when there are no approved ads.
export default function PartnerAdStrip({ section }) {
  const { t } = usePatientLanguage();
  const [ads, setAds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await base44.functions.invoke("patientPartnerAds", { section });
        if (!cancelled) setAds(res.data.ads || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setAds([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [section]);

  if (!ads || ads.length === 0) return null;
  const premium = ads.filter((a) => a.tier === "premium");
  const standard = ads.filter((a) => a.tier !== "premium");

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {t("AMedix Partners")}
      </p>
      {premium.length > 0 && (
        <div className="space-y-3 mb-3">
          {premium.map((ad) => <PartnerAdCard key={ad.partner_id} ad={ad} premium />)}
        </div>
      )}
      {standard.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {standard.map((ad) => <PartnerAdCard key={ad.partner_id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}