import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// terminologyLookup — resolves AMedix clinical terms to standardized codes
// (ICD-11 MMS, LOINC, DICOM modality) from the TerminologyCode catalog.
// Used for exports / interoperability: every matched entry carries the
// canonical FHIR system URI so it can be embedded as a FHIR CodeableConcept
// ({ system, code, display }) with no extra transformation.
//
// Input: { concept_type: "medical_condition" | "lab_test" | "imaging_modality",
//          terms: string[] }  (max 100 terms per call)
// Output: { matched: [{ term, code, display, system, system_uri, concept_type }],
//           unmatched: string[] }
// Matching is case-insensitive on the English term or the Arabic term; no
// fuzzy matching — the catalog is the single source of truth, and an unknown
// term is returned as unmatched rather than guessed.

const ALLOWED_CONCEPT_TYPES = ["medical_condition", "lab_test", "imaging_modality"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const concept_type = body?.concept_type;
    const terms = Array.isArray(body?.terms)
      ? body.terms.map((t) => String(t || "").trim()).filter(Boolean)
      : [];

    if (!ALLOWED_CONCEPT_TYPES.includes(concept_type)) {
      return Response.json({ error: "concept_type must be one of: " + ALLOWED_CONCEPT_TYPES.join(", ") }, { status: 400 });
    }
    if (terms.length === 0) {
      return Response.json({ error: "terms is required (array of strings)" }, { status: 400 });
    }
    if (terms.length > 100) {
      return Response.json({ error: "Maximum 100 terms per lookup" }, { status: 400 });
    }

    const page = await base44.entities.TerminologyCode.filter({ concept_type }, { limit: 500 });
    const catalog = page.items || [];

    const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const byTerm = new Map();
    for (const rec of catalog) {
      if (rec.term) byTerm.set(normalize(rec.term), rec);
      if (rec.term_ar && !byTerm.has(normalize(rec.term_ar))) byTerm.set(normalize(rec.term_ar), rec);
    }

    const matched = [];
    const unmatched = [];
    for (const term of terms) {
      const rec = byTerm.get(normalize(term));
      if (rec) {
        matched.push({
          term,
          code: rec.code,
          display: rec.code_display || "",
          system: rec.coding_system,
          system_uri: rec.system_uri,
          concept_type,
        });
      } else {
        unmatched.push(term);
      }
    }

    return Response.json({ matched, unmatched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}