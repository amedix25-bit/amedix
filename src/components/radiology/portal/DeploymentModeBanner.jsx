import React from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, ShieldCheck } from "lucide-react";

// Deployment state banner — every screen of the radiology portal says in plain
// words how far this facility's imaging deployment has been verified, so
// demonstration data can never be mistaken for patient data.
export default function DeploymentModeBanner({ mode, onOpenDemo }) {
  if (!mode || mode === "live") return null;

  const demonstration = mode === "demonstration";
  const tone = demonstration
    ? "border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/10"
    : "border-[hsl(var(--info))]/40 bg-[hsl(var(--info))]/10";
  const Icon = demonstration ? FlaskConical : ShieldCheck;

  return (
    <div className={`rounded-xl border px-4 py-3 mb-5 flex flex-wrap items-start gap-3 ${tone}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 sm:min-w-[220px]">
        <p className="text-sm font-semibold">
          {demonstration ? "Demonstration environment" : "Verification environment"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {demonstration
            ? "Fictional patients and synthetic DICOM studies only. No hospital PACS is contacted and real patient images are refused by the server."
            : "The facility's own PACS may be tested with the endpoint its vendor confirmed. Real patient images stay blocked until live operation is activated."}
        </p>
      </div>
      {onOpenDemo && (
        <Button size="sm" variant="outline" onClick={onOpenDemo}>
          Rollout stages
        </Button>
      )}
    </div>
  );
}