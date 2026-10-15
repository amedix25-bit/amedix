import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PartnerAdCard from "@/components/partner/PartnerAdCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PartnerAdStrip({ section }) {
  const { t } = usePatientLanguage();
  const { data: ads = [], isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["patient-partner-ads", section],
    queryFn: async () => {
      const { data } = await base44.functions.invoke("patientPartnerAds", { section });
      if (!Array.isArray(data?.ads)) throw new Error("Invalid partner offers response");
      return data.ads;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 30000,
    retry: 1,
  });
  const heading = section === "laboratory" ? t("AMedix Laboratory Partners") : t("AMedix Pharmacy Partners");

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{heading}</p>
        {!isPending && !isError && ads.length > 0 && <span className="text-[10px] text-muted-foreground">{t("Sponsored")}</span>}
      </div>
      {isPending ? (
        <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("Loading partner offers…")}</p>
      ) : isError ? (
        <div role="alert" className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t("Partner offers could not be loaded.")}</p>
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>{t("Try again")}</Button>
        </div>
      ) : ads.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("No partner offers at the moment")}</p>
      ) : (
        <div className="space-y-3">{ads.map((ad) => <PartnerAdCard key={ad.ad_id} ad={ad} premium={ad.tier === "premium"} />)}</div>
      )}
    </div>
  );
}