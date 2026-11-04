import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { resolveRadiologyActor, assertAdministrator, auditRadiology } from "../../shared/radiologyPortal.ts";
import { readDeploymentMode } from "../../shared/radiologyDemo.ts";

// Radiology Portal administration — staff designations, per-facility PACS
// connections (traditional DICOM, DICOMweb, Orthanc, manual import), the
// server-side connection test and department settings. Every write is scoped
// to the caller's own facility and recorded in the radiology audit trail.
// Credential VALUES are never stored here: a connection carries only the NAME
// of a server-side secret.

function items(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

function clean(value: any, max = 300): string {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !!u.hostname;
  } catch (err) {
    return false;
  }
}

function authHeaders(connection: any): Record<string, string> {
  const type = String(connection.auth_type || "none");
  if (type === "none") return {};
  const name = String(connection.auth_secret_name || "");
  if (!name) return {};
  try {
    const value = secrets.get(name);
    if (!value) return {};
    if (type === "bearer") return { Authorization: `Bearer ${value}` };
    return { Authorization: `Basic ${btoa(value)}` };
  } catch (err) {
    return {};
  }
}

async function probeWebEndpoint(connection: any): Promise<{ ok: boolean; message: string }> {
  const base = String(connection.dicomweb_base_url || "").replace(/\/+$/, "");
  if (!isHttpsUrl(base)) return { ok: false, message: "A valid https DICOMweb base URL is required." };
  const url = `${base}/studies?limit=1`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/dicom+json", ...authHeaders(connection) },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return { ok: true, message: `The archive answered ${res.status} to a QIDO-RS study search.` };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: `The archive refused the credentials (${res.status}). Check the authentication method and the server-side secret.` };
    }
    return { ok: false, message: `The archive answered ${res.status} to a QIDO-RS study search.` };
  } catch (err: any) {
    return { ok: false, message: `The endpoint could not be reached: ${err.message}` };
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e && e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "");

    const actor = await resolveRadiologyActor(base44, user);
    if (!actor) return Response.json({ error: "Not authorized for a radiology facility." }, { status: 403 });
    if (!actor.hospitalUserId) {
      return Response.json({ error: "Only facility staff can administer a radiology department." }, { status: 403 });
    }
    const svc = base44.asServiceRole;
    const auditBase = {
      hospitalUserId: actor.hospitalUserId,
      hospitalName: actor.hospitalName,
      actorUserId: user.id,
      actorName: actor.displayName,
      actorRole: actor.role,
    };

    // ---------- Staff ----------
    if (action === "staff_list") {
      const page = await svc.entities.RadiologyStaff.filter(
        { hospital_user_id: actor.hospitalUserId },
        { sort: "-added_datetime", limit: 100 }
      );
      return Response.json({ staff: items(page), can_manage: actor.isAdministrator });
    }

    if (action === "staff_save") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      const id = clean(payload.id, 60);
      const name = clean(payload.name, 120);
      const email = clean(payload.email, 200).toLowerCase();
      const staffRole = ["administrator", "radiologist", "technician"].includes(payload.staff_role) ? payload.staff_role : "radiologist";
      if (!name) return Response.json({ error: "Enter the staff member's name." }, { status: 400 });

      if (id) {
        const existing = items(await svc.entities.RadiologyStaff.filter({ id, hospital_user_id: actor.hospitalUserId }))[0];
        if (!existing) return Response.json({ error: "Staff member not found." }, { status: 404 });
        const participants = [...new Set([...(existing.participant_user_ids || []), actor.hospitalUserId, existing.user_id].filter(Boolean))];
        const updated = await svc.entities.RadiologyStaff.update(id, {
          name,
          email: email || existing.email || "",
          staff_role: staffRole,
          license_number: clean(payload.license_number, 120),
          phone: clean(payload.phone, 60),
          status: ["invited", "active", "suspended"].includes(payload.status) ? payload.status : existing.status,
          participant_user_ids: participants,
        });
        await auditRadiology(base44, {
          ...auditBase,
          action: "staff_updated",
          actionLabel: `updated the radiology staff designation for ${name}`,
          detail: `${staffRole} — ${updated.status}`,
        });
        return Response.json({ staff: updated });
      }

      if (!email) return Response.json({ error: "Enter the email the staff member signs in with." }, { status: 400 });
      const duplicate = items(await svc.entities.RadiologyStaff.filter({ hospital_user_id: actor.hospitalUserId, email }));
      if (duplicate.length > 0) {
        return Response.json({ error: "A staff member with this email is already designated for this facility." }, { status: 409 });
      }
      const created = await svc.entities.RadiologyStaff.create({
        hospital_user_id: actor.hospitalUserId,
        hospital_id: actor.hospitalId || "",
        hospital_name: actor.hospitalName,
        participant_user_ids: [actor.hospitalUserId],
        name,
        email,
        staff_role: staffRole,
        license_number: clean(payload.license_number, 120),
        phone: clean(payload.phone, 60),
        status: "invited",
        added_by_name: actor.displayName,
        added_datetime: new Date().toISOString(),
      });
      await auditRadiology(base44, {
        ...auditBase,
        action: "staff_designated",
        actionLabel: `designated ${name} as ${staffRole}`,
        detail: email,
      });
      return Response.json({ staff: created });
    }

    if (action === "staff_remove") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      const id = clean(payload.id, 60);
      const existing = items(await svc.entities.RadiologyStaff.filter({ id, hospital_user_id: actor.hospitalUserId }))[0];
      if (!existing) return Response.json({ error: "Staff member not found." }, { status: 404 });
      // Access is withdrawn immediately; the designation stays as a record.
      const updated = await svc.entities.RadiologyStaff.update(id, { status: "suspended" });
      await auditRadiology(base44, {
        ...auditBase,
        action: "staff_access_withdrawn",
        actionLabel: `withdrew portal access for ${existing.name}`,
      });
      return Response.json({ staff: updated });
    }

    // ---------- PACS connections ----------
    if (action === "pacs_list") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      const page = await svc.entities.PACSConnection.filter(
        { hospital_user_id: actor.hospitalUserId },
        { sort: "-updated_datetime", limit: 50 }
      );
      return Response.json({ connections: items(page) });
    }

    if (action === "pacs_save") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      if ((await readDeploymentMode(base44, actor.hospitalUserId)) === "demonstration") {
        return Response.json(
          { error: "PACS integration is disabled while the facility is in demonstration mode. Finish the demonstration stages, then switch the deployment to verification to configure the hospital's own PACS." },
          { status: 403 }
        );
      }
      const id = clean(payload.id, 60);
      const type = ["dicom_network", "dicomweb", "orthanc", "manual_import"].includes(payload.connection_type)
        ? payload.connection_type
        : "dicom_network";
      const name = clean(payload.name, 120);
      if (!name) return Response.json({ error: "Give the connection a name." }, { status: 400 });

      const port = Number(payload.port);
      if (type === "dicom_network") {
        if (!clean(payload.host, 200)) return Response.json({ error: "Enter the PACS IP address or hostname." }, { status: 400 });
        if (!port || port < 1 || port > 65535) return Response.json({ error: "Enter a valid PACS port (commonly 104 or 11112)." }, { status: 400 });
        if (!clean(payload.called_ae_title, 16)) return Response.json({ error: "Enter the Called AE Title of the PACS." }, { status: 400 });
        if (!clean(payload.calling_ae_title, 16)) return Response.json({ error: "Enter the Calling AE Title AMedix should present." }, { status: 400 });
      }
      if (type === "dicomweb" || type === "orthanc") {
        if (!isHttpsUrl(clean(payload.dicomweb_base_url, 300))) {
          return Response.json({ error: "Enter the archive's https base URL." }, { status: 400 });
        }
      }

      const record: any = {
        hospital_user_id: actor.hospitalUserId,
        hospital_name: actor.hospitalName,
        participant_user_ids: [actor.hospitalUserId],
        name,
        connection_type: type,
        host: clean(payload.host, 200),
        port: port || null,
        called_ae_title: clean(payload.called_ae_title, 16).toUpperCase(),
        calling_ae_title: clean(payload.calling_ae_title, 16).toUpperCase(),
        dicomweb_base_url: clean(payload.dicomweb_base_url, 300),
        supports_qido: !!payload.supports_qido,
        supports_wado: !!payload.supports_wado,
        supports_stow: !!payload.supports_stow,
        auth_type: ["none", "bearer", "basic"].includes(payload.auth_type) ? payload.auth_type : "none",
        auth_secret_name: clean(payload.auth_secret_name, 120),
        viewer_type: ["ohif", "radiant", "vendor_web", "none"].includes(payload.viewer_type) ? payload.viewer_type : "none",
        viewer_url_template: clean(payload.viewer_url_template, 400),
        radiant_launch_template: clean(payload.radiant_launch_template, 400),
        is_default: !!payload.is_default,
        notes: clean(payload.notes, 1000),
        updated_datetime: new Date().toISOString(),
        // Saving a configuration invalidates any earlier verification.
        status: "pending_verification",
      };

      let saved: any;
      if (id) {
        const existing = items(await svc.entities.PACSConnection.filter({ id, hospital_user_id: actor.hospitalUserId }))[0];
        if (!existing) return Response.json({ error: "Connection not found." }, { status: 404 });
        saved = await svc.entities.PACSConnection.update(id, { ...record, config_version: (existing.config_version || 1) + 1 });
      } else {
        saved = await svc.entities.PACSConnection.create({ ...record, config_version: 1 });
      }

      if (saved.is_default) {
        const others = items(await svc.entities.PACSConnection.filter({ hospital_user_id: actor.hospitalUserId }));
        for (const other of others) {
          if (other.id !== saved.id && other.is_default) {
            await svc.entities.PACSConnection.update(other.id, { is_default: false }).catch(() => null);
          }
        }
      }

      await auditRadiology(base44, {
        ...auditBase,
        action: "pacs_configuration_saved",
        actionLabel: `saved the '${name}' PACS connection`,
        detail: `${type}; verification reset`,
      });
      return Response.json({ connection: saved });
    }

    if (action === "pacs_test") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      if ((await readDeploymentMode(base44, actor.hospitalUserId)) === "demonstration") {
        return Response.json(
          { error: "No real PACS is contacted in demonstration mode. Switch the deployment to verification to test the facility's own endpoint." },
          { status: 403 }
        );
      }
      const id = clean(payload.id, 60);
      const connection = items(await svc.entities.PACSConnection.filter({ id, hospital_user_id: actor.hospitalUserId }))[0];
      if (!connection) return Response.json({ error: "Connection not found." }, { status: 404 });

      const checks: any[] = [];
      let connected = false;

      if (connection.connection_type === "manual_import") {
        checks.push({
          key: "manual", label: "Manual DICOM import",
          outcome: "passed", message: "Files are uploaded through AMedix; no external system to verify.",
        });
        connected = true;
      } else if (connection.connection_type === "dicom_network") {
        const complete = !!connection.host && !!connection.port && !!connection.called_ae_title && !!connection.calling_ae_title;
        checks.push({
          key: "dicom_network",
          label: "DICOM networking configuration",
          outcome: complete ? "passed" : "failed",
          message: complete
            ? `${connection.calling_ae_title} → ${connection.host}:${connection.port} (Called AE ${connection.called_ae_title}).`
            : "Host, port and both AE titles are required.",
        });
        checks.push({
          key: "network_probe",
          label: "Live DICOM association",
          outcome: "not_tested",
          message: "A DICOM association is an application-level protocol that AMedix cannot verify from the web runtime. The facility's DICOM engineer confirms the association; AMedix records the configuration as verified only after QIDO/REST verification.",
        });
      } else {
        const probe = await probeWebEndpoint(connection);
        checks.push({ key: "endpoint", label: "Archive endpoint", outcome: probe.ok ? "passed" : "failed", message: probe.message });
        checks.push({
          key: "capabilities",
          label: "Declared capabilities",
          outcome: connection.supports_qido || connection.supports_wado || connection.supports_stow ? "passed" : "not_tested",
          message: `QIDO ${connection.supports_qido ? "yes" : "no"} · WADO ${connection.supports_wado ? "yes" : "no"} · STOW ${connection.supports_stow ? "yes" : "no"}`,
        });
        connected = probe.ok;
      }

      const testedDatetime = new Date().toISOString();
      const status = connected ? "connected" : "failed";
      const updated = await svc.entities.PACSConnection.update(connection.id, {
        status,
        last_tested_datetime: testedDatetime,
        last_test_result: {
          tested_datetime: testedDatetime,
          outcome: status,
          simulated: false,
          checks,
          message: checks.map((c) => c.message).join(" "),
        },
      });

      await auditRadiology(base44, {
        ...auditBase,
        action: "pacs_test_run",
        actionLabel: `ran a connection test on '${connection.name}'`,
        detail: `${status} — ${checks.map((c) => `${c.label}: ${c.outcome}`).join("; ")}`,
      });

      return Response.json({ connection: updated });
    }

    if (action === "pacs_delete") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      const id = clean(payload.id, 60);
      const existing = items(await svc.entities.PACSConnection.filter({ id, hospital_user_id: actor.hospitalUserId }))[0];
      if (!existing) return Response.json({ error: "Connection not found." }, { status: 404 });
      await svc.entities.PACSConnection.delete(id);
      await auditRadiology(base44, {
        ...auditBase,
        action: "pacs_configuration_removed",
        actionLabel: `removed the '${existing.name}' PACS connection`,
      });
      return Response.json({ ok: true });
    }

    // ---------- Settings ----------
    if (action === "settings_get") {
      const rows = items(
        await svc.entities.RadiologySettings.filter({ hospital_user_id: actor.hospitalUserId }, { limit: 1 })
      );
      const settings = rows[0] || {
        hospital_user_id: actor.hospitalUserId,
        hospital_name: actor.hospitalName,
        deployment_mode: "demonstration",
        critical_escalation_hours: 2,
        report_release_policy: "manual_release_only",
        audit_retention_days: 365,
        default_calling_ae_title: "",
        report_footer_note: "",
      };
      return Response.json({ settings, can_manage: actor.isAdministrator });
    }

    if (action === "settings_save") {
      const denied = assertAdministrator(actor);
      if (denied) return Response.json({ error: denied }, { status: 403 });
      const hours = Number(payload.critical_escalation_hours);
      const retention = Number(payload.audit_retention_days);
      const record: any = {
        hospital_user_id: actor.hospitalUserId,
        hospital_name: actor.hospitalName,
        participant_user_ids: [actor.hospitalUserId],
        default_calling_ae_title: clean(payload.default_calling_ae_title, 16).toUpperCase(),
        critical_escalation_hours: Number.isFinite(hours) && hours > 0 ? hours : 2,
        report_release_policy: ["manual_release_only", "auto_release_finalized"].includes(payload.report_release_policy)
          ? payload.report_release_policy
          : "manual_release_only",
        audit_retention_days: Number.isFinite(retention) && retention >= 30 ? Math.round(retention) : 365,
        report_footer_note: clean(payload.report_footer_note, 500),
        updated_datetime: new Date().toISOString(),
        updated_by_name: actor.displayName,
      };
      const rows = items(await svc.entities.RadiologySettings.filter({ hospital_user_id: actor.hospitalUserId }, { limit: 1 }));
      const saved = rows[0]
        ? await svc.entities.RadiologySettings.update(rows[0].id, record)
        : await svc.entities.RadiologySettings.create(record);
      await auditRadiology(base44, {
        ...auditBase,
        action: "settings_saved",
        actionLabel: "updated the radiology department settings",
        detail: `${record.report_release_policy}, escalation ${record.critical_escalation_hours}h`,
      });
      return Response.json({ settings: saved });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}