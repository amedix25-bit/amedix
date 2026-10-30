import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Loader2, ShieldCheck, MessageSquare, FileText } from "lucide-react";
import {
  OPHTH_STANDARD_VERSION,
  OPHTH_TECHNICAL_VERIFICATION,
  ophthStandards,
} from "@/lib/ophthalmologyStandardsRegister";

const STATUS_LABEL = {
  pending_review: "Pending department review",
  approved: "Approved by the Department",
  approved_with_comments: "Approved with comments",
  changes_requested: "Changes requested",
};

const STATUS_CLASS = {
  pending_review: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success",
  approved_with_comments: "bg-warning/10 text-warning",
  changes_requested: "bg-destructive/10 text-destructive",
};

const emptyReview = (standard) => ({
  specialty: "ophthalmology",
  standard_key: standard.key,
  standard_label: standard.label,
  standard_version: standard.version,
  status: "pending_review",
  comments: [],
  change_history: [],
});

// The Head of the Ophthalmology Department reviews, comments on and approves the
// documentation standards here. A recorded decision is clinical approval; the
// technical checks shown beside each standard are not.
export default function StandardApprovalPanel({ doctorProfile }) {
  const { toast } = useToast();
  const standards = useMemo(() => ophthStandards(), []);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState("");
  const [comment, setComment] = useState({});
  const [headConfirm, setHeadConfirm] = useState(false);
  const [saving, setSaving] = useState("");

  const reviewerName = doctorProfile?.full_name || "Ophthalmologist";

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await base44.entities.OphthalmologyStandardReview.filter({ specialty: "ophthalmology" });
        const map = {};
        (rows || []).forEach((r) => {
          map[r.standard_key] = r;
        });
        setReviews(map);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (standard, changes, historyNote) => {
    const existing = reviews[standard.key];
    const stamp = new Date().toISOString();
    const base = existing || emptyReview(standard);
    const payload = {
      ...base,
      ...changes,
      change_history: [
        ...(base.change_history || []),
        { datetime: stamp, action: changes.status || "comment", by_name: reviewerName, note: historyNote || "" },
      ],
    };
    const saved = existing
      ? await base44.entities.OphthalmologyStandardReview.update(existing.id, payload)
      : await base44.entities.OphthalmologyStandardReview.create(payload);
    setReviews((prev) => ({ ...prev, [standard.key]: saved }));
  };

  const addComment = async (standard) => {
    const text = (comment[standard.key] || "").trim();
    if (!text) return;
    setSaving(standard.key);
    try {
      const existing = reviews[standard.key] || emptyReview(standard);
      const stamp = new Date().toISOString();
      await persist(
        standard,
        {
          comments: [
            ...(existing.comments || []),
            {
              author_user_id: doctorProfile?.user_id || "",
              author_name: reviewerName,
              author_title: headConfirm ? "Head of the Ophthalmology Department" : "Ophthalmologist",
              datetime: stamp,
              text,
            },
          ],
        },
        `Comment: ${text.slice(0, 160)}`,
      );
      setComment((prev) => ({ ...prev, [standard.key]: "" }));
      toast({ title: "Comment recorded", description: "It stays attached to this standard." });
    } finally {
      setSaving("");
    }
  };

  const decide = async (standard, status) => {
    if (!headConfirm) {
      toast({
        title: "Confirm your authority first",
        description: "Only the Head of the Ophthalmology Department can record this decision.",
        variant: "destructive",
      });
      return;
    }
    setSaving(standard.key);
    try {
      await persist(
        standard,
        {
          status,
          reviewer_user_id: doctorProfile?.user_id || "",
          reviewer_name: reviewerName,
          reviewer_title: "Head of the Ophthalmology Department",
          head_confirmed: true,
          decision_datetime: new Date().toISOString(),
        },
        `Decision recorded: ${STATUS_LABEL[status]}`,
      );
      toast({
        title: STATUS_LABEL[status],
        description: `${standard.label} — decision recorded against ${standard.version}.`,
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading the standards register…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Ophthalmology Documentation Standards — Department Review
        </h3>
        <p className="text-xs text-muted-foreground">
          {OPHTH_STANDARD_VERSION}. Review each note type, comment on it, and record the department decision.
          {OPHTH_TECHNICAL_VERIFICATION} Only a decision recorded here makes a standard department-approved.
        </p>
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer">
        <Checkbox checked={headConfirm} onCheckedChange={(v) => setHeadConfirm(Boolean(v))} className="mt-0.5" />
        <span className="text-xs">
          I am the Head of the Ophthalmology Department (or hold the delegated authority) and I am recording a clinical
          decision on these documentation standards.
        </span>
      </label>

      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {standards.map((standard) => {
          const review = reviews[standard.key];
          const status = review?.status || "pending_review";
          const open = openKey === standard.key;
          return (
            <div key={standard.key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? "" : standard.key)}
                className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-accent/40 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{standard.label}</span>
                </span>
                <span className={`text-[10px] px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </button>

              {open && (
                <div className="px-3 pb-4 space-y-3 bg-muted/10">
                  <div className="text-[11px] text-muted-foreground space-y-1">
                    <p>
                      {standard.field_count} documented fields · {standard.references.length} mapped sources ·{" "}
                      {standard.icd_system} {standard.icd_release} ({standard.icd_catalogue_size} verified codes in the
                      specialty catalogue)
                    </p>
                    <p>Standard version: {standard.version}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold">Mapped sources</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1">
                      {standard.references.map((ref) => (
                        <li key={ref.key}>
                          {ref.organization} — {ref.title} ({ref.edition})
                          {ref.revision_verified
                            ? " · revision verified at build time"
                            : " · revision not independently verified; confirm before relying on it"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold">Department comments</p>
                    {(review?.comments || []).length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">No comments recorded.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {(review.comments || []).map((c, i) => (
                          <li key={i} className="text-[11px] rounded border border-border bg-background p-2">
                            <span className="font-medium">{c.author_name}</span>
                            {c.author_title ? ` · ${c.author_title}` : ""} ·{" "}
                            {c.datetime ? format(new Date(c.datetime), "MMM d, yyyy HH:mm") : ""}
                            <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Textarea
                      rows={2}
                      value={comment[standard.key] || ""}
                      onChange={(e) => setComment((prev) => ({ ...prev, [standard.key]: e.target.value }))}
                      placeholder="Comment on this standard: what to change, what to keep, what needs clinical agreement."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving === standard.key}
                      onClick={() => addComment(standard)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Add comment
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving === standard.key}
                      onClick={() => decide(standard, "approved")}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Approve standard
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving === standard.key}
                      onClick={() => decide(standard, "approved_with_comments")}
                    >
                      Approve with comments
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving === standard.key}
                      onClick={() => decide(standard, "changes_requested")}
                    >
                      Request changes
                    </Button>
                  </div>

                  {review?.decision_datetime && (
                    <p className="text-[11px] text-muted-foreground">
                      Last decision: {STATUS_LABEL[review.status]} — {review.reviewer_name}
                      {review.reviewer_title ? `, ${review.reviewer_title}` : ""} on{" "}
                      {format(new Date(review.decision_datetime), "MMM d, yyyy HH:mm")} against{" "}
                      {review.standard_version || standard.version}.
                    </p>
                  )}

                  {(review?.change_history || []).length > 0 && (
                    <details className="text-[11px]">
                      <summary className="cursor-pointer text-muted-foreground">Change history</summary>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {(review.change_history || []).map((h, i) => (
                          <li key={i}>
                            {h.datetime ? format(new Date(h.datetime), "MMM d, yyyy HH:mm") : ""} — {h.by_name} ·{" "}
                            {h.action}
                            {h.note ? ` · ${h.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        <Label className="text-[11px] font-semibold">Limitations to state in the audit report:</Label> AAO guidance is
        mapped, not reproduced, and no claim of AAO or ICD-11 certification is made. A standard approved here records
        departmental agreement with this app's documentation set; it does not certify clinical content against any
        external body.
      </p>
    </div>
  );
}