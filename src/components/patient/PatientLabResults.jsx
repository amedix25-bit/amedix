import React, { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, FileText, Loader2, Plus, Upload, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

const TEST_TYPES = [
  "Complete Blood Count (CBC)",
  "Blood Glucose",
  "HbA1c",
  "Lipid Panel",
  "Liver Function Tests",
  "Kidney Function Tests",
  "Thyroid Function Tests",
  "Urinalysis",
  "Vitamin D",
  "Iron Studies",
  "Coagulation Profile",
  "Other",
];

const EMPTY = { test_type: "", custom_type: "", test_date: "", lab_name: "" };

export default function PatientLabResults({ patient }) {
  const { t, locale } = usePatientLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.PatientLabResult.filter({ patient_id: patient.id }, "-test_date");
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.test_type) {
      setError(t("Select the test type."));
      return;
    }
    if (form.test_type === "Other" && !form.custom_type.trim()) {
      setError(t("Enter the test type."));
      return;
    }
    if (!file) {
      setError(t("Upload your laboratory report (PDF or image)."));
      return;
    }
    setSubmitting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const testType = form.test_type === "Other" ? form.custom_type.trim() : form.test_type;
      await base44.entities.PatientLabResult.create({
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        test_type: testType,
        test_date: form.test_date,
        lab_name: form.lab_name,
        file_url,
        file_name: file.name,
        submitted_date: new Date().toISOString(),
        submitted_by_name: patient.full_name,
      });
      setForm(EMPTY);
      setFile(null);
      setShowForm(false);
      setSuccessMsg(t("Your laboratory result was submitted and is now part of your medical record."));
      load();
    } catch (err) {
      console.error(err);
      setError(t("Could not submit the result. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("Add Lab Result")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{t("Submit Laboratory Result")}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Test Type *")}</Label>
              <Select value={form.test_type} onValueChange={(v) => setForm({ ...form, test_type: v })}>
                <SelectTrigger><SelectValue placeholder={t("Select test type")} /></SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{t(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.test_type === "Other" && (
              <div className="space-y-2">
                <Label>{t("Test Type (specify) *")}</Label>
                <Input
                  value={form.custom_type}
                  onChange={(e) => setForm({ ...form, custom_type: e.target.value })}
                  placeholder={t("e.g. Stool Analysis")}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("Date of Test *")}</Label>
              <Input
                type="date"
                value={form.test_date}
                onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Laboratory Name *")}</Label>
              <Input
                value={form.lab_name}
                onChange={(e) => setForm({ ...form, lab_name: e.target.value })}
                placeholder={t("e.g. Tripoli Medical Laboratory")}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("Laboratory Report (PDF or image) *")}</Label>
            {file ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <span className="text-sm truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-dashed border-border hover:bg-accent">
                  <Upload className="w-4 h-4 mr-2" />
                  {t("Choose PDF or image...")}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("Submit Result")}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("No lab results submitted yet")}</p>
          <p className="text-xs mt-1">{t("Results you submit will be listed here, organized by date.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{t(r.test_type)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("Test date:")} {r.test_date}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {r.submitted_by_name === patient.full_name ? t("Patient-submitted") : t("Laboratory")}
                </span>
              </div>
              {r.lab_name && <p className="text-sm text-muted-foreground mt-1">{r.lab_name}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {t("Submitted")} {r.submitted_date ? new Date(r.submitted_date).toLocaleDateString(locale) : ""} — {r.submitted_by_name}
              </p>
              <ClinicalFileButton kind="patient_lab_result" id={r.id} fileRef={r.file_url} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 mt-3">
                <FileText className="w-4 h-4 mr-1" />
                {t("View Lab Result")}
              </ClinicalFileButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}