import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const CATEGORIES = [
  { value: "side_effect", label: "A side effect" },
  { value: "difficulty_following", label: "Difficulty following the treatment plan" },
  { value: "problem_obtaining", label: "Problem obtaining the medication" },
  { value: "treatment_changed", label: "My clinician changed the treatment" },
  { value: "treatment_stopped", label: "My clinician stopped the treatment" },
];

// Patient feedback report — side effects, difficulty following the plan,
// problems obtaining the medication, or a treatment changed/stopped by the
// clinician. Severe reports and treatment changes alert the prescribing
// doctor. Submitted through the secure backend function.
export default function MedicationFeedbackDialog({ med, onDone }) {
  const { t } = usePatientLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("side_effect");
  const [severity, setSeverity] = useState("mild");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("reportMedicationFeedback", {
        medication_id: med.id,
        category,
        severity: category === "side_effect" ? severity : "",
        details: details.trim(),
      });
      setOpen(false);
      setDetails("");
      toast({
        title: t("Report recorded"),
        description: res.data.doctor_notified
          ? t("Your prescribing doctor has been notified.")
          : t("It is saved in your medical history."),
      });
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("Could not record the report."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="gap-1.5 shrink-0">
        <MessageSquareWarning className="w-3.5 h-3.5" />
        {t("Report a Problem")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Report About {med}", { med: med.name })}</DialogTitle>
            <DialogDescription>
              {t("Your report is added to your medical history. Severe reports alert your doctor.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("What is it about?")}</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors ${
                      category === c.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t(c.label)}
                  </button>
                ))}
              </div>
            </div>
            {category === "side_effect" && (
              <div className="space-y-1.5">
                <Label>{t("Severity")}</Label>
                <div className="flex gap-2">
                  {["mild", "moderate", "severe"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`flex-1 text-xs rounded-lg border px-2 py-1.5 capitalize transition-colors ${
                        severity === s
                          ? s === "severe"
                            ? "border-destructive bg-destructive/10 text-destructive font-semibold"
                            : "border-primary bg-primary/5 font-medium"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="feedback-details">{t("Details")}</Label>
              <Textarea
                id="feedback-details"
                rows={3}
                placeholder={t("Describe what happened, when it started, and anything that helps...")}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={submit} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Send Report")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}