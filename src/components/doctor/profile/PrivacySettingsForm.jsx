import React from "react";
import { Switch } from "@/components/ui/switch";
import { Globe2, Lock, Users } from "lucide-react";
import { PRIVACY_FIELDS } from "@/lib/professionalProfile";

// Who may see what. The choice is enforced by the server every time another
// physician opens the profile — a hidden section is never sent to them at all.
const VISIBILITY = [
  {
    value: "network",
    icon: Globe2,
    title: "All verified physicians",
    description: "Any physician in the AMedix network can open your professional profile.",
  },
  {
    value: "connections",
    icon: Users,
    title: "Only my connections",
    description: "Other physicians see your name, specialty and verification only, until you connect.",
  },
];

export default function PrivacySettingsForm({ privacy, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold">Who can open my professional profile</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {VISIBILITY.map((option) => {
            const Icon = option.icon;
            const active = (privacy.visibility || "network") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ visibility: option.value })}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-doctor-blue bg-doctor-blue/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icon className={`h-4 w-4 ${active ? "text-doctor-blue" : "text-muted-foreground"}`} />
                  {option.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Information shown on my profile</p>
        <div className="divide-y divide-border rounded-xl border border-border">
          {PRIVACY_FIELDS.map((field) => (
            <label key={field.key} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm">{field.label}</span>
                <span className="block text-[11px] text-muted-foreground">{field.hint}</span>
              </span>
              <Switch
                checked={privacy[field.key] !== false}
                onCheckedChange={(checked) => onChange({ [field.key]: checked })}
              />
            </label>
          ))}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          These settings apply to your professional profile only. They never change clinical record access:
          connecting with a physician does not give them access to any patient record, and hiding your profile
          does not change your own patient permissions.
        </span>
      </p>
    </div>
  );
}