import React from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

// One collapsible section of the universal clinical note. State lives in the
// parent form, so collapsing and reopening a section never loses entries.
export default function NoteAccordionSection({ id, title, required, complete, hint, open, onToggle, children }) {
  return (
    <div id={`note-section-${id}`} className="rounded-xl border border-border bg-card overflow-hidden scroll-mt-32">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
        aria-expanded={open}
      >
        {complete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        )}
        <span className="font-medium text-sm truncate">{title}</span>
        {required && <span className="text-destructive text-xs shrink-0">*</span>}
        {hint && <span className="text-xs text-muted-foreground shrink-0">{hint}</span>}
        <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-border/60 space-y-4">{children}</div>}
    </div>
  );
}