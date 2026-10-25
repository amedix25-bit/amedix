import React from "react";
import { AlertTriangle, CalendarHeart } from "lucide-react";

const RISK_CHIP = {
  high: "bg-red-100 text-red-800",
  intermediate: "bg-amber-100 text-amber-800",
  low: "bg-green-100 text-green-800",
  pending_assessment: "bg-muted text-muted-foreground",
};

// The prominent gestational-age banner shown throughout the antenatal
// interface: gestational age in completed weeks and days, trimester, current
// stage, current contact, dating information and the risk level.
export default function GestationalAgeBanner({ dating, pregnancy }) {
  if (!dating || !dating.complete) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Pregnancy dating incomplete</p>
          <p className="text-sm text-amber-800">Gestational age cannot be calculated until the LMP, EDD or ultrasound dating is recorded. Missing information is never assumed to be normal.</p>
        </div>
      </div>
    );
  }
  const risk = pregnancy?.risk_level || "pending_assessment";
  return (
    <div className="rounded-xl border border-border bg-primary/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><CalendarHeart className="w-4 h-4" /> Gestational age</p>
          <p className="text-3xl font-bold text-primary mt-1">{dating.label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Trimester: <span className="font-medium text-foreground">{dating.trimester_label}</span>
            {" · "}Stage: <span className="font-medium text-foreground">{dating.stage}</span>
          </p>
        </div>
        <div className="text-right space-y-1 text-sm">
          <p><span className="text-muted-foreground">Current contact:</span> <span className="font-medium">{dating.contact?.label}</span></p>
          <p><span className="text-muted-foreground">LMP:</span> {dating.lmp}</p>
          <p><span className="text-muted-foreground">EDD:</span> {dating.edd}</p>
          <p><span className="text-muted-foreground">Dating method:</span> {dating.dating_method === "ultrasound" ? "Ultrasound" : dating.dating_method === "lmp" ? "LMP" : dating.dating_method === "edd" ? "EDD" : "Clinical assessment"}</p>
          <p><span className="font-medium">Risk: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_CHIP[risk]}`}>{risk === "pending_assessment" ? "Pending assessment" : risk.charAt(0).toUpperCase() + risk.slice(1) + " risk"}</span></p>
        </div>
      </div>
      {pregnancy?.last_clinical_review_datetime && (
        <p className="text-xs text-muted-foreground mt-3">Latest clinical review: {new Date(pregnancy.last_clinical_review_datetime).toLocaleString()}</p>
      )}
    </div>
  );
}