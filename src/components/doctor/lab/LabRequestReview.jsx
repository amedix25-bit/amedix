import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entryById } from "@/lib/labTestCatalog";
import LabRequestSignature from "@/components/doctor/lab/LabRequestSignature";
import {
  ArrowLeft, AlertTriangle, Send, Loader2, ClipboardCheck, X,
} from "lucide-react";

// Priority meanings shown to the doctor — no option guarantees a turnaround time.
const PRIORITY_INFO = {
  Routine: "Added to the laboratory's standard processing order.",
  Urgent: "Flagged to the laboratory for priority attention.",
  Stat: "Highest urgency — collected and processed ahead of routine work.",
};

const UNSPECIFIED = "Specimen not specified in the catalog";

export default function LabRequestReview({
  patient, doctorProfile, form, priority, onPriorityChange,
  selectedIds, onRemoveTest, onBack, onSubmit, submitting, submitError,
  signature, onSignatureChange,
}) {
  const entries = useMemo(() => selectedIds.map(entryById), [selectedIds]);
  const known = entries.filter(Boolean);
  const unknown = entries.filter((e) => !e);

  // Group tests by specimen type from the catalog — tests without a specimen
  // in the catalog stay in their own "unspecified" group rather than being
  // assumed to share one.
  const specimenGroups = useMemo(() => {
    const map = new Map();
    known.forEach((e) => {
      const key = e.specimen || UNSPECIFIED;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return [...map.entries()];
  }, [known]);

  const errors = [];
  if (!patient) errors.push("Patient identity could not be resolved — go back and re-enter the CIN.");
  if (known.length === 0) errors.push("At least one test must be selected.");
  if (!form.indication.trim()) errors.push("A clinical indication is required.");
  if (unknown.length > 0) errors.push("Remove the retired/unavailable tests flagged below before submitting.");
  if (!signature?.signed) errors.push("Your professional signature must be applied before this request can be issued.");

  const canSubmit = errors.length === 0 && !submitting;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Review Lab Request
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nothing is submitted until you press "Submit Lab Request". Your selections are preserved if you go back.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to editing
        </Button>
      </div>

      {unknown.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {unknown.length} selected test{unknown.length > 1 ? "s" : ""} no longer in the catalog
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            These tests cannot be ordered. Remove them here, then edit the favorite or panel that contains them.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {unknown.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-card border border-destructive/40 px-2.5 py-1 text-xs text-destructive">
                {id}
                <button type="button" onClick={() => onRemoveTest(id)} className="hover:text-destructive/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      {/* Patient identity and ordering physician */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
          <p className="font-semibold mt-1">{patient ? patient.full_name : "Not resolved"}</p>
          {patient && (
            <>
              <p className="text-sm mt-0.5">CIN: <span className="font-medium">{patient.cin}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[patient.date_of_birth && `DOB: ${patient.date_of_birth}`, patient.gender && `Gender: ${patient.gender}`, patient.blood_type && `Blood type: ${patient.blood_type}`].filter(Boolean).join(" · ")}
              </p>
            </>
          )}
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ordering physician</p>
          <p className="font-semibold mt-1">{doctorProfile?.full_name || "-"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[doctorProfile?.specialization, doctorProfile?.hospital].filter(Boolean).join(" · ") || "-"}
          </p>
          {doctorProfile?.license_number && (
            <p className="text-xs text-muted-foreground mt-0.5">License: {doctorProfile.license_number}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Destination laboratory: <span className="font-medium text-foreground">{form.lab_name || "-"}</span></p>
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Order priority *</p>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Routine">Routine</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
            <SelectItem value="Stat">Stat</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {PRIORITY_INFO[priority] || PRIORITY_INFO.Routine} Priority is a flag for the laboratory — it does not guarantee a turnaround time.
        </p>
      </div>

      {/* Selected tests, grouped by specimen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold">Selected tests ({known.length})</p>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onBack}>
            Add or remove tests — back to editing
          </Button>
        </div>
        {specimenGroups.map(([specimen, group]) => (
          <div key={specimen} className="rounded-lg border border-border p-3">
            <p className={`text-xs font-semibold uppercase tracking-wide ${specimen === UNSPECIFIED ? "text-muted-foreground" : "text-foreground"}`}>
              Specimen: {specimen}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
              {specimen === UNSPECIFIED
                ? "The catalog does not specify a specimen for these tests — the laboratory's standard collection procedure applies."
                : "No special collection instructions are recorded in the catalog — the laboratory's standard procedure for this specimen applies."}
            </p>
            <div className="space-y-1">
              {group.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-sm rounded border border-border px-2.5 py-1.5">
                  <span className="min-w-0 truncate">
                    {e.name}
                    {e.abbrev && e.abbrev.toLowerCase() !== e.name.toLowerCase() && (
                      <span className="ml-2 text-[10px] text-muted-foreground">({e.abbrev})</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{e.category}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveTest(e.id)}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                      title="Remove test"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clinical information as entered — never rewritten */}
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinical indication *</p>
          <p className="whitespace-pre-wrap mt-1">{form.indication || <span className="text-muted-foreground italic">Not provided</span>}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relevant clinical information</p>
          <p className="whitespace-pre-wrap mt-1">{form.clinical_info || <span className="text-muted-foreground italic">None recorded</span>}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laboratory instructions</p>
          <p className="whitespace-pre-wrap mt-1">{form.instructions || <span className="text-muted-foreground italic">None recorded</span>}</p>
        </div>
      </div>

      <LabRequestSignature doctorProfile={doctorProfile} value={signature} onChange={onSignatureChange} />

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1">
          {errors.map((err) => (
            <p key={err} className="text-sm text-destructive flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {err}
            </p>
          ))}
        </div>
      )}

      <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onSubmit} disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting request...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Lab Request
          </>
        )}
      </Button>
    </div>
  );
}