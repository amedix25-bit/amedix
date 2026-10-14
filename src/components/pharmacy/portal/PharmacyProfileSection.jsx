import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Building2, Loader2, Upload, Save, Clock, Receipt, Wallet, History } from "lucide-react";

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "insurance", label: "Insurance" },
  { key: "mobile_wallet", label: "Mobile Wallet" },
  { key: "other", label: "Other" },
];

// Pharmacy profile and settings for the administrator: identity and contact
// details, operating hours, supported payment methods, receipt note and
// inventory alert threshold. Every saved change is recorded in the pharmacy's
// settings history and never alters historical transactions.
export default function PharmacyProfileSection({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    address: profile.address || "",
    phone: profile.phone || "",
    whatsapp_number: profile.whatsapp_number || "",
    email: profile.email || "",
    operating_hours: profile.operating_hours || "",
    receipt_note: profile.receipt_note || "",
    low_stock_threshold: profile.low_stock_threshold ?? 10,
    payment_methods: profile.payment_methods || ["cash"],
  });
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  const toggleMethod = (key) => {
    set((f) => ({
      ...f,
      payment_methods: f.payment_methods.includes(key)
        ? f.payment_methods.filter((m) => m !== key)
        : [...f.payment_methods, key],
    }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacySettingsManage", {
        action: "update",
        ...form,
        low_stock_threshold: Number(form.low_stock_threshold),
      });
      onUpdate?.(res.data.profile);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the settings.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.PharmacyProfile.update(profile.id, { logo_url: res.file_url });
      onUpdate?.({ ...profile, logo_url: res.file_url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const history = profile.settings_history || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          {profile.logo_url ? (
            <Image
              src={profile.logo_url}
              alt={`${profile.pharmacy_name} logo`}
              className="w-16 h-16 rounded-full border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-border">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{profile.pharmacy_name}</p>
            <p className="text-xs text-muted-foreground">Pharmacy Portal account</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {profile.logo_url ? "Change Logo" : "Upload Logo"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">A&amp;M Pharmacy Number / ID</span>
          <span className="text-sm font-medium">{profile.pharmacy_number}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Pharmacy Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsapp_number} onChange={(e) => set({ whatsapp_number: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Operating Hours</Label>
            <Input value={form.operating_hours} onChange={(e) => set({ operating_hours: e.target.value })} placeholder="e.g. 9:00 to 22:00 daily" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Low Stock Alert Threshold</Label>
            <Input
              type="number" min="0"
              value={form.low_stock_threshold}
              onChange={(e) => set({ low_stock_threshold: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Supported Payment Methods</Label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleMethod(m.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.payment_methods.includes(m.key)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Receipt Note</Label>
          <Input value={form.receipt_note} onChange={(e) => set({ receipt_note: e.target.value })} placeholder="Note printed on payment receipts" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Settings
          </Button>
          {saved && <span className="text-xs text-emerald-700 font-medium">Saved — the change is recorded in the settings history</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <button
          type="button"
          onClick={() => setShowHistory((s) => !s)}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <History className="w-4 h-4 text-primary" /> Settings Change History ({history.length})
        </button>
        {showHistory && (
          history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No settings changes recorded yet.</p>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {history.slice().reverse().slice(0, 20).map((h, i) => (
                <div key={i} className="py-2 text-xs">
                  <p className="font-medium">{h.field}: {h.old_value || "—"} → {h.new_value || "—"}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {h.datetime ? new Date(h.datetime).toLocaleString() : "—"} · {h.by_name || "—"}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}