import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Library, MapPin } from "lucide-react";
import {
  guidanceForUroNote,
  uroLocalProtocolsFor,
  uroGuidanceBasis,
  URO_LOCAL_PROTOCOL_NOTICE,
  URO_PRIMARY_REFERENCE_NOTE,
} from "@/lib/uroReferences";
import { asObject } from "@/lib/uroFieldKit";

// The guideline basis recorded with the note, in two labelled parts: the
// INTERNATIONAL recommendations the documentation follows (EAU primary), and the
// LOCALLY approved protocols of the institution. The two are never merged — an
// international recommendation is not a local approval, and the note states
// plainly when no local protocol is registered.
//
// A publication year or version AMedix could not confirm is shown as NOT RECORDED
// with the instruction to confirm it at the issuing body. No date is invented.

const referenceLine = (r) => {
  const bits = [];
  if (r.edition) bits.push(r.edition);
  bits.push(r.publication_year ? `published ${r.publication_year}` : "publication year not recorded");
  if (r.guideline_version) bits.push(`version ${r.guideline_version}`);
  if (r.latest_update) bits.push(`latest update ${r.latest_update}`);
  return bits.join(" · ");
};

export default function UroGuidanceField({ value, noteKey, onChange }) {
  const state = asObject(value);
  const refs = guidanceForUroNote(noteKey);
  const local = uroLocalProtocolsFor(noteKey);
  const basis = uroGuidanceBasis(noteKey);
  const primaryRefs = refs.filter((r) => r.primary);
  const otherRefs = refs.filter((r) => !r.primary);

  const record = () =>
    onChange({
      text: basis,
      references: refs.map((r) => r.key),
      local_protocols: local.map((p) => p.key),
      recorded_datetime: new Date().toISOString(),
    });

  const Row = ({ r }) => (
    <li className="text-[11px] leading-relaxed">
      <span className="font-medium">{r.issuing_organization}</span> — {r.title}
      <span className="text-muted-foreground"> ({referenceLine(r)}; {r.population})</span>
      {r.status !== "current" && (
        <span className="ml-1 inline-flex items-center gap-1 text-warning">
          <AlertTriangle className="h-3 w-3" /> edition not confirmed
        </span>
      )}
      <a href={r.source_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 text-primary hover:underline">
        <ExternalLink className="h-3 w-3" /> source
      </a>
      <span className="block text-[10px] text-muted-foreground">Checked against the issuing body: {r.last_verified_date}</span>
    </li>
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Library className="h-3.5 w-3.5 text-primary" /> Guideline basis of this note
        </p>
        <Link to="/clinical-references" className="flex shrink-0 items-center gap-1 text-[11px] text-primary">
          References library <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">{URO_PRIMARY_REFERENCE_NOTE}</p>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Primary international reference — EAU</p>
        {primaryRefs.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No EAU panel is registered for this note type.</p>
        ) : (
          <ul className="space-y-1.5">{primaryRefs.map((r) => <Row key={r.key} r={r} />)}</ul>
        )}
      </div>

      {otherRefs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Additional guidance</p>
          <ul className="space-y-1.5">{otherRefs.map((r) => <Row key={r.key} r={r} />)}</ul>
        </div>
      )}

      <div className="space-y-1">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3 w-3" /> Locally approved protocols
        </p>
        {local.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">{URO_LOCAL_PROTOCOL_NOTICE}</p>
        ) : (
          <ul className="space-y-1.5">
            {local.map((p) => (
              <li key={p.key} className="text-[11px]">
                {p.title} — approved by {p.approving_body} ({p.approval_reference}), review {p.review_date}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          {state.recorded_datetime
            ? `Basis recorded on ${new Date(state.recorded_datetime).toLocaleString()} with ${state.references?.length ?? 0} reference(s).`
            : "The basis has not been recorded on this note yet."}
        </p>
        <button
          type="button"
          onClick={record}
          className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-primary hover:bg-muted/60"
        >
          Record this basis on the note
        </button>
      </div>
    </div>
  );
}