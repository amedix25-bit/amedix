import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACHIEVEMENT_TYPES, emptyAchievementEntry } from "@/lib/professionalProfile";

// Add or edit one achievement: an award, publication, conference, professional
// accomplishment or clinical experience entry.
export default function AchievementEntryDialog({ open, entry, onOpenChange, onSave }) {
  const [draft, setDraft] = useState(emptyAchievementEntry());

  useEffect(() => {
    if (open) setDraft(entry ? { ...emptyAchievementEntry(), ...entry } : emptyAchievementEntry());
  }, [open, entry]);

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "Add achievement or experience"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={draft.type} onValueChange={(value) => set({ type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACHIEVEMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => set({ title: e.target.value.slice(0, 180) })}
              placeholder="Best Clinical Research Award"
              className="mt-1"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Organisation / journal / society</Label>
              <Input
                value={draft.organization}
                onChange={(e) => set({ organization: e.target.value.slice(0, 160) })}
                placeholder="Libyan Cardiac Society"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Input
                value={draft.year}
                onChange={(e) => set({ year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
                placeholder="2024"
                inputMode="numeric"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Details</Label>
            <Textarea
              value={draft.detail}
              onChange={(e) => set({ detail: e.target.value.slice(0, 400) })}
              rows={3}
              placeholder="Citation, journal and DOI, conference city, or the scope of the role."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Link (optional)</Label>
            <Input
              value={draft.link}
              onChange={(e) => set({ link: e.target.value.slice(0, 400) })}
              placeholder="https://"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!draft.title.trim()} onClick={() => onSave(draft)}>
            {entry ? "Save changes" : "Add entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}