// Shared Radiology Portal rules — ONE authorization model behind every action
// of the dedicated Radiology Portal (dashboard, worklist, viewer, reports,
// staff, PACS, settings, audit).
//
// Every caller is resolved server-side to a facility and a role:
//   administrator — the facility administrator whose radiology department is
//                   enabled: full portal oversight (staff, PACS, settings).
//   radiologist   — a radiologist authorized for the facility (granted
//                   membership or legacy home facility): interprets studies
//                   and signs reports.
//   technician    — a designated facility staff member: performs examinations
//                   and imports images, never signs reports.
// RadiologyStaff invitations activate only for the email the facility
// administrator designated — never by self-declaration.

export type RadiologyActor = {
  role: "administrator" | "radiologist" | "technician";
  userId: string;
  displayName: string;
  hospitalUserId: string;
  hospitalId: string;
  hospitalName: string;
  hospitalIds: string[];
  hospitalNames: string[];
  staff: any | null;
  radiologist: any | null;
  isAdministrator: boolean;
  canReport: boolean;
  canImport: boolean;
};

function rows(result: any): any[] {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

export async function resolveRadiologyActor(base44: any, user: any): Promise<RadiologyActor | null> {
  if (!user || !user.id) return null;

  // 1. Facility administrator with a configured radiology department.
  const hospitals = rows(await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id }, { limit: 5 }));
  const department = hospitals.find((h: any) => h.radiology_department_enabled && h.status !== "suspended");
  if (department) {
    return {
      role: "administrator",
      userId: user.id,
      displayName: user.full_name || department.hospital_name,
      hospitalUserId: user.id,
      hospitalId: department.id,
      hospitalName: department.hospital_name,
      hospitalIds: [user.id],
      hospitalNames: [department.hospital_name].filter(Boolean),
      staff: null,
      radiologist: null,
      isAdministrator: true,
      canReport: true,
      canImport: true,
    };
  }

  // 2. An AMedix administrator oversees every facility's radiology department.
  //    Without this the portal is unusable for administration: the account has
  //    no facility of its own, so every read would resolve to nothing.
  if (user.role === "admin") {
    const enabled = rows(
      await base44.asServiceRole.entities.HospitalProfile.filter(
        { radiology_department_enabled: true },
        { limit: 50 }
      )
    ).filter((h: any) => h.status !== "suspended");
    const ids = [...new Set(enabled.map((h: any) => String(h.user_id || "")).filter(Boolean))];
    const names = [...new Set(enabled.map((h: any) => String(h.hospital_name || "").trim()).filter(Boolean))];
    if (ids.length > 0 || names.length > 0) {
      return {
        role: "administrator",
        userId: user.id,
        displayName: user.full_name || "AMedix Administrator",
        hospitalUserId: ids[0] || "",
        hospitalId: enabled[0] ? enabled[0].id : "",
        hospitalName: names[0] || "",
        hospitalIds: ids,
        hospitalNames: names,
        staff: null,
        radiologist: null,
        isAdministrator: true,
        canReport: true,
        canImport: true,
      };
    }
  }

  // 3. Designated radiology staff — an invitation claims on first sign-in with
  //    the exact designated email. Nothing is granted by self-declaration.
  const email = String(user.email || "").toLowerCase();
  if (email) {
    const invited = rows(
      await base44.asServiceRole.entities.RadiologyStaff.filter({ email, status: "invited" }, { limit: 5 })
    );
    if (invited.length > 0) {
      const pending = invited[0];
      const participants = [...new Set([...(pending.participant_user_ids || []), pending.hospital_user_id, user.id])];
      await base44.asServiceRole.entities.RadiologyStaff.update(pending.id, {
        user_id: user.id,
        status: "active",
        participant_user_ids: participants,
        last_active_datetime: new Date().toISOString(),
      });
      pending.user_id = user.id;
      pending.status = "active";
      return actorFromStaff(user, pending);
    }
  }

  const staffRows = rows(
    await base44.asServiceRole.entities.RadiologyStaff.filter({ user_id: user.id, status: "active" }, { limit: 5 })
  );
  if (staffRows.length > 0) return actorFromStaff(user, staffRows[0]);

  // 4. A radiologist authorized for at least one facility's department.
  const radiologists = rows(
    await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }, { limit: 1 })
  );
  const radiologist = radiologists[0];
  if (radiologist && radiologist.status !== "suspended") {
    const ids = new Set<string>();
    const names = new Set<string>();
    const legacy = String(radiologist.hospital || "").trim();
    if (legacy) names.add(legacy);
    for (const f of Array.isArray(radiologist.authorized_facilities) ? radiologist.authorized_facilities : []) {
      if (f && f.hospital_user_id) ids.add(String(f.hospital_user_id));
      if (f && f.hospital_name) names.add(String(f.hospital_name));
    }
    // A profile can name the facility without ever holding its id — resolve the
    // id from the name so facility-scoped reads (settings, PACS, staff, demo
    // state) work instead of resolving to nothing.
    if (ids.size === 0 && names.size > 0) {
      const byName = rows(
        await base44.asServiceRole.entities.HospitalProfile.filter(
          { hospital_name: { $in: [...names] } },
          { limit: 10 }
        )
      );
      byName.forEach((h: any) => h.user_id && ids.add(String(h.user_id)));
    }
    if (ids.size > 0 || names.size > 0) {
      return {
        role: "radiologist",
        userId: user.id,
        displayName: radiologist.full_name || user.full_name,
        hospitalUserId: [...ids][0] || "",
        hospitalId: "",
        hospitalName: [...names][0] || "",
        hospitalIds: [...ids],
        hospitalNames: [...names],
        staff: null,
        radiologist,
        isAdministrator: false,
        canReport: true,
        canImport: false,
      };
    }
  }

  return null;
}

