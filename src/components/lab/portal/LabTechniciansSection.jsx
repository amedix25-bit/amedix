import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, UserCog } from "lucide-react";
import { hashPassword, randomSalt } from "@/lib/hashUtils";

const EMPTY = { full_name: "", age: "", sex: "", job_title: "", password: "" };

function makeUsername(fullName, labNumber) {
  const parts = String(fullName || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const base = `${parts[0] || "tech"}.${parts[parts.length - 1] || "staff"}`.replace(/[^a-z0-9.]/g, "");
  const suffix = String(labNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}.${suffix}`;
}

export default function LabTechniciansSection({ profile }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const techs = await base44.entities.LabTechnician.filter({ laboratory_id: profile.id });
      setItems(techs);
    } catch (err) {
      console.error(err);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleNameChange = (v) => {
    setForm((s) => ({ ...s, full_name: v }));
    setUsername(makeUsername(v, profile.lab_number));
  };

  const fail = (err) =>
    toast({
      title: "Something went wrong",
      description: err.response?.data?.error || err.message,
      variant: "destructive",
    });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.job_title.trim() || !form.password) {
      toast({ title: "Full name, job title, and password are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const salt = randomSalt();
      const passwordHash = await hashPassword(form.password, salt);
      const finalUsername = username.trim().toLowerCase() || makeUsername(form.full_name, profile.lab_number);
      await base44.entities.LabTechnician.create({
        laboratory_id: profile.id,
        laboratory_user_id: profile.user_id,
        laboratory_name: profile.lab_name,
        full_name: form.full_name.trim(),
        age: String(form.age || ""),
        sex: form.sex || "",
        job_title: form.job_title.trim(),
        username: finalUsername,
        password_hash: passwordHash,
        salt,
        is_active: true,
      });
      toast({
        title: "Technician added",
        description: `Login username: ${finalUsername} — share it with the technician.`,
      });
      setForm(EMPTY);
      setUsername("");
      setShowForm(false);
      load();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t) => {
    try {
      await base44.entities.LabTechnician.update(t.id, { is_active: !t.is_active, session_token: "" });
      toast({ title: t.is_active ? "Technician deactivated" : "Technician activated" });
      load();
    } catch (err) {
      fail(err);
    }
  };

  const removeTech = async (t) => {
    try {
      await base44.entities.LabTechnician.delete(t.id);
      toast({ title: "Technician removed" });
      load();
    } catch (err) {
      fail(err);
    }
  };

  const resetPassword = async (t) => {
    if (!newPassword) return;
    try {
      const salt = randomSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      await base44.entities.LabTechnician.update(t.id, { password_hash: passwordHash, salt, session_token: "" });
      toast({ title: "Password reset", description: "The technician must sign in again with the new password." });
      setResetId(null);
      setNewPassword("");
      load();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Add Technician / Staff
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Add Technician / Staff Member</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Age *</Label>
              <Input type="number" min="1" value={form.age} onChange={set("age")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Sex *</Label>
              <Select value={form.sex} onValueChange={(v) => setForm((s) => ({ ...s, sex: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input
                value={form.job_title}
                onChange={set("job_title")}
                placeholder="e.g. Medical Laboratory Technician"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username (auto-generated)</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="auto-generated" />
              <p className="text-xs text-muted-foreground">The technician uses this username to sign in.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Individual Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="Create a password for the technician"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Technician
          </Button>
        </form>
      )}

      {items === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No technicians yet. Add staff members — there is no limit.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-full bg-primary/10 items-center justify-center">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{t.full_name}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.is_active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {t.job_title && <span className="font-medium text-foreground/80">{t.job_title}</span>}
                      {t.sex && <span>· {t.sex.charAt(0).toUpperCase() + t.sex.slice(1)}</span>}
                      {t.age && <span>· {t.age} y</span>}
                      <span>· Username: <span className="font-mono">{t.username}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => toggleActive(t)}>
                    {t.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => { setResetId(resetId === t.id ? null : t.id); setNewPassword(""); }}>
                    Reset Password
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => removeTech(t)}>
                    Remove
                  </Button>
                </div>
              </div>
              {resetId === t.id && (
                <div className="flex flex-wrap gap-2 items-end border-t border-border mt-3 pt-3">
                  <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <Label className="text-xs">New password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter a new individual password"
                    />
                  </div>
                  <Button size="sm" onClick={() => resetPassword(t)} disabled={!newPassword}>
                    Save New Password
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}