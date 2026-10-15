import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { Building2, Loader2, MapPin, Search } from "lucide-react";

// Shared facility chooser for laboratories, hospitals and pharmacies.
// Every option is shown as a card with the facility's logo (from its profile
// registration) and address, and a search bar on top narrows the options.
// Controlled mode: pass query + onQueryChange (e.g. server-backed search).
// Uncontrolled mode: filters the provided items internally.
export default function FacilityPicker({
  items,
  onSelect,
  placeholder = "Search by name or address...",
  loading = false,
  emptyText = "No options match your search.",
  query: queryProp,
  onQueryChange,
  selectLabel = "Select",
  initialQuery = "",
}) {
  const [internalQuery, setInternalQuery] = useState(initialQuery);
  const controlled = typeof onQueryChange === "function";
  const query = controlled ? queryProp || "" : internalQuery;
  const setQuery = controlled ? onQueryChange : setInternalQuery;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || controlled) return items || [];
    return (items || []).filter((it) =>
      (it.name || "").toLowerCase().includes(needle) ||
      (it.subtitle || "").toLowerCase().includes(needle) ||
      (it.address || "").toLowerCase().includes(needle)
    );
  }, [items, query, controlled]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rtl:pl-3 rtl:pr-9"
        />
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-2 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border bg-secondary flex items-center justify-center">
                {it.logo_url ? (
                  <Image src={it.logo_url} fittingType="fit" className="w-12 h-12" alt={it.name} />
                ) : (
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{it.name}</p>
                {it.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>
                )}
                {it.address && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{it.address}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSelect?.(it)}
                className="shrink-0 rounded-md bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
              >
                {selectLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}