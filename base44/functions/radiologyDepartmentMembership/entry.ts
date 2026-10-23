import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Radiology Department membership management — the facility administrator
// associates / disassociates radiologists with their facility's radiology
// department. Server-side enforced: only the administrator of a facility
// with the radiology department enabled may call it, and every change lands
// on the radiologist's authorized_facilities (keyed to the facility ID) with
// a notification to the radiologist. Legacy home-facility members are shown
// and may also be removed by the administrator.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "list");

    const hospitalProfiles = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
    const hospital = hospitalProfiles[0];
    if (!hospital || !hospital.radiology_department_enabled) {
      return Response.json(
        { error: "Only the administrator of a facility with an enabled radiology department can manage its radiologists." },
        { status: 403 }
      );
    }
    const facilityName = String(hospital.hospital_name || "").trim();
    const facilityNameLower = facilityName.toLowerCase();

    const isMember = (r: any) =>
      String(r.hospital || "").trim().toLowerCase() === facilityNameLower ||
      (Array.isArray(r.authorized_facilities) ? r.authorized_facilities : []).some(
        (f: any) =>
          String((f && f.hospital_user_id) || "").trim() === String(hospital.user_id || "").trim() ||
          String((f && f.hospital_name) || "").trim().toLowerCase() === facilityNameLower
      );

    const summary = (r: any) => ({
      user_id: r.user_id,
      full_name: r.full_name,
      specialization: r.specialization || "",
      license_number: r.license_number || "",
      phone: r.phone || "",
      photo_url: r.photo_url || "",
      source: String(r.hospital || "").trim().toLowerCase() === facilityNameLower ? "home_facility" : "granted",
    });

    if (action === "list") {
      const rads = await base44.asServiceRole.entities.RadiologistProfile.filter(
        { status: "active" }, { limit: 500 });
      return Response.json({ members: rads.filter(isMember).map(summary) });
    }

    if (action === "search") {
      const email = String(payload.email || "").trim().toLowerCase();
      if (!email) return Response.json({ error: "Enter the radiologist's account email." }, { status: 400 });
      const users = await base44.asServiceRole.entities.User.filter({ email });
      const account = users[0];
      if (!account) return Response.json({ found: false });
      const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: account.id });
      const profile = profiles[0];
      if (!profile) return Response.json({ found: false, reason: "This account is not registered as a radiologist." });
      return Response.json({ found: true, radiologist: summary(profile), already_member: isMember(profile) });
    }

    if (action === "add") {
      const targetUserId = String(payload.radiologist_user_id || "").trim();
      if (!targetUserId) return Response.json({ error: "Select the radiologist to associate." }, { status: 400 });
      const targets = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: targetUserId });
      const target = targets[0];
      if (!target || target.status !== "active") {
        return Response.json({ error: "Radiologist not found or not active." }, { status: 400 });
      }
      if (isMember(target)) {
        return Response.json({ error: "This radiologist is already associated with your radiology department." }, { status: 409 });
      }
      const granted = (Array.isArray(target.authorized_facilities) ? target.authorized_facilities : [])
        .filter((f: any) => String((f && f.hospital_user_id) || "").trim() !== String(hospital.user_id || "").trim());
      granted.push({
        hospital_user_id: hospital.user_id,
        hospital_name: facilityName,
        added_datetime: new Date().toISOString(),
        added_by_name: user.full_name || "Facility administrator",
      });
      await base44.asServiceRole.entities.RadiologistProfile.update(target.id, { authorized_facilities: granted });
      try {
        await base44.asServiceRole.entities.RadiologistNotification.create({
          radiologist_user_id: target.user_id,
          type: "department_membership",
          title: "Department Membership Granted",
          message: `${facilityName} associated you with its radiology department — its worklist is now available to you.`,
          target: "my_patients",
          datetime: new Date().toISOString(),
          is_read: false,
        });
      } catch (e) { /* non-blocking */ }
      return Response.json({ ok: true, member: summary({ ...target, authorized_facilities: granted }) });
    }

    if (action === "remove") {
      const targetUserId = String(payload.radiologist_user_id || "").trim();
      if (!targetUserId) return Response.json({ error: "Select the radiologist to remove." }, { status: 400 });
      const targets = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: targetUserId });
      const target = targets[0];
      if (!target || !isMember(target)) {
        return Response.json({ error: "This radiologist is not associated with your radiology department." }, { status: 404 });
      }
      const wasLegacy = String(target.hospital || "").trim().toLowerCase() === facilityNameLower;
      const remaining = (Array.isArray(target.authorized_facilities) ? target.authorized_facilities : [])
        .filter((f: any) =>
          String((f && f.hospital_user_id) || "").trim() !== String(hospital.user_id || "").trim() &&
          String((f && f.hospital_name) || "").trim().toLowerCase() !== facilityNameLower);
      const update: Record<string, any> = { authorized_facilities: remaining };
      if (wasLegacy) update.hospital = ""; // the legacy home-facility link is cleared by the administrator
      await base44.asServiceRole.entities.RadiologistProfile.update(target.id, update);
      try {
        await base44.asServiceRole.entities.RadiologistNotification.create({
          radiologist_user_id: target.user_id,
          type: "department_membership",
          title: "Department Membership Removed",
          message: `${facilityName} removed your association with its radiology department — its worklist is no longer available to you.`,
          target: "my_patients",
          datetime: new Date().toISOString(),
          is_read: false,
        });
      } catch (e) { /* non-blocking */ }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}