import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
    // An embedded OHIF deployment must be the facility's OWN https deployment —
    // never the public demo, which must not receive real patient information.
    if (form.pacs_integration_type === "ohif_embedded" && !/^https:\/\//i.test(ohifBase)) {
      toast({
        title: "Invalid OHIF Base URL",
        description: "The embedded OHIF deployment must be recorded as an https:// address (e.g. https://ohif.hospital.example). Never use the public OHIF demo for real patient data.",
        variant: "destructive",
      });
      return;
    }
    if (ohifRoute && !/^https:\/\//i.test(ohifRoute)) {
      toast({
        title: "Invalid OHIF route template",
        description: "The route template must be an https:// URL (e.g. https://ohif.hospital.example/viewer?StudyInstanceUIDs={study_instance_uid}).",
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

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Imaging System Connection (PACS)</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect AMedix to the hospital's EXISTING imaging software — radiologists open the authorized study in your
            system from the Imaging Viewer tab. Confirm the supported integration method with your imaging vendor first.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={form.pacs_integration_enabled}
            onChange={(e) => setForm((s) => ({ ...s, pacs_integration_enabled: e.target.checked }))}
          />
          Connected
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
                  placeholder="https://ohif.hospital.example"
                />
                <p className="text-xs text-muted-foreground">
                  https:// only. Substituted server-side; only the verified Study Instance UID is placed in the study
                  route — never patient name, CIN or credentials.
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