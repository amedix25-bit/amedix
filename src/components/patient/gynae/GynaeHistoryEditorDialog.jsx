import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Check } from "lucide-react";
import GynaeObstetricHistoryForm from "./GynaeObstetricHistoryForm";
import GynaeUpdateHistory from "./GynaeUpdateHistory";
import { normalizeGynaeHistory, buildGynaeSave, legacyGynaeFields } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Lets an already registered female patient complete, review and update her
// Gynaecological, Obstetric and Postmenopausal History — without a new account
// and without touching anything else on her record. Every save keeps what was
// there before and appends one entry to her update history, so nothing is
// duplicated or overwritten.
export default function GynaeHistoryEditorDialog({ open, onOpenChange, profile, onSaved }) {
  const { t } = usePatientLanguage();
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(normalizeGynaeHistory(profile?.gynae_obstetric_history));
    setError("");
    setSaving("");
  }, [open, profile?.id]);

  if (!profile) return null;
  const current = value || normalizeGynaeHistory(profile.gynae_obstetric_history);

  const save = async (finalStatus) => {
    if (!value || saving) return;
    setSaving(finalStatus);
    setError("");
    try {
      const saved = buildGynaeSave(
        profile.gynae_obstetric_history,
        value,
        { name: profile.full_name, role: "patient" },
        { finalStatus }
      );
      const patch = {
        gynae_obstetric_history: saved,
        ...legacyGynaeFields(saved, true),
      };
      const updated = await base44.entities.PatientProfile.update(profile.id, patch);
      onSaved?.(updated && updated.id ? updated : { ...profile, ...patch });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(t("Could not save your history. Please try again."));
    } finally {
      setSaving("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!saving) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Gynaecological & Obstetric History")}</DialogTitle>
          <DialogDescription>
            {t(
              "This section was recorded at registration. You can complete or update it at any time — nothing you saved before is removed."
            )}
          </DialogDescription>
        </DialogHeader>

        <GynaeObstetricHistoryForm
          value={current}
          onChange={setValue}
          hideObstetric={profile.marital_status === "not_married"}
        />
        <GynaeUpdateHistory history={current} />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => save("in_progress")} disabled={!!saving}>
            {saving === "in_progress" ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {t("Save progress")}
          </Button>
          <Button onClick={() => save("completed")} disabled={!!saving}>
            {saving === "completed" ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            {t("Save & update my history")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}