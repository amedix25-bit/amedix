import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus, Users } from "lucide-react";
import RadiologistColleagueCard from "./RadiologistColleagueCard";
import RadiologistColleagueSearch from "./RadiologistColleagueSearch";
import RadiologistColleagueProfileDialog from "./RadiologistColleagueProfileDialog";
import RadiologistConnectionRequests from "./RadiologistConnectionRequests";
import SuggestedRadiologists from "./SuggestedRadiologists";

const today = () => new Date().toISOString().slice(0, 10);

// My Colleagues — find, connect with and manage other active radiologists
// on the platform.
export default function RadiologistColleagues({ radiologistProfile }) {
  const { toast } = useToast();
  const [connections, setConnections] = useState(null);
  const [radiologists, setRadiologists] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewColleague, setViewColleague] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, [radiologistProfile.id]);

  const load = async () => {
    try {
      const [sent, received, active] = await Promise.all([
        base44.entities.RadiologistConnection.filter({ requester_radiologist_id: radiologistProfile.id }),
        base44.entities.RadiologistConnection.filter({ recipient_radiologist_id: radiologistProfile.id }),
        base44.entities.RadiologistProfile.filter({ status: "active" }),
      ]);
      setConnections([...sent, ...received]);
      setRadiologists(active.filter((r) => r.id !== radiologistProfile.id));
    } catch (err) {
      console.error(err);
    }
  };

  const otherId = (c) =>
    c.requester_radiologist_id === radiologistProfile.id ? c.recipient_radiologist_id : c.requester_radiologist_id;
  const otherName = (c) =>
    c.requester_radiologist_id === radiologistProfile.id ? c.recipient_name : c.requester_name;
  const connFor = (radiologistId) =>
    (connections || []).find(
      (c) => c.requester_radiologist_id === radiologistId || c.recipient_radiologist_id === radiologistId
    );

  const accepted = (connections || []).filter((c) => c.status === "accepted");
  const incoming = (connections || []).filter(
    (c) => c.status === "pending" && c.recipient_radiologist_id === radiologistProfile.id
  );
  const outgoing = (connections || []).filter(
    (c) => c.status === "pending" && c.requester_radiologist_id === radiologistProfile.id
  );
  const radiologistMap = Object.fromEntries(radiologists.map((r) => [r.id, r]));
  const connectedIds = new Set((connections || []).map(otherId));

  const sendRequest = async (radiologist) => {
    setBusyId(radiologist.id);
    try {
      const existing = connFor(radiologist.id);
      if (existing?.status === "accepted") {
        toast({ title: "Already colleagues", description: `${radiologist.full_name} is already in your colleagues list.` });
        return;
      }
      if (existing?.status === "pending") {
        toast({ title: "Request already pending", description: "A connection request is already awaiting a response." });
        return;
      }
      if (existing) await base44.entities.RadiologistConnection.delete(existing.id);
      await base44.entities.RadiologistConnection.create({
        requester_radiologist_id: radiologistProfile.id,
        requester_user_id: radiologistProfile.user_id,
        requester_name: radiologistProfile.full_name,
        recipient_radiologist_id: radiologist.id,
        recipient_user_id: radiologist.user_id,
        recipient_name: radiologist.full_name,
        status: "pending",
        date_requested: today(),
        datetime: new Date().toISOString(),
      });
      toast({ title: "Connection request sent", description: `Waiting for ${radiologist.full_name} to respond.` });
      setViewColleague(null);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Could not send the request", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (conn, status) => {
    setBusyId(conn.id);
    try {
      await base44.entities.RadiologistConnection.update(conn.id, { status, date_responded: today() });
      toast({
        title: status === "accepted" ? "Colleague added" : "Request declined",
        description: status === "accepted" ? `${otherName(conn)} is now in your My Colleagues list.` : undefined,
      });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const removeColleague = async (conn) => {
    if (!window.confirm(`Remove ${otherName(conn)} from your colleagues?`)) return;
    setBusyId(conn.id);
    try {
      await base44.entities.RadiologistConnection.delete(conn.id);
      toast({ title: "Colleague removed" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Could not remove the colleague", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const cancelRequest = async (conn) => {
    setBusyId(conn.id);
    try {
      await base44.entities.RadiologistConnection.delete(conn.id);
      toast({ title: "Request cancelled" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Could not cancel the request", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const score = (r) =>
    (r.hospital && r.hospital === radiologistProfile.hospital ? 2 : 0) +
    (r.specialization && r.specialization === radiologistProfile.specialization ? 1 : 0);
  const suggestions = radiologists
    .filter((r) => !connectedIds.has(r.id))
    .sort((a, b) => score(b) - score(a))
    .slice(0, 6);

  const viewedConn = viewColleague ? connFor(viewColleague.id) : null;
  const dialogAction =
    viewColleague && !viewedConn
      ? { label: "Send Connection Request", busy: busyId === viewColleague.id, onClick: () => sendRequest(viewColleague) }
      : null;
  const dialogNote =
    viewedConn?.status === "accepted"
      ? "Already in your My Colleagues list."
      : viewedConn?.status === "pending"
        ? "Connection request pending."
        : null;

  if (connections === null) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading colleagues...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Add Colleague
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Find radiologists by full name, specialty or hospital.
            </p>
          </div>
          <Button variant={searchOpen ? "outline" : "default"} onClick={() => setSearchOpen(!searchOpen)}>
            {searchOpen ? "Close Search" : "Add Colleague"}
          </Button>
        </div>
        {searchOpen && (
          <div className="mt-4">
            <RadiologistColleagueSearch
              radiologists={radiologists}
              connectedIds={connectedIds}
              onSendRequest={sendRequest}
              onViewProfile={setViewColleague}
              busyId={busyId}
            />
          </div>
        )}
      </div>

      <section>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          My Colleagues ({accepted.length})
        </h3>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No colleagues yet. Use Add Colleague to connect with other radiologists.
          </p>
        ) : (
          <div className="space-y-2.5">
            {accepted.map((c) => {
              const r = radiologistMap[otherId(c)];
              return (
                <RadiologistColleagueCard
                  key={c.id}
                  colleague={r || { full_name: otherName(c) }}
                  actions={
                    <>
                      {r && (
                        <Button size="sm" variant="ghost" onClick={() => setViewColleague(r)}>
                          View Profile
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => removeColleague(c)} disabled={busyId === c.id}>
                        Remove
                      </Button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <RadiologistConnectionRequests
        incoming={incoming}
        outgoing={outgoing}
        radiologistMap={radiologistMap}
        onAccept={(c) => respond(c, "accepted")}
        onDecline={(c) => respond(c, "declined")}
        onCancel={cancelRequest}
        busyId={busyId}
      />

      <SuggestedRadiologists
        suggestions={suggestions}
        onSendRequest={sendRequest}
        onViewProfile={setViewColleague}
        busyId={busyId}
      />

      <RadiologistColleagueProfileDialog
        colleague={viewColleague}
        open={!!viewColleague}
        onOpenChange={(o) => !o && setViewColleague(null)}
        action={dialogAction}
        note={dialogNote}
      />
    </div>
  );
}