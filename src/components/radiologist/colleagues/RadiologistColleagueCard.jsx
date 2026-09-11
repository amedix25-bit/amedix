import React from "react";
import DoctorAvatar from "@/components/DoctorAvatar";

// Clean professional card for a radiologist shown in colleague lists,
// search results and suggestions. `actions` receives the buttons for the
// section the card is rendered in.
export default function RadiologistColleagueCard({ colleague, actions }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <DoctorAvatar photoUrl={colleague.photo_url} name={colleague.full_name} className="w-11 h-11 text-sm" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{colleague.full_name}</p>
        <p className="text-sm text-muted-foreground truncate">{colleague.specialization || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{colleague.hospital || "—"}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}