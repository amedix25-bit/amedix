import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { URO_BLOCKS } from "@/lib/uroBlocks";
import { asObject } from "@/lib/uroFieldKit";

// Renders the urology structured documentation blocks a note declares. Every
// field is optional: a blank stays blank and is reported as not documented. No
// field is pre-filled and no value is inferred from another.

const MultiSelect = ({ value, options, onChange }) => {
  const chosen = Array.isArray(value) ? value : [];
  const toggle = (option) =>
    onChange(chosen.includes(option) ? chosen.filter((v) => v !== option) : [...chosen, option]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = chosen.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
              active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

function BlockFieldInput({ field, value, onChange }) {
  if (field.type === "textarea") {
    return <Textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Not documented" />;
  }
  if (field.type === "select") {
    return (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Not documented" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "multi") {
    return <MultiSelect value={value} options={field.options} onChange={onChange} />;
  }
  if (field.type === "number") {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step="any"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.unit ? <span className="shrink-0 text-[11px] text-muted-foreground">{field.unit}</span> : null}
      </div>
    );
  }
  if (field.type === "date") {
    return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Not documented" />;
}

export default function UroBlockField({ value, onChange, blocks }) {
  const all = asObject(value);
  const [open, setOpen] = useState({});
  const keys = Array.isArray(blocks) && blocks.length ? blocks.filter((k) => URO_BLOCKS[k]) : Object.keys(URO_BLOCKS);

  const setField = (blockKey, fieldKey, next) =>
    onChange({ ...all, [blockKey]: { ...asObject(all[blockKey]), [fieldKey]: next } });

  return (
    <div className="space-y-2">
      {keys.map((blockKey) => {
        const block = URO_BLOCKS[blockKey];
        const blockValues = asObject(all[blockKey]);
        const documented = Object.values(blockValues).filter((v) => (Array.isArray(v) ? v.length : String(v ?? "").trim() !== "")).length;
        const isOpen = Boolean(open[blockKey]);
        return (
          <div key={blockKey} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [blockKey]: !o[blockKey] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-primary">{block.title}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{documented ? `${documented} documented` : "not documented"}</span>
            </button>
            {isOpen && (
              <div className="space-y-3 px-3 pb-3 pt-3">
                {block.note ? <p className="text-[11px] leading-relaxed text-muted-foreground">{block.note}</p> : null}
                {block.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs font-medium">{field.label}</Label>
                    <BlockFieldInput field={field} value={blockValues[field.key]} onChange={(next) => setField(blockKey, field.key, next)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        A blank field is reported as not documented — never as normal, negative or absent.
      </p>
    </div>
  );
}