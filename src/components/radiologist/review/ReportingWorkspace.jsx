import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Save, Send, AlertTriangle, Hand, Undo2, Users, FileSignature,
  CheckCircle2, ExternalLink, Eye, Sparkles, FileEdit, X, GitCommitHorizontal,
} from "lucide-react";
import { generateRadiologyReportPdf } from "@/lib/radiologyReportPdf";
import resolveRadiologyFile from "@/lib/radiologyFileUrl";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import ReportTemplatePicker from "@/components/radiologist/review/ReportTemplatePicker";
import ReportPreviewDialog from "@/components/radiologist/review/ReportPreviewDialog";
import CriticalCommunicationPanel from "@/components/radiologist/review/CriticalCommunicationPanel";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";

// Structured reporting (Phase 5) — examination-specific templates, persistent
// drafts, dictation, formatting assistance (always a reviewed suggestion),
// preview, and a controlled amendment workflow for finalized reports.
// A finalized report is never silently overwritten: corrections create a new,
// linked, signed version.
const SECTIONS = [
  ["indication", "Clinical Indication"],
  ["examination_performed", "Examination Performed"],
  ["technique", "Technique"],
  ["comparison", "Comparison"],
  ["findings", "Findings"],
  ["impressions", "Impression"],
  ["recommendations", "Recommendations"],
  ["critical_findings", "Critical Findings"],
];
const DICTATION_SECTIONS = new Set(["technique", "findings", "impressions", "recommendations"]);
const EMPTY = {
  indication: "", examination_performed: "", technique: "", comparison: "",
  findings: "", impressions: "", recommendations: "", critical_findings: "",
};

function mergeLegacyDraft(d = {}) {
  const next = { ...EMPTY };
  for (const [k] of SECTIONS) if (typeof d[k] === "string") next[k] = d[k];
  const legacy = ["measurements", "observations", "notes"]
    .map((k) => (typeof d[k] === "string" ? d[k].trim() : ""))
    .filter(Boolean);
  if (legacy.length) {
    next.findings = [next.findings, legacy.join("\n\n")].filter(Boolean).join("\n\n");
  }
  return next;
}

