import React from "react";
import { Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  REFERRAL_SPECIALTIES,
  REFERRAL_URGENCIES,
  REFERRAL_STATUSES,
  REFERRAL_GUIDANCE,
  newReferral,
} from "@/lib/rheumReferrals";

// Structured referrals to the services rheumatology works with. Each referral
// carries the clinical question and what is requested back, so the receiving
// team receives a clinical question rather than an open-ended note.
export default function RheumReferralsField({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const update = (id, patch) => onChange(list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2.5">
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-3">
          No referral documented for this encounter. Add one only where another service is needed.
        </p>
      )}

      {list.map((r, index) => (
        <div key={r.id || index} className="rounded-lg border border-border p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">Referral {index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(list.filter((x) => x.id !== r.id))}
              title="Remove referral"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Service</Label>
              <Select value={r.specialty || undefined} onValueChange={(v) => update(r.id, { specialty: v })}>
                <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select service..." /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_SPECIALTIES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Urgency</Label>
              <Select value={r.urgency || "Routine"} onValueChange={(v) => update(r.id, { urgency: v })}>
                <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_URGENCIES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {r.specialty === "other" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Specialty name</Label>
              <Input value={r.other_specialty || ""} onChange={(e) => update(r.id, { other_specialty: e.target.value })} />
            </div>
          )}

          {r.specialty && REFERRAL_GUIDANCE[r.specialty] && (
            <p className="text-[11px] text-muted-foreground flex gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {REFERRAL_GUIDANCE[r.specialty]}
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Clinical question</Label>
            <Textarea
              rows={2}
              placeholder="What the receiving service is being asked to answer"
              value={r.question || ""}
              onChange={(e) => update(r.id, { question: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Relevant findings, results & therapy</Label>
            <Textarea
              rows={2}
              placeholder="Organ involvement, serology, imaging, current immunosuppressive therapy"
              value={r.findings || ""}
              onChange={(e) => update(r.id, { findings: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Requested from the service</Label>
              <Input
                placeholder="e.g. biopsy opinion, screening schedule, exercise programme"
                value={r.request || ""}
                onChange={(e) => update(r.id, { request: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={r.status || REFERRAL_STATUSES[0]} onValueChange={(v) => update(r.id, { status: v })}>
                <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...list, newReferral()])}>
        <Plus className="w-4 h-4" /> Add referral
      </Button>
    </div>
  );
}