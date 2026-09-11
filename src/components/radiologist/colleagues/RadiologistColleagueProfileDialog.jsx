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

// Professional profile of another radiologist: registered name, profile
// picture, specialty, hospital/imaging center, license number and contact —
// with the connection action (or status note) in the footer.
export default function RadiologistColleagueProfileDialog({ colleague, open, onOpenChange, action, note }) {
  if (!colleague) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-4">
          <DoctorAvatar photoUrl={colleague.photo_url} name={colleague.full_name} className="w-16 h-16 text-lg" />
          <div className="min-w-0">
            <DialogTitle className="truncate">{colleague.full_name}</DialogTitle>
            <DialogDescription>{colleague.specialization || "—"}</DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Hospital / Imaging Center</p>
            <p className="font-medium truncate">{colleague.hospital || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">License / Reg. No</p>
            <p className="font-medium truncate">{colleague.license_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="font-medium truncate">{colleague.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {colleague.status === "active" ? "Active" : "Suspended"}
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