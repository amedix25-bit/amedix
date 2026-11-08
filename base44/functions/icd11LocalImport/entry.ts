import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  validateImport,
  seedRecords,
  coverageReport,
  ICD11_LOCAL,
  VERIFIED_RESPIRATORY_SEED,
} from "../../shared/icd11Local.ts";

// icd11LocalImport — puts an official ICD-11 release into the workspace's own
// classification database. Administrator only.
//
// Two sources, both official, and no third option:
//   seed   → the bundled verified catalogue (entries read from the published ICD-11
//            MMS tabulation with the release recorded).
//   import → an official WHO ICD-11 release export: the institution's own licensed
//            export file, or a JSON export produced from the WHO ICD-11 API under
//            that institution's subscription. The API is used to PRODUCE the export;
//            nothing in the app needs the credentials at run time.
//
// The importer validates every entry, reports what it rejected and why, never
// repairs or generates a code, supersedes the previous release instead of deleting
// it (so codes already recorded keep their provenance), and stores the respiratory
// coverage of the dataset it just accepted.

const MAX_ENTRIES_PER_IMPORT = 3000;
const CHUNK = 100;

const rowsOf = (v) => (Array.isArray(v) ? v : v?.items || []);

async function readEntries(body) {
  if (Array.isArray(body.entries)) return body.entries;
  const fileUrl = String(body.file_url || "").trim();
  if (!fileUrl) return null;
  if (!/^https:\/\//.test(fileUrl)) throw Object.assign(new Error("file_url must be an https URL"), { status: 400 });
  const res = await fetch(fileUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw Object.assign(new Error(`The export file could not be read (${res.status}).`), { status: 502 });
  const payload = await res.json().catch(() => null);
  if (!payload) throw Object.assign(new Error("The export file is not valid JSON."), { status: 400 });
  if (Array.isArray(payload)) return payload;
  const list =
    payload.entries ||
    payload.concepts ||
    payload.terms ||
    payload.items ||
    payload.destinationEntities ||
    payload["@graph"];
  if (!Array.isArray(list)) {
    throw Object.assign(
      new Error("The export must be a JSON array of entries, or an object with an entries/concepts/terms array."),
      { status: 400 },
    );
  }
  return list;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "Only an administrator can import an ICD-11 release." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode || "import");
    if (!["seed", "import"].includes(mode)) return Response.json({ error: "mode must be seed or import" }, { status: 400 });

    const now = new Date().toISOString();

    if (mode === "seed") {
      const existing = await base44.entities.Icd11Release.filter(
        { release_id: ICD11_LOCAL.catalogue_release, source_type: "verified_catalogue" },
        { limit: 1 },
      );
      if (rowsOf(existing)[0]) {
        return Response.json({ already_loaded: true, release: rowsOf(existing)[0].release_id });
      }
      const { accepted, report } = seedRecords({ importedDatetime: now, importedByName: user.full_name || user.email });
      if (!accepted.length) return Response.json({ error: "The bundled catalogue produced no entries.", report }, { status: 500 });

      const coverage = coverageReport(accepted);
      const previous = rowsOf(await base44.entities.Icd11Release.filter({ status: "active" }, { limit: 50 }));
      for (const rel of previous) await base44.entities.Icd11Release.update(rel.id, { status: "superseded" });

      for (let i = 0; i < accepted.length; i += CHUNK) {
        await base44.entities.Icd11Term.bulkCreate(accepted.slice(i, i + CHUNK));
      }
      const release = await base44.entities.Icd11Release.create({
        release_id: ICD11_LOCAL.catalogue_release,
        linearization: "mms",
        title: `ICD-11 MMS ${ICD11_LOCAL.catalogue_release} — bundled verified catalogue`,
        status: "active",
        source_type: "verified_catalogue",
        licence_reference: "",
        source_note:
          "Respiratory subset of the AMedix verified ICD-11 MMS catalogue, read from the published WHO tabulation. " +
          "Import the institution's official WHO ICD-11 export to extend coverage to the full classification.",
        imported_datetime: now,
        imported_by_name: user.full_name || user.email || "",
        term_count: accepted.length,
        codable_count: report.codable,
        arabic_official_count: report.arabic_official,
        chapters: [...new Set(accepted.map((t) => t.chapter_code).filter(Boolean))],
        validation: { ...report, coverage },
        previous_release_id: previous[0]?.release_id || "",
        notes: "Seeded from the bundled catalogue. Arabic titles are AMedix working translations, labelled as such.",
      });
      return Response.json({
        seeded: true,
        release: release.release_id,
        term_count: accepted.length,
        codable_count: report.codable,
        coverage,
        report,
        arabic_note:
          "The bundled catalogue carries no official Arabic terminology; the Arabic titles it holds are AMedix working translations and are labelled that way in every surface.",
      });
    }

    // ── Import an official release export ───────────────────────────────────
    const releaseId = String(body.release_id || "").trim();
    if (!/^\d{4}-\d{2}$/.test(releaseId)) {
      return Response.json({ error: "release_id must be the WHO release identifier, e.g. 2026-01" }, { status: 400 });
    }
    const sourceType = body.source_type === "who_api_export" ? "who_api_export" : "who_export";
    const licence = String(body.licence_reference || "").trim();
    if (!licence) {
      return Response.json(
        {
          error:
            "licence_reference is required: record the institution's WHO ICD-11 licence or subscription reference for the release being imported, so the provenance of the classification data is auditable.",
        },
        { status: 400 },
      );
    }

    const duplicate = rowsOf(await base44.entities.Icd11Release.filter({ release_id: releaseId }, { limit: 1 }))[0];
    if (duplicate) {
      return Response.json(
        {
          error: `Release ${releaseId} is already in the database (${duplicate.status}). A release is never overwritten — import the newer WHO release when it is published.`,
        },
        { status: 409 },
      );
    }

    const entries = await readEntries(body);
    if (!entries?.length) return Response.json({ error: "No entries were supplied in the export." }, { status: 400 });
    if (entries.length > MAX_ENTRIES_PER_IMPORT) {
      return Response.json(
        {
          error: `This import accepts up to ${MAX_ENTRIES_PER_IMPORT} entries per call. Split the official export into chapter or block files and import them in turn — for the respiratory scope, chapter 12 and its blocks.`,
          supplied: entries.length,
        },
        { status: 413 },
      );
    }

    const { accepted, rejected, report } = validateImport(entries, {
      releaseId,
      sourceType,
      sourceReference: String(body.source_reference || `Official WHO ICD-11 release ${releaseId}`).trim(),
      verifiedDate: String(body.verified_date || now.slice(0, 10)),
      importedDatetime: now,
      importedByName: user.full_name || user.email || "",
    });

    if (!accepted.length) {
      await base44.entities.Icd11Release.create({
        release_id: releaseId,
        linearization: ICD11_LOCAL.linearization,
        title: `ICD-11 MMS ${releaseId} — import rejected`,
        status: "rejected",
        source_type: sourceType,
        licence_reference: licence,
        source_note: String(body.notes || "").slice(0, 2000),
        imported_datetime: now,
        imported_by_name: user.full_name || user.email || "",
        term_count: 0,
        codable_count: 0,
        validation: { ...report, rejected_entries: rejected.slice(0, 50) },
        notes: "Every entry failed validation. Nothing was made available for coding.",
      });
      return Response.json({ imported: 0, rejected, report, error: "No entry passed validation." }, { status: 422 });
    }

    // The previous release is superseded, never deleted: codes already recorded
    // against it keep the release they were verified against.
    const previous = rowsOf(await base44.entities.Icd11Release.filter({ status: "active" }, { limit: 50 }));
    for (const rel of previous) await base44.entities.Icd11Release.update(rel.id, { status: "superseded" });

    for (let i = 0; i < accepted.length; i += CHUNK) {
      await base44.entities.Icd11Term.bulkCreate(accepted.slice(i, i + CHUNK));
    }

    const coverage = coverageReport(accepted);
    const release = await base44.entities.Icd11Release.create({
      release_id: releaseId,
      linearization: ICD11_LOCAL.linearization,
      title: `ICD-11 MMS ${releaseId} — official export`,
      status: "active",
      source_type: sourceType,
      licence_reference: licence,
      source_note: String(body.notes || "").slice(0, 2000),
      imported_datetime: now,
      imported_by_name: user.full_name || user.email || "",
      term_count: accepted.length,
      codable_count: report.codable,
      arabic_official_count: report.arabic_official,
      chapters: [...new Set(accepted.map((t) => t.chapter_code).filter(Boolean))],
      validation: { ...report, coverage, rejected_entries: rejected.slice(0, 50) },
      previous_release_id: previous[0]?.release_id || "",
      notes: "Official WHO ICD-11 release export imported into the workspace database.",
    });

    return Response.json({
      imported: accepted.length,
      release: release.release_id,
      term_count: accepted.length,
      codable_count: report.codable,
      rejected,
      report,
      coverage,
      superseded: previous.map((r) => r.release_id),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}