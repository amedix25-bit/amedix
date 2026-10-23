import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ShieldCheck, FlaskConical, CheckCircle2, XCircle, HelpCircle,
  ClipboardCheck, ChevronDown, ChevronUp, RefreshCw, Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Hospital Portal — Radiology Department tab. Imaging System Connection (PACS):
// connects AMedix to the facility's EXISTING imaging software. The
// configuration is PER-FACILITY (each facility's own record, no global PACS
// URL), saved and tested ONLY through the server-authorized bridge so no
// vendor credential ever reaches the browser, and clearly distinguishes
// DEVELOPMENT MODE (no hospital PACS connected — simulated responses) from a
// verified real integration.

const ONBOARDING_STEPS = [
  { key: "vendor_name", label: "Obtain the vendor / product name of the facility's imaging system" },
  { key: "methods", label: "Confirm with the vendor which integration methods it supports (DICOMweb, web viewer, desktop launch, embedded OHIF)" },
  { key: "endpoints", label: "Obtain the approved endpoints (OHIF Base URL, DICOMweb QIDO Base URL) and launch URL template, as documented by the vendor" },
  { key: "auth", label: "Obtain the approved authentication method and its service credential — add the credential as a server-side secret and record only the secret's name here" },
  { key: "ohif_deploy", label: "Deploy or approve the facility's own OHIF instance, if embedding is planned (never the public demo)" },
  { key: "configure", label: "Configure the secure integration on this page and save — the configuration version increments and any prior verification is invalidated" },
  { key: "test", label: "Run the connection test using the facility's synthetic or approved test studies, and confirm each required check passes" },
  { key: "acceptance", label: "Verify patient and facility matching and permissions, and complete acceptance testing with the imaging team before production use" },
];

const STATUS_META = {
  development_mode: { label: "Development mode — no hospital PACS connected", cls: "bg-amber-500/10 text-amber-700" },
  disabled: { label: "Disabled", cls: "bg-muted text-muted-foreground" },
  pending_configuration: { label: "Pending configuration", cls: "bg-amber-500/10 text-amber-700" },
  connected: { label: "Connected", cls: "bg-emerald-500/10 text-emerald-700" },
  failed: { label: "Failed", cls: "bg-red-500/10 text-red-700" },
};

function deriveStatus(p) {
  if (!p.pacs_integration_enabled) {
    const configured = (String(p.pacs_integration_type || "none") !== "none") || String(p.pacs_vendor_name || "").trim();
    return configured ? "disabled" : "development_mode";
  }
  const type = String(p.pacs_integration_type || "none");
  if (type === "ohif_embedded") {
    const s = String(p.ohif_connection_status || "pending_configuration");
    return s === "connected" ? "connected" : s === "verification_failed" ? "failed" : "pending_configuration";
  }
  const outcome = String((p.pacs_last_test_result || {}).outcome || "");
  return outcome === "connected" ? "connected" : outcome === "failed" ? "failed" : "pending_configuration";
}

function CheckRow({ check }) {
  const isPassed = check.outcome === "passed";
  const isFailed = check.outcome === "failed";
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0">
        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          : isFailed ? <XCircle className="w-3.5 h-3.5 text-red-600" />
          : <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />}
      </span>
      <p>
        <span className="font-medium">{check.label}:</span>{" "}
        <span className={`font-semibold ${isPassed ? "text-emerald-700" : isFailed ? "text-red-700" : "text-muted-foreground"}`}>
          {isPassed ? "Passed" : isFailed ? "Failed" : "Not tested"}
        </span>
        {check.message ? <span className="text-muted-foreground"> — {check.message}</span> : null}
      </p>
    </div>
  );
}

