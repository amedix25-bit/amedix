// Structured interval comparison for the rheumatology follow-up note. Each
// domain records what was documented previously, what is documented now and the
// direction of travel, so a review shows change rather than only today's state.
// Treat-to-target requires the target and whether it was met to be explicit.
export const COMPARISON_ROWS = [
  { key: "symptoms", label: "Symptoms" },
  { key: "flare_frequency", label: "Flare frequency & duration" },
  { key: "pain", label: "Pain (score / character)" },
  { key: "stiffness", label: "Morning stiffness & duration" },
  { key: "function", label: "Functional status" },
  { key: "examination", label: "Examination — tender / swollen joints" },
  { key: "adherence", label: "Medication adherence" },
  { key: "adverse_effects", label: "Adverse effects" },
  { key: "labs", label: "Laboratory trend (ESR, CRP, blood count, renal, liver)" },
  { key: "imaging", label: "Imaging trend" },
  { key: "activity_score", label: "Disease activity score (e.g. DAS28, CDAI, BASDAI)" },
  { key: "treatment_response", label: "Treatment response" },
  { key: "target", label: "Therapeutic target & whether met" },
  { key: "adjustment", label: "Planned adjustment" },
];

export const TREND_OPTIONS = ["Improved", "Unchanged", "Worse", "Mixed", "Not comparable", "Not assessed"];

export const THERAPEUTIC_TARGETS = [
  "Remission",
  "Low disease activity",
  "Low disease activity or remission (treat-to-target)",
  "Other documented target",
  "Not applicable to this condition",
];

export const TARGET_STATUS = ["Met", "Partially met", "Not met", "Not assessed"];

export const emptyComparison = () => ({ rows: [] });

export const comparisonRow = (value, key) => {
  const rows = value && Array.isArray(value.rows) ? value.rows : [];
  return rows.find((r) => r.key === key) || { key, previous: "", current: "", trend: "" };
};

export const setComparisonRow = (value, key, patch) => {
  const base = value && Array.isArray(value.rows) ? value : emptyComparison();
  const rows = [...base.rows];
  const index = rows.findIndex((r) => r.key === key);
  const next = { ...(index >= 0 ? rows[index] : { key }), ...patch, key };
  if (index >= 0) rows[index] = next;
  else rows.push(next);
  return { ...base, rows };
};

export const formatComparison = (value) => {
  const rows = value && Array.isArray(value.rows) ? value.rows : [];
  return rows
    .filter((r) => r.previous || r.current || r.trend)
    .map((r) => {
      const label = (COMPARISON_ROWS.find((x) => x.key === r.key) || {}).label || r.key;
      const parts = [
        r.previous ? `previously ${String(r.previous).trim()}` : "",
        r.current ? `now ${String(r.current).trim()}` : "",
        r.trend ? `trend: ${r.trend}` : "",
      ].filter(Boolean);
      return `${label} — ${parts.join("; ")}`;
    })
    .join("\n");
};