function actorFromStaff(user: any, staff: any): RadiologyActor {
  const role = staff.staff_role === "administrator" ? "administrator" : staff.staff_role === "technician" ? "technician" : "radiologist";
  return {
    role,
    userId: user.id,
    displayName: staff.name || user.full_name,
    hospitalUserId: staff.hospital_user_id,
    hospitalId: staff.hospital_id || "",
    hospitalName: staff.hospital_name || "",
    hospitalIds: staff.hospital_user_id ? [staff.hospital_user_id] : [],
    hospitalNames: staff.hospital_name ? [staff.hospital_name] : [],
    staff,
    radiologist: null,
    isAdministrator: role === "administrator",
    canReport: role !== "technician",
    canImport: true,
  };
}

// Study/request scope of the resolved actor. A radiologist is scoped to the
// facilities they are authorized for; facility staff to their own facility.
export function requestScope(actor: RadiologyActor): any {
  const branches: any[] = [];
  if (actor.hospitalIds.length > 0) branches.push({ routed_hospital_user_id: { $in: actor.hospitalIds } });
  if (actor.hospitalNames.length > 0) branches.push({ routed_hospital: { $in: actor.hospitalNames } });
  return branches.length === 1 ? branches[0] : { $or: branches };
}

export function studyScope(actor: RadiologyActor): any {
  const branches: any[] = [];
  if (actor.hospitalIds.length > 0) branches.push({ hospital_user_id: { $in: actor.hospitalIds } });
  if (actor.hospitalNames.length > 0) branches.push({ hospital_name: { $in: actor.hospitalNames } });
  return branches.length === 1 ? branches[0] : { $or: branches };
}

const ADMIN_ROLES = ["administrator"];

export function assertAdministrator(actor: RadiologyActor): string | null {
  return ADMIN_ROLES.includes(actor.role) ? null : "Only the facility's radiology administrator can do this.";
}

// Everyone who may read a study of this facility: the administrator, the
// facility's active radiology staff, and radiologists authorized for it.
export async function participantIds(base44: any, hospitalUserId: string, hospitalName: string): Promise<string[]> {
  const ids = new Set<string>();
  if (hospitalUserId) ids.add(hospitalUserId);
  try {
    const staff = rows(
      await base44.asServiceRole.entities.RadiologyStaff.filter(
        { hospital_user_id: hospitalUserId, status: "active" },
        { limit: 50 }
      )
    );
    staff.forEach((s: any) => s.user_id && ids.add(s.user_id));
  } catch (err) {
    // the administrator still reads their own facility's studies
  }
  try {
    const radiologists = rows(await base44.asServiceRole.entities.RadiologistProfile.list({ limit: 200 }));
    const name = String(hospitalName || "").trim();
    radiologists.forEach((r: any) => {
      const granted = Array.isArray(r.authorized_facilities) ? r.authorized_facilities : [];
      const allowed =
        granted.some((f: any) => f && f.hospital_user_id === hospitalUserId) ||
        (name && String(r.hospital || "").trim() === name);
      if (allowed && r.user_id && r.status !== "suspended") ids.add(r.user_id);
    });
  } catch (err) {
    // radiologist memberships are advisory here; the administrator is always included
  }
  return [...ids];
}

export async function auditRadiology(base44: any, params: any): Promise<void> {
  try {
    await base44.asServiceRole.entities.RadiologyAuditLog.create({
      hospital_user_id: params.hospitalUserId,
      hospital_name: params.hospitalName || "",
      participant_user_ids: params.participants || [params.hospitalUserId].filter(Boolean),
      actor_user_id: params.actorUserId || "",
      actor_name: params.actorName || "System",
      actor_role: params.actorRole || "system",
      action: params.action,
      action_label: params.actionLabel || params.action,
      detail: String(params.detail || "").slice(0, 1000),
      study_id: params.studyId || "",
      study_instance_uid: params.studyInstanceUid || "",
      request_ref: params.requestRef || "",
      patient_cin: params.patientCin || "",
      patient_name: params.patientName || "",
      datetime: new Date().toISOString(),
    });
  } catch (err) {
    // An audit write never blocks the clinical action.
  }
}

export const MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound", "Mammography", "Other"];

export function modalityOf(value: string): string {
  const raw = String(value || "");
  const v = raw.toLowerCase();
  if (["ct", "computed tomography"].includes(v)) return "CT";
  if (["mr", "mri", "magnetic resonance"].includes(v)) return "MRI";
  if (["us", "ultrasound", "sonography"].includes(v)) return "Ultrasound";
  if (["mg", "mammography", "mammogram"].includes(v)) return "Mammography";
  if (["dx", "cr", "x-ray", "xray", "radiograph"].includes(v)) return "X-Ray";
  return MODALITIES.includes(raw) ? raw : "Other";
}