import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Hospital Portal — Radiology Department tab. Imaging System Connection (PACS):
// connects AMedix to the facility's EXISTING imaging software so radiologists
// open the authorized study in the vendor system from the Imaging Viewer tab.
export default function HospitalPacsSection({ profile, onUpdate }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    pacs_integration_enabled: !!profile.pacs_integration_enabled,
    pacs_integration_type: profile.pacs_integration_type || "dicomweb",
    pacs_vendor_name: profile.pacs_vendor_name || "",
    pacs_viewer_url_template: profile.pacs_viewer_url_template || "",
    pacs_dicomweb_base_url: profile.pacs_dicomweb_base_url || "",
    pacs_vendor_notes: profile.pacs_vendor_notes || "",
    ohif_base_url: profile.ohif_base_url || "",
    ohif_route_template: profile.ohif_route_template || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // A deployable OHIF address: a well-formed https:// URL on a real host —
  // never the public OHIF demo or a reserved example/placeholder domain.
  const isValidOhifUrl = (value) => {
    try {
      const u = new URL(value);
      if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return false;
      const host = u.hostname.toLowerCase();
      const blocked = ["ohif.org", "www.ohif.org", "demo.ohif.org", "o.ohif.org", "example.com", "www.example.com", "example.org", "example.net", "localhost"];
      return !blocked.includes(host) && !host.endsWith(".example") && !host.endsWith(".test") && !host.endsWith(".local");
    } catch {
      return false;
    }
  };
  const connectionStatus = profile.ohif_connection_status || "pending_configuration";

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const template = form.pacs_viewer_url_template.trim();
    const dicomweb = form.pacs_dicomweb_base_url.trim();
    // A launch template must be the vendor's DOCUMENTED web or protocol URL —
    // a local file path (e.g. /Applications/Viewer.app) is never launchable.
    if (template && !/^[a-z][a-z0-9+.-]*:\/\//i.test(template)) {
      toast({
        title: "Invalid launch URL template",
        description: "It must be the vendor's documented launch URL or protocol (e.g. https://... or scheme://...). A local file path cannot be launched from AMedix.",
        variant: "destructive",
      });
      return;
    }
    if (dicomweb && !/^https?:\/\//i.test(dicomweb)) {
      toast({
        title: "Invalid DICOMweb base URL",
        description: "It must be a valid http(s) endpoint (e.g. https://pacs.example.com/dicom-web).",
        variant: "destructive",
      });
      return;
    }
    const ohifBase = form.ohif_base_url.trim();
    const ohifRoute = form.ohif_route_template.trim();
    // An embedded OHIF deployment must be the facility's OWN DEPLOYED https
    // instance — never the public demo or a placeholder address. An empty Base
    // URL is allowed while deployment is pending: the integration then stays
    // "Pending configuration" and launching stays disabled.
    if (form.pacs_integration_type === "ohif_embedded" && ohifBase && !isValidOhifUrl(ohifBase)) {
      toast({
        title: "Invalid OHIF Base URL",
        description: "Enter the https:// address of your own deployed, approved OHIF instance (e.g. https://ohif.your-hospital.com). The public OHIF demo and placeholder or example addresses are not accepted. Leave it empty while deployment is still pending.",
        variant: "destructive",
      });
      return;
    }
    if (ohifRoute && !isValidOhifUrl(ohifRoute)) {
      toast({
        title: "Invalid OHIF route template",
        description: "The route template must be an https:// URL of your own deployment (e.g. https://ohif.your-hospital.com/viewer?StudyInstanceUIDs={study_instance_uid}).",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await base44.entities.HospitalProfile.update(profile.id, {
        pacs_integration_enabled: !!form.pacs_integration_enabled,
        pacs_integration_type: form.pacs_integration_enabled ? form.pacs_integration_type : "none",
        pacs_vendor_name: form.pacs_vendor_name.trim(),
        pacs_viewer_url_template: form.pacs_viewer_url_template.trim(),
        pacs_dicomweb_base_url: form.pacs_dicomweb_base_url.trim(),
        pacs_vendor_notes: form.pacs_vendor_notes.trim(),
        ohif_base_url: ohifBase,
        ohif_route_template: ohifRoute,
        // The Connected state is earned only through the end-to-end test. It is
        // preserved when saving an unchanged OHIF configuration, and reset to
        // Pending configuration whenever the Base URL, route template, enable
        // state or integration type changes.
        ohif_connection_status:
          form.pacs_integration_enabled &&
          form.pacs_integration_type === "ohif_embedded" &&
          ohifBase === String(profile.ohif_base_url || "").trim() &&
          ohifRoute === String(profile.ohif_route_template || "").trim()
            ? (profile.ohif_connection_status || "pending_configuration")
            : "pending_configuration",
        pacs_updated_datetime: new Date().toISOString(),
      });
      if (onUpdate) onUpdate(updated);
      toast({ title: "Imaging system connection saved" });
    } catch (err) {
      toast({ title: "Could not save the connection", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // End-to-end verification — the ONLY path that marks the integration
  // Connected. Server-side: reaches the deployment and retrieves a study
  // from the facility archive through its DICOMweb (QIDO) endpoint.
  const runConnectionTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "ohif_test",
        hospital_profile_id: profile.id,
      });
      setTestResult(res.data);
      if (onUpdate && res.data.connection_status) {
        onUpdate({ ...profile, ohif_connection_status: res.data.connection_status, ohif_connection_tested_datetime: res.data.tested_datetime });
      }
    } catch (err) {
      const data = (err.response && err.response.data) || {};
      setTestResult({
        tested: false,
        connection_status: data.connection_status || "verification_failed",
        message: data.message || data.error || err.message,
      });
      if (onUpdate && data.connection_status) {
        onUpdate({ ...profile, ohif_connection_status: data.connection_status });
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Imaging System Connection (PACS)</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect AMedix to the hospital's EXISTING imaging software — radiologists open the authorized study in your
            system from the Imaging Viewer tab. Confirm the supported integration method with your imaging vendor first.
          </p>
          {form.pacs_integration_type === "ohif_embedded" && form.pacs_integration_enabled && (
            <p className={`mt-1.5 inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-500/10 text-emerald-700"
                : connectionStatus === "verification_failed"
                  ? "bg-red-500/10 text-red-700"
                  : "bg-amber-500/10 text-amber-700"
            }`}>
              {connectionStatus === "connected"
                ? "Connected — end-to-end study-retrieval test passed"
                : connectionStatus === "verification_failed"
                  ? "Verification failed — correct the configuration and run the test again"
                  : "Pending configuration — deployment required"}
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={form.pacs_integration_enabled}
            onChange={(e) => setForm((s) => ({ ...s, pacs_integration_enabled: e.target.checked }))}
          />
          Enabled
        </label>
      </div>
      {form.pacs_integration_enabled && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Integration Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.pacs_integration_type}
                onChange={set("pacs_integration_type")}
              >
                <option value="dicomweb">DICOMweb / PACS (browser viewer)</option>
                <option value="web_viewer">Web viewer launch URL</option>
                <option value="desktop_app">Desktop application (cannot be embedded)</option>
                <option value="ohif_embedded">OHIF Viewer (embedded workspace)</option>
              </select>
              {form.pacs_integration_type === "ohif_embedded" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Record your facility's OWN approved OHIF deployment below — never the public OHIF demo for real patient
                  data. AMedix opens the study through the documented route
                  /viewer?StudyInstanceUIDs={"{study_instance_uid}"} unless a custom route template is recorded. The
                  DICOMweb (QIDO) Base URL above is used to verify the study exists in your archive before the viewer is
                  opened; the department records the Study Instance UID on each imaging request.
                </p>
              )}
              {form.pacs_integration_type === "desktop_app" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Desktop software opens outside the browser. AMedix can only launch it automatically if the vendor
                  documents a launch URL or protocol (e.g. scheme://...) — record it below; otherwise radiologists open
                  the study manually with the accession number, and the department records the Study Instance UID on each request.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Vendor / Product Name</Label>
              <Input value={form.pacs_vendor_name} onChange={set("pacs_vendor_name")} placeholder="e.g. Vendor PACS Suite" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Viewer Launch URL Template</Label>
            <Input
              value={form.pacs_viewer_url_template}
              onChange={set("pacs_viewer_url_template")}
              placeholder="https://pacs.example.com/viewer?StudyUID={study_instance_uid}&Accession={accession_number}&token={launch_token}"
            />
            <p className="text-xs text-muted-foreground">
              Placeholders: {"{study_instance_uid}"} {"{accession_number}"} {"{request_id}"} {"{patient_cin}"} {"{launch_token}"} —
              the token is one-time and expires after 15 minutes. Substituted server-side only.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>DICOMweb (QIDO) Base URL — used to verify study availability</Label>
            <Input
              value={form.pacs_dicomweb_base_url}
              onChange={set("pacs_dicomweb_base_url")}
              placeholder="https://pacs.example.com/dicom-web"
            />
          </div>
          {form.pacs_integration_type === "ohif_embedded" && (
            <>
              <div className="space-y-1.5">
                <Label>OHIF Base URL (your approved deployment)</Label>
                <Input
                  value={form.ohif_base_url}
                  onChange={set("ohif_base_url")}
                  placeholder="https://ohif.your-hospital-domain"
                />
                <p className="text-xs text-muted-foreground">
                  https:// only — your own DEPLOYED instance, never the public OHIF demo. It may stay empty while
                  deployment is pending; the integration then stays "Pending configuration" and launching is disabled.
                  Only the verified Study Instance UID is placed in the study route — never patient name, CIN or credentials.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>OHIF Route Template (optional — documented route override)</Label>
                <Input
                  value={form.ohif_route_template}
                  onChange={set("ohif_route_template")}
                  placeholder="https://ohif.hospital.example/viewer?StudyInstanceUIDs={study_instance_uid}"
                />
                <p className="text-xs text-muted-foreground">
                  Record only the route your deployed OHIF version documents. Placeholders: {"{study_instance_uid}"} {"{accession_number}"}.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground flex-1 min-w-[16rem]">
                    The integration is marked <span className="font-semibold">Connected</span> only after this test: AMedix
                    reaches your deployed OHIF instance and retrieves a study from your facility archive through its
                    DICOMweb (QIDO) endpoint. Changing the Base URL or route template resets the status to Pending configuration.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={runConnectionTest} disabled={testing}>
                    {testing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
                    Run connection test
                  </Button>
                </div>
                {testResult && (
                  <p className={`text-xs rounded-md px-2.5 py-1.5 border ${
                    testResult.connection_status === "connected"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : testResult.connection_status === "verification_failed"
                        ? "text-red-700 bg-red-50 border-red-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Vendor Integration Notes</Label>
            <Input
              value={form.pacs_vendor_notes}
              onChange={set("pacs_vendor_notes")}
              placeholder="Vendor contact, agreed authentication method, confirmed launch capabilities"
            />
          </div>
        </div>
      )}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save
      </Button>
    </form>
  );
}