import React from "react";
import { AlertTriangle, BellRing, Info, Sparkles } from "lucide-react";

const TONE = {
  highlight: { cls: "border-indigo-300 bg-indigo-50 text-indigo-900", Icon: Sparkles },
  reminder: { cls: "border-amber-300 bg-amber-50 text-amber-900", Icon: BellRing },
  alert: { cls: "border-red-300 bg-red-50 text-red-900", Icon: AlertTriangle },
  info: { cls: "border-blue-200 bg-blue-50 text-blue-900", Icon: Info },
};

// Automated antenatal care messages — highlight, reminder, alert and info.
// Automations only surface and organize clinical information: they never
// diagnose, never auto-order investigations and never recommend induction.
export default function AntenatalAutomations({ automations }) {
  if (!automations || automations.length === 0) return null;
  return (
    <div className="space-y-2">
      {automations.map((a) => {
        const t = TONE[a.tone] || TONE.info;
        const Icon = t.Icon;
        return (
          <div key={a.key} className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${t.cls}`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">{a.title}</p>
              <p className="mt-0.5">{a.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}