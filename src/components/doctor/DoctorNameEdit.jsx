import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenLine, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// One-time name edit for doctors whose account was created before the
// first/middle/last name fields were added. Saving writes the name parts
// and the combined full name, and sets name_edited so the prompt
// never shows again.
export default function DoctorNameEdit({ profile, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first: profile?.first_name || "",
    middle: profile?.middle_name || "",
    last: profile?.last_name || "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    const first = form.first.trim();
    const middle = form.middle.trim();
    const last = form.last.trim();
    if (!first || !last) return;
    setSaving(true);
    try {
      const full = [first, middle, last].filter(Boolean).join(" ");
      const patch = {
        first_name: first,
        middle_name: middle,
        last_name: last,
        full_name: full,
        name_edited: true,
      };
      await base44.entities.DoctorProfile.update(profile.id, patch);
      onUpdated({ ...profile, ...patch });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <PenLine className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-sm">Add your name</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your account is missing your full name. Set it once — it shows in your portal and to your patients.
          </p>
        </div>
      </div>
      <Button size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        Set My Name
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your name</DialogTitle>
            <DialogDescription>
              This is a one-time edit — your name will appear in your portal and to your patients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="doc-first">First Name *</Label>
              <Input id="doc-first" placeholder="e.g. Ayatallah" value={form.first} onChange={set("first")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-middle">Middle Name</Label>
              <Input id="doc-middle" placeholder="Optional" value={form.middle} onChange={set("middle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-last">Last Name *</Label>
              <Input id="doc-last" placeholder="e.g. Elallegy" value={form.last} onChange={set("last")} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving || !form.first.trim() || !form.last.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}