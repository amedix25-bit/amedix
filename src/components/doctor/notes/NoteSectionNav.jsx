import React from "react";
import { ChevronsDown, ChevronsUp } from "lucide-react";

// Direct navigation to any section of the clinical note — compact chips with
// a completion dot, plus Expand All / Collapse All. Scrolls horizontally on
// small screens so every section stays reachable.
export default function NoteSectionNav({ sections, onJump, onExpandAll, onCollapseAll }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-2 flex items-center gap-2">
      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(s.id)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.complete ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            {s.title}
            {s.required && <span className="text-destructive">*</span>}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 shrink-0 border-l border-border pl-2">
        <button
          type="button"
          onClick={onExpandAll}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Expand all sections"
        >
          <ChevronsDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Expand All</span>
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Collapse all sections"
        >
          <ChevronsUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Collapse All</span>
        </button>
      </div>
    </div>
  );
}