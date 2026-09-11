import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import RadiologistColleagueCard from "./RadiologistColleagueCard";

// Search across active radiologists on the platform — by full name,
// specialty or hospital. Radiologists already connected (any connection
// status) are excluded; they live in the other sections.
export default function RadiologistColleagueSearch({ radiologists, connectedIds, onSendRequest, onViewProfile, busyId }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = q
    ? radiologists
        .filter(
          (r) =>
            !connectedIds.has(r.id) &&
            [r.full_name, r.specialization, r.hospital].some((v) => v && String(v).toLowerCase().includes(q))
        )
        .slice(0, 10)
    : [];

  return (
    <div>
      <Input
        autoFocus
        placeholder="Search by full name, specialty or hospital..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        Only active radiologists appear in search results.
      </p>

      {q && results.length === 0 && (
        <p className="text-sm text-muted-foreground mt-3">No radiologists match your search.</p>
      )}
      <div className="space-y-2.5 mt-3">
        {results.map((r) => (
          <RadiologistColleagueCard
            key={r.id}
            colleague={r}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => onViewProfile(r)}>
                  View Profile
                </Button>
                <Button size="sm" disabled={busyId === r.id} onClick={() => onSendRequest(r)}>
                  {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Connection Request"}
                </Button>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}