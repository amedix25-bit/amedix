import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, Hand, AlertTriangle } from "lucide-react";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import { formatDate, formatDateTime, reportStatus, studyMatch } from "@/lib/radiologistWorklist";
import RadiAntRequestLink from "@/components/radiologist/imaging/RadiAntRequestLink";

const OWNERSHIP = {
  mine: { label: "Yours", chip: "bg-blue-500/15 text-blue-700" },
  other: { label: "Other radiologist", chip: "bg-purple-500/15 text-purple-700" },
  finalized: { label: "Finalized", chip: "bg-emerald-500/15 text-emerald-700" },
  unassigned: { label: "Unassigned", chip: "bg-amber-500/15 text-amber-700" },
};

const PRIORITY_CHIP = {
  Emergency: "bg-red-500 text-white",
  Urgent: "bg-red-500/10 text-red-700",
};

const TH = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";

// Worklist table — one row per imaging request, every column taken from the
// record itself. Clicking a row opens the patient imaging case.
export default function WorklistTable({ rows, loading, claiming, onOpen, onClaim }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading the worklist...
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No studies in this view.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-360px)] overflow-y-auto">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr className="border-b border-border">
              <th className={TH}>Patient</th>
              <th className={TH}>CIN</th>
              <th className={TH}>Request ID</th>
              <th className={TH}>Examination</th>
              <th className={TH}>Modality</th>
              <th className={TH}>Priority</th>
              <th className={TH}>Study date</th>
              <th className={TH}>Ordering doctor</th>
              <th className={TH}>Study matching</th>
              <th className={TH}>Reporting status</th>
              <th className={TH}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const owner = OWNERSHIP[r.ownership] || OWNERSHIP.unassigned;
              const match = studyMatch(r.study_match);
              const report = reportStatus(r.report_status);
              const claimable = r.ownership === "unassigned" &&
                ["ready_for_reporting", "performed", "examination_completed"].includes(r.stage);
              return (
                <tr
                  key={r.id}
                  onClick={() => onOpen(r.id)}
                  className="cursor-pointer hover:bg-accent/50 align-top"
                >
                  <td className="px-3 py-2">
                    <p className="font-medium leading-tight flex items-center gap-1.5">
                      {r.patient_name}
                      {r.is_critical && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${owner.chip}`}>
                        {r.ownership === "other" && r.assigned_radiologist_name
                          ? `Dr. ${r.assigned_radiologist_name}`
                          : owner.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STAGE_CHIP[r.stage] || "bg-secondary"}`}>
                        {STAGE_LABELS[r.stage]}
                      </span>
                      {r.is_overdue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-700">Overdue</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.patient_cin}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <RadiAntRequestLink requestId={r.id} requestRef={r.request_id} />
                  </td>
                  <td className="px-3 py-2">
                    <p className="leading-tight">{r.examination}</p>
                    {r.body_part && <p className="text-[11px] text-muted-foreground">{r.body_part}</p>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.modality}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_CHIP[r.priority] || "bg-secondary text-muted-foreground"}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <p>{formatDate(r.study_date)}</p>
                    <p className="text-[11px] text-muted-foreground">{r.images_count} image file(s)</p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <p className="leading-tight">{r.ordering_doctor || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{r.routed_hospital || "—"}</p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${match.chip}`} title={r.study_instance_uid}>
                      {match.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${report.chip}`}>{report.label}</span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {r.report_version ? `v${r.report_version} · ${r.signed_by_name || ""}` : r.draft_radiologist_name ? `Dr. ${r.draft_radiologist_name}` : ""}
                    </p>
                    {r.report_version && (
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(r.signed_datetime)}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onOpen(r.id); }}>
                        Open Case
                      </Button>
                      {claimable && (
                        <Button size="sm" className="h-7 text-xs" disabled={claiming === r.id}
                          onClick={(e) => { e.stopPropagation(); onClaim(r); }}>
                          {claiming === r.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Hand className="w-3.5 h-3.5 mr-1" />}
                          Take Case
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}