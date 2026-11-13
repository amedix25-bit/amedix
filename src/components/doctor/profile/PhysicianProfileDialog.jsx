import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PhysicianProfilePanel from "./PhysicianProfilePanel";

// Opens a physician's professional profile in place — from a search result, a
// colleague card or a connection request — so the profile is seen BEFORE a
// connection is accepted or sent.
export default function PhysicianProfileDialog({ doctorId, open, onOpenChange, onConnectionChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="sr-only">Physician professional profile</DialogTitle>
        {open && doctorId ? (
          <PhysicianProfilePanel doctorId={doctorId} onConnectionChange={onConnectionChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}