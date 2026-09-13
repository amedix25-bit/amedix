import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Stethoscope, X, AlertTriangle } from "lucide-react";
import {
  EXAMINATION_TYPES,
  getExaminationType,
  computeSectionStatus,
  computeOverallStatus,
  generateReference,
  CLINICAL_LOCATIONS,
} from "@/lib/examinations";
import ExaminationSectionCard from "./ExaminationSectionCard";

const initData = (type) =>
  Object.fromEntries(type.sections.map((s) => [s.key, { status: "", values: {}, notes: "" }]));

const draftKeyFor = (patientId, typeKey) => `amedix_exam_draft_${patientId}_${typeKey}`;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nowTimeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Dynamic Examination Builder. Step 1: pick an examination type. Step 2: only
// the sections configured for that type render. Saving creates a NEW dated
// PatientExamination record (never overwrites); amending an existing record
// creates the next version and preserves the original.
export default function ExaminationBuilderDialog({
  open,
  onOpenChange,
  patient,
  doctorProfile,
  user,
  editOf,
  onSaved,
}) {
  const { toast } = useToast();
  const [typeKey, setTypeKey] = useState(null);
  const [data, setData] = useState({});
  const [location, setLocation] = useState("Clinic");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTimeStr());
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingAction, setPendingAction] = useState("close");

  // Initialize each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editOf) {
      const cfg = getExaminationType(editOf.examination_type_key);
      const byKey = {};
      (editOf.sections || []).forEach((s) => {
        byKey[s.key] = {
          status: s.status === "normal" || s.status === "abnormal" ? s.status : "",
          values: s.values || {},
          notes: s.notes || "",
        };
      });
      if (cfg) cfg.sections.forEach((s) => { if (!byKey[s.key]) byKey[s.key] = { status: "", values: {}, notes: "" }; });
      setTypeKey(editOf.examination_type_key);
      setData(byKey);
      setLocation(editOf.clinical_location || "Clinic");
      setDate(editOf.examination_date || todayStr());
      setTime(editOf.examination_time || nowTimeStr());
      setAdditionalNotes(editOf.additional_notes || "");
    } else {
      setTypeKey(null);
      setData({});
      setLocation("Clinic");
      setDate(todayStr());
      setTime(nowTimeStr());
      setAdditionalNotes("");
    }
    setEditReason("");
    setDirty(false);
  }, [open, editOf]);

  const type = typeKey ? getExaminationType(typeKey) : null;

  const selectType = (key) => {
    const cfg = getExaminationType(key);
    let initialData = initData(cfg);
    let meta = { location: "Clinic", date: todayStr(), time: nowTimeStr(), additionalNotes: "" };
    let restored = false;
    try {
      const raw = localStorage.getItem(draftKeyFor(patient.id, key));
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.data) initialData = { ...initialData, ...draft.data };
        meta = {
          location: draft.location || "Clinic",
          date: draft.date || todayStr(),
          time: draft.time || nowTimeStr(),
          additionalNotes: draft.additionalNotes || "",
        };
        restored = true;
      }
    } catch (e) {
      /* corrupt draft — start fresh */
    }
    setTypeKey(key);
    setData(initialData);
    setLocation(meta.location);
    setDate(meta.date);
    setTime(meta.time);
    setAdditionalNotes(meta.additionalNotes);
    setDirty(restored);
  };

  // Autosave draft (fresh examinations only — amendments are not drafted).
  useEffect(() => {
    if (!open || !typeKey || editOf) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKeyFor(patient.id, typeKey),
          JSON.stringify({ data, location, date, time, additionalNotes })
        );
      } catch (e) {
        /* storage unavailable — ignore */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [open, typeKey, data, location, date, time, additionalNotes, editOf, patient.id]);

  const setSectionData = (key, d) => {
    setData((prev) => ({ ...prev, [key]: d }));
    setDirty(true);
  };

  const requestClose = () => {
    if (dirty) {
      setPendingAction("close");
      setConfirmDiscard(true);
    } else {
      onOpenChange(false);
    }
  };

  const changeType = () => {
    if (dirty) {
      setPendingAction("changeType");
      setConfirmDiscard(true);
    } else {
      setTypeKey(null);
    }
  };

  const summary = useMemo(() => {
    if (!type) return null;
    const statuses = type.sections.map((s) => computeSectionStatus(s, data[s.key]));
    return {
      normal: statuses.filter((s) => s === "normal").length,
      abnormal: statuses.filter((s) => s === "abnormal").length,
      partial: statuses.filter((s) => s === "partially_completed").length,
      notDocumented: statuses.filter((s) => s === "not_documented").length,
    };
  }, [type, data]);

  const save = async () => {
    if (!type || !patient) return;
    if (editOf && !editReason.trim()) {
      toast({
        title: "Amendment reason required",
        description: "Enter the reason for correcting this examination.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const sectionsPayload = type.sections.map((s) => {
        const d = data[s.key] || { status: "", values: {}, notes: "" };
        return {
          key: s.key,
          title: s.title,
          mode: s.mode,
          status: computeSectionStatus(s, d),
          values: d.values || {},
          notes: d.notes || "",
        };
      });
      const now = new Date();
      const record = {
        examination_id: editOf ? editOf.examination_id : generateReference("EX"),
        patient_id: patient.id,
        patient_user_id: patient.user_id || "",
        patient_name: patient.full_name || "",
        patient_cin: patient.cin || "",
        encounter_id: editOf ? editOf.encounter_id || generateReference("ENC") : generateReference("ENC"),
        examination_type_key: type.key,
        examination_type: type.label,
        sections: sectionsPayload,
        normal_sections: sectionsPayload.filter((s) => s.status === "normal").map((s) => s.key),
        abnormal_sections: sectionsPayload.filter((s) => s.status === "abnormal").map((s) => s.key),
        overall_status: computeOverallStatus(type, data),
        doctor_id: doctorProfile?.id || "",
        doctor_user_id: user?.id || "",
        doctor_name: doctorProfile?.full_name || "",
        clinical_location: location,
        examination_date: date,
        examination_time: time,
        additional_notes: additionalNotes || "",
        created_datetime: now.toISOString(),
        version: editOf ? (editOf.version || 1) + 1 : 1,
        previous_version_id: editOf ? editOf.id : "",
        edit_reason: editOf ? editReason.trim() : "",
        edited_by_name: editOf ? doctorProfile?.full_name || "" : "",
        edited_datetime: editOf ? now.toISOString() : "",
        audit_trail: editOf
          ? [
              ...(editOf.audit_trail || []),
              {
                action: "amended",
                by_name: doctorProfile?.full_name || "",
                by_role: "doctor",
                datetime: now.toISOString(),
                details: `Corrected version ${editOf.version || 1} — reason: ${editReason.trim()}`,
              },
            ]
          : [
              {
                action: "created",
                by_name: doctorProfile?.full_name || "",
                by_role: "doctor",
                datetime: now.toISOString(),
                details: `${type.label} documented`,
              },
            ],
      };
      await base44.entities.PatientExamination.create(record);
      if (!editOf) localStorage.removeItem(draftKeyFor(patient.id, typeKey));
      toast({
        title: editOf ? "Examination amended" : "Examination saved",
        description: `${type.label} — ${record.examination_id}${editOf ? ` (version ${record.version})` : ""}`,
      });
      setDirty(false);
      if (onSaved) onSaved(record);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not save examination",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) requestClose(); }}>
        {!type ? (
          <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                New Clinical Examination
              </DialogTitle>
              <DialogDescription>
                {patient?.full_name} · CIN {patient?.cin} — select an examination type
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXAMINATION_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectType(t.key)}
                  className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-accent/40 transition-colors"
                >
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">{t.sections.length} sections</p>
                </button>
              ))}
            </div>
          </DialogContent>
        ) : (
          <DialogContent className="sm:max-w-4xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-border text-left space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <DialogTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    {editOf ? `Amend: ${type.label}` : type.label}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {patient?.full_name} · CIN {patient?.cin}
                    {editOf ? ` · ${editOf.examination_id} (version ${editOf.version || 1})` : ""}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={requestClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col gap-1 min-w-32">
                  <Label className="text-[11px]">Location</Label>
                  <Select value={location} onValueChange={(v) => { setLocation(v); setDirty(true); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLINICAL_LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-32">
                  <Label className="text-[11px]">Date</Label>
                  <Input type="date" className="h-8 text-xs" value={date} onChange={(e) => { setDate(e.target.value); setDirty(true); }} />
                </div>
                <div className="flex flex-col gap-1 min-w-24">
                  <Label className="text-[11px]">Time</Label>
                  <Input type="time" className="h-8 text-xs" value={time} onChange={(e) => { setTime(e.target.value); setDirty(true); }} />
                </div>
              </div>
              {editOf && (
                <div>
                  <Label className="text-[11px]">Reason for amendment (required)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="Why is this examination being corrected?"
                    value={editReason}
                    onChange={(e) => { setEditReason(e.target.value); setDirty(true); }}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    The original version {editOf.version || 1} is preserved. Saving creates version{" "}
                    {(editOf.version || 1) + 1}.
                  </p>
                </div>
              )}
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-secondary/30">
              {type.sections.map((s, i) => (
                <ExaminationSectionCard
                  key={s.key}
                  spec={s}
                  data={data[s.key]}
                  onChange={(d) => setSectionData(s.key, d)}
                  defaultOpen={i === 0}
                />
              ))}
              <div className="rounded-xl border border-border bg-card p-4">
                <Label className="text-xs">Additional Notes</Label>
                <Textarea
                  className="text-xs mt-1.5 min-h-16"
                  placeholder="Examination-level additional notes…"
                  value={additionalNotes}
                  onChange={(e) => { setAdditionalNotes(e.target.value); setDirty(true); }}
                />
              </div>
            </div>

            <div className="border-t border-border bg-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {summary && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {summary.normal} normal
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {summary.abnormal} abnormal
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {summary.partial} partial
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                      {summary.notDocumented} not documented
                    </span>
                  </>
                )}
                {dirty && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <AlertTriangle className="w-3 h-3" /> Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={changeType}>
                  {!editOf ? "Change Type" : "Close"}
                </Button>
                <Button onClick={save} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editOf ? "Save Amended Version" : "Save Examination"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              This examination has changes that have not been saved.
              {editOf
                ? " If you continue, your edits to this amendment will be lost."
                : " A draft is kept so you can finish documenting later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false);
                if (pendingAction === "changeType") setTypeKey(null);
                else onOpenChange(false);
              }}
            >
              {editOf ? "Discard changes" : "Continue without saving"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}