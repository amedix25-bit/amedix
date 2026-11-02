import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, UserMinus, ShieldCheck } from "lucide-react";

// Designated hospital messaging staff — who may handle conversations and which
// department they represent. Only the hospital administrator can change this.
export default function HospitalStaffPanel({ onChanged }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "staff" });
      setStaff(res.data.staff || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Staff could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setError("");
    setNotice("");
    if (!email.trim() || !department.trim()) {
      setError("Email and department are required.");
      return;
    }
    setBusy(true);
    try {
      await base44.functions.invoke("messagingApi", { action: "addStaff", email: email.trim(), name: name.trim(), department: department.trim(), role });
      setNotice("Messaging access granted.");
      setEmail("");
      setName("");
      setDepartment("");
      setRole("staff");
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setError(e?.response?.data?.error || "The staff member could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (member) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("messagingApi", { action: "removeStaff", staff_id: member.id, reactivate: member.status !== "active" });
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setError(e?.response?.data?.error || "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold"><UserPlus className="w-4 h-4" /> Designate Messaging Staff</h3>
        <div>
          <Label className="text-xs">AMedix account email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Name (optional)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown on their messages" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Administrative department</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Human Resources" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Role</Label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="staff">Staff — reply, assign and resolve</option>
            <option value="manager">Manager — also send announcements</option>
          </select>
        </div>
        {error && <p className="text-xs text-critical">{error}</p>}
        {notice && <p className="text-xs text-success">{notice}</p>}
        <Button onClick={add} disabled={busy} className="w-full">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Grant messaging access
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Access activates the first time they sign in with that email. They only see this hospital's conversations, never its management pages.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="font-heading text-sm font-semibold">Authorized Staff</p>
        </div>
        <div className="divide-y divide-border">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
          {!loading && staff.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">No additional messaging staff designated.</p>
          )}
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-2 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {s.department} · {s.role === "manager" ? "Manager" : "Staff"}
                  {s.email ? ` · ${s.email}` : ""}
                </p>
              </div>
              <span className={`rounded border px-1.5 py-0.5 text-[10px] ${
                s.status === "active"
                  ? "border-success/30 bg-success/10 text-success"
                  : s.status === "invited"
                    ? "border-info/30 bg-info/10 text-info"
                    : "border-border text-muted-foreground"
              }`}>
                {s.status === "active" ? "Active" : s.status === "invited" ? "Invited" : "Suspended"}
              </span>
              <Button size="sm" variant="outline" onClick={() => toggle(s)} disabled={busy}>
                {s.status === "active" ? <UserMinus className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}