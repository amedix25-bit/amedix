import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import ColleagueCard from "./ColleagueCard";

// Search across verified doctors on the platform — by full name, specialty,
// doctor ID or hospital/clinic. Doctors already connected (any connection
// status) are excluded; they live in the other sections.
export default function ColleagueSearch({ doctors, connectedIds, onSendRequest, onViewProfile, busyId }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = q
    ? doctors
        .filter(
          (d) =>
            !connectedIds.has(d.id) &&
            [d.full_name, d.specialization, d.hospital].some(
              (v) => v && String(v).toLowerCase().includes(q)
            )
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
        Only verified doctors appear in search results.
      </p>

      {q && results.length === 0 && (
        <p className="text-sm text-muted-foreground mt-3">No verified doctors match your search.</p>
      )}
      <div className="space-y-2.5 mt-3">
        {results.map((d) => (
          <ColleagueCard
            key={d.id}
            doctor={d}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => onViewProfile(d)}>
                  View Profile
                </Button>
                <Button size="sm" disabled={busyId === d.id} onClick={() => onSendRequest(d)}>
                  {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Connection Request"}
                </Button>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}