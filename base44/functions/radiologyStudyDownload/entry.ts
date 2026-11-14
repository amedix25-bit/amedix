import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeRadiologyStudy } from "../../shared/radiologyStudyAccess.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { createZipStore } from "../../shared/zipStore.ts";
import { verifyPatientOwnership, logOwnershipDenial } from "../../shared/patientOwnership.ts";

// RadiAnt desktop DICOM workflow — the authorized way a radiologist gets the
// study onto their own workstation.
//
// Security model:
// - Nothing is downloaded without server-side authorization: the caller must be
//   an active radiologist authorized for THIS study (assigned, authorized by the
//   patient, or an active radiologist of the facility the request was routed to)
//   or the facility's radiology department.
// - The study is resolved SERVER-SIDE from its DICOM Study Instance UID (or the
//   study record matched to the request) and its patient is checked against the
//   request's patient — a mismatched or unmatched study is never packaged.
// - Images are read from AMedix's private storage with short-lived signed URLs
//   issued on the server. No file URI, no public URL and no credential ever
//   reaches the browser; the browser receives only a short-lived signed URL for
//   the ZIP that this function built for this caller.
// - No PACS connection is invented. If AMedix holds no DICOM files for the study,
//   the function says a DICOM/PACS source is required instead of producing an
//   empty or fabricated archive.
// - Every download and every refusal is written to the clinical audit trail.

const MAX_FILES = 400;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 900;

function json(data: any, status = 200): Response {
  return Response.json(data, { status });
}

