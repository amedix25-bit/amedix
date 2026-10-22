import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// One-time (idempotent) migration of previously PUBLIC clinical files to
// PRIVATE storage. Scans every affected entity/field for permanent public
// file URLs (.../files/mp/public/...), re-uploads each unique file to
// private storage, and repoints EVERY reference — including copies inside
// notifications and attachments — to the new private file URI.
//
// Originals are NEVER deleted: public files stay in storage until integrity
// checks pass, so any failure is fully reversible by re-pointing fields.
// Re-running this function is safe: only public URLs are processed, and
// migrated fields hold private URIs which are skipped.
//
// Admin-only. Returns a migration summary for the remediation report.

const TEXT_FIELDS = [
  ["MedicalDocument", ["file_url"]],
  ["PatientLabResult", ["file_url"]],
  ["LabRequest", ["result_file_url", "corrected_result_file_url", "pdf_url"]],
  ["LabPatientVisit", ["result_file_url"]],
  ["LabNotification", ["result_file_url"]],
  ["ReferralLetter", ["pdf_url"]],
  ["ImagingResult", ["report_pdf_url"]],
  ["ImagingRequest", ["pdf_url", "report_file_url"]],
  ["RadiologyRecord", ["file_url"]],
  ["DoctorNotification", ["report_pdf_url"]],
];
const ARRAY_FIELDS = [
  ["ImagingResult", "images"],       // items: {file_url, file_name}
  ["ImagingRequest", "image_file_urls"], // items: strings
  ["ReferralLetter", "attachments"], // items: {file_url, ...}
];

function isPublicUrl(ref) {
  const s = String(ref || "");
  return /^https?:/i.test(s) && s.includes("/files/mp/public/");
}

function fileNameFromUrl(url) {
  try {
    const tail = String(url).split("/").pop() || "file";
    return decodeURIComponent(tail.replace(/^[0-9a-f]+_/, ""));
  } catch (e) {
    return "file";
  }
}

function mimeFromName(name) {
  const ext = String(name).split(".").pop().toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Administrator access required." }, { status: 403 });
    }
    const svc = base44.asServiceRole;

    // Pass 1 — scan and collect every unique public URL with the records referencing it.
    const urlRefs = new Map(); // publicUrl -> [{entity, id, field, index?}]
    for (const [entity, fields] of TEXT_FIELDS) {
      const rows = await svc.entities[entity].list({ limit: 1000 });
      for (const r of rows.items || rows) {
        for (const f of fields) {
          if (isPublicUrl(r[f])) {
            const list = urlRefs.get(r[f]) || [];
            list.push({ entity, id: r.id, field: f });
            urlRefs.set(r[f], list);
          }
        }
      }
    }
    for (const [entity, field] of ARRAY_FIELDS) {
      const rows = await svc.entities[entity].list({ limit: 1000 });
      for (const r of rows.items || rows) {
        const arr = r[field];
        if (!Array.isArray(arr)) continue;
        arr.forEach((item, idx) => {
          const ref = typeof item === "string" ? item : item && item.file_url;
          if (isPublicUrl(ref)) {
            const list = urlRefs.get(ref) || [];
            list.push({ entity, id: r.id, field, index: idx });
            urlRefs.set(ref, list);
          }
        });
      }
    }

    // Pass 2 — re-upload each unique public file to PRIVATE storage, exactly once.
    const remapped = new Map(); // publicUrl -> privateFileUri
    const errors = [];
    for (const [url, refs] of urlRefs.entries()) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          errors.push({ url, error: `Fetch failed with status ${res.status}` });
          continue;
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        const name = fileNameFromUrl(url);
        const file = new File([bytes], name, { type: mimeFromName(name) });
        const up = await svc.integrations.Core.UploadPrivateFile({ file });
        if (up && up.file_uri) remapped.set(url, up.file_uri);
        else errors.push({ url, error: "Upload returned no file_uri" });
      } catch (e) {
        errors.push({ url, error: e.message });
      }
    }

    // Pass 3 — repoint every reference to the new private URI.
    const applied = [];
    for (const [entity, fields] of TEXT_FIELDS) {
      const rows = await svc.entities[entity].list({ limit: 1000 });
      for (const r of rows.items || rows) {
        const patch = {};
        for (const f of fields) {
          const nu = remapped.get(r[f]);
          if (nu) patch[f] = nu;
        }
        if (Object.keys(patch).length) {
          await svc.entities[entity].update(r.id, patch);
          applied.push({ entity, id: r.id, fields: Object.keys(patch) });
        }
      }
    }
    for (const [entity, field] of ARRAY_FIELDS) {
      const rows = await svc.entities[entity].list({ limit: 1000 });
      for (const r of rows.items || rows) {
        const arr = r[field];
        if (!Array.isArray(arr)) continue;
        let changed = false;
        const next = arr.map((item) => {
          const ref = typeof item === "string" ? item : item && item.file_url;
          const nu = remapped.get(ref);
          if (!nu) return item;
          changed = true;
          return typeof item === "string" ? nu : { ...item, file_url: nu };
        });
        if (changed) {
          await svc.entities[entity].update(r.id, { [field]: next });
          applied.push({ entity, id: r.id, fields: [field] });
        }
      }
    }

    const summary = {
      public_urls_found: urlRefs.size,
      files_migrated: remapped.size,
      references_repointed: applied.length,
      errors,
      mapping: Object.fromEntries(remapped),
      migrated_datetime: new Date().toISOString(),
    };

    try {
      await svc.entities.ClinicalAuditLog.create({
        actor_user_id: user.id,
        actor_name: user.full_name || "Administrator",
        actor_role: "admin",
        action: "migrated_public_files_to_private_storage",
        action_label: `Migrated ${remapped.size} public clinical file(s) to private storage`,
        datetime: new Date().toISOString(),
      });
    } catch (e) {
      // Audit failure must not fail the migration report.
    }

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}