export default function HospitalPacsSection({ profile, onUpdate }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    pacs_integration_enabled: !!profile.pacs_integration_enabled,
    pacs_integration_type: profile.pacs_integration_type === "none" ? "dicomweb" : (profile.pacs_integration_type || "dicomweb"),
    pacs_vendor_name: profile.pacs_vendor_name || "",
    pacs_viewer_url_template: profile.pacs_viewer_url_template || "",
    pacs_dicomweb_base_url: profile.pacs_dicomweb_base_url || "",
    pacs_vendor_notes: profile.pacs_vendor_notes || "",
    ohif_base_url: profile.ohif_base_url || "",
    ohif_route_template: profile.ohif_route_template || "",
    pacs_dicomweb_auth_type: profile.pacs_dicomweb_auth_type || "none",
    pacs_dicomweb_auth_secret_name: profile.pacs_dicomweb_auth_secret_name || "",
    test_study_uid: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(!profile.pacs_onboarding_completed || profile.pacs_onboarding_completed.length === 0);
  const [completedSteps, setCompletedSteps] = useState(profile.pacs_onboarding_completed || []);

  const status = deriveStatus(form);
  const statusMeta = STATUS_META[status] || STATUS_META.pending_configuration;
  const configVersion = Number(profile.pacs_config_version) || 1;
  const lastTest = profile.pacs_last_test_result || null;

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const toggleStep = async (key) => {
    const next = completedSteps.includes(key)
      ? completedSteps.filter((k) => k !== key)
      : [...completedSteps, key];
    setCompletedSteps(next);
    try {
      const updated = await base44.entities.HospitalProfile.update(profile.id, { pacs_onboarding_completed: next });
      if (onUpdate) onUpdate(updated);
    } catch {
      setCompletedSteps(completedSteps);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // The save runs through the server-authorized bridge: per-method
      // validation, placeholder policy and verification invalidation are all
      // enforced server-side — the browser never carries vendor credentials.
      const { test_study_uid, ...config } = form;
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "save_config",
        hospital_profile_id: profile.id,
        config,
      });
      const data = res.data || {};
      if (onUpdate && data.profile) onUpdate(data.profile);
      toast({
        title: "Imaging system connection saved",
        description: data.verification_invalidated
          ? `Configuration version ${data.config_version}. Any previous verification was invalidated — run the connection test to restore the Connected state.`
          : undefined,
      });
    } catch (err) {
      toast({ title: "Could not save the connection", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Connection test — server-side. In development mode it returns a clearly
  // flagged SIMULATED response; with a real configuration it performs the
  // real end-to-end checks and is the ONLY path to Connected.
  const runConnectionTest = async (withTestStudy) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "connection_test",
        hospital_profile_id: profile.id,
        ...(withTestStudy && form.test_study_uid.trim() ? { test_study_uid: form.test_study_uid.trim() } : {}),
      });
      const data = res.data || {};
      setTestResult(data);
      if (onUpdate) {
        onUpdate({
          ...profile,
          ohif_connection_status: data.connection_status === "connected"
            ? "connected"
            : data.connection_status === "failed"
              ? "verification_failed"
              : "pending_configuration",
          ohif_connection_tested_datetime: data.tested_datetime || profile.ohif_connection_tested_datetime,
          pacs_last_test_result: data.simulated
            ? { tested_datetime: new Date().toISOString(), outcome: "simulated", simulated: true, checks: data.checks, message: data.message }
            : { tested_datetime: data.tested_datetime, outcome: data.connection_status, simulated: false, checks: data.checks, message: data.message },
        });
      }
    } catch (err) {
      const data = (err.response && err.response.data) || {};
      setTestResult({ simulated: false, connection_status: data.connection_status || "failed", message: data.error || data.message || err.message });
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
            Per-facility configuration for <span className="font-semibold">{profile.hospital_name}</span> — connect
            AMedix to this hospital's EXISTING imaging software. Confirm the supported integration method with your
            imaging vendor first. Configuration version: <span className="font-medium">v{configVersion}</span>
            {lastTest && !lastTest.simulated && (
              <> · Last real test: {lastTest.outcome === "connected" ? "passed" : lastTest.outcome === "failed" ? "failed" : "incomplete"}
                {lastTest.tested_datetime ? ` (${new Date(lastTest.tested_datetime).toLocaleString()})` : ""}</>
            )}
          </p>
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

      {/* Development mode banner — while no hospital PACS is connected */}
      {status === "development_mode" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <FlaskConical className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800">
            Development mode — no hospital PACS connected.
            <span className="font-normal block mt-0.5">
              No real imaging system is configured for this facility. Connection tests return clearly-flagged
              SIMULATED responses and radiology workflows can be tested with synthetic studies — nothing is ever
              marked Connected, and no result implies a verified hospital integration.
            </span>
          </p>
        </div>
      )}

      {/* Overall status pill */}
      {status !== "development_mode" && (
        <p className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.cls}`}>
          {statusMeta.label}
          {status === "connected" && lastTest && !lastTest.simulated && lastTest.tested_datetime
            ? ` — verified ${new Date(lastTest.tested_datetime).toLocaleString()}`
            : ""}
        </p>
      )}

      {/* Onboarding checklist */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 text-left"
          onClick={() => setShowOnboarding((v) => !v)}
        >
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Hospital integration onboarding checklist
            <span className="text-xs font-normal text-muted-foreground">
              ({completedSteps.length}/{ONBOARDING_STEPS.length} complete)
            </span>
          </span>
          {showOnboarding ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showOnboarding && (
          <div className="mt-2 space-y-1.5">
            {ONBOARDING_STEPS.map((step) => {
              const done = completedSteps.includes(step.key);
              return (
                <label key={step.key} className="flex items-start gap-2 text-xs cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={done} onChange={() => toggleStep(step.key)} />
                  <span className={done ? "text-muted-foreground line-through" : ""}>{step.label}</span>
                </label>
              );
            })}
          </div>
        )}
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
                  DICOMweb (QIDO) Base URL is used to verify the study exists in your archive before the viewer is
                  opened; the department records the Study Instance UID on each imaging request.
                </p>
              )}
              {form.pacs_integration_type === "desktop_app" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Desktop software opens outside the browser and needs no OHIF configuration. AMedix can launch it
                  automatically only if the vendor documents a launch URL or protocol (e.g. scheme://...) — record it
                  below; otherwise radiologists open the study manually with the accession number, and the department
                  records the Study Instance UID on each request.
                </p>
              )}
              {form.pacs_integration_type === "web_viewer" && (
                <p className="text-xs text-muted-foreground mt-1">
                  The vendor's browser viewer is opened through its documented launch URL. AMedix substitutes the study
                  identifiers server-side — patient identifiers are never placed in viewer URLs.
                </p>
              )}
              {form.pacs_integration_type === "dicomweb" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Studies are verified against the facility's DICOMweb (QIDO) endpoint server-side, with the
                  facility-approved authentication method. The DICOMweb Base URL is required for this method.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Vendor / Product Name</Label>
              <Input value={form.pacs_vendor_name} onChange={set("pacs_vendor_name")} placeholder="e.g. Vendor PACS Suite" />
            </div>
          </div>
          {(form.pacs_integration_type === "web_viewer" || form.pacs_integration_type === "desktop_app") && (
            <div className="space-y-1.5">
              <Label>Viewer Launch URL Template{form.pacs_integration_type === "desktop_app" ? " (optional)" : ""}</Label>
              <Input
                value={form.pacs_viewer_url_template}
                onChange={set("pacs_viewer_url_template")}
                placeholder="https://pacs.example.com/viewer?StudyUID={study_instance_uid}&Accession={accession_number}&token={launch_token}"
              />
              <p className="text-xs text-muted-foreground">
                Placeholders: {"{study_instance_uid}"} {"{accession_number}"} {"{request_id}"} {"{launch_token}"} —
                the token is one-time and expires after 15 minutes. Substituted server-side only. Patient identifiers
                ({"{patient_cin}"}, names) are not permitted in viewer URLs.
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>DICOMweb (QIDO) Base URL — used to verify study availability</Label>
            <Input
              value={form.pacs_dicomweb_base_url}
              onChange={set("pacs_dicomweb_base_url")}
              placeholder="https://pacs.example.com/dicom-web"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>DICOMweb Authentication</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.pacs_dicomweb_auth_type}
                onChange={set("pacs_dicomweb_auth_type")}
              >
                <option value="none">None (test environments only)</option>
                <option value="bearer">Bearer token (vendor-approved)</option>
                <option value="basic">Basic (user:password)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Use the authentication method the vendor approved. The credential VALUE is never stored here or sent
                to the browser — QIDO verification always runs server-side.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Server-side Secret Name{form.pacs_dicomweb_auth_type === "none" ? " (not used)" : ""}</Label>
              <Input
                value={form.pacs_dicomweb_auth_secret_name}
                onChange={set("pacs_dicomweb_auth_secret_name")}
                disabled={form.pacs_dicomweb_auth_type === "none"}
                placeholder="e.g. PACS_VENDOR_TOKEN"
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                Record only the NAME of the secret holding the credential — add the value in the dashboard Secrets page.
              </p>
            </div>
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
          <div className="space-y-1.5">
            <Label>Test Study Instance UID (optional — for the identifier-match check)</Label>
            <Input
              value={form.test_study_uid}
              onChange={set("test_study_uid")}
              placeholder="UID of a synthetic or approved test study in the facility archive"
            />
            <p className="text-xs text-muted-foreground">
              When provided, the test confirms the archive returns EXACTLY this study — patient and facility matching
              is verified, never assumed from a UID alone.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => runConnectionTest(false)}
          disabled={testing || saving}
        >
          {testing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
          Run connection test
        </Button>
        {form.pacs_integration_enabled && form.test_study_uid.trim() && (
          <Button
            type="button"
            variant="outline"
            onClick={() => runConnectionTest(true)}
            disabled={testing || saving}
          >
            Test with test study UID
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Saving any endpoint, route, authentication, enable-state or integration-type change invalidates the previous
        verification — the integration returns to Pending configuration until the end-to-end test passes again.
      </p>

      {/* Test result — every check reported separately */}
      {testResult && (
        <div className={`rounded-lg border p-3 space-y-2 ${
          testResult.simulated
            ? "border-amber-200 bg-amber-50"
            : testResult.connection_status === "connected"
              ? "border-emerald-200 bg-emerald-50"
              : testResult.connection_status === "failed"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
        }`}>
          {testResult.simulated && (
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Simulated — development mode
            </p>
          )}
          <p className={`text-xs ${testResult.simulated ? "text-amber-800" : testResult.connection_status === "connected" ? "text-emerald-700" : testResult.connection_status === "failed" ? "text-red-700" : "text-amber-700"}`}>
            {testResult.message}
          </p>
          {(testResult.checks || []).map((c, i) => (
            <CheckRow key={i} check={c} />
          ))}
        </div>
      )}
    </form>
  );
}