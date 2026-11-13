import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EDUCATION_TYPES, emptyEducationEntry } from "@/lib/professionalProfile";

// Add or edit one education entry: a degree, residency, fellowship or
// certification. Nothing is saved until the physician confirms.
export default function EducationEntryDialog({ open, entry, onOpenChange, onSave }) {
  const [draft, setDraft] = useState(emptyEducationEntry());

  useEffect(() => {
    if (open) setDraft(entry ? { ...emptyEducationEntry(), ...entry } : emptyEducationEntry());
  }, [open, entry]);

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit qualification" : "Add qualification"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={draft.type} onValueChange={(value) => set({ type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => set({ title: e.target.value.slice(0, 160) })}
              placeholder="MBBS · Fellowship in Interventional Cardiology"
              className="mt-1"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Institution</Label>
              <Input
                value={draft.institution}
                onChange={(e) => set({ institution: e.target.value.slice(0, 160) })}
                placeholder="University of Tripoli"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Field / specialty</Label>
              <Input
                value={draft.field}
                onChange={(e) => set({ field: e.target.value.slice(0, 120) })}
                placeholder="Internal Medicine"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input
                value={draft.country}
                onChange={(e) => set({ country: e.target.value.slice(0, 80) })}
                placeholder="Libya"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  value={draft.start_year}
                  onChange={(e) => set({ start_year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
                  placeholder="2012"
                  inputMode="numeric"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  value={draft.end_year}
                  onChange={(e) => set({ end_year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
                  placeholder="2018"
                  inputMode="numeric"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Note (optional)</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value.slice(0, 300) })}
              rows={2}
              placeholder="Distinction, thesis title, training focus"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!draft.title.trim()} onClick={() => onSave(draft)}>
            {entry ? "Save changes" : "Add qualification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}