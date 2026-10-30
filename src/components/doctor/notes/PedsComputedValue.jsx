import React from "react";

// A calculated field inside a pediatric block. The arithmetic is shown, never hidden,
// and when its inputs are missing it says so instead of assuming a value.
export default function PedsComputedValue({ field, values }) {
  let calculated = null;
  try {
    calculated = field.compute ? field.compute(values) : null;
  } catch {
    calculated = null;
  }
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 px-2.5 py-1.5 text-[11px] leading-snug">
      {calculated ? (
        <span className="text-foreground">{calculated}</span>
      ) : (
        <span className="text-muted-foreground">Not calculated — the fields it needs above are not documented.</span>
      )}
    </div>
  );
}