function safeSegment(value: any, fallback: string): string {
  const cleaned = String(value || "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 120) || fallback;
}

// The study behind this request, resolved by its DICOM Study Instance UID (or by
// the study record explicitly linked to the request). The patient on the study
// must be the request's patient — otherwise nothing is packaged.
async function resolveStudy(svc: any, request: any) {
  const studyPage = await svc.entities.ImagingStudy.filter(
    request.study_instance_uid
      ? { $or: [{ imaging_request_id: request.id }, { study_instance_uid: request.study_instance_uid }] }
      : { imaging_request_id: request.id },
    { limit: 5 }
  );
  const studies = studyPage.items || [];
  const study = studies[0] || null;
  const studyUid = String((study && study.study_instance_uid) || request.study_instance_uid || "").trim();
  const patientMismatch = !!study && !!study.patient_id && request.patient_id && study.patient_id !== request.patient_id;

  const seriesPage = studies.length
    ? await svc.entities.ImagingSeries.filter(
        { study_id: { $in: studies.map((s: any) => s.id) } },
        { sort: "series_number", limit: 300 }
      )
    : { items: [] as any[] };
  const series = seriesPage.items || [];

  const files: { file_uri: string; path: string }[] = [];
  const usedPaths = new Set<string>();
  const studyFolder = safeSegment(studyUid, "DICOM_STUDY");

  for (const s of series) {
    const seriesFolder = `${studyFolder}/${safeSegment(
      `${s.series_number ?? ""}_${s.modality || ""}_${s.series_description || ""}`,
      "series"
    )}`;
    const sops = Array.isArray(s.files) && s.files.length
      ? s.files
      : (s.sop_instance_uids || []).map((uid: string) => ({ file_uri: "", sop_instance_uid: uid }));
    let index = 0;
    for (const f of sops) {
      index += 1;
      if (!f || !f.file_uri) continue;
      const base = safeSegment(f.sop_instance_uid || f.file_name || `image_${index}`, `image_${index}`);
      let path = `${seriesFolder}/${base}.dcm`;
      let n = 1;
      while (usedPaths.has(path)) {
        n += 1;
        path = `${seriesFolder}/${base}_${n}.dcm`;
      }
      usedPaths.add(path);
      files.push({ file_uri: String(f.file_uri), path });
    }
  }

  return { study, studyUid, series, files, patientMismatch };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "status");
    const requestId = String(payload.request_id || "").trim();
    if (!requestId) return json({ error: "Select the imaging request." }, 400);

    const svc = base44.asServiceRole;
    const found = await svc.entities.ImagingRequest.filter({ id: requestId });
    const request = found[0];
    if (!request) return json({ error: "Imaging request not found." }, 404);

    // PATIENT ISOLATION (fail-closed): no study is packaged unless the request
    // itself resolves to one patient whose CIN and account match the record.
    const ownership = await verifyPatientOwnership(base44, request, {});
    if (!ownership.ok) {
      await logOwnershipDenial(base44, {
        user,
        actor_role: "radiologist",
        module: "radiologyStudyDownload",
        record_id: request.id,
        record_ref: request.request_id || "",
        reason: ownership.reason,
        patient_id: request.patient_id || "",
        hospital: request.routed_hospital || request.doctor_hospital || "",
      });
      return json({ error: "This study's patient ownership could not be verified, so it cannot be downloaded." }, 403);
    }

    const actorRole = await authorizeRadiologyStudy(base44, user, request);
    if (!actorRole) {
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: user.full_name,
        actor_role: "radiologist",
        action: "radiology_dicom_download_refused",
        action_label: "attempted to download a DICOM study without authorization for it",
        document_id: request.request_id,
        hospital: request.routed_hospital || request.doctor_hospital,
      });
      return json({ error: "You are not authorized to download this study." }, 403);
    }

    const { study, studyUid, series, files, patientMismatch } = await resolveStudy(svc, request);
    if (patientMismatch) {
      return json(
        { error: "The imaging study stored for this request belongs to a different patient record, so it cannot be downloaded. The department must correct the study mapping." },
        409
      );
    }

    const facilityName = request.routed_hospital || request.doctor_hospital || "";
    const noSourceMessage =
      "No DICOM study files are available for this request, so no archive can be built. A DICOM archive is required before study retrieval can work: either the radiology department imports the study into AMedix, or the facility connects its PACS/DICOM source in the Hospital Portal (Radiology Department — Imaging System Connection).";

    if (action === "status") {
      const facilities = await svc.entities.HospitalProfile.filter({ user_id: request.routed_hospital_user_id });
      const facility = facilities.find((h: any) => String(h.hospital_name || "").trim() === String(facilityName).trim()) || facilities[0] || null;
      return json({
        request_ref: request.request_id || "",
        patient_cin: request.patient_cin || "",
        study_instance_uid: studyUid,
        accession_number: (study && study.accession_number) || request.accession_number || "",
        series_count: series.length,
        file_count: files.length,
        source: files.length ? "amedix_archive" : null,
        ready: files.length > 0,
        dicom_source_configured: !!(facility && facility.pacs_integration_enabled),
        facility: facilityName,
        message: files.length ? "" : noSourceMessage,
      });
    }

    if (action !== "prepare") return json({ error: "Unknown action." }, 400);
    if (!studyUid) {
      return json(
        { error: "This request has no DICOM Study Instance UID recorded, so the correct study cannot be identified for download. The department must record the study identifier on the imaging request." },
        409
      );
    }
    if (!files.length) return json({ error: noSourceMessage, no_source: true }, 409);
    if (files.length > MAX_FILES) {
      return json({ error: `This study contains ${files.length} DICOM files, more than the ${MAX_FILES} allowed in one download. Ask the radiology department to split the study.` }, 413);
    }

    // Fetch the study's own files from private storage, in small batches.
    const entries: { path: string; data: Uint8Array }[] = [];
    let totalBytes = 0;
    let failed = 0;
    for (let i = 0; i < files.length; i += 6) {
      const batch = files.slice(i, i + 6);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const { signed_url } = await svc.integrations.Core.CreateFileSignedUrl({ file_uri: item.file_uri, expires_in: 600 });
          if (!signed_url) throw new Error("Could not sign the stored file.");
          const res = await fetch(signed_url, { signal: AbortSignal.timeout(30000) });
          if (!res.ok) throw new Error(`Storage answered HTTP ${res.status}`);
          return new Uint8Array(await res.arrayBuffer());
        })
      );
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          entries.push({ path: batch[index].path, data: result.value });
          totalBytes += result.value.length;
        } else {
          failed += 1;
        }
      });
      if (totalBytes > MAX_TOTAL_BYTES) {
        return json({ error: "This study exceeds the maximum archive size for one download. Ask the radiology department to split the study." }, 413);
      }
    }

    if (!entries.length) {
      return json({ error: "The study's DICOM files could not be retrieved from secure storage, so no archive was produced.", no_source: true }, 409);
    }

    const zip = createZipStore(entries);
    const fileName = `AMedix_${safeSegment(request.request_id || request.id, "study")}_${safeSegment(studyUid, "DICOM")}.zip`;
    const upload = await svc.integrations.Core.UploadPrivateFile({
      file: new File([zip], fileName, { type: "application/zip" }),
    });
    const fileUri = upload && upload.file_uri;
    if (!fileUri) return json({ error: "The prepared archive could not be stored." }, 500);

    const signed = await svc.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: SIGNED_URL_TTL_SECONDS });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: user.full_name,
      actor_role: actorRole,
      action: "radiology_dicom_study_downloaded",
      action_label: `downloaded the DICOM study ${studyUid} (${entries.length} image file(s)) for RadiAnt`,
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      encounter_id: request.encounter_id,
      document_id: request.request_id,
      hospital: facilityName,
    });

    return json({
      download_url: signed.signed_url,
      file_name: fileName,
      study_instance_uid: studyUid,
      series_count: series.length,
      file_count: entries.length,
      skipped_files: failed,
      size_bytes: zip.length,
      expires_in_seconds: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}