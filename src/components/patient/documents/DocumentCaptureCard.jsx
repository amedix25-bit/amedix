import React, { useRef, useState } from "react";
import { Camera, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";
import DocumentRow from "@/components/patient/documents/DocumentRow";
import DocumentUploadDialog from "@/components/patient/documents/DocumentUploadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// One capture card: category header, "Take a Picture" buttons (front/back for
// the insurance card), and the saved documents belonging to the category.
export default function DocumentCaptureCard({ category, docs, uploadingButton, onCapture, onUpload, onDelete, onView }) {
  const { t } = usePatientLanguage();
  const inputRefs = useRef({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const multi = category.buttons.length > 1;
  const uploadMode = !!category.upload;

  const handleFile = (button, e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-capturing the same file
    if (file) onCapture(category, button, file);
  };

  const displayTitle = (title) =>
    (title || "").split(" — ").map((part) => t(part)).join(" — ");

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <category.icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{t(category.label)}</p>
          {category.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{t(category.description)}</p>
          )}
        </div>
        {docs.length > 0 && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground shrink-0">
            {docs.length}
          </span>
        )}
      </div>

      <div className={`mt-4 flex flex-wrap gap-2 ${docs.length === 0 ? "" : "mb-4"}`}>
        {uploadMode ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!!uploadingButton}
            onClick={() => setUploadOpen(true)}
          >
            {uploadingButton === `${category.key}:upload` ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4" />
            )}
            {t("Upload Document")}
          </Button>
        ) : (
          category.buttons.map((button) => {
            const busy = uploadingButton === `${category.key}:${button.id}`;
            return (
              <React.Fragment key={button.id}>
                <input
                  ref={(el) => (inputRefs.current[button.id] = el)}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(button, e)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!uploadingButton}
                  onClick={() => inputRefs.current[button.id]?.click()}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {multi ? `${t("Take a Picture")} — ${t(button.label)}` : t("Take a Picture")}
                </Button>
              </React.Fragment>
            );
          })
        )}
      </div>

      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={{ ...doc, title: displayTitle(doc.title) }}
              icon={category.icon}
              onView={onView}
              onDelete={() => setDeleteTarget(doc)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this document?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('"{title}" will be permanently removed from your documents.', { title: displayTitle(deleteTarget?.title) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {uploadMode && (
        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          category={category}
          onSubmit={(file, meta) => onUpload(category, file, meta)}
        />
      )}
    </div>
  );
}