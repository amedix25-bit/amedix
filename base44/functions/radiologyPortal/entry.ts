import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  resolveRadiologyActor, requestScope, studyScope, auditRadiology, modalityOf, MODALITIES,
} from "../../shared/radiologyPortal.ts";
import { canonicalStage, isOverdue } from "../../shared/radiologyWorkflow.ts";
import { deploymentModeOf } from "../../shared/radiologyDemo.ts";

// Radiology Portal read API — dashboard, worklist, reports, patient history,
// DICOM study records, viewer launch data and the audit trail. Every response
// is computed server-side inside the caller's facility scope; nothing is
// inferred and no configuration or credential is returned to the browser.

const LEGACY = { examination_completed: "performed", reporting_in_progress: "interpretation" };

function expandStages(stages: string[]): string[] {
  const out = new Set<string>();
  stages.forEach((s) => {
    out.add(s);
    if (LEGACY[s]) out.add(LEGACY[s]);
  });
  return [...out];
}

function and(filters: any[]): any {
  const clean = filters.filter(Boolean);
  if (clean.length === 0) return {};
  return clean.length === 1 ? clean[0] : { $and: clean };
}

function items(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

async function buildViewerUrl(template: string, values: Record<string, string>): Promise<string> {
  let url = String(template || "");
  Object.entries(values).forEach(([key, value]) => {
    url = url.split(`{${key}}`).join(encodeURIComponent(value || ""));
  });
  return url;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e && e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "context");

    const actor = await resolveRadiologyActor(base44, user);
    if (!actor) {
      return Response.json(
        { error: "This portal is for a facility's radiology administrator, its designated radiology staff and its authorized radiologists." },
        { status: 403 }
      );
    }

    const svc = base44.asServiceRole;
    const scope = requestScope(actor);
    const sScope = studyScope(actor);

    if (action === "context") {
      const canSeeAdmin = !!actor.hospitalUserId && actor.isAdministrator;
      const scopeUserId = actor.hospitalUserId || actor.hospitalIds[0] || "";
      const [staff, connections, settings] = await Promise.all([
        canSeeAdmin
          ? svc.entities.RadiologyStaff.filter({ hospital_user_id: actor.hospitalUserId }, { limit: 50 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
        canSeeAdmin
          ? svc.entities.PACSConnection.filter({ hospital_user_id: actor.hospitalUserId }, { limit: 20 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
        scopeUserId
          ? svc.entities.RadiologySettings.filter({ hospital_user_id: scopeUserId }, { limit: 1 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);
      return Response.json({
        actor: {
          role: actor.role,
          displayName: actor.displayName,
          hospitalUserId: actor.hospitalUserId,
          hospitalName: actor.hospitalName,
          hospitalIds: actor.hospitalIds,
          hospitalNames: actor.hospitalNames,
          isAdministrator: actor.isAdministrator,
          canReport: actor.canReport,
          staffRole: actor.staff ? actor.staff.staff_role : actor.role,
        },
        staff_count: items(staff).length,
        pacs_connected: items(connections).filter((c: any) => c.status === "connected").length,
        pacs_configured: items(connections).length,
        deployment_mode: deploymentModeOf(items(settings)[0] || null),
      });
    }

    if (action === "dashboard") {
      const pendingStages = ["requested", "under_review", "clarification_required", "scheduled"];
      const reportingStages = ["images_awaiting_transfer", "ready_for_reporting", "reporting_in_progress"];
      const doneStages = ["final_report", "released"];
      const [totalStudies, pending, urgent, awaiting, completed, critical, studiesByModality, recent, connections, imported] =
        await Promise.all([
          svc.entities.ImagingRequest.count(scope).catch(() => 0),
          svc.entities.ImagingRequest.count(and([scope, { workflow_status: { $in: expandStages(pendingStages) } }])).catch(() => 0),
          svc.entities.ImagingRequest.count(and([scope, {
            priority: { $in: ["Urgent", "Emergency"] },
            workflow_status: { $nin: ["final_report", "released", "cancelled"] },
          }])).catch(() => 0),
          svc.entities.ImagingRequest.count(and([scope, { workflow_status: { $in: expandStages(reportingStages) } }])).catch(() => 0),
          svc.entities.ImagingRequest.count(and([scope, { workflow_status: { $in: expandStages(doneStages) } }])).catch(() => 0),
          svc.entities.ImagingRequest.count(and([scope, { is_critical: true }])).catch(() => 0),
          svc.entities.ImagingRequest.aggregate({ query: scope, groupBy: "scan_type" }).catch(() => ({ rows: [] })),
          svc.entities.RadiologyAuditLog.filter({ participant_user_ids: user.id }, { sort: "-datetime", limit: 8 }).catch(() => ({ items: [] })),
          actor.hospitalUserId
            ? svc.entities.PACSConnection.filter({ hospital_user_id: actor.hospitalUserId }, { limit: 20 }).catch(() => ({ items: [] }))
            : Promise.resolve({ items: [] }),
          svc.entities.ImagingStudy.count(sScope).catch(() => 0),
        ]);

      const modalityRows = (studiesByModality && studiesByModality.rows) || [];
      const byModality = MODALITIES.map((m) => ({ modality: m, count: 0 }));
      modalityRows.forEach((row: any) => {
        const key = modalityOf(row.scan_type);
        const rowIn = byModality.find((b) => b.modality === key);
        if (rowIn) rowIn.count += Number(row.count || 0);
        else byModality.push({ modality: key, count: Number(row.count || 0) });
      });

      const recentRows = items(recent);
      let recentPatients: Record<string, any> = {};
      if (recentRows.length > 0) {
        const ids = [...new Set(recentRows.map((r: any) => r.patient_cin).filter(Boolean))];
        recentPatients = { cin_count: ids.length };
      }

      return Response.json({
        counts: {
          total_studies: totalStudies,
          imported_studies: imported,
          pending_requests: pending,
          urgent_cases: urgent,
          awaiting_interpretation: awaiting,
          completed_reports: completed,
          critical_findings: critical,
        },
        by_modality: byModality,
        recent_activity: recentRows,
        pacs: {
          configured: items(connections).length,
          connected: items(connections).filter((c: any) => c.status === "connected").length,
        },
        recent_context: recentPatients,
      });
    }

    if (action === "worklist") {
      const stages = Array.isArray(payload.stages) ? payload.stages.filter(Boolean) : [];
      const filters: any[] = [scope];
      if (stages.length > 0) filters.push({ workflow_status: { $in: expandStages(stages) } });
      if (payload.priority === "Urgent/Emergency") filters.push({ priority: { $in: ["Urgent", "Emergency"] } });
      else if (payload.priority) filters.push({ priority: String(payload.priority) });
      if (payload.modality) filters.push({ scan_type: String(payload.modality) });
      if (payload.status) filters.push({ workflow_status: String(payload.status) });
      if (payload.date_from || payload.date_to) {
        const range: any = {};
        if (payload.date_from) range.$gte = `${payload.date_from}T00:00:00.000Z`;
        if (payload.date_to) range.$lte = `${payload.date_to}T23:59:59.999Z`;
        filters.push({ request_datetime: range });
      }
      const term = String(payload.search || "").trim();
      if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = { $regex: escaped, $options: "i" };
        filters.push({ $or: [{ patient_name: rx }, { patient_cin: rx }, { request_id: rx }] });
      }
      if (actor.role === "radiologist") {
        filters.push({ $or: [{ assigned_radiologist_user_id: user.id }, { assigned_radiologist_user_id: null }] });
      }
      const query = and(filters);

      const [page, stageRows] = await Promise.all([
        svc.entities.ImagingRequest.filter(query, { sort: "-request_datetime", limit: 200 }),
        svc.entities.ImagingRequest.aggregate({ query: scope, groupBy: "workflow_status" }).catch(() => ({ rows: [] })),
      ]);

      const rows = items(page).map((r: any) => ({
        id: r.id,
        request_id: r.request_id,
        patient_id: r.patient_id,
        patient_cin: r.patient_cin,
        patient_name: r.patient_name,
        scan_type: r.scan_type,
        examination: r.examination,
        priority: r.priority,
        stage: canonicalStage(r.workflow_status),
        assigned_radiologist_user_id: r.assigned_radiologist_user_id || "",
        assigned_radiologist_name: r.assigned_radiologist_name || "",
        request_datetime: r.request_datetime || r.date_requested || "",
        is_critical: !!r.is_critical,
        doctor_name: r.doctor_name || "",
        overdue: isOverdue(r),
      }));

      const stageCounts: Record<string, number> = {};
      ((stageRows && stageRows.rows) || []).forEach((row: any) => {
        const key = canonicalStage(row.workflow_status);
        stageCounts[key] = (stageCounts[key] || 0) + Number(row.count || 0);
      });

      const requestIds = rows.map((r) => r.id).filter(Boolean);
      let studiesByRequest: Record<string, number> = {};
      if (requestIds.length > 0) {
        const studies = await svc.entities.ImagingStudy
          .filter({ imaging_request_id: { $in: requestIds.slice(0, 100) } }, { limit: 200 })
          .catch(() => ({ items: [] }));
        items(studies).forEach((s: any) => {
          studiesByRequest[s.imaging_request_id] = (studiesByRequest[s.imaging_request_id] || 0) + 1;
        });
      }
      rows.forEach((r) => {
        (r as any).study_count = studiesByRequest[r.id] || 0;
      });

      return Response.json({ worklist: rows, stage_counts: stageCounts, role: actor.role, can_report: actor.canReport });
    }

    if (action === "reports" || action === "report_detail") {
      if (action === "report_detail") {
        const requestId = String(payload.request_id || "");
        if (!requestId) return Response.json({ error: "Select the imaging request." }, { status: 400 });
        const found = await svc.entities.ImagingRequest.filter(and([scope, { id: requestId }])).catch(() => ({ items: [] }));
        const request = items(found)[0];
        if (!request) return Response.json({ error: "Imaging request not found in your facility." }, { status: 404 });
        const versions = items(
          await svc.entities.RadiologyReportVersion.filter({ imaging_request_id: requestId }, { sort: "-version", limit: 50 }).catch(() => ({ items: [] }))
        );
        return Response.json({ request: { ...request, stage: canonicalStage(request.workflow_status) }, versions });
      }

      const state = String(payload.state || "");
      const stageMap: Record<string, string[]> = {
        draft: ["reporting_in_progress"],
        pending: ["ready_for_reporting", "reporting_in_progress"],
        finalized: ["final_report", "released"],
      };
      const stages = state && stageMap[state] ? stageMap[state] : ["ready_for_reporting", "reporting_in_progress", "final_report", "released"];
      const page = await svc.entities.ImagingRequest.filter(
        and([scope, { workflow_status: { $in: expandStages(stages) } }]),
        { sort: "-request_datetime", limit: 200 }
      );
      const rows = items(page);
      const ids = rows.map((r: any) => r.id);
      let versions: any[] = [];
      if (ids.length > 0) {
        versions = items(
          await svc.entities.RadiologyReportVersion
            .filter({ imaging_request_id: { $in: ids.slice(0, 100) } }, { sort: "-version", limit: 300 })
            .catch(() => ({ items: [] }))
        );
      }
      const byRequest: Record<string, any[]> = {};
      versions.forEach((v) => {
        if (!byRequest[v.imaging_request_id]) byRequest[v.imaging_request_id] = [];
        byRequest[v.imaging_request_id].push(v);
      });
      const reports = rows.map((r: any) => {
        const list = byRequest[r.id] || [];
        const latest = list[0] || null;
        const stage = canonicalStage(r.workflow_status);
        let report_state = "draft";
        if (latest && latest.signed_datetime) report_state = "finalized";
        else if (latest) report_state = "pending_verification";
        return {
          request_id: r.id,
          request_ref: r.request_id,
          patient_name: r.patient_name,
          patient_cin: r.patient_cin,
          scan_type: r.scan_type,
          examination: r.examination,
          priority: r.priority,
          stage,
          report_state,
          version_count: list.length,
          latest_version: latest ? latest.version : 0,
          signed_by_name: latest ? latest.signed_by_name || "" : "",
          signed_datetime: latest ? latest.signed_datetime || "" : "",
          is_amendment: latest ? !!latest.is_amendment : false,
        };
      });
      return Response.json({ reports, role: actor.role });
    }

    if (action === "patient_history") {
      const term = String(payload.search || "").trim();
      const patientId = String(payload.patient_id || "");
      if (!term && !patientId) return Response.json({ error: "Enter a patient name or CIN." }, { status: 400 });

      let patient: any = null;
      if (patientId) {
        patient = await svc.entities.PatientProfile.get(patientId).catch(() => null);
      } else {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = { $regex: escaped, $options: "i" };
        const patients = items(
          await svc.entities.PatientProfile.filter({ $or: [{ cin: rx }, { full_name: rx }] }, { limit: 10 }).catch(() => ({ items: [] }))
        );
        // A patient is only visible here through a study or request of this facility.
        for (const candidate of patients) {
          const inScope =
            (await svc.entities.ImagingRequest.count(and([scope, { patient_id: candidate.id }])).catch(() => 0)) > 0 ||
            (await svc.entities.ImagingStudy.count(and([sScope, { patient_id: candidate.id }])).catch(() => 0)) > 0;
          if (inScope) {
            patient = candidate;
            break;
          }
        }
        if (!patient) {
          return Response.json({ patient: null, studies: [], requests: [], reports: [], message: "No patient of this facility matches that name or CIN." });
        }
      }

      const [requests, studies, versions] = await Promise.all([
        svc.entities.ImagingRequest.filter(and([scope, { patient_id: patient.id }]), { sort: "-request_datetime", limit: 50 }).catch(() => ({ items: [] })),
        svc.entities.ImagingStudy.filter(and([sScope, { patient_id: patient.id }]), { sort: "-created_datetime", limit: 50 }).catch(() => ({ items: [] })),
        svc.entities.RadiologyReportVersion.filter({ patient_id: patient.id }, { sort: "-signed_datetime", limit: 50 }).catch(() => ({ items: [] })),
      ]);

      await auditRadiology(base44, {
        hospitalUserId: actor.hospitalUserId,
        hospitalName: actor.hospitalName,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "patient_history_viewed",
        actionLabel: "viewed the patient's radiology history",
        patientCin: patient.cin,
        patientName: patient.full_name,
      });

      return Response.json({
        patient: { id: patient.id, cin: patient.cin, full_name: patient.full_name, date_of_birth: patient.date_of_birth || "" },
        requests: items(requests).map((r: any) => ({ ...r, stage: canonicalStage(r.workflow_status) })),
        studies: items(studies),
        reports: items(versions),
      });
    }

    if (action === "studies" || action === "study_detail") {
      if (action === "study_detail") {
        const studyId = String(payload.study_id || "");
        if (!studyId) return Response.json({ error: "Select a study." }, { status: 400 });
        const found = await svc.entities.ImagingStudy.filter(and([sScope, { id: studyId }])).catch(() => ({ items: [] }));
        const study = items(found)[0];
        if (!study) return Response.json({ error: "Study not found in your facility." }, { status: 404 });
        const series = items(
          await svc.entities.ImagingSeries.filter({ study_id: study.id }, { sort: "series_number", limit: 100 }).catch(() => ({ items: [] }))
        );

        // Authorized, short-lived access to the stored DICOM files.
        const files: any[] = [];
        for (const s of series) {
          for (const f of Array.isArray(s.files) ? s.files.slice(0, 6) : []) {
            if (files.length >= 24) break;
            try {
              const signed = await svc.integrations.Core.CreateFileSignedUrl({ file_uri: f.file_uri, expires_in: 300 });
              files.push({ file_name: f.file_name || "DICOM", series_instance_uid: s.series_instance_uid, url: signed.signed_url });
            } catch (err) {
              files.push({ file_name: f.file_name || "DICOM", series_instance_uid: s.series_instance_uid, url: "" });
            }
          }
        }

        await auditRadiology(base44, {
          hospitalUserId: actor.hospitalUserId,
          hospitalName: actor.hospitalName,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "study_opened",
          actionLabel: "opened an imaging study",
          studyId: study.id,
          studyInstanceUid: study.study_instance_uid,
          patientCin: study.patient_cin,
          patientName: study.patient_name,
        });

        return Response.json({ study, series, files, role: actor.role });
      }

      const filters: any[] = [sScope];
      const term = String(payload.search || "").trim();
      if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = { $regex: escaped, $options: "i" };
        filters.push({
          $or: [{ patient_name: rx }, { patient_cin: rx }, { accession_number: rx }, { study_instance_uid: rx }],
        });
      }
      if (payload.modality) filters.push({ modality: String(payload.modality) });
      const page = await svc.entities.ImagingStudy.filter(and(filters), { sort: "-created_datetime", limit: 100 });
      return Response.json({ studies: items(page), role: actor.role });
    }

    if (action === "viewer_launch") {
      const studyId = String(payload.study_id || "");
      const viewer = String(payload.viewer || "ohif");
      if (!studyId) return Response.json({ error: "Select a study." }, { status: 400 });
      const found = await svc.entities.ImagingStudy.filter(and([sScope, { id: studyId }])).catch(() => ({ items: [] }));
      const study = items(found)[0];
      if (!study) return Response.json({ error: "Study not found in your facility." }, { status: 404 });

      const connections = items(
        await svc.entities.PACSConnection
          .filter({ hospital_user_id: study.hospital_user_id }, { sort: "-is_default", limit: 10 })
          .catch(() => ({ items: [] }))
      );
      const connection = connections.find((c: any) => c.status === "connected") || connections[0] || null;

      if (!connection) {
        return Response.json({
          configured: false,
          message: "No PACS connection is configured for this facility yet. The administrator records it under PACS Integration.",
          study_instance_uid: study.study_instance_uid,
        });
      }

      const values = {
        study_instance_uid: study.study_instance_uid,
        accession_number: study.accession_number || "",
        series_instance_uid: "",
      };

      if (viewer === "ohif") {
        const template = String(connection.viewer_url_template || "");
        if (connection.viewer_type !== "ohif" || !template) {
          return Response.json({
            configured: false,
            message: "This facility's embedded viewer is not configured. Record the facility's own OHIF deployment under PACS Integration.",
            study_instance_uid: study.study_instance_uid,
          });
        }
        const launch_url = await buildViewerUrl(template, values);
        await auditRadiology(base44, {
          hospitalUserId: actor.hospitalUserId, hospitalName: actor.hospitalName, actorUserId: user.id,
          actorName: actor.displayName, actorRole: actor.role, action: "viewer_launched",
          actionLabel: "opened the study in the embedded viewer", studyId: study.id,
          studyInstanceUid: study.study_instance_uid, patientCin: study.patient_cin, patientName: study.patient_name,
        });
        return Response.json({ configured: true, launch_url, viewer: "ohif", study_instance_uid: study.study_instance_uid });
      }

      // RadiAnt (or another desktop viewer): only a template the facility
      // confirmed with its vendor is ever used — AMedix never guesses a scheme.
      const template = String(connection.radiant_launch_template || "");
      const dicom = {
        host: connection.host || "",
        port: connection.port || null,
        called_ae_title: connection.called_ae_title || "",
        calling_ae_title: connection.calling_ae_title || "",
      };
      if (!template) {
        return Response.json({
          configured: false,
          message: "No desktop viewer launch URL is recorded for this facility. The administrator records the URL the RadiAnt vendor documented.",
          study_instance_uid: study.study_instance_uid,
          dicom,
        });
      }
      const launch_url = await buildViewerUrl(template, values);
      await auditRadiology(base44, {
        hospitalUserId: actor.hospitalUserId, hospitalName: actor.hospitalName, actorUserId: user.id,
        actorName: actor.displayName, actorRole: actor.role, action: "desktop_viewer_launched",
        actionLabel: "requested the study in the desktop viewer", studyId: study.id,
        studyInstanceUid: study.study_instance_uid, patientCin: study.patient_cin, patientName: study.patient_name,
      });
      return Response.json({ configured: true, launch_url, viewer: "radiant", study_instance_uid: study.study_instance_uid, dicom });
    }

    if (action === "audit_list") {
      const page = await svc.entities.RadiologyAuditLog.filter(
        { participant_user_ids: user.id },
        { sort: "-datetime", limit: 100 }
      ).catch(() => ({ items: [] }));
      return Response.json({ entries: items(page) });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}