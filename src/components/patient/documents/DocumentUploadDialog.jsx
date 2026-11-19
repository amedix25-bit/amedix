import React, { useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateField from "@/components/ui/date-field";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { todayIso } from "@/lib/dateOnly";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Upload one document into a category: an image or a PDF, the name the patient
// gives it, and the date it was done. The category name is always appended to
// the title when it is saved.
export default function DocumentUploadDialog({ open, onOpenChange, category, onSubmit }) {
  const { t } = usePatientLanguage();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setFile(null);
    setName("");
    setDate(todayIso());
    setError("");
    setSubmitting(false);
  }, [open]);

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    const isImage = (picked.type || "").startsWith("image/");
    const isPdf = picked.type === "application/pdf" || /\.pdf$/i.test(picked.name || "");
    if (!isImage && !isPdf) {
      setError(t("Please choose an image or PDF first."));
      return;
    }
    setError("");
    setFile(picked);
  };

  const submit = async () => {
    if (!file) {
      setError(t("Please choose an image or PDF first."));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const ok = await onSubmit(file, { name: name.trim(), date: date || todayIso() });
      if (ok === false) {
        setError(t("Could not save the document. Please try again."));
        return;
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(t("Could not save the document. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Upload Document")}</DialogTitle>
          <DialogDescription>{t(category.label)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("Image or PDF")}</Label>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm cursor-pointer hover:border-primary">
              <FileUp className="w-4 h-4 text-primary shrink-0" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {file ? file.name : t("Choose image or PDF")}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-name">{t("Document name (optional)")}</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Chest X-Ray")}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-date">{t("Date of the document")}</Label>
            <DateField id="doc-date" value={date} onChange={setDate} disableFuture />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting || !file}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}