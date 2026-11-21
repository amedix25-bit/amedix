import React from "react";
import { Bell, BellOff, Send, Trash2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_OPTIONS } from "@/lib/webPush";
import { cn } from "@/lib/utils";

// One device in the list: master switch, per-category switches, test and remove.
export default function DevicePreferences({
  device,
  isThisDevice,
  busy,
  onSetEnabled,
  onSetCategory,
  onRemove,
  onTest,
}) {
  const categories = device.categories || {};
  const paused = device.enabled === false || device.status === "expired";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Smartphone className="h-4 w-4" />
          </span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              {device.device_label}
              {isThisDevice && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                  This device
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {device.status === "expired"
                ? "This subscription has expired. Turn notifications on again on this device."
                : paused
                ? "Paused — this device will not receive notifications."
                : "Active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={!paused}
            disabled={!!busy}
            onCheckedChange={(value) => onSetEnabled(device.id, value)}
            aria-label={`Notifications on ${device.device_label}`}
          />
        </div>
      </div>

      {!paused && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.key}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-xs",
                categories[option.key] === false && "opacity-60"
              )}
            >
              <span className="text-foreground">{option.label}</span>
              <Switch
                checked={categories[option.key] !== false}
                disabled={!!busy}
                onCheckedChange={(value) =>
                  onSetCategory(device, { ...categories, [option.key]: value })
                }
                aria-label={option.label}
              />
            </label>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {isThisDevice && !paused && (
          <Button size="sm" variant="outline" onClick={onTest} disabled={!!busy}>
            <Send className="h-3.5 w-3.5" /> Send test
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => onRemove(device.id)}
          disabled={!!busy}
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </div>
  );
}

export function PushStatusIcon({ active }) {
  return active ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />;
}