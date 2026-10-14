import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";
import { LAB_CATEGORIES, CATALOG_ENTRIES, searchLabTests, entryById } from "@/lib/labTestCatalog";

export default function FavoriteEditorDialog({
  open, onOpenChange, favorite = null, initialTestIds = [], doctorId, isShared = false, hospital = null, onSaved,
}) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState(new Set());
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(LAB_CATEGORIES[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(favorite ? favorite.favorite_name : "");
    setPicked(new Set(favorite ? favorite.test_ids || [] : initialTestIds));
    setQuery("");
    setActiveCategory(LAB_CATEGORIES[0].id);
    setError("");
    setSaving(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const pickedEntries = useMemo(
    () => [...picked].map(entryById).filter(Boolean),
    [picked]
  );
  const groupedPicked = useMemo(() => {
    const map = new Map();
    pickedEntries.forEach((e) => {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category).push(e);
    });
    return [...map.entries()];
  }, [pickedEntries]);

  const results = query.trim() ? searchLabTests(query) : [];
  const activeCat = LAB_CATEGORIES.find((c) => c.id === activeCategory) || LAB_CATEGORIES[0];
  const activeEntries = CATALOG_ENTRIES.filter((t) => t.categoryId === activeCat.id);
  const activeCount = activeEntries.filter((t) => picked.has(t.id)).length;
  const activeAll = activeCount === activeEntries.length && activeCount > 0;

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Give the favorite a name."); return; }
    if (picked.size === 0) { setError("Select at least one test."); return; }
    setSaving(true);
    setError("");
    try {
      const values = { favorite_name: trimmed, test_ids: [...picked] };
      let saved;
      if (hospital) {
        // Hospital panels go through the backend-enforced panel endpoint —
        // membership and ownership are verified server-side.
        const res = await base44.functions.invoke("hospitalPanelManage", {
          action: favorite ? "update" : "create",
          id: favorite ? favorite.id : undefined,
          ...values,
        });
        saved = res.data.panel;
      } else if (favorite) {
        saved = await base44.entities.DoctorLabFavorite.update(favorite.id, values);
      } else {
        saved = await base44.entities.DoctorLabFavorite.create({
          doctor_id: doctorId,
          ...values,
          is_shared: isShared,
        });
      }
      if (onSaved) onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError("Could not save the favorite. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const TestRow = ({ entry }) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => toggle(entry.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(entry.id)}
      className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${
        picked.has(entry.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <Checkbox checked={picked.has(entry.id)} className="pointer-events-none" tabIndex={-1} />
      <span className="min-w-0 truncate">{entry.name}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{favorite ? (hospital ? "Edit Hospital Panel" : "Edit Favorite") : hospital ? "Create Hospital Panel" : "Create New Favorite"}</DialogTitle>
          <DialogDescription>
            {hospital
              ? `Shared with the doctors of ${hospital.hospital_name} — they can apply it with one click; only this hospital's administrators can edit it.`
              : isShared
              ? "A shared, standardized panel — every doctor will be able to apply it, and only administrators can edit it."
              : "A reusable collection of laboratory tests from the existing catalog — apply it later with one click."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="space-y-1.5">
            <Input
              placeholder={isShared ? "Panel name, e.g. Standard Pre-Op Panel" : "Favorite name, e.g. Routine Checkup"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {pickedEntries.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selected tests ({pickedEntries.length})
                </p>
                <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setPicked(new Set())}>
                  Clear all
                </Button>
              </div>
              {groupedPicked.map(([category, entries]) => (
                <div key={category} className="mb-2 last:mb-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entries.map((e) => (
                      <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs">
                        {e.name}
                        <button type="button" onClick={() => toggle(e.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tests across all categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {query.trim() ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Search results ({results.length})
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tests match "{query}".</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {results.map((entry) => (
                    <div key={entry.id} className="space-y-0.5">
                      <TestRow entry={entry} />
                      <p className="text-[11px] text-muted-foreground pl-9 truncate">
                        {entry.panel ? `${entry.panel} · ` : ""}{entry.category}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {LAB_CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive ? "bg-primary/10 border-primary/40 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold">
                    {activeCat.name}
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      {activeEntries.length} tests{activeCount > 0 ? ` · ${activeCount} selected` : ""}
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => activeEntries.forEach((t) => toggle(t.id))}
                  >
                    {activeAll ? "Deselect all" : "Select all"}
                  </Button>
                </div>
                {(activeCat.panels || []).map((panel) => {
                  const panelIds = panel.tests.map((n) => `${activeCat.id}:${panel.id}:${n}`);
                  return (
                    <div key={panel.id} className="rounded-lg bg-muted p-3 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium">
                          {panel.name}
                          <span className="text-xs text-muted-foreground font-normal ml-2">({panelIds.length} tests)</span>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => panelIds.forEach((id) => toggle(id))}
                        >
                          {panelIds.every((id) => picked.has(id)) ? "Deselect panel" : "Select panel"}
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {panel.tests.map((n) => (
                          <TestRow key={`${activeCat.id}:${panel.id}:${n}`} entry={{ id: `${activeCat.id}:${panel.id}:${n}`, name: n }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(activeCat.tests || []).length > 0 && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {activeCat.tests.map((n) => (
                      <TestRow key={`${activeCat.id}:${n}`} entry={{ id: `${activeCat.id}:${n}`, name: n }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : favorite ? "Save Changes" : hospital ? "Create Panel" : "Create Favorite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}