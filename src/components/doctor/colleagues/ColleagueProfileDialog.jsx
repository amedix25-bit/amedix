import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import DoctorAvatar from "@/components/DoctorAvatar";

// Professional profile of another doctor: registered name, profile picture,
// specialty, hospital/clinic, doctor ID and contact — with the connection
// action (or status note) in the footer.
export default function ColleagueProfileDialog({ doctor, open, onOpenChange, action, note }) {
  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-4">
          <DoctorAvatar photoUrl={doctor.photo_url} name={doctor.full_name} className="w-16 h-16 text-lg" />
          <div className="min-w-0">
            <DialogTitle className="truncate">{doctor.full_name}</DialogTitle>
            <DialogDescription>{doctor.specialization || "—"}</DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Hospital / Clinic</p>
            <p className="font-medium truncate">{doctor.hospital || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Verification</p>
            <p className="font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified
            </p>
          </div>
        </div>

        <DialogFooter>
          {action ? (
            <Button onClick={action.onClick} disabled={action.busy}>
              {action.busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {action.label}
            </Button>
          ) : note ? (
            <p className="text-sm text-muted-foreground">{note}</p>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}