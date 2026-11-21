import React from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown instead of an empty content area when a section or linked record
// cannot be opened (expired link, removed record, no longer available). A
// blank screen never tells the user what happened — this always does.
export default function UnavailableSection({
  title = "This item is not available",
  message = "The record you tried to open may have been removed, or it is no longer available to your account.",
  actionLabel = "Go to Home",
  onAction,
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
      </span>
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onAction && (
        <Button variant="outline" className="mt-4" onClick={onAction}>
          <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}