import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, ChevronDown } from "lucide-react";
import { LAB_CATEGORIES, CATALOG_ENTRIES, searchLabTests } from "@/lib/labTestCatalog";

function TestRow({ name, isSelected, onToggle, className }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 cursor-pointer hover:bg-accent transition-colors ${
        isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      } ${className || ""}`}
    >
      <Checkbox checked={isSelected} className="pointer-events-none" tabIndex={-1} />
      <span>{name}</span>
    </div>
  );
}

function PanelBlock({ panel, categoryId, selected, onToggle, onSetMany }) {
  const [open, setOpen] = useState(false);
  const ids = panel.tests.map((name) => `${categoryId}:${panel.id}:${name}`);
  const count = ids.filter((id) => selected.has(id)).length;
  const all = count === ids.length && count > 0;

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="flex items-center gap-1 text-sm font-medium" onClick={() => setOpen(!open)}>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {panel.tests.map((name) => {
            const id = `${categoryId}:${panel.id}:${name}`;
            return (
              <TestRow
                key={id}
                name={name}
                isSelected={selected.has(id)}
                onToggle={() => onToggle(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LabTestPicker({ selected, onToggle, onSetMany }) {
  const [query, setQuery] = useState("");
  const results = query.trim() ? searchLabTests(query) : [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tests by name, panel, or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {query.trim() ? (
        results.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tests match "{query}".</p>
        ) : (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 max-h-96 overflow-y-auto">
            {results.map((entry) => (
              <TestRow
                key={entry.id}
                name={`${entry.name} — ${entry.panel ? `${entry.panel} · ` : ""}${entry.category}`}
                isSelected={selected.has(entry.id)}
                onToggle={() => onToggle(entry.id)}
              />
            ))}
          </div>
        )
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {LAB_CATEGORIES.map((cat) => {
            const catEntries = CATALOG_ENTRIES.filter((t) => t.categoryId === cat.id);
            const catIds = catEntries.map((t) => t.id);
            const count = catIds.filter((id) => selected.has(id)).length;
            const all = count === catIds.length && count > 0;
            return (
              <AccordionItem key={cat.id} value={cat.id} className="border border-border rounded-xl px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {count > 0 && <span className="text-xs text-primary font-semibold">{count} selected</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => onSetMany(catIds, !all)}>
                      {all ? "Deselect all" : "Select all"}
                    </Button>
                  </div>
                  {(cat.panels || []).map((panel) => (
                    <PanelBlock
                      key={panel.id}
                      panel={panel}
                      categoryId={cat.id}
                      selected={selected}
                      onToggle={onToggle}
                      onSetMany={onSetMany}
                    />
                  ))}
                  {(cat.tests || []).length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cat.tests.map((name) => {
                        const id = `${cat.id}:${name}`;
                        return (
                          <TestRow
                            key={id}
                            name={name}
                            isSelected={selected.has(id)}
                            onToggle={() => onToggle(id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}