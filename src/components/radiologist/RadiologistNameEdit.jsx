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

// Name editor for the Radiologist Portal. Saving writes the first/middle/
// last name parts and the combined full name on the radiologist's profile.
export default function RadiologistNameEdit({ profile, onUpdated }) {
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
      await base44.entities.RadiologistProfile.update(profile.id, patch);
      onUpdated({ ...profile, ...patch });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PenLine className="w-4 h-4 mr-1.5" />
        Edit Name
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your name</DialogTitle>
            <DialogDescription>
              Your name appears in your portal and wherever you are shown to other users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rad-first">First Name *</Label>
              <Input id="rad-first" placeholder="e.g. Ayatallah" value={form.first} onChange={set("first")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rad-middle">Middle Name</Label>
              <Input id="rad-middle" placeholder="Optional" value={form.middle} onChange={set("middle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rad-last">Last Name *</Label>
              <Input id="rad-last" placeholder="e.g. Elallegy" value={form.last} onChange={set("last")} />
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
    </>
  );
}