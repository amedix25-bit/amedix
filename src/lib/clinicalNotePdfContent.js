// What belongs on the printed clinical record.
//
// The sheet carries only what the physician actually documented: a recorded
// answer — including an explicit "None" or "Not documented" — is printed, an
// unanswered or unused template field is not, and a decision-support block is
// reduced to the clinician's own documented action. Nothing is inferred,
// completed or generated for the page.

export const isDocumentedValue = (value) => {
  const text = String(value ?? "").trim();
  return text !== "" && !/^[.\-–—_·,\s]+$/.test(text);
};

// Decision support (safety prompts, alerts) is stored with its rule text,
// provenance and standing boilerplate even when the physician answered nothing.
// Only the clinician's own entries survive here.
const MARKERS = [
  ["Action documented", "Documented action"],
  ["Action taken", "Documented action"],
  ["No action required because", "No action required"],
  ["Other safety concern documented", "Other safety concern"],
  ["Other safety concern", "Other safety concern"],
  ["Clinician note", "Clinician note"],
  ["Clinician interpretation", "Clinician interpretation"],
  ["Decision taken", "Decision taken"],
  ["Escalation and documented action", "Escalation and documented action"],
];

const MARKER_RE = new RegExp(`(${MARKERS.map(([marker]) => marker).join("|")})\\s*:\\s*([^—\\n]+)`, "gi");

const NOT_AN_ANSWER = /^(not documented|not recorded|none documented|no action documented|to be documented)$/i;

export const isDecisionSupportType = (type) => /(_safety|_alerts)$/i.test(String(type || ""));

export function documentedActions(value) {
  const text = String(value ?? "");
  const found = [];
  MARKER_RE.lastIndex = 0;
  let match;
  while ((match = MARKER_RE.exec(text)) !== null) {
    const key = String(match[1] || "").toLowerCase();
    const label = (MARKERS.find(([marker]) => marker.toLowerCase() === key) || [])[1] || "Documented action";
    const body = String(match[2] || "")
      .replace(/\s+/g, " ")
      .replace(/[\s.;,]+$/, "")
      .trim();
    if (!body || NOT_AN_ANSWER.test(body)) continue;
    if (!found.some((entry) => entry.value === body)) found.push({ label, value: body });
  }
  return found;
}

// Coding-review prompts appended to an ICD-11 field are advisory machine text,
// never part of the physician's documentation.
export const stripCodingPrompts = (value) => String(value ?? "").replace(/\n?Coding review prompts[\s\S]*$/i, "");

// A structured examination is stored both as its documented fields and as the
// raw widget payload; the payload is machine data and never prints.
export const isRawPayload = (value) => {
  const text = String(value ?? "").trim();
  return /^\{[\s\S]*\}$/.test(text) && /"[:]/.test(text);
};