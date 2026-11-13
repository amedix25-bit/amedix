import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { displayDoctor, initials } from "@/lib/messaging";
import { Loader2, Search, ShieldCheck, Clock, UserPlus, UserMinus, Building2, MessageSquare, Send } from "lucide-react";

// Doctor Portal → Find Doctors / My Colleagues.
//
// Only doctors verified by their own hospital are listed: verification is what
// opens the network, so a doctor who has not been verified by the hospital they
// work at is never shown here.
export default function FindDoctors({ profile }) {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [viewDoctor, setViewDoctor] = useState(null);
  const [messageTo, setMessageTo] = useState(null);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = async (query = "") => {
    try {
      const res = await base44.functions.invoke("doctorNetwork", { action: "list", search: query });
      setDoctors(res.data.doctors || []);
      setTotal(res.data.total_doctors ?? res.data.total_verified_doctors ?? 0);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.error || "The verified doctor network is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
  }, [profile?.id]);

  // Predictive search: from the second letter on, every keystroke searches the
  // network (debounced). A single letter keeps the full list on screen instead
  // of querying with a term too short to be meaningful.
  useEffect(() => {
    const query = search.trim();
    if (query.length === 1) return;
    const timer = setTimeout(() => load(query), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const colleagues = useMemo(() => doctors.filter((d) => d.is_colleague), [doctors]);
  const visible = filter === "colleagues" ? colleagues : doctors;

  const toggleColleague = async (doctor) => {
    setBusyId(doctor.doctor_id);
    try {
      const action = doctor.is_colleague ? "removeColleague" : "addColleague";
      await base44.functions.invoke("doctorNetwork", { action, doctor_id: doctor.doctor_id });
      setDoctors((prev) =>
        prev.map((d) => (d.doctor_id === doctor.doctor_id ? { ...d, is_colleague: !d.is_colleague } : d))
      );
      toast({
        title: doctor.is_colleague ? "Removed from colleagues" : "Added to colleagues",
        description: doctor.is_colleague
          ? `${displayDoctor(doctor.full_name)} was removed from your contact list.`
          : `${displayDoctor(doctor.full_name)} is now in your colleagues list. Clinical access is unchanged.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Could not update colleagues", description: e?.response?.data?.error });
    } finally {
      setBusyId("");
    }
  };

  const sendMessage = async () => {
    if (!messageTo || !subject.trim() || !messageBody.trim()) {
      toast({ variant: "destructive", title: "Subject and message are required" });
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("messagingApi", {
        action: "send",
        channel: "doctor",
        peer_user_id: messageTo.doctor_user_id,
        subject,
        body: messageBody,
      });
      toast({ title: "Message sent", description: `Your message reached ${displayDoctor(messageTo.full_name)}.` });
      setMessageTo(null);
      setSubject("");
      setMessageBody("");
    } catch (e) {
      toast({ variant: "destructive", title: "Message not sent", description: e?.response?.data?.error });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">Find Doctors</h2>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Loading the verified doctor network…"
                : search.trim().length > 1
                  ? `${doctors.length} of ${total} doctors match “${search.trim()}”`
                  : `${total} doctors across the AMedix network`}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
            {[
              { key: "all", label: "All doctors" },
              { key: "colleagues", label: `My colleagues (${colleagues.length})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  filter === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty or hospital"
            className="pl-9"
          />
        </div>

        {search.trim().length === 1 && (
          <p className="mt-2 text-[11px] text-muted-foreground">Type one more letter to search the network.</p>
        )}

        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          Colleagues are professional contacts only. Adding a colleague never grants access to their patients,
          medical records, clinical notes or hospital information.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          {filter === "colleagues"
            ? "You have not added any colleagues yet."
            : search.trim().length > 1
              ? `No doctor matches “${search.trim()}”.`
              : "No other doctor has joined the AMedix network yet."}
        </div>
      ) : (
        <div className="grid gap-2">
          {visible.map((doctor) => (
            <div key={doctor.doctor_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(doctor.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setViewDoctor(doctor)}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {displayDoctor(doctor.full_name)}
                  </button>
                  {doctor.verified ? (
                    <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
                      <Clock className="h-3 w-3" /> Awaiting verification
                    </Badge>
                  )}
                  {doctor.is_colleague && <Badge variant="secondary">Colleague</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {[doctor.specialization, doctor.hospital].filter(Boolean).join(" · ") || "Specialty not recorded"}
                </p>
                {!doctor.verified && (
                  <p className="text-[11px] text-warning">Messaging opens once AMedix verification is complete.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!doctor.verified} onClick={() => setMessageTo(doctor)}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button
                  size="sm"
                  variant={doctor.is_colleague ? "ghost" : "default"}
                  disabled={busyId === doctor.doctor_id || !doctor.verified}
                  onClick={() => toggleColleague(doctor)}
                >
                  {busyId === doctor.doctor_id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : doctor.is_colleague ? (
                    <UserMinus className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {doctor.is_colleague ? "Remove" : "Add colleague"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewDoctor} onOpenChange={(open) => !open && setViewDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewDoctor ? displayDoctor(viewDoctor.full_name) : ""}</DialogTitle>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                {viewDoctor.verified ? (
                  <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
                    <ShieldCheck className="h-3 w-3" /> AMedix verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
                    <Clock className="h-3 w-3" /> Awaiting AMedix verification
                  </Badge>
                )}
                {viewDoctor.is_colleague && <Badge variant="secondary">Colleague</Badge>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Primary specialty</p>
                <p>{viewDoctor.specialization || "Not recorded"}</p>
              </div>
              {viewDoctor.specialties?.length > 1 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Subspecialties</p>
                  <p>{viewDoctor.specialties.join(", ")}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Affiliated institution</p>
                <p className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {viewDoctor.hospital || "Not recorded"}
                </p>
              </div>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                Professional contact only — no clinical access is granted by this connection.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled={!viewDoctor.verified} onClick={() => { setMessageTo(viewDoctor); setViewDoctor(null); }}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!messageTo} onOpenChange={(open) => !open && setMessageTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {messageTo ? displayDoctor(messageTo.full_name) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write your message"
              rows={5}
            />
            <div className="flex justify-end">
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}