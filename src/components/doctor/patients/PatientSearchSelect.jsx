import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function PatientSearchSelect({ selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cache = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (!cache.current) {
          cache.current = await base44.entities.PatientProfile.list("-created_date", 500);
        }
        const q = query.trim().toLowerCase();
        const matches = (cache.current || [])
          .filter((p) => (p.full_name || "").toLowerCase().includes(q))
          .slice(0, 8);
        if (!cancelled) setResults(matches);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const choose = (p) => {
    onSelect(p);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  if (selected) {
    return (
      <div className="rounded-lg border border-border bg-muted p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <Label>Patient *</Label>
            <p className="font-medium">{selected.full_name}</p>
            <p className="text-xs text-muted-foreground">
              CIN: {selected.cin}
              {selected.date_of_birth ? ` · DOB: ${selected.date_of_birth}` : ""}
              {selected.gender ? ` · ${selected.gender}` : ""}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)} aria-label="Change patient">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative space-y-2">
      <Label>Patient Name *</Label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patient name..."
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-md max-h-64 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No registered patients found.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
              >
                <p className="font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">CIN: {p.cin}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}