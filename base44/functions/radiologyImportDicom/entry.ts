import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { parseDicom, dicomDate, readZip, isZip } from "../../shared/dicomParser.ts";
import { resolveRadiologyActor, requestScope, participantIds, auditRadiology } from "../../shared/radiologyPortal.ts";

// Secure manual DICOM import for authorized radiology technicians.
// Files are uploaded privately from the browser, then read here: the DICOM
// structure is verified, the Study / Series / SOP Instance UIDs, modality,
// study date and accession number are extracted from the file itself,
// duplicates are detected on the Study Instance UID, and the study is tied to
// the ONE existing AMedix patient record (by imaging request or CIN) — never
// by name alone. Nothing is invented: a file that is not valid DICOM, or a
// study whose patient cannot be confirmed, is refused with a clear reason.

const MAX_FILES = 30;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

function items(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

function normalizeName(value: string): string {
  return String(value || "").replace(/\^/g, " ").replace(/[^A-Za-z\u0600-\u06FF ]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

// Names are compared on tokens, never on a single fuzzy score: the DICOM name
// and the patient record must share at least one family/given token.
function namesCompatible(dicomName: string, patientName: string): boolean {
  const a = normalizeName(dicomName).split(" ").filter((t) => t.length > 1);
  const b = normalizeName(patientName).split(" ").filter((t) => t.length > 1);
  if (a.length === 0 || b.length === 0) return true; // nothing to contradict
  return a.some((token) => b.includes(token));
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e && e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "import");

    const actor = await resolveRadiologyActor(base44, user);
    if (!actor) return Response.json({ error: "Not authorized for a radiology facility." }, { status: 403 });
    if (!actor.hospitalUserId) {
      return Response.json({ error: "Only facility radiology staff can import studies." }, { status: 403 });
    }
    const svc = base44.asServiceRole;
    const auditBase = {
      hospitalUserId: actor.hospitalUserId,
      hospitalName: actor.hospitalName,
      actorUserId: user.id,
      actorName: actor.displayName,
      actorRole: actor.role,
    };

    if (action === "verify_study") {
      const studyId = String(payload.study_id || "");
      const found = items(await svc.entities.ImagingStudy.filter({ id: studyId, hospital_user_id: actor.hospitalUserId }));
      const study = found[0];
      if (!study) return Response.json({ error: "Study not found in your facility." }, { status: 404 });
      const updated = await svc.entities.ImagingStudy.update(study.id, {
        status: "verified",
        identity_check: "matched_cin",
        verified_datetime: new Date().toISOString(),
        verified_by_name: actor.displayName,
      });
      await auditRadiology(base44, {
        ...auditBase,
        action: "study_verified",
        actionLabel: "confirmed the patient identity of an imported study",
        studyId: study.id,
        studyInstanceUid: study.study_instance_uid,
        patientCin: study.patient_cin,
        patientName: study.patient_name,
      });
      return Response.json({ study: updated });
    }

    // ---------- Import ----------
    const incoming = Array.isArray(payload.files) ? payload.files.slice(0, MAX_FILES) : [];
    const usable = incoming
      .map((f: any) => ({ file_uri: String((f && f.file_uri) || ""), file_name: String((f && f.file_name) || "upload.dcm"), size: Number((f && f.size) || 0) }))
      .filter((f: any) => f.file_uri.startsWith("private/"));
    if (usable.length === 0) {
      return Response.json({ error: "Upload at least one DICOM file or ZIP package." }, { status: 400 });
    }
    const totalBytes = usable.reduce((sum: number, f: any) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return Response.json({ error: "This upload is too large. Split it into smaller packages (60 MB at a time)." }, { status: 400 });
    }

    const requestId = String(payload.request_id || "");
    const patientCin = String(payload.patient_cin || "").trim();

    let request: any = null;
    if (requestId) {
      const scoped = items(await svc.entities.ImagingRequest.filter({ id: requestId }).catch(() => ({ items: [] })));
      request = scoped[0] || null;
      if (!request) return Response.json({ error: "Imaging request not found." }, { status: 404 });
    }

    let patient: any = null;
    if (request && request.patient_id) {
      patient = await svc.entities.PatientProfile.get(request.patient_id).catch(() => null);
    }
    if (!patient && patientCin) {
      const found = items(await svc.entities.PatientProfile.filter({ cin: patientCin }, { limit: 1 }).catch(() => ({ items: [] })));
      patient = found[0] || null;
    }
    if (!patient) {
      return Response.json(
        { error: "Select the imaging request or enter the patient's CIN so the study is attached to the existing patient record." },
        { status: 400 }
      );
    }

    // ---------- Read and parse every uploaded file ----------
    const parsed: any[] = [];
    const rejected: any[] = [];
    for (const file of usable) {
      let bytes: Uint8Array;
      try {
        const signed = await svc.integrations.Core.CreateFileSignedUrl({ file_uri: file.file_uri, expires_in: 300 });
        const response = await fetch(signed.signed_url, { signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error(`file download returned ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_FILE_BYTES) throw new Error("file exceeds 25 MB");
        bytes = new Uint8Array(buffer);
      } catch (err: any) {
        rejected.push({ file_name: file.file_name, reason: `Could not be read: ${err.message}` });
        continue;
      }

      const parts: { name: string; bytes: Uint8Array }[] = [];
      if (isZip(bytes)) {
        const entries = await readZip(bytes);
        if (!entries || entries.length === 0) {
          rejected.push({ file_name: file.file_name, reason: "The ZIP package could not be read or contains no files." });
          continue;
        }
        entries.slice(0, MAX_FILES).forEach((e) => parts.push({ name: `${file.file_name}/${e.name}`, bytes: e.data }));
      } else {
        parts.push({ name: file.file_name, bytes });
      }

      for (const part of parts) {
        const tags = parseDicom(part.bytes);
        if (!tags) {
          rejected.push({ file_name: part.name, reason: "Not a DICOM file (no DICOM Part 10 header)." });
          continue;
        }
        if (!tags.studyInstanceUid || !tags.seriesInstanceUid || !tags.sopInstanceUid) {
          rejected.push({ file_name: part.name, reason: "The DICOM file is missing its Study, Series or SOP Instance UID." });
          continue;
        }
        if (tags.patientName && !namesCompatible(tags.patientName, patient.full_name)) {
          rejected.push({
            file_name: part.name,
            reason: `The study's patient (${tags.patientName.replace(/\^/g, " ")}) does not match the selected patient (${patient.full_name}).`,
          });
          continue;
        }
        parsed.push({ file, part, tags });
      }
    }

    if (parsed.length === 0) {
      return Response.json(
        { error: "No valid DICOM images were found in this upload. Nothing was imported.", rejected },
        { status: 400 }
      );
    }

    // ---------- Group into one study ----------
    const studyUids = [...new Set(parsed.map((p) => p.tags.studyInstanceUid))];
    if (studyUids.length > 1) {
      return Response.json(
        { error: "This upload contains images from more than one study. Import one study at a time so each is attached to the right request.", rejected },
        { status: 409 }
      );
    }
    const studyUid = studyUids[0];
    const first = parsed[0].tags;
    const participants = await participantIds(base44, actor.hospitalUserId, actor.hospitalName);

    const existing = items(
      await svc.entities.ImagingStudy.filter({ hospital_user_id: actor.hospitalUserId, study_instance_uid: studyUid }, { limit: 1 })
    )[0] || null;

    const seriesMap = new Map<string, any>();
    for (const p of parsed) {
      const key = p.tags.seriesInstanceUid;
      if (!seriesMap.has(key)) {
        seriesMap.set(key, {
          series_instance_uid: key,
          modality: p.tags.modality,
          series_number: p.tags.seriesNumber,
          series_description: p.tags.seriesDescription,
          sop_instance_uids: [],
          files: [],
        });
      }
      const entry = seriesMap.get(key);
      if (!entry.sop_instance_uids.includes(p.tags.sopInstanceUid)) entry.sop_instance_uids.push(p.tags.sopInstanceUid);
      entry.files.push({ file_uri: p.file.file_uri, file_name: p.part.name.slice(0, 200), size: p.file.size, sop_instance_uid: p.tags.sopInstanceUid });
    }

    const now = new Date().toISOString();
    let study: any;
    let createdStudy = false;

    if (existing) {
      // Duplicate detection: the study is already archived for this facility.
      const existingSeries = items(
        await svc.entities.ImagingSeries.filter({ study_id: existing.id }, { limit: 100 }).catch(() => ({ items: [] }))
      );
      const known = new Set<string>();
      existingSeries.forEach((s: any) => (s.sop_instance_uids || []).forEach((u: string) => known.add(u)));
      const newSeries = [...seriesMap.values()].filter((s) => !existingSeries.some((e: any) => e.series_instance_uid === s.series_instance_uid));
      const newImages = parsed.filter((p) => !known.has(p.tags.sopInstanceUid));

      if (newSeries.length === 0 && newImages.length === 0) {
        await auditRadiology(base44, {
          ...auditBase,
          action: "import_duplicate",
          actionLabel: "attempted to import a study already archived",
          studyId: existing.id,
          studyInstanceUid: studyUid,
          patientCin: existing.patient_cin,
          patientName: existing.patient_name,
        });
        return Response.json({
          duplicate: true,
          study: existing,
          message: `This study is already archived for this facility (${existing.series_count || 0} series). Nothing was duplicated.`,
          rejected,
        });
      }

      for (const s of newSeries) {
        await svc.entities.ImagingSeries.create({
          study_id: existing.id,
          hospital_user_id: actor.hospitalUserId,
          participant_user_ids: participants,
          series_instance_uid: s.series_instance_uid,
          modality: s.modality,
          series_number: s.series_number,
          series_description: s.series_description,
          sop_instance_uids: s.sop_instance_uids.slice(0, 500),
          sop_instance_count: s.sop_instance_uids.length,
          files: s.files.slice(0, 200),
          created_datetime: now,
        });
      }
      const allSeries = items(await svc.entities.ImagingSeries.filter({ study_id: existing.id }, { limit: 200 }));
      study = await svc.entities.ImagingStudy.update(existing.id, {
        series_count: allSeries.length,
        image_count: allSeries.reduce((sum: number, s: any) => sum + Number(s.sop_instance_count || 0), 0),
      });
    } else {
      study = await svc.entities.ImagingStudy.create({
        hospital_user_id: actor.hospitalUserId,
        hospital_name: actor.hospitalName,
        participant_user_ids: participants,
        patient_id: patient.id,
        patient_user_id: patient.user_id || "",
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || first.patientName.replace(/\^/g, " "),
        patient_birth_date: dicomDate(first.patientBirthDate) || patient.date_of_birth || "",
        study_instance_uid: studyUid,
        accession_number: first.accessionNumber || "",
        modality: first.modality || "",
        study_date: dicomDate(first.studyDate),
        study_description: first.studyDescription,
        series_count: seriesMap.size,
        image_count: parsed.length,
        source: "manual_import",
        imaging_request_id: request ? request.id : "",
        request_ref: request ? request.request_id || "" : "",
        status: "imported",
        identity_check: request ? "matched_request" : "matched_cin",
        imported_by_user_id: user.id,
        imported_by_name: actor.displayName,
        created_datetime: now,
      });
      createdStudy = true;

      for (const s of seriesMap.values()) {
        await svc.entities.ImagingSeries.create({
          study_id: study.id,
          hospital_user_id: actor.hospitalUserId,
          participant_user_ids: participants,
          series_instance_uid: s.series_instance_uid,
          modality: s.modality,
          series_number: s.series_number,
          series_description: s.series_description,
          sop_instance_uids: s.sop_instance_uids.slice(0, 500),
          sop_instance_count: s.sop_instance_uids.length,
          files: s.files.slice(0, 200),
          created_datetime: now,
        });
      }
    }

    // The request now has images: move it to ready for reporting when the
    // examination stage allows it — the same single workflow chain is used.
    if (request && ["images_awaiting_transfer", "examination_completed", "performed"].includes(String(request.workflow_status))) {
      const history = Array.isArray(request.status_history) ? [...request.status_history] : [];
      history.push({
        action: "images_received",
        from: request.workflow_status,
        to: "ready_for_reporting",
        by_name: actor.displayName,
        by_role: "department",
        datetime: now,
        note: `Images imported (${parsed.length} images, ${seriesMap.size} series)`,
      });
      await svc.entities.ImagingRequest.update(request.id, {
        workflow_status: "ready_for_reporting",
        images_received_datetime: now,
        images_note: `Imported manually by ${actor.displayName}`,
        status_history: history,
        updated_datetime: now,
      }).catch(() => null);
    }

    await auditRadiology(base44, {
      ...auditBase,
      action: createdStudy ? "study_imported" : "study_series_added",
      actionLabel: createdStudy ? "imported a DICOM study" : "added series to an archived study",
      detail: `${parsed.length} images, ${seriesMap.size} series, modality ${first.modality || "unknown"}${request ? `, request ${request.request_id}` : ""}`,
      studyId: study.id,
      studyInstanceUid: studyUid,
      requestRef: request ? request.request_id || "" : "",
      patientCin: patient.cin,
      patientName: patient.full_name,
    });

    return Response.json({
      study,
      created: createdStudy,
      duplicate: !createdStudy,
      series_count: seriesMap.size,
      image_count: parsed.length,
      modality: first.modality || "",
      study_date: dicomDate(first.studyDate),
      accession_number: first.accessionNumber || "",
      patient: { id: patient.id, cin: patient.cin, full_name: patient.full_name },
      rejected,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}