export default function ReportingWorkspace({ study, user, radiologistProfile, onChanged, reportVersions }) {
  const { toast } = useToast();
  const [sections, setSections] = useState(EMPTY);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [busy, setBusy] = useState("");
  const [showSecondOpinion, setShowSecondOpinion] = useState(false);
  const [secondOpinionNote, setSecondOpinionNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [amending, setAmending] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [suggestion, setSuggestion] = useState(null); // { section, text }
  const [savedJson, setSavedJson] = useState(JSON.stringify(EMPTY));

  const stage = study.stage;
  const assignedToMe = study.assigned_radiologist_user_id === user.id;
  const assignedOther = !!study.assigned_radiologist_user_id && !assignedToMe;
  const closed = ["final_report", "released", "cancelled"].includes(stage);
  // Open collaboration — assignment records who took the study, but any
  // logged-in radiologist of the department may also work on it.
  const assignedToAnyone = !!study.assigned_radiologist_user_id;
  const authorized = study.authorized_by_patient || assignedToAnyone;
  const claimable = !study.assigned_radiologist_user_id &&
    ["ready_for_reporting", "performed", "examination_completed"].includes(stage);
  const canStart = assignedToAnyone && ["ready_for_reporting", "performed", "examination_completed"].includes(stage);
  const editable = assignedToAnyone && ["ready_for_reporting", "performed", "examination_completed", "reporting_in_progress"].includes(stage);
  const canAmend = authorized && ["final_report", "released"].includes(stage);
  const latestVersion = (reportVersions && reportVersions.length) ? reportVersions[0] : null;

  useEffect(() => {
    let cancelled = false;
    setDraftLoaded(false);
    setHasDraft(false);
    (async () => {
      let loaded = null;
      try {
        const drafts = await base44.entities.ReportDraft.filter({
          request_id: study.id,
          radiologist_user_id: user.id,
        });
        if (!cancelled && drafts.length) {
          loaded = mergeLegacyDraft(drafts[0].sections || {});
          setHasDraft(true);
        }
      } catch (err) {
        console.error(err);
      }
      if (!cancelled && !loaded && !["final_report", "released", "cancelled"].includes(study.stage)) {
        // Prefill the factual fields from the request — never generated content.
        loaded = { ...EMPTY,
          indication: study.clinical_indication || "",
          examination_performed: `${study.scan_type} — ${study.examination}`,
        };
      }
      if (!cancelled && loaded) setSections(loaded);
      if (!cancelled) setDraftLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [study.id, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drafts survive interruptions (Phase 10) — autosave 4s after the last edit,
  // and a browser warning while unsaved changes remain.
  const dirty = draftLoaded && editable && JSON.stringify(sections) !== savedJson;
  useEffect(() => {
    if (!dirty || !editable) return;
    const timer = setTimeout(async () => {
      try {
        await base44.functions.invoke("radiologyReportDraft", { request_id: study.id, sections });
        setSavedJson(JSON.stringify(sections));
      } catch (err) {
        console.error(err);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [sections, dirty, editable]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const applyTemplate = (tpl) => {
    const hasText = Object.values(sections).some((v) => v.trim());
    if (hasText && !window.confirm("Replace the current draft with this template? Your current text will be discarded.")) {
      return;
    }
    setSections(mergeLegacyDraft({ ...EMPTY, ...(tpl.sections || {}) }));
    toast({ title: `Template applied: ${tpl.name}`, description: "Edit or omit any section as clinically appropriate." });
  };

  const savePersonalTemplate = async (name) => {
    const filled = {};
    for (const [k] of SECTIONS) if (sections[k].trim()) filled[k] = sections[k];
    await base44.entities.RadiologyReportTemplate.create({
      name,
      modality: study.scan_type || "Any",
      examination: study.examination || "",
      institution_approved: false,
      owner_radiologist_user_id: user.id,
      sections: filled,
      created_datetime: new Date().toISOString(),
    });
  };

  const run = async (key, fn, okTitle) => {
    setBusy(key);
    try {
      await fn();
      if (okTitle) toast({ title: okTitle });
      onChanged();
    } catch (err) {
      toast({ title: "Action failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const claim = () =>
    run("claim", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "claim_study" }),
      "Study claimed — it is now assigned to you");

  const startReporting = () =>
    run("start", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "start_reporting" }),
      "Reporting started");

  const saveDraft = () =>
    run("draft", async () => {
      await base44.functions.invoke("radiologyReportDraft", { request_id: study.id, sections });
      setSavedJson(JSON.stringify(sections));
      setHasDraft(true);
    }, "Draft saved");

  const reopenDraft = async () => {
    setBusy("reopen");
    try {
      const drafts = await base44.entities.ReportDraft.filter({ request_id: study.id, radiologist_user_id: user.id });
      if (drafts.length) {
        setSections(mergeLegacyDraft(drafts[0].sections || {}));
        toast({ title: "Draft reopened" });
      }
    } finally {
      setBusy("");
    }
  };

  const buildRows = () => SECTIONS.filter(([k]) => (sections[k] || "").trim()).map(([k, label]) => [label, sections[k]]);
  const missing = ["indication", "examination_performed", "technique", "comparison", "findings", "impressions", "recommendations"]
    .filter((k) => !(sections[k] || "").trim())
    .map(([k, label]) => {
      const row = SECTIONS.find(([key]) => key === k);
      return row ? row[1] : k;
    });

  const makePdf = async () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows = buildRows();
    const doc = generateRadiologyReportPdf({
      patientName: study.patient_name,
      patientCin: study.patient_cin,
      scanType: study.scan_type,
      examination: study.examination,
      requestRef: study.request_id,
      doctorName: study.doctor_name,
      radiologistName: radiologistProfile?.full_name,
      date: dateStr,
      sections: rows,
    });
    const pdfFile = new File(
      [doc.output("blob")],
      `RadiologyReport_${study.patient_cin}_${dateStr}.pdf`,
      { type: "application/pdf" }
    );
    const { file_uri: reportPdfUrl } = await base44.integrations.Core.UploadPrivateFile({ file: pdfFile });
    return { reportPdfUrl, reportText: rows.map(([h, t]) => `${h}:\n${t.trim()}`).join("\n\n") };
  };

  const finalize = () => {
    if (!(sections.findings || "").trim()) {
      toast({ title: "Findings are required before finalizing the report.", variant: "destructive" });
      return;
    }
    if (!(sections.impressions || "").trim()) {
      toast({ title: "Impression is required before finalizing the report.", variant: "destructive" });
      return;
    }
    // Consequential action — explicit confirmation (Phase 10).
    if (!window.confirm("Sign and finalize this report? A signed, immutable report version will be recorded, and the report becomes ready for release.")) {
      return;
    }
    run("finalize", async () => {
      const { reportPdfUrl, reportText } = await makePdf();
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "finalize_report",
        report: reportText,
        report_pdf_url: reportPdfUrl,
        sections,
      });
    }, "Report signed and finalized — awaiting release to the patient record");
  };

  const submitAmendment = () => {
    if (!(sections.findings || "").trim()) {
      toast({ title: "Findings are required in the amended report.", variant: "destructive" });
      return;
    }
    // Consequential action — explicit confirmation (Phase 10).
    if (!window.confirm("Sign this amendment? A new linked version will be recorded and the original signed report stays preserved.")) {
      return;
    }
    run("amend", async () => {
      if (!(sections.findings || "").trim()) throw new Error("Findings are required in the amended report.");
      const { reportPdfUrl, reportText } = await makePdf();
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "amend_report",
        report: reportText,
        report_pdf_url: reportPdfUrl,
        sections,
        amendment_reason: amendmentReason,
      });
      setAmending(false);
      setAmendmentReason("");
    }, "Amendment signed — a new report version was recorded");
  };

  const startAmendment = () => {
    const base = latestVersion && Object.keys(latestVersion.sections || {}).length
      ? mergeLegacyDraft(latestVersion.sections)
      : { ...EMPTY, findings: latestVersion ? latestVersion.report_text : "" };
    setSections(base);
    setAmending(true);
  };

  const requestSecondOpinion = () =>
    run("second", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "request_second_opinion",
        note: secondOpinionNote,
      }),
      "Second opinion requested — the department has been notified");

  const flagCritical = () =>
    run("critical", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "flag_critical" }),
      "Critical finding flagged — the doctor and patient were notified");

  const formatSection = (key) =>
    run(`assist-${key}`, async () => {
      const res = await base44.functions.invoke("radiologyReportAssist", {
        section: key,
        text: sections[key],
        examination: `${study.scan_type} — ${study.examination}`,
      });
      setSuggestion({ section: key, text: res.data.suggestion || "" });
    });

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setSections({ ...sections, [suggestion.section]: suggestion.text });
    setSuggestion(null);
  };

  const spinner = (key) => busy === key && <Loader2 className="w-4 h-4 mr-1 animate-spin" />;

  const statusChip = amending ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">Amending v{latestVersion?.version}</span>
  ) : closed && latestVersion ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
      {latestVersion.is_amendment ? "Amended" : "Finalized"} v{latestVersion.version}
    </span>
  ) : hasDraft ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Draft</span>
  ) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 xl:max-h-[calc(100vh-220px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Reporting Workspace</h3>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Autosaving draft…</span>
          )}
          {statusChip}
        </div>
      </div>

      {/* Closed / finalized — read-only unless amending */}
      {closed && !amending && (
        <div className="space-y-3">
          {stage === "cancelled" ? (
            <div className="rounded-lg bg-red-500/10 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">This study was cancelled.</p>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-500/10 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <p className="text-sm text-emerald-800">
                {stage === "released"
                  ? "The report was released to the patient record."
                  : "The report is finalized — awaiting release to the patient record by the department."}
              </p>
            </div>
          )}
          {latestVersion && (
            <p className="text-xs text-muted-foreground">
              Signed by {latestVersion.signed_by_name} · v{latestVersion.version} ·{" "}
              {latestVersion.signed_datetime ? new Date(latestVersion.signed_datetime).toLocaleString() : ""}
            </p>
          )}
          {(study.report || latestVersion?.report_text) && (
            <div className="space-y-2">
              <Label>Final Report{latestVersion?.is_amendment ? " (Amended)" : ""}</Label>
              <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap">
                {study.report || latestVersion.report_text}
              </div>
            </div>
          )}
          {(study.report_file_url || latestVersion?.report_pdf_url) && (
            <ResolvedFileButton
              requestId={study.id}
              fileRef={study.report_file_url || latestVersion.report_pdf_url}
              className="inline-flex items-center border border-input rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open Report PDF
            </ResolvedFileButton>
          )}
          {canAmend && (
            <Button variant="outline" size="sm" onClick={startAmendment}>
              <GitCommitHorizontal className="w-4 h-4 mr-1" /> Amend Report
            </Button>
          )}
          {latestVersion?.is_amendment && latestVersion.amendment_reason && (
            <p className="text-xs text-muted-foreground">Amendment reason: {latestVersion.amendment_reason}</p>
          )}
        </div>
      )}

      {/* Amendment editor */}
      {closed && amending && (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Amendment in progress — the original signed v{latestVersion?.version} report stays preserved. Submitting creates
            a new linked version.
          </div>
          <div className="space-y-1.5">
            <Label>Amendment Reason *</Label>
            <Textarea rows={2} value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="Document why the report is being corrected..." />
          </div>
          <AmendmentEditor
            sections={sections}
            setSections={setSections}
            busy={busy}
            study={study}
            user={user}
            onFormat={formatSection}
            suggestion={suggestion}
            onAcceptSuggestion={acceptSuggestion}
            onDismissSuggestion={() => setSuggestion(null)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={submitAmendment} disabled={!!busy || !amendmentReason.trim()}>
              {spinner("amend")} <FileSignature className="w-4 h-4 mr-1" /> Sign Amendment
            </Button>
            <Button variant="ghost" onClick={() => setAmending(false)} disabled={!!busy}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Assignment info — open collaboration, never a lock */}
      {assignedOther && !closed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
          <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Assigned to <span className="font-semibold">{study.assigned_radiologist_name}</span>
            {study.reporting_since ? ` — reporting since ${new Date(study.reporting_since).toLocaleString()}` : ""}.
            You can also open and report this study — every radiologist of the department may work on it.
          </p>
        </div>
      )}

      {/* Claimable pool */}
      {claimable && !assignedOther && !closed && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">This study is unassigned — claim it to start your interpretation.</p>
          <Button onClick={claim} disabled={!!busy}>
            {spinner("claim")} <Hand className="w-4 h-4 mr-1" /> Claim Study
          </Button>
        </div>
      )}

      {canStart && (
        <Button onClick={startReporting} disabled={!!busy} className="w-full">
          {spinner("start")} <FileSignature className="w-4 h-4 mr-1" /> Start Reporting
        </Button>
      )}

      {/* The editor */}
      {!closed && draftLoaded && (
        <div className={`space-y-3 ${editable ? "" : "pointer-events-none opacity-50"}`}>
          <ReportTemplatePicker
            study={study}
            user={user}
            onApply={applyTemplate}
            onSavePersonal={savePersonalTemplate}
            disabled={!editable}
          />
          {SECTIONS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}{key === "findings" || key === "impressions" ? " *" : ""}</Label>
              <Textarea
                rows={key === "findings" ? 5 : 3}
                value={sections[key]}
                onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
                placeholder={label}
              />
              {editable && DICTATION_SECTIONS.has(key) && (
                <MedicalDictationButton
                  value={sections[key]}
                  onChange={(text) => setSections({ ...sections, [key]: text })}
                  specialty="Radiology"
                  contextLabel={`radiology report — ${label}`}
                />
              )}
              {editable && (key === "findings" || key === "impressions") && sections[key].trim() && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => formatSection(key)} disabled={!!busy}>
                  {spinner(`assist-${key}`)} <Sparkles className="w-3.5 h-3.5 mr-1" /> Formatting assistance
                </Button>
              )}
              {suggestion && suggestion.section === key && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Suggested formatting — your text is NOT changed until you accept
                  </p>
                  <p className="text-xs whitespace-pre-wrap">{suggestion.text}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={acceptSuggestion}>Apply Suggestion</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSuggestion(null)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Keep Mine
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {missing.length > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Missing sections: {missing.join(", ")} — findings and impression
              are required to finalize.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {editable && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" onClick={saveDraft} disabled={!!busy}>
            {spinner("draft")} <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button variant="ghost" onClick={reopenDraft} disabled={!!busy} title="Reopen the last saved draft">
            {spinner("reopen")} <FileEdit className="w-4 h-4 mr-1" /> Reopen Draft
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!!busy}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button onClick={finalize} disabled={!!busy}>
            {spinner("finalize")} <Send className="w-4 h-4 mr-1" /> Sign &amp; Finalize
          </Button>
        </div>
      )}

      {/* Study-level actions */}
      {(assignedToMe || assignedOther || claimable) && !closed && !amending && (
        <div className="pt-2 border-t border-border space-y-2">
          {!study.is_critical && (
            <Button variant="destructive" size="sm" onClick={flagCritical} disabled={!!busy}>
              {spinner("critical")} <AlertTriangle className="w-4 h-4 mr-1" /> Flag Critical Finding
            </Button>
          )}
          {study.is_critical && (
            <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Flagged as critical — see the communication trail below.
            </p>
          )}
          {assignedToMe && !closed && (
            <Button variant="ghost" size="sm" onClick={() =>
              run("release", () =>
                base44.functions.invoke("radiologyUpdateWorkflowStatus", {
                  request_id: study.id,
                  action: "release_work",
                  reason: "Released back to the department pool",
                }), "Study released back to the department pool")
            } disabled={!!busy}>
              {spinner("release")} <Undo2 className="w-4 h-4 mr-1" /> Release to Department Pool
            </Button>
          )}
          {(assignedToMe || claimable) && !showSecondOpinion && (
            <Button variant="ghost" size="sm" onClick={() => setShowSecondOpinion(true)}>
              <Users className="w-4 h-4 mr-1" /> Request Second Opinion
            </Button>
          )}
          {showSecondOpinion && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Label>Why do you need a second opinion?</Label>
              <Textarea rows={2} value={secondOpinionNote} onChange={(e) => setSecondOpinionNote(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" disabled={!!busy || !secondOpinionNote.trim()} onClick={requestSecondOpinion}>
                  {spinner("second")} Send to Department
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSecondOpinion(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical findings communication trail (Phase 6) */}
      {study.is_critical && (
        <CriticalCommunicationPanel study={study} user={user} onChanged={onChanged} />
      )}

      <ReportPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sections={buildRows()}
        study={study}
        radiologistProfile={radiologistProfile}
        missing={missing}
      />
    </div>
  );
}

// Editor body reused by the amendment flow.
function AmendmentEditor({ sections, setSections, busy, study, user, onFormat, suggestion, onAcceptSuggestion, onDismissSuggestion }) {
  return (
    <div className="space-y-3">
      {SECTIONS.map(([key, label]) => (
        <div key={key} className="space-y-1.5">
          <Label>{label}</Label>
          <Textarea
            rows={key === "findings" ? 5 : 3}
            value={sections[key]}
            onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
          />
          {(key === "findings" || key === "impressions") && sections[key].trim() && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onFormat(key)} disabled={!!busy}>
              {busy === `assist-${key}` && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Formatting assistance
            </Button>
          )}
          {suggestion && suggestion.section === key && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-700">Suggested formatting — your text is NOT changed until you accept</p>
              <p className="text-xs whitespace-pre-wrap">{suggestion.text}</p>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={onAcceptSuggestion}>Apply Suggestion</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismissSuggestion}>Keep Mine</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}