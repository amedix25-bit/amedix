import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, ShieldOff, ShieldCheck, Users } from "lucide-react";

const ROLE_LABEL = { administrator: "Radiology administrator", radiologist: "Radiologist", technician: "Technician" };
const STATUS_CHIP = {
  invited: "bg-secondary text-secondary-foreground",
  active: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  suspended: "bg-[hsl(var(--critical))]/10 text-[hsl(var(--critical))]",
};

// Radiology staff — roles are granted by the facility administrator, never
// self-declared. An invitation activates only for the account that signs in
// with the designated email; withdrawing access takes effect immediately.
export default function StaffModule() {
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", staff_role: "radiologist", license_number: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyPortalAdmin", { action: "staff_list" });
      setStaff(res.data?.staff || []);
      setCanManage(!!res.data?.can_manage);
    } catch (err) {
      setStaff([]);
      toast({ title: "Could not load staff", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.functions.invoke("radiologyPortalAdmin", { action: "staff_save", ...form });
      setForm({ name: "", email: "", staff_role: "radiologist", license_number: "", phone: "" });
      toast({ title: "Staff member designated", description: "The invitation activates when they sign in with that email." });
      load();
    } catch (err) {
      toast({ title: "Could not designate the staff member", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const change = async (member, status) => {
    setBusy(member.id);
    try {
      await base44.functions.invoke("radiologyPortalAdmin", { action: "staff_save", id: member.id, name: member.name, staff_role: member.staff_role, status });
      load();
    } catch (err) {
      toast({ title: "Could not update access", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  if (loading) return <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {canManage && (
        <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Designate radiology staff</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">AMedix email</Label>
              <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Portal role</Label>
              <Select value={form.staff_role} onValueChange={(v) => setForm({ ...form, staff_role: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="radiologist">Radiologist — interprets and signs reports</SelectItem>
                  <SelectItem value="technician">Technician — examinations and image import</SelectItem>
                  <SelectItem value="administrator">Radiology administrator — full oversight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Licence / registration (optional)</Label>
              <Input className="mt-1" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Designate
          </Button>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Radiology staff ({staff.length})</h2>
        </div>
        {staff.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No radiology staff designated yet.</p>
        ) : (
          <ul className="space-y-2">
            {staff.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ROLE_LABEL[m.staff_role] || m.staff_role} · {m.email || "no email"}
                    {m.license_number ? ` · ${m.license_number}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CHIP[m.status]}`}>
                    {m.status}
                  </span>
                  {canManage && m.status !== "suspended" && (
                    <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => change(m, "suspended")}>
                      <ShieldOff className="w-3.5 h-3.5 mr-1" /> Withdraw
                    </Button>
                  )}
                  {canManage && m.status === "suspended" && (
                    <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => change(m, "active")}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}