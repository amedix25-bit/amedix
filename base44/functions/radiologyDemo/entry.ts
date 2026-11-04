import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveRadiologyActor, auditRadiology } from "../../shared/radiologyPortal.ts";
import {
  DEMO_PATIENTS, DEMO_STUDIES, DEMO_STAGES, DEMO_CIN_PREFIX,
  buildDemoStudyFiles, deploymentModeOf, isDemoPatient,
} from "../../shared/radiologyDemo.ts";

// Demonstration environment API for the Radiology Portal.
//
// The facility starts in demonstration mode: fictional patients and synthetic
// DICOM studies only. This function prepares that data — it creates the
// fictional patient records and uploads real DICOM files built by
// shared/radiologyDemo, which the browser then sends through the ordinary
// authorized import function. Nothing is written straight into the study
// tables, so the demonstration exercises the same pipeline a real facility
// will use.
//
// The deployment mode itself is a server-side setting: leaving demonstration
// mode is an explicit, audited administrator decision.

function items(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

function clean(value: any, max = 200): string {
  return String(value == null ? "" : value).trim().slice(0, max);
}

// Demonstration requests cover every worklist stage the department must learn:
// one waiting, one scheduled, one performed and one awaiting image transfer.
const SCAN_TYPE: Record<string, string> = {
  CT: "CT", MR: "MRI", DX: "X-Ray", CR: "X-Ray", US: "Ultrasound", MG: "Mammography",
};

const DEMO_REQUESTS: { workflow_status: string; priority: string }[] = [
  { workflow_status: "requested", priority: "Routine" },
  { workflow_status: "scheduled", priority: "Urgent" },
  { workflow_status: "examination_completed", priority: "Routine" },
  { workflow_status: "images_awaiting_transfer", priority: "Emergency" },
];

async function settingsRow(base44: any, hospitalUserId: string): Promise<any | null> {
  const page = await base44.asServiceRole.entities.RadiologySettings.filter(
    { hospital_user_id: hospitalUserId },
    { limit: 1 }
  );
  return items(page)[0] || null;
}

async function saveSettings(base44: any, hospitalUserId: string, hospitalName: string, patch: any): Promise<any> {
  const existing = await settingsRow(base44, hospitalUserId);
  const base = { hospital_user_id: hospitalUserId, hospital_name: hospitalName, participant_user_ids: [hospitalUserId] };
  if (existing) return base44.asServiceRole.entities.RadiologySettings.update(existing.id, patch);
  return base44.asServiceRole.entities.RadiologySettings.create({
    ...base,
    critical_escalation_hours: 2,
    report_release_policy: "manual_release_only",
    audit_retention_days: 365,
    deployment_mode: "demonstration",
    ...patch,
  });
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e && e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "status");

    const actor = await resolveRadiologyActor(base44, user);
    if (!actor) return Response.json({ error: "Not authorized for a radiology facility." }, { status: 403 });
    // A radiologist may be authorized by facility name only; fall back to the
    // first facility id so the read-only deployment state still resolves.
    const facilityUserId = actor.hospitalUserId || actor.hospitalIds[0] || "";
    if (!facilityUserId) {
      return Response.json({ error: "Only facility radiology staff can see the deployment state." }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const auditBase = {
      hospitalUserId: facilityUserId,
      hospitalName: actor.hospitalName,
      actorUserId: user.id,
      actorName: actor.displayName,
      actorRole: actor.role,
    };

    if (action === "status") {
      const settings = await settingsRow(base44, facilityUserId);
      const mode = deploymentModeOf(settings);
      const [patients, studies, series, requests] = await Promise.all([
        svc.entities.PatientProfile.filter({ cin: { $regex: `^${DEMO_CIN_PREFIX}` } }, { limit: 50 }).catch(() => ({ items: [] })),
        svc.entities.ImagingStudy.filter({ hospital_user_id: facilityUserId, patient_cin: { $regex: `^${DEMO_CIN_PREFIX}` } }, { limit: 100 }).catch(() => ({ items: [] })),
        svc.entities.ImagingSeries.filter({ hospital_user_id: facilityUserId }, { limit: 200 }).catch(() => ({ items: [] })),
        svc.entities.ImagingRequest.filter({ routed_hospital_user_id: facilityUserId }, { limit: 200 }).catch(() => ({ items: [] })),
      ]);
      const studyRows = items(studies);
      const demoSeries = items(series).filter((s: any) => studyRows.some((st: any) => st.id === s.study_id));
      const demoRequests = items(requests).filter((r: any) => String(r.patient_cin || "").toUpperCase().startsWith(DEMO_CIN_PREFIX));

      const states: Record<string, string> = {
        dashboard_data: "ready",
        worklist: "ready",
        viewer: "ready",
        manual_import: studyRows.length > 0 ? "verified" : "ready",
        reporting: "ready",
        portals: "ready",
        pacs: mode === "demonstration" ? "blocked" : "ready",
      };

      return Response.json({
        deployment_mode: mode,
        can_manage: actor.isAdministrator,
        demo: {
          patients: items(patients).length,
          studies: studyRows.length,
          series: demoSeries.length,
          requests: demoRequests.length,
          images: studyRows.reduce((sum: number, s: any) => sum + Number(s.image_count || 0), 0),
          seeded_datetime: settings ? settings.demo_seeded_datetime || "" : "",
        },
        stages: DEMO_STAGES.map((stage) => ({
          ...stage,
          state: states[stage.key] || "ready",
          blocked_reason:
            stage.key === "pacs"
              ? "Real hospital PACS and RadiAnt are connected only after the demonstration stages are signed off and the facility is switched to verification, then live operation."
              : "",
        })),
      });
    }

    if (action === "prepare") {
      if (!actor.isAdministrator) {
        return Response.json({ error: "Only the facility's radiology administrator can prepare demonstration data." }, { status: 403 });
      }

      // Fictional patient records — one per demonstration subject. They are
      // identified by the reserved DEMO- CIN prefix everywhere in the portal.
      for (const person of DEMO_PATIENTS) {
        const existing = items(await svc.entities.PatientProfile.filter({ cin: person.cin }, { limit: 1 }).catch(() => ({ items: [] })))[0];
        if (!existing) {
          await svc.entities.PatientProfile.create({
            user_id: "",
            cin: person.cin,
            full_name: person.full_name,
            first_name: "Fictional",
            father_name: "Patient",
            last_name: person.full_name.split(" ").slice(-1)[0],
            date_of_birth: person.date_of_birth,
            gender: person.gender,
            nationality: "Demonstration",
            preferred_language: "en",
          });
        }
      }

      // Demonstration imaging requests, so the worklist and the reporting chain
      // can be walked with the same synthetic patients.
      const existingRequests = items(
        await svc.entities.ImagingRequest
          .filter({ routed_hospital_user_id: facilityUserId }, { limit: 200 })
          .catch(() => ({ items: [] }))
      ).filter((r: any) => String(r.patient_cin || "").toUpperCase().startsWith(DEMO_CIN_PREFIX));

      const today = new Date().toISOString();
      const todayDate = today.slice(0, 10);
      const prepared: any[] = [];

      for (let index = 0; index < DEMO_STUDIES.length; index += 1) {
        const plan = DEMO_STUDIES[index];
        const study = buildDemoStudyFiles(plan, today);

        let request = existingRequests.find((r: any) => r.patient_cin === study.patient.cin) || null;
        if (!request) {
          const shape = DEMO_REQUESTS[index % DEMO_REQUESTS.length];
          request = await svc.entities.ImagingRequest.create({
            patient_id: (items(await svc.entities.PatientProfile.filter({ cin: study.patient.cin }, { limit: 1 }))[0] || {}).id || "",
            patient_user_id: "",
            patient_cin: study.patient.cin,
            patient_name: study.patient.full_name,
            doctor_id: "",
            doctor_name: "Demonstration Referral",
            doctor_specialization: "Demonstration",
            request_id: `DEMO-IR-${String(index + 1).padStart(4, "0")}`,
            scan_type: SCAN_TYPE[plan.modality] || "Other",
            examination: plan.study_description,
            body_part: plan.series[0] ? plan.series[0].description : "",
            clinical_indication: "Demonstration data — this is not a real patient.",
            working_diagnosis: "Demonstration data — for portal testing only.",
            priority: shape.priority,
            date_requested: todayDate,
            request_datetime: today,
            request_time: today.slice(11, 16),
            workflow_status: shape.workflow_status,
            routed_hospital_user_id: facilityUserId,
            routed_hospital: actor.hospitalName,
            status: "requested",
            status_history: [
              {
                action: "demo_request_created",
                from: "",
                to: shape.workflow_status,
                by_name: actor.displayName,
                by_role: "department",
                datetime: today,
                note: "Synthetic demonstration request for fictional patient",
              },
            ],
            updated_datetime: today,
          });
        }

        // Synthetic studies are built as real DICOM Part 10 files and uploaded
        // to private storage; the caller imports them through the ordinary
        // import function, so the same verification, duplicate detection and
        // patient matching apply as for a real facility.
        const files: any[] = [];
        for (const file of study.files) {
          const uploaded = await svc.integrations.Core.UploadPrivateFile({
            file: new File([file.bytes], file.file_name, { type: "application/dicom" }),
          });
          files.push({ file_uri: uploaded.file_uri, file_name: file.file_name, size: file.bytes.length });
        }

        prepared.push({
          patient_cin: study.patient.cin,
          patient_name: study.patient.full_name,
          modality: study.modality,
          study_description: study.study_description,
          accession_number: study.accession_number,
          request_id: request ? request.id : "",
          request_ref: request ? request.request_id : "",
          files,
        });
      }

      await saveSettings(base44, facilityUserId, actor.hospitalName, {
        deployment_mode: deploymentModeOf(await settingsRow(base44, facilityUserId)),
        demo_seeded_datetime: today,
        demo_study_count: prepared.length,
        updated_datetime: today,
        updated_by_name: actor.displayName,
      });

      await auditRadiology(base44, {
        ...auditBase,
        action: "demo_data_prepared",
        actionLabel: "prepared synthetic demonstration studies",
        detail: `${prepared.length} synthetic studies generated for import (fictional patients only)`,
      });

      return Response.json({ studies: prepared });
    }

    if (action === "mode_save") {
      if (!actor.isAdministrator) {
        return Response.json({ error: "Only the facility's radiology administrator can change the deployment mode." }, { status: 403 });
      }
      const requested = String(payload.deployment_mode || "");
      if (!["demonstration", "verification", "live"].includes(requested)) {
        return Response.json({ error: "Choose demonstration, verification or live operation." }, { status: 400 });
      }
      if (requested === "live" && payload.confirm !== true) {
        return Response.json({ error: "Activating live operation requires the administrator's explicit confirmation." }, { status: 400 });
      }

      const now = new Date().toISOString();
      const patch: any = {
        deployment_mode: requested,
        updated_datetime: now,
        updated_by_name: actor.displayName,
      };
      if (requested === "live") {
        patch.live_activated_datetime = now;
        patch.live_activated_by_name = actor.displayName;
      }
      const saved = await saveSettings(base44, facilityUserId, actor.hospitalName, patch);

      await auditRadiology(base44, {
        ...auditBase,
        action: "deployment_mode_changed",
        actionLabel: `set the radiology deployment to ${requested}`,
        detail: clean(payload.note, 500),
      });

      return Response.json({ deployment_mode: deploymentModeOf(saved), settings: saved });
    }

    if (action === "purge_demo") {
      if (!actor.isAdministrator) {
        return Response.json({ error: "Only the facility's radiology administrator can clear demonstration data." }, { status: 403 });
      }
      const studies = items(
        await svc.entities.ImagingStudy.filter({ hospital_user_id: facilityUserId }, { limit: 200 }).catch(() => ({ items: [] }))
      ).filter((s: any) => isDemoPatient({ cin: s.patient_cin }));

      for (const study of studies) {
        const series = items(await svc.entities.ImagingSeries.filter({ study_id: study.id }, { limit: 200 }).catch(() => ({ items: [] })));
        for (const s of series) {
          await svc.entities.ImagingSeries.delete(s.id).catch(() => null);
        }
        await svc.entities.ImagingStudy.delete(study.id).catch(() => null);
      }

      const demoRequests = items(
        await svc.entities.ImagingRequest.filter({ routed_hospital_user_id: facilityUserId }, { limit: 200 }).catch(() => ({ items: [] }))
      ).filter((r: any) => String(r.patient_cin || "").toUpperCase().startsWith(DEMO_CIN_PREFIX));
      for (const request of demoRequests) {
        await svc.entities.ImagingRequest.delete(request.id).catch(() => null);
      }

      const patients = items(
        await svc.entities.PatientProfile.filter({ cin: { $regex: `^${DEMO_CIN_PREFIX}` } }, { limit: 50 }).catch(() => ({ items: [] }))
      );
      for (const person of patients) {
        const using = await svc.entities.ImagingStudy.count({ patient_id: person.id }).catch(() => 0);
        if (using === 0) await svc.entities.PatientProfile.delete(person.id).catch(() => null);
      }

      await saveSettings(base44, facilityUserId, actor.hospitalName, {
        demo_seeded_datetime: "",
        demo_study_count: 0,
        updated_datetime: new Date().toISOString(),
        updated_by_name: actor.displayName,
      });

      await auditRadiology(base44, {
        ...auditBase,
        action: "demo_data_cleared",
        actionLabel: "cleared the synthetic demonstration data",
        detail: `${studies.length} synthetic studies and ${demoRequests.length} demonstration requests removed`,
      });

      return Response.json({
        removed_studies: studies.length,
        removed_requests: demoRequests.length,
        removed_patients: patients.length,
      });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}