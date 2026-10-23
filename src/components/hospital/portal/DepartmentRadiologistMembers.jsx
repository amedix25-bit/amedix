import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, UserMinus, Search, Users, ShieldCheck } from "lucide-react";

// Hospital Portal — Radiology Department membership. The facility
// administrator associates verified radiologists with this facility's
// department (by account email) and removes them. Membership is stored
// against the facility ID on the radiologist's profile — never self-declared.
export default function DepartmentRadiologistMembers({ profile }) {
  const { toast } = useToast();
  const [members, setMembers] = useState(null);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyDepartmentMembership", { action: "list" });
      setMembers(res.data.members || []);
    } catch (err) {
      setMembers([]);
      toast({
        title: "Could not load department radiologists",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const search = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setCandidate(null);
    try {
      const res = await base44.functions.invoke("radiologyDepartmentMembership", { action: "search", email });
      if (!res.data.found) {
        toast({ title: "Radiologist not found", description: res.data.reason || "No radiologist account matches this email." });
      } else if (res.data.already_member) {
        toast({ title: "Already associated", description: `${res.data.radiologist.full_name} is already part of your radiology department.` });
      } else {
        setCandidate(res.data.radiologist);
      }
    } catch (err) {
      toast({ title: "Search failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const add = async (r) => {
    setBusy(r.user_id);
    try {
      await base44.functions.invoke("radiologyDepartmentMembership", { action: "add", radiologist_user_id: r.user_id });
      toast({ title: "Radiologist associated", description: `${r.full_name} can now open your department worklist.` });
      setCandidate(null);
      setEmail("");
      load();
    } catch (err) {
      toast({ title: "Could not associate the radiologist", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const remove = async (m) => {
    setBusy(m.user_id);
    try {
      await base44.functions.invoke("radiologyDepartmentMembership", { action: "remove", radiologist_user_id: m.user_id });
      toast({ title: "Radiologist removed", description: `${m.full_name} no longer has access to your department worklist.` });
      load();
    } catch (err) {
      toast({ title: "Could not remove the radiologist", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <p className="font-semibold">Department Radiologists</p>
          <p className="text-sm text-muted-foreground mt-1">
            Associate verified radiologist accounts with {profile.hospital_name}'s radiology department.
            Associated radiologists see this facility's worklist and can claim and report studies —
            and only them.
          </p>
        </div>
      </div>

      {members === null ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No radiologists are associated with this department yet — search by account email below.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium truncate flex items-center gap-2">
                  {m.full_name}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    m.source === "home_facility" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"
                  }`}>
                    {m.source === "home_facility" ? "home facility" : "added by you"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {m.specialization}{m.license_number ? ` · License ${m.license_number}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === m.user_id}
                onClick={() => remove(m)}
                className="shrink-0 text-red-600 hover:text-red-700"
              >
                {busy === m.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Radiologist account email…"
            autoComplete="email"
          />
          <Button onClick={search} disabled={searching || !email.trim()} className="shrink-0">
            {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Find
          </Button>
        </div>
        {candidate && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-accent/40">
            <div className="min-w-0">
              <p className="font-medium truncate flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                {candidate.full_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {candidate.specialization}{candidate.license_number ? ` · License ${candidate.license_number}` : ""}
              </p>
            </div>
            <Button size="sm" disabled={busy === candidate.user_id} onClick={() => add(candidate)} className="shrink-0">
              {busy === candidate.user_id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
              Associate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}