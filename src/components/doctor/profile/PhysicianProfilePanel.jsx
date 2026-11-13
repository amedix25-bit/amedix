import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, UserCheck, UserMinus, UserPlus } from "lucide-react";
import PhysicianProfileView from "./PhysicianProfileView";
import PhysicianMessageDialog from "./PhysicianMessageDialog";
import ShareProfileButton from "./ShareProfileButton";
import { displayDoctor } from "@/lib/messaging";
import { useToast } from "@/components/ui/use-toast";

// Loads one physician's professional profile through the privacy-aware backend
// and renders it with the professional actions: Add Physician, Message (for
// connected physicians) and Share Profile.
export default function PhysicianProfilePanel({ doctorId, onConnectionChange }) {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("doctorProfessionalProfile", { action: "get", doctor_id: doctorId });
      setProfile(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "This professional profile could not be opened.");
    }
  }, [doctorId]);

  useEffect(() => {
    setProfile(null);
    load();
  }, [load]);

  const toggleConnection = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const action = profile.connection.is_colleague ? "removeColleague" : "addColleague";
      await base44.functions.invoke("doctorNetwork", { action, doctor_id: profile.doctor_id });
      await load();
      onConnectionChange?.();
      toast({
        title: profile.connection.is_colleague ? "Removed from your colleagues" : "Physician added",
        description: profile.connection.is_colleague
          ? `${displayDoctor(profile.full_name)} was removed from your professional contacts.`
          : `${displayDoctor(profile.full_name)} is now in your colleagues list. Patient record access is unchanged.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Could not update this connection", description: e?.response?.data?.error });
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <p className="rounded-xl border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>;
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const connection = profile.connection || {};
  const connectLabel = connection.is_colleague
    ? "Remove"
    : connection.pending === "incoming"
      ? "Accept Connection"
      : "Add Physician";

  const actions = (
    <>
      {!profile.is_self && (
        <Button
          size="sm"
          variant={connection.is_colleague ? "outline" : "default"}
          onClick={toggleConnection}
          disabled={busy || connection.available === false}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : connection.is_colleague ? (
            <UserMinus className="h-3.5 w-3.5" />
          ) : connection.pending === "incoming" ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {connectLabel}
        </Button>
      )}
      {!profile.is_self && connection.can_message && (
        <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
          <MessageSquare className="h-3.5 w-3.5" /> Message
        </Button>
      )}
      <ShareProfileButton doctorId={profile.doctor_id} name={displayDoctor(profile.full_name)} />
    </>
  );

  return (
    <div className="space-y-3">
      <PhysicianProfileView profile={profile} actions={actions} />

      {!profile.is_self && connection.available === false && connection.unavailable_reason ? (
        <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-[11px] text-warning">
          {connection.unavailable_reason}
        </p>
      ) : null}

      {!profile.is_self && connection.pending === "outgoing" ? (
        <p className="text-[11px] text-muted-foreground">
          Your connection request is awaiting {displayDoctor(profile.full_name)}&rsquo;s response.
        </p>
      ) : null}

      <PhysicianMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        doctor={{ full_name: profile.full_name, user_id: profile.doctor_user_id }}
      />
    </div>
  );
}