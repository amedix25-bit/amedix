import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIDE_OPTIONS } from "@/lib/examinations/shared";

// Renders ONE examination field from its configuration spec. The value shape
// depends on the field configuration:
//   select      → string | {value, detail, side?} when detailOn | {right, left} when bilateral
//   checkbox    → boolean | {value, detail} when detailOn
//   multiselect → string[] | {value: string[], side} when detailLaterality
//   scale       → number | {right, left} when bilateral
//   cn          → {value, detail}
//   laterality  → string (Right/Left/Bilateral)
//   number/text/textarea → primitive | {right, left} (number bilateral)

const SideChips = ({ value, onChange }) => (
  <div className="flex gap-1.5">
    {SIDE_OPTIONS.map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(value === s ? "" : s)}
        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
          value === s
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:bg-accent"
        }`}
      >
        {s}
      </button>
    ))}
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{children}</label>
);

const SelectBox = ({ value, onChange, options, placeholder = "Select…" }) => (
  <Select value={value || undefined} onValueChange={onChange}>
    <SelectTrigger className="h-8 text-xs w-full">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o} value={o}>
          {o}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ScaleButtons = ({ value, onChange, field }) => {
  const opts = [];
  for (let v = field.min; v <= field.max; v++) opts.push(v);
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {opts.map((v) => (
          <button
            key={v}
            type="button"
            title={field.scaleLabels ? field.scaleLabels[v - field.min] : String(v)}
            onClick={() => onChange(value === v ? "" : v)}
            className={`min-w-8 h-8 px-1.5 rounded-md text-xs border font-medium transition-colors ${
              value === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {field.scaleLabels ? field.scaleLabels[v - field.min].split(" —")[0] : v}
          </button>
        ))}
      </div>
      {field.scaleLabels && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
          {field.min === 0 && field.max === 5
            ? "0 none · 1 flicker · 2 gravity eliminated · 3 against gravity · 4 against resistance · 5 normal"
            : field.scaleLabels.map((l) => l.split(" —")[0]).join(" · ")}
        </p>
      )}
    </div>
  );
};

const SideTag = ({ side }) => (
  <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground pt-2 capitalize">{side}</span>
);

