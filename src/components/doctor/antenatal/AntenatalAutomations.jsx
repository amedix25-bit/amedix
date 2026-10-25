import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, BellRing, CheckCheck, Info, Loader2, Sparkles } from "lucide-react";

const TONE = {
  highlight: { cls: "border-indigo-300 bg-indigo-50 text-indigo-900", Icon: Sparkles, ack: false },
  reminder: { cls: "border-amber-300 bg-amber-50 text-amber-900", Icon: BellRing, ack: true },
  alert: { cls: "border-red-300 bg-red-50 text-red-900", Icon: AlertTriangle, ack: true },
  info: { cls: "border-blue-200 bg-blue-50 text-blue-900", Icon: Info, ack: false },
};

// Rule-based clinical decision support. Automations only surface and organize
// clinical information: they never diagnose, never auto-order investigations
// and never recommend induction. Every rule is traceable to its documented
// source and version, and alerts can be acknowledged with the action taken —
// acknowledged alerts stop repeating to avoid duplicate reminders.
export default function AntenatalAutomations({ automations, onAcknowledge, busyAck }) {
  const [acking, setAcking] = useState(null); // rule key with an open input
  const [actionText, setActionText] = useState("");
  if (!automations || automations.length === 0) return null;
  return (
    <div className="space-y-2">
      {automations.map((a) => {
        const t = TONE[a.tone] || TONE.info;
        const Icon = t.Icon;
        return (
          <div key={a.key} className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${t.cls}`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.title}</p>
              <p className="mt-0.5">{a.message}</p>
              <p className="text-[11px] opacity-70 mt-1">Rule: {a.key} · {a.source || "documented clinical rules"} · v{a.rule_version ?? 1}{a.rule_effective_date ? ` · effective ${a.rule_effective_date}` : ""}</p>
              {t.ack && onAcknowledge && (
                acking === a.key ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Input value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="Action taken (required)" className="h-8 text-xs flex-1 min-w-[180px]" />
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={!actionText.trim() || busyAck === a.key}
                      onClick={() => { onAcknowledge(a.key, actionText.trim()); setAcking(null); setActionText(""); }}>
                      {busyAck === a.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCheck className="w-3.5 h-3.5" /> Acknowledge</>}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setAcking(null); setActionText(""); }}>Cancel</Button>
                  </div>
                ) : (
                  <button type="button" className="text-[11px] underline mt-1 opacity-80 hover:opacity-100" onClick={() => { setAcking(a.key); setActionText(""); }}>
                    Acknowledge this alert
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}