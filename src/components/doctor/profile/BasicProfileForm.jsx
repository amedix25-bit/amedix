import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, ShieldCheck } from "lucide-react";

// The core of the professional identity: how the physician presents themselves.
// The registered name and the medical specialty are governed by verification, so
// they are shown as verified facts rather than typed here.
export default function BasicProfileForm({ name, specialty, verified, draft, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Full name (registered)</Label>
          <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{name || "—"}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Fixed to your verified identity. Change it from Settings if it is misspelled.
          </p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Medical specialty</Label>
          <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{specialty || "Not recorded"}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {verified?.specialty_verified
              ? "Verified by your hospital — this badge is what colleagues see."
              : "Confirmed once your hospital verifies your affiliation."}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Professional title</Label>
        <Input
          value={draft.professional_title || ""}
          onChange={(e) => onChange({ professional_title: e.target.value.slice(0, 140) })}
          placeholder="Consultant Interventional Cardiologist"
          className="mt-1"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Current hospital / workplace</Label>
          <Input
            value={draft.workplace || ""}
            onChange={(e) => onChange({ workplace: e.target.value.slice(0, 160) })}
            placeholder={verified?.hospital || "Where you currently practise"}
            className="mt-1"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Shown as self-reported. Your verified affiliation is always displayed separately.
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Input
            value={draft.location || ""}
            onChange={(e) => onChange({ location: e.target.value.slice(0, 120) })}
            placeholder="Tripoli, Libya"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label className="text-xs text-muted-foreground">Professional biography</Label>
          <span className="text-[11px] text-muted-foreground">{(draft.bio || "").length}/1200</span>
        </div>
        <Textarea
          value={draft.bio || ""}
          onChange={(e) => onChange({ bio: e.target.value.slice(0, 1200) })}
          rows={5}
          placeholder="A short summary of your practice, clinical interests and the work you do with colleagues."
          className="mt-1"
        />
      </div>
    </div>
  );
}