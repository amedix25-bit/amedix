import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserRound, Building2, ShieldCheck, Clock, Bell, KeyRound, Loader2, X } from "lucide-react";

const PREF_KEYS = [
  { key: "prescriptions", label: "Prescription updates" },
  { key: "inventory", label: "Inventory movements" },
  { key: "recalls", label: "Medication recalls" },
  { key: "expiry", label: "Expiry alerts" },
];

// The pharmacist's profile: their own account details, contact and
// registration information, notification preferences and password. Account
// status, permissions and professional details stay with the pharmacy
// administrator under the Pharmacists tab of the Pharmacy Portal.
export default function PharmacistProfileSection({ session, pharmacist, pharmacy }) {
  const name = pharmacist?.full_name || session?.full_name || "";
  const active = pharmacist ? pharmacist.is_active !== false : true;

  const [prefs, setPrefs] = useState({
    prescriptions: true, inventory: true, recalls: true, expiry: true,
  });
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    const p = pharmacist?.notification_prefs || {};
    setPrefs({
      prescriptions: p.prescriptions !== false,
      inventory: p.inventory !== false,
      recalls: p.recalls !== false,
      expiry: p.expiry !== false,
    });
  }, [pharmacist?.notification_prefs]);

  const savePrefs = async () => {
    setPrefsBusy(true);
    setPrefsSaved(false);
    try {
      await base44.functions.invoke("pharmacistProfileManage", {
        action: "prefs",
        prefs,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setPrefsSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setPrefsBusy(false);
    }
  };

  const changePassword = async () => {
    setPwError("");
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Fill in all three fields.");
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError("The new password must be at least 6 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("The new passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await base44.functions.invoke("pharmacistProfileManage", {
        action: "change_password",
        current_password: pwForm.current,
        new_password: pwForm.next,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setPwOpen(false);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwSaved(true);
    } catch (err) {
      setPwError(err.response?.data?.error || "Could not change the password.");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{name}</p>
            <p className="text-xs text-muted-foreground">Pharmacist</p>
          </div>
          <span
            className={`ml-auto text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${
              active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            {active ? "Active" : "Deactivated"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="font-medium">{pharmacist?.username || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Active</p>
            <p className="font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {pharmacist?.last_active_datetime ? new Date(pharmacist.last_active_datetime).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Contact &amp; Registration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{pharmacist?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registration Number</p>
            <p className="font-medium">{pharmacist?.registration_number || "—"}</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Contact and registration details are maintained by the pharmacy administrator.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Notification Preferences</h3>
        </div>
        <div className="space-y-2.5">
          {PREF_KEYS.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{p.label}</span>
              <Switch
                checked={prefs[p.key]}
                onCheckedChange={(v) => { setPrefs((s) => ({ ...s, [p.key]: v })); setPrefsSaved(false); }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={savePrefs} disabled={prefsBusy}>
            {prefsBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Preferences
          </Button>
          {prefsSaved && <span className="text-xs text-emerald-700 font-medium">Saved</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Security</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setPwOpen(true); setPwError(""); }}>
            Change Password
          </Button>
          {pwSaved && <span className="text-xs text-emerald-700 font-medium">Password updated</span>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{pharmacy?.pharmacy_name || "—"}</p>
            <p className="text-xs text-muted-foreground">{pharmacy?.pharmacy_number || "—"}</p>
          </div>
          {pharmacy?.status && (
            <span
              className={`ml-auto text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${
                pharmacy.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {pharmacy.status === "active" ? "Active" : pharmacy.status === "suspended" ? "Suspended" : "Pending Approval"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-medium">{pharmacy?.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{pharmacy?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium truncate">{pharmacy?.email || "—"}</p>
          </div>
        </div>
      </div>

      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => !pwBusy && setPwOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Change Password</h3>
              <button type="button" onClick={() => !pwBusy && setPwOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input type="password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>New password (at least 6 characters)</Label>
              <Input type="password" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} />
            </div>
            {pwError && <p className="text-xs text-destructive">{pwError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPwOpen(false)} disabled={pwBusy}>Cancel</Button>
              <Button size="sm" onClick={changePassword} disabled={pwBusy}>
                {pwBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}