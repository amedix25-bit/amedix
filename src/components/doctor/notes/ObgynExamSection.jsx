import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import ObgynExamField from "@/components/doctor/notes/ObgynExamField";
import {
  examGroupsForDoc,
  examHasIntimate,
  EXAM_STATUS_OPTIONS,
  CONSENT_OPTIONS,
  CHAPERONE_OPTIONS,
  EXAM_STATUS_KEY,
  EXAM_STATUS_REASON_KEY,
  EXAM_CONSENT_KEY,
  EXAM_CHAPERONE_KEY,
  EXAM_CHAPERONE_NAME_KEY,
} from "@/lib/obgynExamSchema";

// Section-level keys live beside the group fields in the same values object —
// they are saved with the same prefix so nothing collides with template fields.
const STATUS_KEY = EXAM_STATUS_KEY;
const STATUS_REASON_KEY = EXAM_STATUS_REASON_KEY;
const CONSENT_KEY = EXAM_CONSENT_KEY;
const CHAPERONE_KEY = EXAM_CHAPERONE_KEY;
const CHAPERONE_NAME_KEY = EXAM_CHAPERONE_NAME_KEY;

// Structured, expandable Clinical Examination for OB/GYN notes. Doctors expand
// only the sections they need; entered findings survive collapsing because all
// values live in the parent note's state. Nothing is auto-populated as normal
// and no examination is marked performed without clinician confirmation.
export default function ObgynExamSection({ docKey, values, onChange }) {
  const groups = useMemo(() => examGroupsForDoc(docKey), [docKey]);
  const intimate = useMemo(() => examHasIntimate(docKey), [docKey]);
  const [open, setOpen] = useState(() => new Set());
  const [shortcutApplied, setShortcutApplied] = useState({});

  const v = values || {};
  const setVal = (key, val) => onChange({ ...v, [key]: val });

  const status = v[STATUS_KEY] || "";
  const reasonNeeded =
    status === "Not Examined" ||
    status === "Deferred" ||
    status === "Declined by Patient" ||
    status === "Not Indicated" ||
    status === "Unable to Assess";
  const chaperone = v[CHAPERONE_KEY] || "";

  const toggle = (key) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  // Document normal findings shortcut — pre-fills ONLY unanswered dropdown
  // fields that offer a Normal option in this group; numeric measurements and
  // free text are never fabricated, and the doctor still reviews and saves.
  const applyNormalShortcut = (group) => {
    const next = { ...v };
    group.fields.forEach((f) => {
      if (f.type === "select" && Array.isArray(f.options) && f.options.includes("Normal") && !String(next[f.key] ?? "").trim()) {
        next[f.key] = "Normal";
      }
    });
    onChange(next);
    setShortcutApplied((s) => ({ ...s, [group.key]: true }));
  };

  return (
    <div className="space-y-3">
      {/* Examination status, consent & chaperone — required where intimate
          examinations are part of this encounter type. */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Examination Status</Label>
            <Select value={status} onValueChange={(val) => setVal(STATUS_KEY, val)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Not recorded" /></SelectTrigger>
              <SelectContent>
                {EXAM_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {intimate && (
            <div className="space-y-1.5">
              <Label className="text-xs">Intimate Examination Consent</Label>
              <Select value={v[CONSENT_KEY] || ""} onValueChange={(val) => setVal(CONSENT_KEY, val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                <SelectContent>
                  {CONSENT_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {intimate && (
            <div className="space-y-1.5">
              <Label className="text-xs">Chaperone</Label>
              <Select value={chaperone} onValueChange={(val) => setVal(CHAPERONE_KEY, val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                <SelectContent>
                  {CHAPERONE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {intimate && chaperone === "Offered & Accepted" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Chaperone Identity</Label>
            <Input
              className="h-8 text-xs"
              value={v[CHAPERONE_NAME_KEY] || ""}
              placeholder="Name of the chaperone present"
              onChange={(e) => setVal(CHAPERONE_NAME_KEY, e.target.value)}
            />
          </div>
        )}
        {reasonNeeded && (
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (deferred / declined / not indicated)</Label>
            <Textarea
              rows={2}
              className="text-xs"
              value={v[STATUS_REASON_KEY] || ""}
              onChange={(e) => setVal(STATUS_REASON_KEY, e.target.value)}
              placeholder="Documented reason — emergency care is never delayed to complete this form"
            />
          </div>
        )}
      </div>

      {/* Expandable examination groups — collapsed by default, findings
          preserved when collapsed because values live in the note's state. */}
      {groups.map((group) => {
        const filled = group.fields.filter((f) => String(v[f.key] ?? "").trim() !== "").length;
        const abnormal = group.fields.filter((f) => String(v[f.key] ?? "").startsWith("Abnormal")).length;
        const isOpen = open.has(group.key);
        return (
          <div key={group.key} className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggle(group.key)}
            >
              <span className="flex items-center gap-2 min-w-0">
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
                <span className="text-sm font-medium truncate">{group.label}</span>
                {abnormal > 0 && (
                  <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-amber-700 border border-amber-300 bg-amber-50 rounded-full px-2 py-0.5">
                    ⚠ {abnormal} abnormal
                  </span>
                )}
                {!isOpen && abnormal === 0 && filled > 0 && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{filled} documented</span>
                )}
              </span>
              {group.normalShortcut && isOpen && (
                <span
                  role="button"
                  tabIndex={0}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    applyNormalShortcut(group);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      applyNormalShortcut(group);
                    }
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Document normal findings
                </span>
              )}
            </button>
            {isOpen && (
              <div className="p-3 space-y-2">
                {shortcutApplied[group.key] && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Normal findings pre-filled — review, complete measurements, then save. Nothing was marked as performed automatically.
                  </p>
                )}
                {group.fields.map((f) => (
                  <ObgynExamField key={f.key} field={f} value={v[f.key]} onChange={setVal} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}