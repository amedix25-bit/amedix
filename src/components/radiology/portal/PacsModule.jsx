import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Network, PlugZap, Trash2, Plus, CheckCircle2, XCircle, HardDriveDownload } from "lucide-react";

const STATUS_CHIP = {
  connected: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  failed: "bg-[hsl(var(--critical))]/10 text-[hsl(var(--critical))]",
  pending_verification: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  not_configured: "bg-secondary text-secondary-foreground",
};

const EMPTY = {
  id: "", name: "", connection_type: "dicom_network", host: "", port: 104,
  called_ae_title: "", calling_ae_title: "", dicomweb_base_url: "",
  supports_qido: false, supports_wado: false, supports_stow: false,
  auth_type: "none", auth_secret_name: "", viewer_type: "none",
  viewer_url_template: "", radiant_launch_template: "", is_default: false, notes: "",
};

// PACS Integration — a hybrid configuration per facility: traditional DICOM
// networking (host, port, AE titles), DICOMweb (QIDO/WADO/STOW) or the
// facility's Orthanc archive, plus manual import. Capabilities are recorded
// only once the vendor confirmed them; a connection is "Connected" only after
// the server-side test passes. Credential values live in server-side secrets —
// this screen stores only the secret's name.
export default function PacsModule() {
  const { toast } = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyPortalAdmin", { action: "pacs_list" });
      setConnections(res.data?.connections || []);
    } catch (err) {
      setConnections([]);
      toast({ title: "Could not load PACS connections", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const edit = (connection) => {
    setForm({ ...EMPTY, ...connection });
    setOpen(true);
  };

  const presetOrthanc = () => {
    setForm({
      ...EMPTY,
      connection_type: "orthanc",
      name: "Orthanc DICOM archive",
      supports_qido: true,
      supports_wado: true,
      supports_stow: true,
      viewer_type: "ohif",
      notes: "Orthanc archive: enter the server's https base URL. QIDO/WADO/STOW are served by Orthanc's DICOMweb plugin — confirm the plugin is enabled on the server.",
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.functions.invoke("radiologyPortalAdmin", { action: "pacs_save", ...form });
      toast({ title: "Connection saved", description: "Verification was reset — run the connection test." });
      setForm(EMPTY);
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Could not save the connection", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const test = async (connection) => {
    setTesting(connection.id);
    try {
      const res = await base44.functions.invoke("radiologyPortalAdmin", { action: "pacs_test", id: connection.id });
      const status = res.data?.connection?.status;
      toast({
        title: status === "connected" ? "Connection verified" : "Connection test did not pass",
        description: res.data?.connection?.last_test_result?.message,
        variant: status === "connected" ? undefined : "destructive",
      });
      load();
    } catch (err) {
      toast({ title: "Connection test failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setTesting("");
    }
  };

  const remove = async (connection) => {
    try {
      await base44.functions.invoke("radiologyPortalAdmin", { action: "pacs_delete", id: connection.id });
      load();
    } catch (err) {
      toast({ title: "Could not remove the connection", description: err.response?.data?.error || err.message, variant: "destructive" });
    }
  };

  const field = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isWeb = form.connection_type === "dicomweb" || form.connection_type === "orthanc";

  if (loading) return <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setForm(EMPTY); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New connection
        </Button>
        <Button variant="outline" onClick={presetOrthanc}>
          <HardDriveDownload className="w-4 h-4 mr-1.5" /> Orthanc preset
        </Button>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <Network className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">
            No PACS connection configured. AMedix does not assume a hospital supports DICOMweb — record exactly what the vendor confirmed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {c.name} {c.is_default && <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-secondary">default</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.connection_type === "dicom_network"
                      ? `DICOM ${c.host || "—"}:${c.port || "—"} · ${c.calling_ae_title || "—"} → ${c.called_ae_title || "—"}`
                      : c.connection_type === "manual_import"
                        ? "Manual DICOM import through AMedix"
                        : `${c.dicomweb_base_url || "no endpoint"} · QIDO ${c.supports_qido ? "yes" : "no"} · WADO ${c.supports_wado ? "yes" : "no"} · STOW ${c.supports_stow ? "yes" : "no"}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Viewer: {c.viewer_type} · saved {c.updated_datetime ? new Date(c.updated_datetime).toLocaleString() : "—"}
                    {c.auth_secret_name ? ` · secret ${c.auth_secret_name}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CHIP[c.status] || "bg-secondary"}`}>
                    {String(c.status).replace(/_/g, " ")}
                  </span>
                  <Button size="sm" variant="outline" disabled={testing === c.id} onClick={() => test(c)}>
                    {testing === c.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <PlugZap className="w-3.5 h-3.5 mr-1" />}
                    Test
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => edit(c)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {Array.isArray(c.last_test_result?.checks) && c.last_test_result.checks.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {c.last_test_result.checks.map((ch) => (
                    <li key={ch.key} className="text-[11px] flex items-start gap-1.5">
                      {ch.outcome === "passed" ? (
                        <CheckCircle2 className="w-3 h-3 mt-0.5 text-[hsl(var(--success))]" />
                      ) : ch.outcome === "failed" ? (
                        <XCircle className="w-3 h-3 mt-0.5 text-[hsl(var(--critical))]" />
                      ) : (
                        <span className="w-3 h-3 mt-0.5 rounded-full border border-border" />
                      )}
                      <span className="text-muted-foreground"><strong>{ch.label}:</strong> {ch.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">{form.id ? "Edit connection" : "New PACS connection"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Connection name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => field("name")(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Connection type</Label>
              <Select value={form.connection_type} onValueChange={field("connection_type")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dicom_network">Traditional DICOM networking</SelectItem>
                  <SelectItem value="dicomweb">DICOMweb (QIDO / WADO / STOW)</SelectItem>
                  <SelectItem value="orthanc">Orthanc archive</SelectItem>
                  <SelectItem value="manual_import">Manual DICOM import only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.connection_type === "dicom_network" && (
              <>
                <div>
                  <Label className="text-xs">PACS IP address or hostname</Label>
                  <Input className="mt-1" value={form.host} onChange={(e) => field("host")(e.target.value)} placeholder="10.0.0.25" />
                </div>
                <div>
                  <Label className="text-xs">Port</Label>
                  <Input className="mt-1" type="number" value={form.port} onChange={(e) => field("port")(e.target.value)} placeholder="104" />
                </div>
                <div>
                  <Label className="text-xs">Called AE Title</Label>
                  <Input className="mt-1" value={form.called_ae_title} onChange={(e) => field("called_ae_title")(e.target.value)} placeholder="PACS" />
                </div>
                <div>
                  <Label className="text-xs">Calling AE Title</Label>
                  <Input className="mt-1" value={form.calling_ae_title} onChange={(e) => field("calling_ae_title")(e.target.value)} placeholder="AMEDIX" />
                </div>
              </>
            )}

            {isWeb && (
              <>
                <div className="sm:col-span-2">
                  <Label className="text-xs">DICOMweb base URL (https)</Label>
                  <Input className="mt-1" value={form.dicomweb_base_url} onChange={(e) => field("dicomweb_base_url")(e.target.value)} placeholder="https://pacs.hospital.example/dicom-web" />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-4 text-xs">
                  {[["supports_qido", "QIDO-RS search"], ["supports_wado", "WADO-RS retrieve"], ["supports_stow", "STOW-RS upload"]].map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={!!form[key]} onChange={(e) => field(key)(e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Authentication</Label>
                  <Select value={form.auth_type} onValueChange={field("auth_type")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer token</SelectItem>
                      <SelectItem value="basic">Basic (user:password)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Server-side secret name</Label>
                  <Input className="mt-1" value={form.auth_secret_name} onChange={(e) => field("auth_secret_name")(e.target.value)} placeholder="PACS_FACILITY_TOKEN" />
                  <p className="text-[11px] text-muted-foreground mt-1">Only the name is stored here; the value is a dashboard secret.</p>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs">Viewer</Label>
              <Select value={form.viewer_type} onValueChange={field("viewer_type")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No viewer configured</SelectItem>
                  <SelectItem value="ohif">Embedded OHIF</SelectItem>
                  <SelectItem value="radiant">RadiAnt (desktop)</SelectItem>
                  <SelectItem value="vendor_web">Vendor web viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Viewer URL template</Label>
              <Input className="mt-1" value={form.viewer_url_template} onChange={(e) => field("viewer_url_template")(e.target.value)} placeholder="https://ohif.hospital.example/viewer?StudyInstanceUIDs={study_instance_uid}" />
              <p className="text-[11px] text-muted-foreground mt-1">Placeholders: {"{study_instance_uid}"}, {"{accession_number}"}.</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">RadiAnt launch URL (confirmed by the vendor)</Label>
              <Input className="mt-1" value={form.radiant_launch_template} onChange={(e) => field("radiant_launch_template")(e.target.value)} placeholder="Leave empty until the vendor's documented launch URL is confirmed" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input className="mt-1" value={form.notes} onChange={(e) => field("notes")(e.target.value)} placeholder="Vendor contact, agreed authentication method" />
            </div>
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!form.is_default} onChange={(e) => field("is_default")(e.target.checked)} />
              Use as the default connection
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save connection
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(EMPTY); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}