export default function ExaminationField({ field, value, onChange }) {
  if (field.type === "select") {
    const detailOn = field.detailOn || [];
    if (field.bilateral) {
      const val = value && typeof value === "object" ? value : {};
      return (
        <div>
          <FieldLabel>{field.label}</FieldLabel>
          <div className="space-y-1.5">
            {["right", "left"].map((side) => {
              const cur = val[side];
              const curObj = cur && typeof cur === "object" ? cur : null;
              const curValue = curObj ? curObj.value : typeof cur === "string" ? cur : "";
              return (
                <div key={side} className="flex items-start gap-2">
                  <SideTag side={side} />
                  <div className="flex-1 space-y-1.5">
                    <SelectBox
                      value={curValue}
                      options={field.options}
                      onChange={(v) =>
                        onChange({ ...val, [side]: detailOn.length ? { ...curObj, value: v } : v })
                      }
                    />
                    {detailOn.includes(curValue) && (
                      <Input
                        className="h-8 text-xs"
                        placeholder="Detail"
                        value={curObj?.detail || ""}
                        onChange={(e) =>
                          onChange({ ...val, [side]: { ...curObj, value: curValue, detail: e.target.value } })
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (detailOn.length) {
      const v = value && typeof value === "object" ? value : { value: typeof value === "string" ? value : "" };
      const showDetail = detailOn.includes(v.value);
      return (
        <div>
          <FieldLabel>{field.label}</FieldLabel>
          <SelectBox
            value={v.value}
            options={field.options}
            onChange={(nv) => onChange({ ...v, value: nv })}
          />
          {showDetail && (
            <div className="mt-1.5 space-y-1.5">
              <Input
                className="h-8 text-xs"
                placeholder="Describe"
                value={v.detail || ""}
                onChange={(e) => onChange({ ...v, detail: e.target.value })}
              />
              {field.detailLaterality && (
                <SideChips value={v.side || ""} onChange={(s) => onChange({ ...v, side: s })} />
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <SelectBox value={typeof value === "string" ? value : ""} options={field.options} onChange={onChange} />
      </div>
    );
  }

  if (field.type === "checkbox") {
    if (field.detailOn) {
      const v = value && typeof value === "object" ? value : { value: Boolean(value), detail: "" };
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(v.value)}
              onCheckedChange={(c) => onChange({ ...v, value: Boolean(c) })}
            />
            <span className="text-xs font-medium">{field.label}</span>
          </div>
          {v.value && (
            <div className="space-y-1.5">
              <Input
                className="h-8 text-xs"
                placeholder="Describe"
                value={v.detail || ""}
                onChange={(e) => onChange({ ...v, detail: e.target.value })}
              />
              {field.detailLaterality && (
                <SideChips value={v.side || ""} onChange={(s) => onChange({ ...v, side: s })} />
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 pt-4">
        <Checkbox checked={Boolean(value)} onCheckedChange={(c) => onChange(Boolean(c))} />
        <span className="text-xs font-medium">{field.label}</span>
      </div>
    );
  }

  if (field.type === "multiselect") {
    const withSide = Boolean(field.detailLaterality);
    const v = withSide
      ? value && typeof value === "object" && !Array.isArray(value)
        ? value
        : { value: [], side: "" }
      : Array.isArray(value)
        ? value
        : [];
    const list = withSide ? v.value : v;
    const toggle = (o) => {
      const next = o === "None" ? (list.includes("None") ? [] : ["None"]) : list.filter((x) => x !== "None").includes(o) ? list.filter((x) => x !== o) : [...list.filter((x) => x !== "None"), o];
      if (withSide) onChange({ ...v, value: next });
      else onChange(next);
    };
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                list.includes(o)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {withSide && list.length > 0 && !list.includes("None") && (
          <div className="mt-1.5">
            <SideChips value={v.side || ""} onChange={(s) => onChange({ ...v, side: s })} />
          </div>
        )}
      </div>
    );
  }

  if (field.type === "scale") {
    if (field.bilateral) {
      const val = value && typeof value === "object" ? value : {};
      return (
        <div className="sm:col-span-2">
          <FieldLabel>{field.label} — Right / Left</FieldLabel>
          <div className="space-y-1.5">
            {["right", "left"].map((side) => (
              <div key={side} className="flex items-start gap-2">
                <SideTag side={side} />
                <div className="flex-1">
                  <ScaleButtons
                    field={field}
                    value={val[side] === 0 || val[side] ? val[side] : ""}
                    onChange={(nv) => onChange({ ...val, [side]: nv })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <ScaleButtons field={field} value={value === 0 || value ? value : ""} onChange={onChange} />
      </div>
    );
  }

  if (field.type === "cn") {
    const v = value && typeof value === "object" ? value : { value: typeof value === "string" ? value : "" };
    return (
      <div>
        <FieldLabel>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center min-w-6 h-5 px-1 rounded bg-secondary text-[10px] font-semibold text-secondary-foreground">
              {field.cnNumber}
            </span>
            {field.cnName}
          </span>
        </FieldLabel>
        <div className="space-y-1.5">
          <SelectBox
            value={v.value}
            options={["Normal", "Abnormal", "Not tested"]}
            onChange={(nv) => onChange({ ...v, value: nv })}
          />
          {v.value === "Abnormal" && (
            <Input
              className="h-8 text-xs"
              placeholder="Describe the abnormality"
              value={v.detail || ""}
              onChange={(e) => onChange({ ...v, detail: e.target.value })}
            />
          )}
        </div>
      </div>
    );
  }

  if (field.type === "laterality") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <SideChips value={typeof value === "string" ? value : ""} onChange={onChange} />
      </div>
    );
  }

  if (field.type === "number") {
    if (field.bilateral) {
      const val = value && typeof value === "object" ? value : {};
      return (
        <div>
          <FieldLabel>
            {field.label} {field.unit ? `(${field.unit})` : ""}
          </FieldLabel>
          <div className="space-y-1.5">
            {["right", "left"].map((side) => (
              <div key={side} className="flex items-center gap-2">
                <SideTag side={side} />
                <Input
                  type="number"
                  className="h-8 text-xs"
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  value={val[side] === 0 || val[side] ? val[side] : ""}
                  onChange={(e) => onChange({ ...val, [side]: e.target.value === "" ? "" : Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <FieldLabel>
          {field.label} {field.unit ? `(${field.unit})` : ""}
        </FieldLabel>
        <Input
          type="number"
          className="h-8 text-xs"
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={value === 0 || value ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        <FieldLabel>{field.label}</FieldLabel>
        <Textarea
          className="text-xs min-h-16"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  // text
  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      <Input
        className="h-8 text-xs"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Formats a stored field value for read-only display. Returns null when the
// field holds nothing worth showing.
export const formatFieldValue = (field, v) => {
  if (v === null || v === undefined || v === "" || v === false) return null;
  switch (field.type) {
    case "checkbox": {
      const o = typeof v === "object" ? v : null;
      const checked = o ? o.value : v;
      if (!checked) return null;
      let s = "Yes";
      if (o?.detail) s += ` — ${o.detail}`;
      if (o?.side) s += ` (${o.side})`;
      return s;
    }
    case "multiselect": {
      const withSide = Boolean(field.detailLaterality);
      const o = withSide && typeof v === "object" && !Array.isArray(v) ? v : null;
      const list = o ? o.value : v;
      if (!Array.isArray(list) || !list.length) return null;
      let s = list.join(", ");
      if (o?.side) s += ` (${o.side})`;
      return s;
    }
    case "cn": {
      const o = typeof v === "object" ? v : { value: v };
      if (!o.value) return null;
      return o.value === "Abnormal" && o.detail ? `Abnormal — ${o.detail}` : o.value;
    }
    case "select": {
      if (field.bilateral) {
        const parts = ["right", "left"]
          .map((side) => {
            const cur = (v || {})[side];
            const o = cur && typeof cur === "object" ? cur : null;
            const val = o ? o.value : typeof cur === "string" ? cur : "";
            if (!val) return null;
            let s = `${side === "right" ? "R" : "L"}: ${val}`;
            if (o?.detail) s += ` (${o.detail})`;
            return s;
          })
          .filter(Boolean);
        return parts.length ? parts.join(" · ") : null;
      }
      const o = typeof v === "object" && "value" in v ? v : { value: typeof v === "string" ? v : "" };
      if (!o.value) return null;
      let s = o.value;
      if (o.detail) s += ` — ${o.detail}`;
      if (o.side) s += ` (${o.side})`;
      return s;
    }
    case "scale": {
      const fmt = (x) =>
        x === 0 || x
          ? field.scaleLabels
            ? field.scaleLabels[x - field.min]
            : String(x)
          : null;
      if (field.bilateral) {
        const r = fmt((v || {}).right);
        const l = fmt((v || {}).left);
        const parts = [];
        if (r) parts.push(`R: ${r}`);
        if (l) parts.push(`L: ${l}`);
        return parts.length ? parts.join(" · ") : null;
      }
      return fmt(v);
    }
    case "laterality":
      return typeof v === "string" ? v : null;
    case "number": {
      if (field.bilateral) {
        const parts = [];
        if ((v || {}).right === 0 || (v || {}).right) parts.push(`R: ${v.right}${field.unit ? ` ${field.unit}` : ""}`);
        if ((v || {}).left === 0 || (v || {}).left) parts.push(`L: ${v.left}${field.unit ? ` ${field.unit}` : ""}`);
        return parts.length ? parts.join(" · ") : null;
      }
      return v === 0 || v ? `${v}${field.unit ? ` ${field.unit}` : ""}` : null;
    }
    default:
      return typeof v === "string" && v.trim() ? v : null;
  }
};