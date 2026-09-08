import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, Ban, RotateCcw } from "lucide-react";
import { medicationStatus, mealLabel, routeLabel, todayStr } from "@/lib/medicationUtils";

export default function MedicationsSection({ number, patient, editable }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Medication.filter({ patient_id: patient.id }, "-start_date");
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Medication.create({
        patient_id: patient.id,
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || "",
        name: name.trim(),
        start_date: startDate || new Date().toISOString().slice(0, 10),
        is_active: true,
      });
      setName("");
      setStartDate("");
      setShowAdd(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m, makeActive) => {
    try {
      await base44.entities.Medication.update(
        m.id,
        makeActive
          ? { is_active: true, stopped_date: "" }
          : { is_active: false, stopped_date: new Date().toISOString().slice(0, 10) }
      );
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const active = items.filter((m) => m.is_active !== false && (!m.end_date || m.end_date >= today));
  const stopped = items.filter((m) => !(m.is_active !== false && (!m.end_date || m.end_date >= today)));

  return (
    <SectionCard
      number={number}
      title="Medications"
      action={
        editable ? (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        ) : undefined
      }
    >
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Add Medication</p>
            <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Medication name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin" required />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Save Medication
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No medications were recorded.</p>
      ) : (
        <div className="space-y-3">
          {[...active, ...stopped].map((m) => (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 ${
                m.is_active === false ? "opacity-60" : ""
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm">{m.name}</p>
                  {m.source === "doctor_prescribed" ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Doctor-Prescribed
                    </span>
                  ) : m.source === "patient_reported" ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Patient-Reported
                    </span>
                  ) : null}
                </div>
                {(m.dose || m.route || m.frequency || m.meal_timing || m.duration) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[
                      m.dose,
                      m.route && routeLabel(m.route),
                      m.frequency,
                      m.meal_timing && mealLabel(m.meal_timing),
                      m.duration,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {medicationStatus(m, todayStr()) !== "active" && (
                  <p className="text-xs text-muted-foreground">
                    {m.stopped_date === m.end_date && m.end_date
                      ? `Completed${m.stopped_date ? ` — ${m.stopped_date}` : ""}`
                      : `Stopped${m.stopped_date ? ` — ${m.stopped_date}` : ""}`}
                  </p>
                )}
              </div>
              {editable &&
                (m.is_active === false ? (
                  <Button size="sm" variant="outline" onClick={() => toggleActive(m, true)}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restart
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleActive(m, false)}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> Stop
                  </Button>
                ))}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}