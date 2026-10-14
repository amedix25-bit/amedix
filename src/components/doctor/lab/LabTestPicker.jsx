import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, ChevronDown, Star, Plus, Trash2, X,
} from "lucide-react";
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
  const [showSaveFav, setShowSaveFav] = useState(false);
  const [favName, setFavName] = useState("");
  const [savingFav, setSavingFav] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    base44.entities.DoctorLabFavorite.filter({ doctor_id: doctorId }, "-created_date")
      .then((favs) => { if (!cancelled) setFavorites(favs); })
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

  const saveFavorite = async () => {
    const name = favName.trim();
    if (!name || selected.size === 0 || savingFav) return;
    setSavingFav(true);
    try {
      const existing = favorites.find((f) => f.favorite_name.toLowerCase() === name.toLowerCase());
      if (existing) {
        const updated = await base44.entities.DoctorLabFavorite.update(existing.id, { test_ids: [...selected] });
        setFavorites((f) => f.map((x) => (x.id === existing.id ? updated : x)));
      } else {
        const created = await base44.entities.DoctorLabFavorite.create({
          doctor_id: doctorId,
          favorite_name: name,
          test_ids: [...selected],
        });
        setFavorites((f) => [created, ...f]);
      }
      setFavName("");
      setShowSaveFav(false);
    } finally {
      setSavingFav(false);
    }
  };

  const deleteFavorite = async (fav) => {
    await base44.entities.DoctorLabFavorite.delete(fav.id);
    setFavorites((f) => f.filter((x) => x.id !== fav.id));
  };

  const applyFavorite = (fav) => {
    // Merge into the current selection — duplicates are impossible because it is a Set.
    onSetMany(fav.test_ids || [], true);
    setQuery("");
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
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                My Lab Favorites
              </p>
              <button
                type="button"
                title={selected.size === 0 ? "Select tests first, then save them as a favorite" : "Save current selection as a favorite"}
                onClick={() => { if (selected.size > 0) setShowSaveFav(!showSaveFav); }}
                disabled={selected.size === 0}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showSaveFav && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Favorite name, e.g. Anemia Panel"
                  value={favName}
                  onChange={(e) => setFavName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveFavorite()}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button type="button" size="sm" className="h-8" onClick={saveFavorite} disabled={savingFav || !favName.trim()}>
                  Save
                </Button>
              </div>
            )}

            {favorites.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Select tests, then save them here to apply the whole set with one click.
              </p>
            ) : (
              <div className="space-y-1 mt-2">
                {favorites.map((fav) => (
                  <div key={fav.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => applyFavorite(fav)}
                      className="min-w-0 flex-1 text-left"
                      title="Apply this favorite — selects its tests in addition to any current selection"
                    >
                      <p className="text-sm font-medium truncate hover:text-primary">{fav.favorite_name}</p>
                      <p className="text-xs text-muted-foreground">{(fav.test_ids || []).length} test(s)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFavorite(fav)}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive shrink-0"
                      title="Delete favorite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
    </div>
  );
}