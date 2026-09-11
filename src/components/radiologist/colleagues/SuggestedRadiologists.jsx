import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import RadiologistColleagueCard from "./RadiologistColleagueCard";

// Active radiologists from the same hospital or specialty the radiologist
// has not connected with yet.
export default function SuggestedRadiologists({ suggestions, onSendRequest, onViewProfile, busyId }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section>
      <h3 className="font-semibold text-sm mb-1">Suggested Colleagues</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Radiologists from your hospital or specialty you haven't connected with yet.
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {suggestions.map((r) => (
          <RadiologistColleagueCard
            key={r.id}
            colleague={r}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => onViewProfile(r)}>
                  Profile
                </Button>
                <Button size="sm" disabled={busyId === r.id} onClick={() => onSendRequest(r)}>
                  {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                </Button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}