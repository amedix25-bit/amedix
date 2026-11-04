import React from "react";
import { Inbox, Images, PenLine, FileSignature, CheckCircle2, Siren } from "lucide-react";
import { SUMMARY_CARDS } from "@/lib/radiologistWorklist";

const ICONS = {
  new_requests: Inbox,
  images_ready: Images,
  reporting: PenLine,
  awaiting_signature: FileSignature,
  completed: CheckCircle2,
  urgent_critical: Siren,
};
const TONES = {
  new_requests: "bg-sky-500/10 text-sky-700",
  images_ready: "bg-violet-500/10 text-violet-700",
  reporting: "bg-blue-500/10 text-blue-700",
  awaiting_signature: "bg-indigo-500/10 text-indigo-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  urgent_critical: "bg-red-500/10 text-red-700",
};

// Summary cards — every number is a live server-side count of the studies this
// radiologist is authorized for, and each card opens the matching worklist.
export default function WorklistSummary({ summary, activeCategory, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {SUMMARY_CARDS.map((card) => {
        const Icon = ICONS[card.key];
        const active = card.target === activeCategory;
        return (
          <button
            key={card.key}
            onClick={() => onSelect(card)}
            className={`rounded-xl border bg-card p-3 text-left transition-colors ${
              active ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONES[card.key]}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xl font-bold tabular-nums leading-none">{summary[card.key] ?? 0}</span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mt-2 leading-tight">{card.label}</p>
          </button>
        );
      })}
    </div>
  );
}