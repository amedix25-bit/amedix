import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Small prompt dialog used by the department worklist for actions that need
// input — scheduling, clarification, cancellation reasons, assignment notes.
export default function PromptDialog({ open, onOpenChange, title, description, fields, submitLabel, busy, onSubmit }) {
  const [values, setValues] = useState({});
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) {
      setValues({});
      setError("");
    }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    const vals = {};
    for (const f of fields) {
      const v = String(values[f.key] ?? "").trim();
      if (f.required && !v) {
        setError(`${f.label} is required.`);
        return;
      }
      vals[f.key] = v;
    }
    setError("");
    onSubmit(vals, () => onOpenChange(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}{f.required ? " *" : ""}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  rows={3}
                  value={values[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  value={values[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}