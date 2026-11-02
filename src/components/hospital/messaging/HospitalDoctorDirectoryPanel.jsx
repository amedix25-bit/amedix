import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MessageSquarePlus } from "lucide-react";
import NewConversationForm from "@/components/messaging/NewConversationForm";
import { displayDoctor } from "@/lib/messaging";

// Hospital doctor directory — search by name, specialty, department or doctor
// ID, then open a conversation. Affiliations are read server-side.
export default function HospitalDoctorDirectoryPanel({ departments = [], onOpenInbox }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "directory" });
        setDoctors(res.data.doctors || []);
      } catch (e) {
        setError(e?.response?.data?.error || "The doctor directory could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const specialties = useMemo(
    () => [...new Set([...doctors.map((d) => d.specialization), ...departments].filter(Boolean))].sort(),
    [doctors, departments]
  );

  const filtered = doctors.filter((d) => {
    const matchesSpecialty = specialty === "all" || d.specialization === specialty;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [d.doctor_name, d.specialization, d.department, d.doctor_id, d.doctor_user_id]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return matchesSpecialty && matchesSearch;
  });

  if (selectedDoctor) {
    return (
      <NewConversationForm
        mode="hospital"
        doctors={doctors}
        defaultDoctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        onCreated={(thread) => onOpenInbox(thread)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, specialty, department or doctor ID…" className="pl-8" />
        </div>
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-xs">
          <option value="all">All specialties</option>
          {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {loading && <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
        {!loading && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">No affiliated doctors match this search.</p>
        )}
        {filtered.map((d) => (
          <div key={d.doctor_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{displayDoctor(d.doctor_name)}</p>
              <p className="text-xs text-muted-foreground">
                {d.specialization || "General"}
                {d.doctor_id ? ` · ID ${String(d.doctor_id).slice(-8)}` : ""}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedDoctor(d)}>
              <MessageSquarePlus className="w-4 h-4" /> Message
            </Button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Only doctors with an active affiliation to your hospital are listed.
      </p>
    </div>
  );
}