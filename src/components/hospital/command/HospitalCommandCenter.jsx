import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useAppLanguage } from "@/lib/appLanguage";
import { formatDateTime } from "@/lib/hospitalCommandFormat";
import { Loader2, RefreshCw, Radio, AlertCircle } from "lucide-react";
import CommandKpiGrid from "./CommandKpiGrid";
import CommandAlerts from "./CommandAlerts";
import CommandActivityFeed from "./CommandActivityFeed";
import CommandDepartments from "./CommandDepartments";
import CommandQuickActions from "./CommandQuickActions";
import CommandFlowChart from "./CommandFlowChart";

// Hospital Command Center — the operational overview of one hospital. Every
// figure comes from that hospital's own records, loaded by a server function
// that verifies the caller owns the hospital before reading anything.
export default function HospitalCommandCenter({ profile, userName, onNavigate }) {
  const { t } = useAppLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("hospitalCommandCenter", {});
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground">
        {profile?.photo_url ? (
          <Image
            src={profile.photo_url}
            alt=""
            className="absolute inset-0 w-full h-full opacity-25"
          />
        ) : null}
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">
                {t("Hospital Command Center")}
              </p>
              <h2 className="text-xl lg:text-2xl font-bold mt-1">
                {t("Welcome")}, {userName || profile?.hospital_name}
              </h2>
              <p className="text-sm text-primary-foreground/80 mt-1">
                {profile?.location
                  ? `${profile.hospital_name} · ${profile.location}`
                  : profile?.hospital_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-medium">
                <Radio className="w-3 h-3" /> {t("Live")}
              </span>
              <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                {t("Refresh")}
              </Button>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/70 mt-4">
            {now.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            {data?.generated_at ? ` · ${t("updated")} ${formatDateTime(data.generated_at)}` : ""}
          </p>
        </div>
      </section>

      {loading && !data ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("Loading hospital figures...")}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-critical/30 bg-critical/5 p-6 text-center">
          <AlertCircle className="w-7 h-7 mx-auto mb-2 text-critical" />
          <p className="text-sm font-medium">{t("Hospital figures could not be loaded.")}</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={load}>
            {t("Try again")}
          </Button>
        </div>
      ) : (
        <>
          <CommandKpiGrid kpis={data.kpis} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <CommandFlowChart flow={data.flow} />
              <CommandDepartments departments={data.departments} />
            </div>
            <div className="space-y-4">
              <CommandAlerts alerts={data.alerts} onNavigate={onNavigate} />
              <CommandQuickActions onNavigate={onNavigate} />
            </div>
          </div>

          <CommandActivityFeed activity={data.activity} />

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t(
              "Every figure above is counted from this hospital's own records. A dash means the figure could not be measured — it is never shown as zero."
            )}
          </p>
        </>
      )}
    </div>
  );
}