import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PartnerAdCard from "@/components/partner/PartnerAdCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The sponsored partner advertising strip for ONE Patient Portal tab. A
// `section` of "pharmacy" renders the "AMedix Pharmacy Partners" area only and
// belongs in the Prescriptions tab; "laboratory" renders the "AMedix
// Laboratory Partners" area only and belongs in the Labs tab. It is never
// placed on the dashboard, other tabs or other portals. Premium partners fill
// the featured positions first; the backend applies deterministic, fairly
// rotated ordering. Advertising is kept entirely separate from clinical
// records, results and clinician-selected services.
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

  const heading = section === "laboratory" ? t("AMedix Laboratory Partners") : t("AMedix Pharmacy Partners");

  if (ads && ads.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{heading}</p>
        <p className="text-xs text-muted-foreground">{t("No partner offers at the moment")}</p>
      </div>
    );
  }
  if (!ads) return null;

  const premium = ads.filter((a) => a.tier === "premium");
  const standard = ads.filter((a) => a.tier !== "premium");

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </p>
        <span className="text-[10px] text-muted-foreground">{t("Sponsored")}</span>
      </div>
      <div className="space-y-3">
        {premium.map((ad) => <PartnerAdCard key={ad.partner_id} ad={ad} premium />)}
        {standard.map((ad) => <PartnerAdCard key={ad.partner_id} ad={ad} />)}
      </div>
    </div>
  );
}