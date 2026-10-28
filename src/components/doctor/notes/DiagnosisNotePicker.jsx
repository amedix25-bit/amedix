import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Disease-specific note templates of the doctor's own specialty, listed in
// full and searchable — the same templates, presentation only.
export default function DiagnosisNotePicker({ groups = [], aliases = {}, selectedKey, onSelect }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = (d) =>
    !q || d.label.toLowerCase().includes(q) || (aliases[d.key] || "").includes(q);

  const visible = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, docs: g.docs.filter(matches) }))
        .filter((g) => g.docs.length > 0),
    [groups, q]
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Search diseases..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {visible.map((g) => (
          <div key={g.title} className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-1">{g.title}</p>
            {g.docs.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelect(d.key)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-md border transition-colors ${
                  selectedKey === d.key
                    ? "border-primary bg-secondary text-foreground"
                    : "border-transparent hover:bg-secondary text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-muted-foreground px-1 py-2">No disease matches "{query}".</p>
        )}
      </div>
    </div>
  );
}