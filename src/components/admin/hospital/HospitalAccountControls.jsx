import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Power, PowerOff, Trash2, Loader2 } from "lucide-react";

export const HOSPITAL_STATUS_LABEL = {
  active: "Active",
  suspended: "Inactive",
  none: "No hospital account",
};

// Administrative controls over the hospital ACCOUNT itself, kept beside its
// registration record: an institution can be set inactive (withdrawn from
// clinical and messaging use immediately) or deleted outright. Every change is
// written to the registration's audit trail server-side.
export default function HospitalAccountControls({ item, onChanged, onDeleted }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [open, setOpen] = useState(false);

  const status = item.hospital_status || "none";
  const inactive = status === "suspended";

  const setStatus = async (next) => {
    setBusy("status");
    try {
      const res = await base44.functions.invoke("adminHospitalAuthorizations", {
        action: "set_hospital_status",
        id: item.id,
        status: next,
      });
      onChanged?.(res.data?.authorization || { ...item, hospital_status: next });
      toast({ title: next === "active" ? "Hospital set active" : "Hospital set inactive" });
    } catch (err) {
      toast({
        title: "Could not change the hospital status",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await base44.functions.invoke("adminHospitalAuthorizations", {
        action: "delete_hospital",
        id: item.id,
        confirm_name: confirmName,
      });
      toast({ title: "Hospital deleted", description: "Doctor and staff links were removed with it." });
      setOpen(false);
      onDeleted?.(item);
    } catch (err) {
      toast({
        title: "Could not delete the hospital",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  const nameMatches =
    confirmName.trim().toLowerCase() === String(item.hospital_name || "").trim().toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={busy === "status" || status === "none"}
        onClick={() => setStatus(inactive ? "active" : "suspended")}
      >
        {busy === "status" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : inactive ? (
          <Power className="w-4 h-4 mr-2" />
        ) : (
          <PowerOff className="w-4 h-4 mr-2" />
        )}
        {inactive ? "Set active" : "Set inactive"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-critical hover:text-critical">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete hospital
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {item.hospital_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the hospital account, its registration and authorization record, and its doctor and staff
              links. Patient clinical records are not deleted. The deletion is recorded in the administrative audit log
              and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-medium text-foreground">{item.hospital_name}</span> to confirm.
            </p>
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={item.hospital_name} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "delete"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!nameMatches || busy === "delete"}
              onClick={(e) => {
                e.preventDefault();
                if (nameMatches) remove();
              }}
            >
              {busy === "delete" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete hospital
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}