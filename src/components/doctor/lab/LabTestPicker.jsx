import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, ChevronDown, Star, Plus, Trash2, X, Pencil, SquarePen, Copy, Globe,
} from "lucide-react";
import FavoriteEditorDialog from "@/components/doctor/lab/FavoriteEditorDialog";
import { LAB_CATEGORIES, CATALOG_ENTRIES, searchLabTests, entryById } from "@/lib/labTestCatalog";

const ALL_TEST_IDS = CATALOG_ENTRIES.map((t) => t.id);

function TestRow({ entry, isSelected, onToggle }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${
        isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <Checkbox checked={isSelected} className="pointer-events-none" tabIndex={-1} />
      <span className="min-w-0 truncate">{entry.name}</span>
    </div>
  );
}

function PanelBlock({ panel, categoryId, selected, onToggle, onSetMany, open, onToggleOpen }) {
  const ids = panel.tests.map((name) => `${categoryId}:${panel.id}:${name}`);
  const count = ids.filter((id) => selected.has(id)).length;
  const all = count === ids.length && count > 0;

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium"
          onClick={onToggleOpen}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          {panel.name}
          <span className="text-xs text-muted-foreground font-normal">
            ({ids.length} tests{count > 0 ? `, ${count} selected` : ""})
          </span>
        </button>
        <Button type="button" variant="outline" size="sm" onClick={() => onSetMany(ids, !all)}>
          {all ? "Deselect panel" : "Select panel"}
        </Button>
      </div>
      {open && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 mt-3">
          {panel.tests.map((name) => {
            const entry = { id: `${categoryId}:${panel.id}:${name}`, name };
            return (
              <TestRow
                key={entry.id}
                entry={entry}
                isSelected={selected.has(entry.id)}
                onToggle={() => onToggle(entry.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SelectedSummary({ selected, onToggle, onSetMany, onSelectCategory }) {
  const selectedEntries = useMemo(
    () => [...selected].map(entryById).filter(Boolean),
    [selected]
  );
  const grouped = useMemo(() => {
    const map = new Map();
    selectedEntries.forEach((e) => {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category).push(e);
    });
    return [...map.entries()];
  }, [selectedEntries]);

  if (selectedEntries.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-semibold">Review Selected Tests ({selectedEntries.length})</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSetMany(ALL_TEST_IDS, false)}
        >
          Clear all
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Remove any test before submitting — the whole selection is submitted as one consolidated request.
      </p>
      {grouped.map(([category, entries]) => (
        <div key={category} className="mb-3 last:mb-0">
          <button
            type="button"
            onClick={() => onSelectCategory(category)}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground"
            title={`Show ${category} in the test browser`}
          >
            {category}
          </button>
          <div className="flex flex-wrap gap-2">
            {entries.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-xs">
                {e.name}
                <button
                  type="button"
                  onClick={() => onToggle(e.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LabTestPicker({ selected, onToggle, onSetMany, doctorId }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(LAB_CATEGORIES[0].id);
  const [openPanels, setOpenPanels] = useState(new Set());
  const [favorites, setFavorites] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFavorite, setEditorFavorite] = useState(null);
  const [renamingFav, setRenamingFav] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    // Personal favorites for this doctor + shared standardized panels for everyone.
    Promise.all([
      base44.entities.DoctorLabFavorite.filter({ doctor_id: doctorId }, "-created_date"),
      base44.entities.DoctorLabFavorite.filter({ is_shared: true }, "favorite_name"),
    ])
      .then(([own, shared]) => {
        if (cancelled) return;
        const map = new Map();
        [...own, ...shared].forEach((fav) => map.set(fav.id, fav));
        setFavorites([...map.values()]);
      })
      .catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, [doctorId]);

  // Selected count per category, for the sidebar badges.
  const selectedPerCategory = useMemo(() => {
    const map = new Map();
    CATALOG_ENTRIES.forEach((e) => {
      if (selected.has(e.id)) map.set(e.categoryId, (map.get(e.categoryId) || 0) + 1);
    });
    return map;
  }, [selected]);

  const results = query.trim() ? searchLabTests(query) : [];
  const activeCat = LAB_CATEGORIES.find((c) => c.id === activeCategory) || LAB_CATEGORIES[0];
  const activeEntries = CATALOG_ENTRIES.filter((t) => t.categoryId === activeCat.id);
  const activeCount = selectedPerCategory.get(activeCat.id) || 0;
  const activeAll = activeCount === activeEntries.length && activeCount > 0;

  const togglePanelOpen = (panelId) =>
    setOpenPanels((s) => {
      const n = new Set(s);
      if (n.has(panelId)) n.delete(panelId);
      else n.add(panelId);
      return n;
    });

  const onSavedFavorite = (saved) =>
    setFavorites((f) => [saved, ...f.filter((x) => x.id !== saved.id)]);

  const renameFavorite = async (fav) => {
    const name = renameValue.trim();
    if (!name) return;
    const updated = await base44.entities.DoctorLabFavorite.update(fav.id, { favorite_name: name });
    setFavorites((f) => f.map((x) => (x.id === fav.id ? updated : x)));
    setRenamingFav(null);
  };

  const deleteFavorite = async (fav) => {
    await base44.entities.DoctorLabFavorite.delete(fav.id);
    setFavorites((f) => f.filter((x) => x.id !== fav.id));
  };

  const applyFavorite = (fav) => {
    // Merge into the current selection — duplicates are impossible because it is a Set.
    // This only preselects tests; the doctor always reviews and confirms before submitting.
    onSetMany(fav.test_ids || [], true);
    setQuery("");
  };

  const duplicateFavorite = async (fav) => {
    const created = await base44.entities.DoctorLabFavorite.create({
      doctor_id: doctorId,
      favorite_name: `${fav.favorite_name} (copy)`,
      test_ids: fav.test_ids || [],
      is_shared: false,
    });
    setFavorites((f) => [created, ...f]);
  };

  const searchInput = (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search tests across all categories..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const categoryButton = (cat, compact) => {
    const isActive = !query.trim() && cat.id === activeCategory;
    const count = selectedPerCategory.get(cat.id) || 0;
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => { setActiveCategory(cat.id); setQuery(""); }}
        className={
          compact
            ? `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "bg-primary/10 border-primary/40 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`
            : `w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-accent"
              }`
        }
      >
        <span className={compact ? "" : "truncate"}>{cat.name}</span>
        {count > 0 && (
          <span className={`text-xs rounded-full px-1.5 py-0.5 shrink-0 ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary font-semibold"}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-[240px_1fr] gap-4 items-start">
        {/* Left sidebar — categories, search and favorites */}
        <div className="space-y-3 md:sticky md:top-4">
          {searchInput}

          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                My Lab Favorites
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => { setEditorFavorite(null); setEditorOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create New Favorite
              </Button>
            </div>

            {favorites.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Create a reusable collection of tests from the catalog, then apply it with one click.
              </p>
            ) : (
              <div className="space-y-1 mt-2">
                {favorites.map((fav) => {
                  const shared = !!fav.is_shared;
                  const renaming = renamingFav === fav.id;
                  return (
                    <div key={fav.id} className="rounded-lg border border-border px-2 py-1.5">
                      {renaming ? (
                        <div className="flex gap-1.5">
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameFavorite(fav)}
                            className="h-8 text-xs"
                          />
                          <Button type="button" size="sm" className="h-8" onClick={() => renameFavorite(fav)}>Save</Button>
                          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setRenamingFav(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => applyFavorite(fav)}
                            className="min-w-0 flex-1 text-left"
                            title={shared ? "Apply this shared panel — adds its tests to the current selection" : "Apply this favorite — adds its tests to the current selection"}
                          >
                            <p className="text-sm font-medium truncate hover:text-primary flex items-center gap-1.5">
                              {shared && <Globe className="w-3 h-3 text-sky-600 shrink-0" />}
                              <span className="truncate">{fav.favorite_name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fav.test_ids || []).length} test(s){shared ? " · shared panel" : ""}
                            </p>
                          </button>
                          <div className="flex items-center shrink-0">
                            {!shared && (
                              <button
                                type="button"
                                onClick={() => { setRenamingFav(fav.id); setRenameValue(fav.favorite_name); }}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                                title="Rename favorite"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!shared && (
                              <button
                                type="button"
                                onClick={() => { setEditorFavorite(fav); setEditorOpen(true); }}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                                title="Edit tests in this favorite"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => duplicateFavorite(fav)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                              title="Duplicate as a personal favorite"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {!shared && (
                              <button
                                type="button"
                                onClick={() => deleteFavorite(fav)}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                                title="Delete favorite"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories — vertical list on desktop, scrollable chips on mobile */}
          <div className="hidden md:block rounded-xl border border-border bg-card p-2 space-y-0.5">
            {LAB_CATEGORIES.map((cat) => categoryButton(cat, false))}
          </div>
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1">
            {LAB_CATEGORIES.map((cat) => categoryButton(cat, true))}
          </div>
        </div>

        {/* Main content — active category only, or search results */}
        <div className="space-y-3 min-w-0">
          {query.trim() ? (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Search results ({results.length})
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tests match "{query}".</p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[28rem] overflow-y-auto">
                  {results.map((entry) => (
                    <div key={entry.id} className="space-y-0.5">
                      <TestRow
                        entry={entry}
                        isSelected={selected.has(entry.id)}
                        onToggle={() => onToggle(entry.id)}
                      />
                      <p className="text-[11px] text-muted-foreground pl-9 truncate">
                        {entry.panel ? `${entry.panel} · ` : ""}{entry.category}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-semibold">{activeCat.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {activeEntries.length} tests available{activeCount > 0 ? ` · ${activeCount} selected` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSetMany(activeEntries.map((t) => t.id), !activeAll)}
                  >
                    {activeAll ? "Deselect all" : "Select all"}
                  </Button>
                </div>
              </div>

              {(activeCat.panels || []).map((panel) => (
                <PanelBlock
                  key={panel.id}
                  panel={panel}
                  categoryId={activeCat.id}
                  selected={selected}
                  onToggle={onToggle}
                  onSetMany={onSetMany}
                  open={openPanels.has(panel.id)}
                  onToggleOpen={() => togglePanelOpen(panel.id)}
                />
              ))}
              {(activeCat.tests || []).length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {activeCat.tests.map((name) => {
                    const entry = { id: `${activeCat.id}:${name}`, name };
                    return (
                      <TestRow
                        key={entry.id}
                        entry={entry}
                        isSelected={selected.has(entry.id)}
                        onToggle={() => onToggle(entry.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          <SelectedSummary
            selected={selected}
            onToggle={onToggle}
            onSetMany={onSetMany}
            onSelectCategory={(categoryName) => {
              const cat = LAB_CATEGORIES.find((c) => c.name === categoryName);
              if (cat) { setActiveCategory(cat.id); setQuery(""); }
            }}
          />
        </div>
      </div>

      <FavoriteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        favorite={editorFavorite}
        initialTestIds={[...selected]}
        doctorId={doctorId}
        onSaved={onSavedFavorite}
      />
    </div>
  );
}