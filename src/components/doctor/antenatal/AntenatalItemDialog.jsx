import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// The recording dialog for antenatal schedule items:
//  - COMPLETED: the clinician documents the outcome (normal / abnormal) — an
//    abnormal finding REQUIRES a documented management or follow-up plan, and
//    is never treated as a confirmed diagnosis on its own.
//  - ORDERED (imaging): the clinician links an existing open imaging request
//    (created through the normal AMedix imaging workflow) so the request and
//    its final report flow back into the pregnancy record.
export default function AntenatalItemDialog({ open, item, mode, patientId, doctorId, onClose, onSubmit, busy }) {
  const [outcome, setOutcome] = useState("normal");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState("");
  const [requests, setRequests] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setOutcome("normal"); setNotes(""); setPlan(""); setSelectedId(""); setLoadErr(""); setRequests(null);
    if (mode === "ordered") {
      base44.functions.invoke("antenatalCare", { action: "list_open_imaging_requests", patient_id: patientId, doctor_id: doctorId })
        .then((res) => setRequests(res.data?.requests || []))
        .catch((e) => setLoadErr(e?.response?.data?.error || e.message || "Could not load open imaging requests."));
    }
  }, [open, mode]);

  const submit = () => {
    const payload = { notes };
    if (mode === "completed") {
      if (outcome === "abnormal" && !plan.trim()) return;
      payload.outcome = outcome;
      payload.followup_plan = outcome === "abnormal" ? plan.trim() : "";
    }
    if (mode === "ordered") payload.linked_imaging_request_id = selectedId;
    onSubmit(payload);
  };

  const planMissing = mode === "completed" && outcome === "abnormal" && !plan.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === "completed" ? "Record item as completed" : "Record item as ordered"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">{item?.label}</p>

        {mode === "completed" ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Outcome</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" size="sm" variant={outcome === "normal" ? "default" : "outline"} onClick={() => setOutcome("normal")}>Normal</Button>
                <Button type="button" size="sm" variant={outcome === "abnormal" ? "default" : "outline"} className={outcome === "abnormal" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => setOutcome("abnormal")}>Abnormal finding</Button>
              </div>
            </div>
            {outcome === "abnormal" && (
              <div>
                <Label className="text-xs">Management / follow-up plan <span className="text-red-600">required</span></Label>
                <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. referral to maternal-fetal medicine; repeat scan in 4 weeks" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">A screening finding is never treated as a confirmed diagnosis without appropriate clinical assessment.</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {loadErr && <p className="text-sm text-red-600">{loadErr}</p>}
            {requests === null && !loadErr && <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading open imaging requests…</div>}
            {requests !== null && requests.length === 0 && <p className="text-sm text-muted-foreground">No open imaging requests for this patient. Create the request through the normal imaging workflow, then link it here.</p>}
            {requests !== null && requests.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {requests.map((r) => (
                  <button key={r.id} type="button" onClick={() => setSelectedId(r.id)} className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 ${selectedId === r.id ? "bg-accent" : ""}`}>
                    <span className="font-medium">{r.request_id}</span> · {r.scan_type} — {r.examination}
                    <span className="text-xs text-muted-foreground block">{r.workflow_status === "requested" ? "Submitted" : r.workflow_status}</span>
                  </button>
                ))}
              </div>
            )}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">The final report flows back to this pregnancy record through the radiology workflow once released.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || planMissing || (mode === "ordered" && requests === null)}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}