import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GestationalAgeBanner from "@/components/doctor/antenatal/GestationalAgeBanner";
import AntenatalWindows from "@/components/doctor/antenatal/AntenatalWindows";
import AntenatalDatingForm from "@/components/doctor/antenatal/AntenatalDatingForm";
import { AlertTriangle, Activity, Baby, Loader2, Pencil, RefreshCw } from "lucide-react";

// Gestational-age-based antenatal care and screening — doctor side. Shows the
// prominent gestational age, the automated WHO / Libyan-protocol screening
// timeline (due / approaching / overdue items), computed risk flags and the
// dating editor. Data comes from the antenatalCare backend function, which
// enforces approved-doctor access and keeps the full audit trail.
export default function DoctorAntenatalSection({ patient, doctorProfile }) {
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const [riskLevel, setRiskLevel] = useState("");
  const [riskReason, setRiskReason] = useState("");
  const [savingRisk, setSavingRisk] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("antenatalCare", {
        action: "get_overview",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
      });
      setOv(res.data);
      setRiskLevel(res.data?.pregnancy?.risk_level || "");
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not load the antenatal record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patient.id]);

  const recordItem = async (item, windowKey, status) => {
    setBusyKey(item.key);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "record_item",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        item_key: item.key,
        item_label: item.label,
        window_key: windowKey,
        status,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not record the item.");
    } finally {
      setBusyKey(null);
    }
  };

  const saveRisk = async () => {
    if (!riskLevel) return;
    setSavingRisk(true);
    setError("");
    try {
      await base44.functions.invoke("antenatalCare", {
        action: "set_risk_level",
        patient_id: patient.id,
        doctor_id: doctorProfile?.id,
        risk_level: riskLevel,
        reason: riskReason,
      });
      setRiskReason("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not save the risk level.");
    } finally {
      setSavingRisk(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading antenatal record…</div>;
  }
  if (error && !ov) {
    return <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  }
  if (!ov) return null;
  const pregnancy = ov.pregnancy;

  if (!pregnancy) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Baby className="w-4 h-4" /> No active antenatal record for this patient yet. Start one by recording the pregnancy dating and obstetric history.</p>
        <AntenatalDatingForm patient={patient} initial={null} requireReason={false} onSaved={load} onCancel={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="rounded-xl border border-border p-4">
          <h4 className="font-semibold mb-3">Pregnancy dating and history</h4>
          <AntenatalDatingForm patient={patient} initial={pregnancy} requireReason onSaved={() => { setEditing(false); load(); }} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <GestationalAgeBanner dating={ov.dating} pregnancy={pregnancy} />
      )}

      {ov.flags.map((f) => (
        <div key={f.key} className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${f.severity === "high" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{f.message}</span>
        </div>
      ))}

      {!editing && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /> Update dating / history</Button>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh schedule</Button>
        </div>
      )}

      <AntenatalWindows schedule={ov.schedule} onRecordItem={recordItem} busyKey={busyKey} />

      <div className="rounded-xl border border-border p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4" /> Risk assessment</h4>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ov.computed_risk_flags.length === 0 && <p className="text-sm text-muted-foreground">No documented risk factors. Missing information is never treated as low risk — the risk level stays pending until assessed.</p>}
          {ov.computed_risk_flags.map((r, i) => (
            <span key={r.key + i} className="rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-xs">{r.message}</span>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Assign risk level</Label>
            <select className="flex h-9 rounded-md border border-border bg-background px-2 text-sm" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
              <option value="pending_assessment">Pending assessment</option>
              <option value="low">Low</option>
              <option value="intermediate">Intermediate</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">Reason</Label>
            <Input value={riskReason} onChange={(e) => setRiskReason(e.target.value)} placeholder="e.g. chronic hypertension + age 38" />
          </div>
          <Button size="sm" onClick={saveRisk} disabled={savingRisk || !riskLevel}>{savingRisk ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save risk level"}</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}