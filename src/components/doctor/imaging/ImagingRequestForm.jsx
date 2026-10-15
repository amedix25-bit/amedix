import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { X, Info } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import {
  IMAGING_TYPES,
  EXAMINATIONS,
  CONTRAST_OPTIONS,
  CONTRAST_APPLICABLE,
  CONTRAST_ALLERGY_OPTIONS,
  REACTION_OPTIONS,
  PRIORITY_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from "@/lib/imagingCatalog";

const EMPTY_FORM = {
  patient_cin: "",
  scan_type: "",
  examination: "",
  examination_other: "",
  clinical_indication: "",
  working_diagnosis: "",
  priority: "Routine",
  contrast: "",
  contrast_allergy: "",
  previous_contrast_reaction: "",
  mri_metal_implant: "",
  mri_pacemaker: "",
  mri_other_device: "",
  mri_metallic_foreign_body: "",
  mri_other_concern: "",
};

export default function ImagingRequestForm({ doctorProfile, initialCin, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, patient_cin: initialCin || "" });
  const [errors, setErrors] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const showContrast = CONTRAST_APPLICABLE.includes(form.scan_type);
  const contrastSelected = ["With contrast", "With and without contrast"].includes(form.contrast);
  const isMri = form.scan_type === "MRI";
  const examOptions = EXAMINATIONS[form.scan_type] || [];

  const handleTypeChange = (v) =>
    setForm((f) => ({
      ...f,
      scan_type: v,
      examination: "",
      examination_other: "",
      contrast: "",
      contrast_allergy: "",
      previous_contrast_reaction: "",
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];
    if (!form.patient_cin.trim()) errs.push("Patient CIN is required.");
    if (!form.scan_type) errs.push("Select the type of imaging.");
    if (!form.examination) errs.push("Select the examination / view.");
    else if (form.examination === "Other" && !form.examination_other.trim()) errs.push("Specify the examination / view.");
    if (!form.clinical_indication.trim()) errs.push("Clinical indication is required.");
    if (!form.working_diagnosis.trim()) errs.push("Working diagnosis / clinical question is required.");
    if (showContrast && contrastSelected) {
      if (!form.contrast_allergy) errs.push("Indicate the contrast allergy status.");
      if (!form.previous_contrast_reaction) errs.push("Indicate whether there was a previous contrast reaction.");
    }
    if (isMri && (!form.mri_metal_implant || !form.mri_pacemaker || !form.mri_other_device || !form.mri_metallic_foreign_body)) {
      errs.push("Complete all MRI safety questions before submitting.");
    }
    setErrors(errs);
    if (errs.length === 0) setConfirmOpen(true);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Request Imaging</h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-2">
        <Label>Patient CIN *</Label>
        <Input value={form.patient_cin} onChange={(e) => set("patient_cin")(e.target.value)} required />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type of Imaging *</Label>
          <Select value={form.scan_type} onValueChange={handleTypeChange}>
            <SelectTrigger><SelectValue placeholder="Select imaging type" /></SelectTrigger>
            <SelectContent>
              {IMAGING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Examination / View *</Label>
          <Select value={form.examination} onValueChange={set("examination")} disabled={!form.scan_type}>
            <SelectTrigger><SelectValue placeholder={form.scan_type ? "Select examination" : "Select imaging type first"} /></SelectTrigger>
            <SelectContent>
              {examOptions.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.examination === "Other" && (
        <div className="space-y-2">
          <Label>Specify Examination / View *</Label>
          <Input value={form.examination_other} onChange={(e) => set("examination_other")(e.target.value)} placeholder="Describe the examination / view" />
        </div>
      )}

      <div className="space-y-2">
        <Label>Clinical Indication *</Label>
        <Textarea value={form.clinical_indication} onChange={(e) => set("clinical_indication")(e.target.value)} rows={2} placeholder="Briefly explain why the imaging is requested — e.g. Sudden onset chest pain and shortness of breath." />
        <MedicalDictationButton
          value={form.clinical_indication}
          onChange={(v) => set("clinical_indication")(v)}
          specialty={doctorProfile?.specialization || ""}
          contextLabel="Imaging request — clinical indication"
        />
      </div>

      <div className="space-y-2">
        <Label>Working Diagnosis / Clinical Question *</Label>
        <Textarea value={form.working_diagnosis} onChange={(e) => set("working_diagnosis")(e.target.value)} rows={2} placeholder="Suspected diagnosis or what you want the radiologist to assess — e.g. Suspected pulmonary embolism — assess for evidence of PE." />
        <MedicalDictationButton
          value={form.working_diagnosis}
          onChange={(v) => set("working_diagnosis")(v)}
          specialty={doctorProfile?.specialization || ""}
          contextLabel="Imaging request — working diagnosis / clinical question"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority *</Label>
          <Select value={form.priority} onValueChange={set("priority")}>
            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showContrast && (
          <div className="space-y-2">
            <Label>Contrast</Label>
            <Select value={form.contrast} onValueChange={set("contrast")}>
              <SelectTrigger><SelectValue placeholder="Select contrast" /></SelectTrigger>
              <SelectContent>
                {CONTRAST_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {showContrast && contrastSelected && (
        <div className="grid sm:grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/50">
          <div className="space-y-2">
            <Label>Contrast Allergy *</Label>
            <Select value={form.contrast_allergy} onValueChange={set("contrast_allergy")}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CONTRAST_ALLERGY_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Previous Contrast Reaction *</Label>
            <Select value={form.previous_contrast_reaction} onValueChange={set("previous_contrast_reaction")}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {REACTION_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isMri && (
        <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/50">
          <p className="font-medium text-sm">MRI Safety Screening *</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Metal or metallic implant in the body? *</Label>
              <Select value={form.mri_metal_implant} onValueChange={set("mri_metal_implant")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YES_NO_UNKNOWN_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pacemaker or implanted cardiac device? *</Label>
              <Select value={form.mri_pacemaker} onValueChange={set("mri_pacemaker")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YES_NO_UNKNOWN_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Other implanted medical device? *</Label>
              <Select value={form.mri_other_device} onValueChange={set("mri_other_device")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YES_NO_UNKNOWN_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Possible metallic foreign body, especially in the eye? *</Label>
              <Select value={form.mri_metallic_foreign_body} onValueChange={set("mri_metallic_foreign_body")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YES_NO_UNKNOWN_OPTIONS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Other MRI safety concern</Label>
            <Textarea value={form.mri_other_concern} onChange={(e) => set("mri_other_concern")(e.target.value)} rows={2} placeholder="Describe any other MRI safety concern" />
            <MedicalDictationButton
              value={form.mri_other_concern}
              onChange={(v) => set("mri_other_concern")(v)}
              specialty={doctorProfile?.specialization || ""}
              contextLabel="MRI safety — other concern"
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Requesting doctor, specialty, hospital and the date/time of the request are attached automatically
          ({doctorProfile?.full_name}{doctorProfile?.specialization ? ` — ${doctorProfile.specialization}` : ""}).
        </span>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
          {errors.map((err) => (<p key={err}>{err}</p>))}
        </div>
      )}

      <Button type="submit">Create Request</Button>
    </form>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send this imaging request?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send this {form.scan_type} request for patient {form.patient_cin.toUpperCase()}?
            Check the details carefully — the request will be sent only once.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setConfirmOpen(false);
              onSubmit(form);
            }}
          >
            Yes, Send Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}