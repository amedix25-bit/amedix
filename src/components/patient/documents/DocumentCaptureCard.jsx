import React, { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
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
export default function DocumentCaptureCard({ category, docs, uploadingButton, onCapture, onDelete, onView }) {
  const inputRefs = useRef({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const multi = category.buttons.length > 1;

  const handleFile = (button, e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-capturing the same file
    if (file) onCapture(category, button, file);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <category.icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{category.label}</p>
          {category.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
          )}
        </div>
        {docs.length > 0 && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground shrink-0">
            {docs.length}
          </span>
        )}
      </div>

      <div className={`mt-4 flex flex-wrap gap-2 ${docs.length === 0 ? "" : "mb-4"}`}>
        {category.buttons.map((button) => {
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
                {multi ? `Take a Picture — ${button.label}` : "Take a Picture"}
              </Button>
            </React.Fragment>
          );
        })}
      </div>

      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
              {doc.file_url ? (
                <Image
                  src={doc.file_url}
                  alt={doc.title}
                  className="w-12 h-12 rounded-md overflow-hidden shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <category.icon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.date}</p>
              </div>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline shrink-0" onClick={() => onView?.(doc)}>
                  View
                </a>
              )}
              <button
                onClick={() => setDeleteTarget(doc)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed from your documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}