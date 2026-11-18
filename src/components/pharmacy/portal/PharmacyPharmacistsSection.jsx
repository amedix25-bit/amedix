import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, UserCog, Users, Wifi, WifiOff, Pencil, Check, X } from "lucide-react";
import { hashPassword, randomSalt } from "@/lib/hashUtils";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function makeUsername(fullName, pharmacyName) {
  const parts = String(fullName || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const base = `${parts[0] || "staff"}.${parts[parts.length - 1] || "pharmacy"}`.replace(/[^a-z0-9.]/g, "");
  const suffix = String(pharmacyName || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "pharm";
  return `${base}.${suffix}`;
}

const isOnline = (r) =>
  !!r.last_active_datetime && Date.now() - new Date(r.last_active_datetime).getTime() < ONLINE_WINDOW_MS;

// Pharmacist management — the pharmacy administrator creates any number of
// pharmacist accounts, each with individual credentials, and can deactivate /
// reactivate them, reset their passwords, update their details, and see who
// is online. Deactivation never deletes historical dispensing records.
export default function PharmacyPharmacistsSection({ profile }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    try {
      const recs = await base44.entities.Pharmacist.filter({ pharmacy_id: profile.id });
      setItems(recs);
    } catch (err) {
      console.error(err);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNameChange = (v) => {
    setFullName(v);
    setUsername(makeUsername(v, profile.pharmacy_name));
  };

  const fail = (err) =>
    toast({
      title: "Something went wrong",
      description: err.response?.data?.error || err.message,
      variant: "destructive",
    });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !password) {
      toast({ title: "Full name and password are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const salt = randomSalt();
      const passwordHash = await hashPassword(password, salt);
      const finalUsername = username.trim().toLowerCase() || makeUsername(fullName, profile.pharmacy_name);
      await base44.entities.Pharmacist.create({
        pharmacy_id: profile.id,
        pharmacy_name: profile.pharmacy_name,
        pharmacy_user_id: profile.user_id,
        full_name: fullName.trim(),
        username: finalUsername,
        password_hash: passwordHash,
        salt,
        is_active: true,
      });
      toast({
        title: "Pharmacist created",
        description: `Login username: ${finalUsername} — share it with the pharmacist.`,
      });
      setFullName("");
      setUsername("");
      setPassword("");
      setShowForm(false);
      load();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r) => {
    try {
      await base44.entities.Pharmacist.update(r.id, { is_active: !r.is_active, session_token: "" });
      toast({ title: r.is_active ? "Pharmacist deactivated" : "Pharmacist activated" });
      load();
    } catch (err) {
      fail(err);
    }
  };

  const resetPassword = async (r) => {
    if (!newPassword) return;
    try {
      const salt = randomSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      await base44.entities.Pharmacist.update(r.id, { password_hash: passwordHash, salt, session_token: "" });
      toast({ title: "Password reset", description: "The pharmacist must sign in again with the new password." });
      setResetId(null);
      setNewPassword("");
      load();
    } catch (err) {
      fail(err);
    }
  };

  const saveName = async (r) => {
    if (!editName.trim()) return;
    try {
      await base44.entities.Pharmacist.update(r.id, { full_name: editName.trim() });
      toast({ title: "Details updated" });
      setEditId(null);
      setEditName("");
      load();
    } catch (err) {
      fail(err);
    }
  };

  const total = items ? items.length : 0;
  const online = items ? items.filter((r) => isOnline(r)).length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Pharmacists</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Wifi className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{online}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Online</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <WifiOff className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{total - online}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Offline</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create Pharmacist
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Create Pharmacist</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Each pharmacist gets their own individual login — accounts are never shared. They sign in at the pharmacist workspace.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={fullName} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Username (auto-generated)</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="auto-generated" />
              <p className="text-xs text-muted-foreground">The pharmacist uses this username to sign in.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Individual Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password for the pharmacist"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Pharmacist
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
          <p className="text-sm">No pharmacists yet. Add as many as you need — each with individual credentials.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{r.full_name}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.is_active ? "Active" : "Deactivated"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline(r) ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                      {isOnline(r) ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Username: {r.username}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
                    {r.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setResetId(resetId === r.id ? null : r.id); setNewPassword(""); }}>
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditId(editId === r.id ? null : r.id); setEditName(r.full_name); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {resetId === r.id && (
                <div className="flex flex-wrap gap-2 items-end border-t border-border mt-3 pt-3">
                  <div className="space-y-1.5 flex-1 min-w-0 sm:min-w-[200px]">
                    <Label className="text-xs">New password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter a new individual password"
                    />
                  </div>
                  <Button size="sm" onClick={() => resetPassword(r)} disabled={!newPassword}>
                    Save New Password
                  </Button>
                </div>
              )}
              {editId === r.id && (
                <div className="flex flex-wrap gap-2 items-end border-t border-border mt-3 pt-3">
                  <div className="space-y-1.5 flex-1 min-w-0 sm:min-w-[200px]">
                    <Label className="text-xs">Full name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => saveName(r)} disabled={!editName.trim()}>
                    <Check className="w-3.5 h-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    <X className="w-3.5 h-3.5" /> Cancel
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