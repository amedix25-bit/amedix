import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ExternalLink, FileCheck2, Globe2, ShieldCheck } from "lucide-react";
import { NSG_ATTRIBUTION_STATE, NSG_ICD11, NSG_REVIEW, noteSourcesFor } from "@/lib/neurosurgeryReferences";

// Guideline attribution for one note.
//
// Shows the published documents this note's structure follows — each with its
// own title, edition, publication date, population and review state — and the
// ICD-11 release the coding follows. Where the sources differ in scope or
// population, both are named and the clinician records which one was applied:
// the app never merges them into a single universal recommendation.

const NO_SOURCE = "None attributed";

const DocumentRow = ({ doc }) => {
  const state = NSG_ATTRIBUTION_STATE[doc.attribution] || NSG_ATTRIBUTION_STATE.title_verified;
  return (
    <div className="rounded-md border border-border bg-background p-2 space-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium leading-snug text-foreground">
          <span className="inline-block rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary mr-1 align-middle">
            {doc.organization}
          </span>
          {doc.title}
        </p>
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${doc.title}`}
          className="text-primary shrink-0 mt-0.5"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        {doc.edition || doc.kind}
        {doc.published ? ` · ${doc.published}` : " · publication date to be confirmed at local review"}
        {doc.kind && doc.edition ? ` · ${doc.kind}` : ""}
      </p>
      {doc.citation && <p className="text-[10px] text-muted-foreground leading-snug">{doc.citation}</p>}
      <p className="text-[10px] text-foreground/80 leading-snug">
        <span className="font-medium">Population:</span> {doc.population}
      </p>
      <p className={`text-[10px] leading-snug ${state.tone}`}>{state.label}</p>
    </div>
  );
};

export default function NeurosurgerySourceAttribution({ noteKey, attribution, onChange }) {
  const safe = attribution && typeof attribution === "object" ? attribution : {};
  const { documents, divergences, population } = noteSourcesFor(noteKey);
  const set = (patch) => onChange({ ...safe, ...patch });
  const applied = String(safe.guideline_applied || "");

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium flex items-center gap-1.5 text-foreground">
            <FileCheck2 className="w-3.5 h-3.5 text-primary" /> Guideline attribution
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            The published documents this note's structure follows. Population covered here: {population || "recorded per source"}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 shrink-0">
          <AlertTriangle className="w-2.5 h-2.5" /> Clinical review pending
        </span>
      </div>

      <div className="space-y-1.5">
        {documents.map((doc) => (
          <DocumentRow key={doc.key} doc={doc} />
        ))}
      </div>

      {divergences.length > 0 && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 p-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Where the sources differ — record what was applied
          </p>
          {divergences.map((line) => (
            <p key={line} className="text-[11px] text-amber-900 leading-relaxed">
              {line}
            </p>
          ))}
          <div className="space-y-1 pt-0.5">
            <Label className="text-[10px] text-amber-900">Guideline applied for this patient</Label>
            <Select
              value={applied || NO_SOURCE}
              onValueChange={(v) => set({ guideline_applied: v === NO_SOURCE ? "" : v })}
            >
              <SelectTrigger className="h-8 text-[11px] bg-white">
                <SelectValue placeholder="Select the source applied" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SOURCE} className="text-[11px]">
                  {NO_SOURCE}
                </SelectItem>
                {documents.map((doc) => (
                  <SelectItem key={doc.key} value={`${doc.organization} — ${doc.short}`} className="text-[11px]">
                    {doc.organization} — {doc.short}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={safe.population_applied || ""}
              onChange={(e) => set({ population_applied: e.target.value })}
              placeholder="Population / local protocol detail (e.g. adult pathway, local threshold)"
              className="h-8 text-[11px] bg-white"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-primary/20 bg-primary/5 p-2 space-y-1">
        <p className="text-[11px] font-medium text-primary flex items-center gap-1.5">
          <Globe2 className="w-3 h-3" /> {NSG_ICD11.label} — release {NSG_ICD11.release}
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          {NSG_ICD11.system} · {NSG_ICD11.system_uri}
        </p>
        <ul className="space-y-0.5">
          {NSG_ICD11.structure.map((line) => (
            <li key={line} className="text-[10px] text-foreground/85 leading-relaxed flex gap-1">
              <span className="text-primary">•</span>
              {line}
            </li>
          ))}
        </ul>
        <a
          href={NSG_ICD11.browser_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline pt-0.5"
        >
          <ExternalLink className="w-2.5 h-2.5" /> WHO ICD-11 browser
        </a>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1">
        <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" /> {NSG_REVIEW.label}.
      </p>
    </div>
  );
}