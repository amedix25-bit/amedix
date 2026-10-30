import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, ShieldAlert, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import NeurologyApprovalPanel from "@/components/doctor/neurology/NeurologyApprovalPanel";
import { NEURO_REVIEW_SPECIALTY, neurologyApprovalState, neurologyGateLabel } from "@/lib/neurologyApproval";

// Compact deployment-gate strip shown with the neurology safety review.
//
// It states, from the recorded reviews only, whether the decision-support layer has
// been signed off. Opening it shows the register and the form a specialist uses to
// record a decision. When the register cannot be read the strip says so — it never
// shows "approved" on a failed load.
export default function NeurologyApprovalBanner() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const page = await base44.entities.NeurologyClinicalReview.filter(
        { specialty: NEURO_REVIEW_SPECIALTY },
        { sort: "-updated_date", limit: 50 }
      );
      setReviews(Array.isArray(page) ? page : page?.items || []);
    } catch (e) {
      setFailed(true);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const state = neurologyApprovalState(reviews);
  const approved = state.canDeploy;
  const Icon = approved ? ShieldCheck : ShieldAlert;

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-2 p-2 text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${approved ? "text-success" : "text-warning"}`} />
        <span className="flex-1">
          <span className="block text-[11px] font-semibold text-foreground">Clinical deployment status</span>
          <span className="block text-[10px] text-muted-foreground leading-snug">
            {loading
              ? "Reading the review register…"
              : failed
                ? "The review register could not be read, so deployment status is unknown — it is not approved by default."
                : neurologyGateLabel(state)}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-2">
          <NeurologyApprovalPanel reviews={reviews} onRecorded={load} />
        </div>
      )}
    </div>
  );
}