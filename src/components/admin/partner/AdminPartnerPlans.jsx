import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Megaphone, Save } from "lucide-react";

// Administrator editor for the partner advertising plan settings: prices,
// currency, billing interval, intro offer, grace period, plan descriptions and
// availability. Prices are commercial terms the administrator sets — the
// system never invents them.
export default function AdminPartnerPlans({ settings, onSaved, partnerType = "pharmacy" }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const p = partnerType === "laboratory" ? "lab" : partnerType === "hospital" ? "hospital" : "pharmacy";
  const typeLabel = partnerType === "laboratory" ? "Laboratory" : partnerType === "hospital" ? "Hospital" : "Pharmacy";

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("adminPartnerManage", {
        action: "update_plans",
        settings: {
          ...form,
          plan_features: (form.plan_features || []).filter(Boolean),
        },
      });
      toast({ title: "Plan settings saved" });
      onSaved?.();
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

  if (!form) return null;

  const priceField = (key, label) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min="0" step="0.01" placeholder="Not set" value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
    </div>
  );
  const descField = (key, label) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={form[key] || ""} onChange={(e) => set(key, e.target.value)} />
    </div>
  );
  const switchField = (key, label) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={form[key] !== false} onChange={(e) => set(key, e.target.checked)} className="accent-[hsl(var(--primary))]" />
      {label}
    </label>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Advertising Plans — {typeLabel}</h3>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Currency</Label>
          <Input value={form.currency || ""} onChange={(e) => set("currency", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Billing interval</Label>
          <select value={form.billing_interval || "month"} onChange={(e) => set("billing_interval", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        {priceField("grace_days", "Grace period (days)")}
        {priceField("premium_upgrade_fee", "Premium upgrade fee (optional)")}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {priceField(`${p}_standard_price`, `${typeLabel} Standard price / interval`)}
        {priceField(`${p}_premium_price`, `${typeLabel} Premium price / interval (total)`)}
      </div>
      <p className="text-xs text-muted-foreground">
        Leave a price empty until you set the commercial terms. The Premium price is the total monthly price — enter an upgrade fee above only if Premium should cost extra on top of an active Standard subscription.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {descField(`${p}_standard_description`, `${typeLabel} Standard description`)}
        {descField(`${p}_premium_description`, `${typeLabel} Premium description`)}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Included features (comma separated)</Label>
        <Textarea rows={2}
          value={(form.plan_features || []).join(", ")}
          onChange={(e) => set("plan_features", e.target.value.split(",").map((s) => s.trim()))} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.intro_offer_enabled} onChange={(e) => set("intro_offer_enabled", e.target.checked)} className="accent-[hsl(var(--primary))]" />
          Introductory offer
        </label>
        {priceField("intro_discount_percent", "Intro discount %")}
        {priceField("intro_duration_months", "Intro covers (payments)")}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Cancellation policy</Label>
        <select value={form.cancellation_policy || "end_of_period"} onChange={(e) => set("cancellation_policy", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="end_of_period">End of paid period (subscription stays active until the renewal date)</option>
          <option value="immediate">Immediate (cancellation takes effect as soon as it is approved)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Overdue-payment policy</Label>
        <Textarea rows={2} value={form.overdue_policy || ""} onChange={(e) => set("overdue_policy", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {switchField(`${p}_standard_available`, `${typeLabel} Standard open for new subscriptions`)}
        {switchField(`${p}_premium_available`, `${typeLabel} Premium open for new subscriptions`)}
      </div>

      {settings?.updated_datetime && (
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(settings.updated_datetime).toLocaleString()}{settings.updated_by_name ? ` by ${settings.updated_by_name}` : ""}
        </p>
      )}

      <Button onClick={save} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save plan settings
      </Button>
    </div>
  );
}