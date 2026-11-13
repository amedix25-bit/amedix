import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Award, Pencil, Plus, Trash2 } from "lucide-react";
import AchievementEntryDialog from "./AchievementEntryDialog";
import { ACHIEVEMENT_TYPES, labelOf } from "@/lib/professionalProfile";

// Achievements & Experience — awards, research publications, conference work,
// professional accomplishments and clinical experience, managed entry by entry.
export default function AchievementSection({ entries = [], onSaveEntry, onRemoveEntry, busy }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const save = async (entry) => {
    await onSaveEntry(entry);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold">
            <Award className="h-4 w-4 text-primary" /> Achievements & Experience
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Awards, publications, conferences, accomplishments and clinical experience. These entries are shown
            as self-reported.
          </p>
        </div>
        <Button size="sm" onClick={openNew} disabled={busy}>
          <Plus className="h-3.5 w-3.5" /> Add entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
          Nothing added yet. Showcase the work that colleagues should know about — awards, papers, talks and
          clinical posts.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.entry_id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[labelOf(ACHIEVEMENT_TYPES, entry.type, "Achievement"), entry.organization, entry.year]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.detail ? <p className="mt-1 text-xs text-foreground/80">{entry.detail}</p> : null}
                {entry.link ? (
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-info hover:underline"
                  >
                    {entry.link}
                  </a>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditing(entry);
                    setOpen(true);
                  }}
                  disabled={busy}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveEntry(entry.entry_id)}
                  disabled={busy}
                  title="Remove"
                  className="text-critical hover:text-critical"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AchievementEntryDialog open={open} entry={editing} onOpenChange={setOpen} onSave={save} />
    </div>
  );
}