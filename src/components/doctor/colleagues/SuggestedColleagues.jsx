import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ColleagueCard from "./ColleagueCard";

// Verified doctors from the same hospital or specialty the doctor has not
// connected with yet.
export default function SuggestedColleagues({ suggestions, onSendRequest, onViewProfile, busyId }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section>
      <h3 className="font-semibold text-sm mb-1">Suggested Colleagues</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Verified doctors from your hospital or specialty you haven't connected with yet.
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {suggestions.map((d) => (
          <ColleagueCard
            key={d.id}
            doctor={d}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => onViewProfile(d)}>
                  Profile
                </Button>
                <Button size="sm" disabled={busyId === d.id} onClick={() => onSendRequest(d)}>
                  {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                </Button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}