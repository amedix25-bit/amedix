import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// The recording dialog for antenatal schedule items.
//  - COMPLETED: outcome (normal / abnormal) + optional result details — an
//    abnormal finding REQUIRES a documented management or follow-up plan.
//  - STATUS: the structured screening status (sample collected, pending
//    result, result available, normal / negative, abnormal / positive,
//    inconclusive, declined, not indicated) — statuses are not
//    interchangeable; declined and not-indicated require a documented reason.
//  - ORDERED (imaging): links an existing open imaging request so the request
//    and its final report flow back into the pregnancy record.
//  - REVIEW: documented clinical review of an abnormal / inconclusive result.
export default function AntenatalItemDialog({ open, item, mode, patientId, doctorId, onClose, onSubmit, busy }) {
  const [outcome, setOutcome] = useState("normal");
  const [status, setStatus] = useState("normal");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultUnits, setResultUnits] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [indication, setIndication] = useState("");
  const [responsible, setResponsible] = useState("");
  const [requests, setRequests] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setOutcome("normal"); setStatus("normal"); setNotes(""); setPlan("");
    setResultValue(""); setResultUnits(""); setReferenceRange(""); setInterpretation("");
    setIndication(""); setResponsible(""); setSelectedId(""); setLoadErr(""); setRequests(null);
    if (mode === "ordered") {
      base44.functions.invoke("antenatalCare", { action: "list_open_imaging_requests", patient_id: patientId, doctor_id: doctorId })
        .then((res) => setRequests(res.data?.requests || []))
        .catch((e) => setLoadErr(e?.response?.data?.error || e.message || "Could not load open imaging requests."));
    }
  }, [open, mode]);

  const showResult = mode === "completed" || mode === "status";
  const statusResult = mode === "status" && ["normal", "abnormal", "inconclusive", "result_available"].includes(status);

  const submit = () => {
    const payload = { notes };
    if (mode === "completed") {
      if (outcome === "abnormal" && !plan.trim()) return;
      payload.outcome = outcome;
      payload.followup_plan = outcome === "abnormal" ? plan.trim() : "";
      payload.clinical_indication = indication.trim();
      payload.result_value = resultValue.trim();
      payload.result_units = resultUnits.trim();
      payload.reference_range = referenceRange.trim();
      payload.interpretation = interpretation.trim();
    }
    if (mode === "status") {
      payload.status = status;
      if (["normal", "abnormal", "inconclusive", "result_available"].includes(status)) {
        payload.followup_plan = plan.trim();
        payload.result_value = resultValue.trim();
        payload.result_units = resultUnits.trim();
        payload.reference_range = referenceRange.trim();
        payload.interpretation = interpretation.trim();
        payload.clinical_indication = indication.trim();
      }
      if (["declined", "not_indicated"].includes(status)) payload.deferral_reason = plan.trim();
    }
    if (mode === "ordered") payload.linked_imaging_request_id = selectedId;
    if (mode === "review") {
      payload.followup_plan = plan.trim();
      payload.responsible_clinician = responsible.trim();
      payload.notes = notes;
    }
    onSubmit(payload);
  };

  const blocked =
    (mode === "completed" && outcome === "abnormal" && !plan.trim()) ||
    (mode === "status" && status === "abnormal" && !plan.trim()) ||
    (mode === "status" && ["declined", "not_indicated"].includes(status) && !plan.trim()) ||
    (mode === "ordered" && !selectedId) ||
    (mode === "review" && !plan.trim());

  const title =
    mode === "completed" ? "Record item as completed" :
    mode === "ordered" ? "Record item as ordered" :
    mode === "review" ? "Document clinical review" :
    "Record screening status";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">{item?.label}</p>

        {mode === "ordered" ? (
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
        ) : mode === "review" ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Management / follow-up plan <span className="text-red-600">required</span></Label>
              <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. repeat scan in 4 weeks; refer to maternal-fetal medicine" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Responsible clinician</Label>
              <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="e.g. Dr. Ahmed — obstetric team" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Review notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">The finding stays tracked until the review and the action taken are documented — a missing result is never treated as negative.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === "status" && (
              <div>
                <Label className="text-xs">Structured status</Label>
                <select className="flex h-9 w-full rounded-md border border-border bg-background px-2 text-sm mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="normal">Normal / negative</option>
                  <option value="abnormal">Abnormal / positive</option>
                  <option value="inconclusive">Inconclusive</option>
                  <option value="sample_collected">Sample collected</option>
                  <option value="pending_result">Pending result</option>
                  <option value="result_available">Result available — awaiting review</option>
                  <option value="declined">Declined by patient</option>
                  <option value="not_indicated">Not indicated</option>
                </select>
              </div>
            )}
            {mode === "completed" && (
              <div>
                <Label className="text-xs">Outcome</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={outcome === "normal" ? "default" : "outline"} onClick={() => setOutcome("normal")}>Normal</Button>
                  <Button type="button" size="sm" variant={outcome === "abnormal" ? "default" : "outline"} className={outcome === "abnormal" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => setOutcome("abnormal")}>Abnormal finding</Button>
                </div>
              </div>
            )}
            {showResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Result value</Label>
                  <Input value={resultValue} onChange={(e) => setResultValue(e.target.value)} placeholder="e.g. 8.9" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Units</Label>
                  <Input value={resultUnits} onChange={(e) => setResultUnits(e.target.value)} placeholder="e.g. g/dL" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Reference range</Label>
                  <Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="e.g. 11.0-15.0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Clinical indication</Label>
                  <Input value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="e.g. routine antenatal screening" className="mt-1" />
                </div>
              </div>
            )}
            {(showResult || mode === "status") && (
              <div>
                <Label className="text-xs">Interpretation</Label>
                <Input value={interpretation} onChange={(e) => setInterpretation(e.target.value)} placeholder="e.g. mild anemia — below reference range" className="mt-1" />
              </div>
            )}
            {((mode === "completed" && outcome === "abnormal") || (mode === "status" && status === "abnormal")) && (
              <div>
                <Label className="text-xs">Management / follow-up plan <span className="text-red-600">required</span></Label>
                <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. referral to maternal-fetal medicine; repeat scan in 4 weeks" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">A screening finding is never treated as a confirmed diagnosis without appropriate clinical assessment.</p>
              </div>
            )}
            {mode === "status" && ["inconclusive", "sample_collected", "pending_result", "result_available"].includes(status) && (
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
              </div>
            )}
            {mode === "status" && ["declined", "not_indicated"].includes(status) && (
              <div>
                <Label className="text-xs">Documented reason <span className="text-red-600">required</span></Label>
                <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder={status === "declined" ? "e.g. patient declined after counselling" : "e.g. not indicated for this patient"} className="mt-1" />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy || blocked || (mode === "ordered" && requests === null)}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}