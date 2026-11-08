import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INHALER_DEVICES, TECHNIQUE_COUNSELLING } from "@/lib/inhalerDevice";

const SELECT_CLASS = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

// Structured inhaler device recorded beside the prescribed medication. Shown
// only for an inhaled route, and nothing is preselected: a device the prescriber
// did not choose stays unrecorded rather than defaulting to a device.
export default function InhalerDeviceField({ value, onChange }) {
  const device = value?.inhaler_device || "";
  const set = (key, next) => onChange({ ...(value || {}), [key]: next });

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-primary">Inhaler Device</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Device</Label>
          <select
            value={device}
            onChange={(e) => set("inhaler_device", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Select device…</option>
            {INHALER_DEVICES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Technique Counselling</Label>
          <select
            value={value?.technique_counselling || ""}
            onChange={(e) => set("technique_counselling", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Not recorded</option>
            {TECHNIQUE_COUNSELLING.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Device Specification</Label>
        <Input
          placeholder="e.g. 100 micrograms per actuation, with valved holding chamber"
          value={value?.inhaler_device_detail || ""}
          onChange={(e) => set("inhaler_device_detail", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Device Instructions</Label>
        <Textarea
          rows={2}
          placeholder="e.g. rinse mouth after use, prime before first use, replace cartridge when the dose counter shows zero"
          value={value?.inhaler_device_instructions || ""}
          onChange={(e) => set("inhaler_device_instructions", e.target.value)}
        />
      </div>
    </div>
  );
}