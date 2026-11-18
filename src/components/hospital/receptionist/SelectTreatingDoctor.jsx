import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Check, Loader2, Search, Stethoscope, UserRound } from "lucide-react";

// Searchable treating-doctor picker for the receptionist check-in. Only the
// doctors the backend returned for THIS hospital are offered — the list is
// filtered by name or specialty. Selecting one is presentation only: the
// check-in function re-verifies the doctor's association, status and
// verification before any access is granted.
export default function SelectTreatingDoctor({ doctors, value, onChange, loading, error }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors || [];
    return (doctors || []).filter(
      (d) =>
        String(d.full_name || "").toLowerCase().includes(q) ||
        String(d.specialization || "").toLowerCase().includes(q) ||
        String(d.professional_title || "").toLowerCase().includes(q)
    );
  }, [doctors, query]);

  return (
    <div className="space-y-2">
      <Label>Select Treating Doctor *</Label>
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor name or specialty"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your hospital's doctors…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (doctors || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No eligible doctors are linked to your hospital yet. A hospital administrator must approve the doctor's
          affiliation first.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctor matches your search.</p>
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {filtered.map((d) => {
            const selected = value === d.doctor_id;
            return (
              <button
                key={d.doctor_id}
                type="button"
                onClick={() => onChange(d.doctor_id)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  selected ? "bg-primary/5" : "hover:bg-accent/50"
                }`}
              >
                {d.photo_url ? (
                  <Image
                    src={d.photo_url}
                    alt={d.full_name}
                    className="w-10 h-10 rounded-full shrink-0"
                    fittingType="fill"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">Dr. {d.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 shrink-0" />
                    {[d.specialization, d.professional_title].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}