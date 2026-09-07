import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await base44.entities.User.list();
      setUsers(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await base44.entities.User.update(id, { role });
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-3">
      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No users found</p>
        </div>
      ) : (
        users.map((u) => (
          <div key={u.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-50 text-purple-700" : u.role === "doctor" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                {u.role || "user"}
              </span>
              <select
                value={u.role || "user"}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background"
              >
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
}