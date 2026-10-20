import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus, Users } from "lucide-react";
import ColleagueCard from "./ColleagueCard";
import ColleagueSearch from "./ColleagueSearch";
import ColleagueProfileDialog from "./ColleagueProfileDialog";
import ConnectionRequests from "./ConnectionRequests";
import SuggestedColleagues from "./SuggestedColleagues";

const today = () => new Date().toISOString().slice(0, 10);

// My Colleagues — find, connect with and manage other verified doctors on
// the platform. Accepted colleagues can be selected when creating a
// Referral Letter so the receiving doctor's details are pre-filled.
export default function DoctorColleagues({ doctorProfile }) {
  const { toast } = useToast();
  const [connections, setConnections] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, [doctorProfile.id]);

  const load = async () => {
    try {
      const [sent, received, verified, dirRes] = await Promise.all([
        base44.entities.DoctorConnection.filter({ requester_doctor_id: doctorProfile.id }),
        base44.entities.DoctorConnection.filter({ recipient_doctor_id: doctorProfile.id }),
        base44.entities.DoctorProfile.filter({ is_verified: true }),
        base44.functions.invoke("doctorDirectory"),
      ]);
      // Only doctors with a real account, whose hospital (when set) is a
      // registered facility — and never the doctor's own duplicate profiles.
      const eligible = new Set(dirRes.data.doctor_ids || []);
      setConnections([...sent, ...received]);
      setDoctors(verified.filter(
        (d) => d.id !== doctorProfile.id &&
          d.user_id !== doctorProfile.user_id &&
          eligible.has(d.id)
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const otherId = (c) => (c.requester_doctor_id === doctorProfile.id ? c.recipient_doctor_id : c.requester_doctor_id);
  const otherName = (c) => (c.requester_doctor_id === doctorProfile.id ? c.recipient_name : c.requester_name);
  const connFor = (doctorId) =>
    (connections || []).find((c) => c.requester_doctor_id === doctorId || c.recipient_doctor_id === doctorId);

  const accepted = (connections || []).filter((c) => c.status === "accepted");
  const incoming = (connections || []).filter((c) => c.status === "pending" && c.recipient_doctor_id === doctorProfile.id);
  const outgoing = (connections || []).filter((c) => c.status === "pending" && c.requester_doctor_id === doctorProfile.id);
  const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d]));
  const connectedIds = new Set((connections || []).map(otherId));

  const sendRequest = async (doctor) => {
    setBusyId(doctor.id);
    try {
      const existing = connFor(doctor.id);
      if (existing?.status === "accepted") {
        toast({ title: "Already colleagues", description: `${doctor.full_name} is already in your colleagues list.` });
        return;
      }
      if (existing?.status === "pending") {
        toast({ title: "Request already pending", description: "A connection request is already awaiting a response." });
        return;
      }
      if (existing) await base44.entities.DoctorConnection.delete(existing.id);
      await base44.entities.DoctorConnection.create({
        requester_doctor_id: doctorProfile.id,
        requester_user_id: doctorProfile.user_id,
        requester_name: doctorProfile.full_name,
        recipient_doctor_id: doctor.id,
        recipient_user_id: doctor.user_id,
        recipient_name: doctor.full_name,
        status: "pending",
        date_requested: today(),
        datetime: new Date().toISOString(),
      });
      toast({ title: "Connection request sent", description: `Waiting for ${doctor.full_name} to respond.` });
      setViewDoctor(null);
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
      await base44.entities.DoctorConnection.update(conn.id, { status, date_responded: today() });
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
      await base44.entities.DoctorConnection.delete(conn.id);
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
      await base44.entities.DoctorConnection.delete(conn.id);
      toast({ title: "Request cancelled" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Could not cancel the request", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const score = (d) =>
    (d.hospital && d.hospital === doctorProfile.hospital ? 2 : 0) +
    (d.specialization && d.specialization === doctorProfile.specialization ? 1 : 0);
  const suggestions = doctors.filter((d) => !connectedIds.has(d.id)).sort((a, b) => score(b) - score(a)).slice(0, 6);

  const viewedConn = viewDoctor ? connFor(viewDoctor.id) : null;
  const dialogAction =
    viewDoctor && !viewedConn
      ? { label: "Send Connection Request", busy: busyId === viewDoctor.id, onClick: () => sendRequest(viewDoctor) }
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
      {/* Add Colleague — prominent button with the search bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Add Colleague
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Find verified doctors by full name, specialty, doctor ID or hospital.
            </p>
          </div>
          <Button variant={searchOpen ? "outline" : "default"} onClick={() => setSearchOpen(!searchOpen)}>
            {searchOpen ? "Close Search" : "Add Colleague"}
          </Button>
        </div>
        {searchOpen && (
          <div className="mt-4">
            <ColleagueSearch
              doctors={doctors}
              connectedIds={connectedIds}
              onSendRequest={sendRequest}
              onViewProfile={setViewDoctor}
              busyId={busyId}
            />
          </div>
        )}
      </div>

      {/* My Colleagues */}
      <section>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          My Colleagues ({accepted.length})
        </h3>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No colleagues yet. Use Add Colleague to connect with other verified doctors.
          </p>
        ) : (
          <div className="space-y-2.5">
            {accepted.map((c) => {
              const d = doctorMap[otherId(c)];
              return (
                <ColleagueCard
                  key={c.id}
                  doctor={d || { full_name: otherName(c) }}
                  actions={
                    <>
                      {d && (
                        <Button size="sm" variant="ghost" onClick={() => setViewDoctor(d)}>
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

      <ConnectionRequests
        incoming={incoming}
        outgoing={outgoing}
        doctorMap={doctorMap}
        onAccept={(c) => respond(c, "accepted")}
        onDecline={(c) => respond(c, "declined")}
        onCancel={cancelRequest}
        busyId={busyId}
      />

      <SuggestedColleagues
        suggestions={suggestions}
        onSendRequest={sendRequest}
        onViewProfile={setViewDoctor}
        busyId={busyId}
      />

      <ColleagueProfileDialog
        doctor={viewDoctor}
        open={!!viewDoctor}
        onOpenChange={(o) => !o && setViewDoctor(null)}
        action={dialogAction}
        note={dialogNote}
      />
    </div>
  );
}