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
  });
  const [saving, setSaving] = useState(false);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await base44.entities.HospitalProfile.update(profile.id, {
        pacs_integration_enabled: !!form.pacs_integration_enabled,
        pacs_integration_type: form.pacs_integration_enabled ? form.pacs_integration_type : "none",
        pacs_vendor_name: form.pacs_vendor_name.trim(),
        pacs_viewer_url_template: form.pacs_viewer_url_template.trim(),
        pacs_dicomweb_base_url: form.pacs_dicomweb_base_url.trim(),
        pacs_vendor_notes: form.pacs_vendor_notes.trim(),
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
              </select>
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