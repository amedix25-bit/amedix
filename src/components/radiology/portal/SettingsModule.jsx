import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings as SettingsIcon, ScrollText } from "lucide-react";

// Radiology settings and audit trail. Release policy, escalation window and
// retention are recorded per facility; the audit trail is append-only and is
// what makes every import, study access, viewer launch, report release and
// configuration change reviewable.
export default function SettingsModule() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [settingsRes, auditRes] = await Promise.all([
        base44.functions.invoke("radiologyPortalAdmin", { action: "settings_get" }),
        base44.functions.invoke("radiologyPortal", { action: "audit_list" }),
      ]);
      setSettings(settingsRes.data?.settings || null);
      setCanManage(!!settingsRes.data?.can_manage);
      setEntries(auditRes.data?.entries || []);
    } catch (err) {
      toast({ title: "Could not load settings", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.functions.invoke("radiologyPortalAdmin", { action: "settings_save", ...settings });
      toast({ title: "Radiology settings saved" });
      load();
    } catch (err) {
      toast({ title: "Could not save settings", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const set = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="space-y-4">
      {settings && (
        <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Department settings</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Report release policy</Label>
              <Select value={settings.report_release_policy || "manual_release_only"} onValueChange={set("report_release_policy")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_release_only">Manual release only (recommended)</SelectItem>
                  <SelectItem value="auto_release_finalized">Auto-release finalized and signed reports</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                A report is never released before it is finalized and signed.
              </p>
            </div>
            <div>
              <Label className="text-xs">Critical finding escalation (hours)</Label>
              <Input className="mt-1" type="number" min="1" value={settings.critical_escalation_hours ?? 2} onChange={(e) => set("critical_escalation_hours")(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Default Calling AE Title</Label>
              <Input className="mt-1" value={settings.default_calling_ae_title || ""} onChange={(e) => set("default_calling_ae_title")(e.target.value)} placeholder="AMEDIX" />
            </div>
            <div>
              <Label className="text-xs">Audit retention (days)</Label>
              <Input className="mt-1" type="number" min="30" value={settings.audit_retention_days ?? 365} onChange={(e) => set("audit_retention_days")(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Report footer note</Label>
              <Input className="mt-1" value={settings.report_footer_note || ""} onChange={(e) => set("report_footer_note")(e.target.value)} placeholder="Accreditation or contact line printed on reports" />
            </div>
          </div>
          {canManage && (
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save settings
            </Button>
          )}
        </form>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Radiology audit trail</h2>
        </div>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No radiology activity recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="text-xs border border-border rounded-lg px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{e.action_label || e.action}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {e.datetime ? new Date(e.datetime).toLocaleString() : ""}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {e.actor_name || "System"} ({e.actor_role || "system"})
                  {e.patient_name ? ` · ${e.patient_name}` : ""}
                  {e.patient_cin ? ` · ${e.patient_cin}` : ""}
                  {e.request_ref ? ` · ${e.request_ref}` : ""}
                </p>
                {e.detail && <p className="text-[11px] text-muted-foreground mt-0.5">{e.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}