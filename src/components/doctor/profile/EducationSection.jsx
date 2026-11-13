import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import EducationEntryDialog from "./EducationEntryDialog";
import { EDUCATION_TYPES, labelOf, yearRange } from "@/lib/professionalProfile";

// Education & Qualifications — the physician's degrees, residencies, fellowships
// and certifications, added, updated and removed one entry at a time.
export default function EducationSection({ entries = [], onSaveEntry, onRemoveEntry, busy }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (entry) => {
    setEditing(entry);
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
            <GraduationCap className="h-4 w-4 text-primary" /> Education & Qualifications
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Degrees, residency programmes, fellowships and certifications. These entries are shown as
            self-reported — your verified licence and specialty appear separately.
          </p>
        </div>
        <Button size="sm" onClick={openNew} disabled={busy}>
          <Plus className="h-3.5 w-3.5" /> Add qualification
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
          No qualifications added yet. Add your medical degree first, then your residency and fellowships.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.entry_id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[labelOf(EDUCATION_TYPES, entry.type, "Qualification"), entry.institution, entry.field, entry.country, yearRange(entry)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-foreground/80">{entry.notes}</p> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(entry)} disabled={busy} title="Edit">
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

      <EducationEntryDialog open={open} entry={editing} onOpenChange={setOpen} onSave={save} />
    </div>
  );
}