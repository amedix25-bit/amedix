import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Hospital-wide laboratory panels. Every operation is enforced here on the
// backend: doctors may only LIST shared panels of hospitals they are actively
// associated with (HospitalDoctor membership) plus legacy platform-wide panels
// (no hospital_user_id). Only the administering hospital administrator (or a
// platform admin) may create, update or delete that hospital's panels — a
// doctor can never modify another hospital's panels, and personal favorites
// are never exposed through this endpoint.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (e) { body = {}; }
    const action = String(body.action || "");

    // Hospitals the requesting user administers.
    const administered = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });

    // Active hospital associations of the requesting doctor.
    const memberships = await base44.asServiceRole.entities.HospitalDoctor.filter({ doctor_user_id: user.id, status: "active" });
    const memberHospitalUserIds = [...new Set(memberships.map((m) => m.hospital_user_id).filter(Boolean))];

    const isAdmin = user.role === "admin";
    const manages = isAdmin || administered.length > 0;

    if (action === "list") {
      const shared = await base44.asServiceRole.entities.DoctorLabFavorite.filter({ is_shared: true }, "-created_date");
      const panels = shared.filter(
        (p) => !p.hospital_user_id || memberHospitalUserIds.includes(p.hospital_user_id) || (manages && p.doctor_id === user.id)
      );
      return Response.json({ panels });
    }

    if (!manages) {
      return Response.json({ error: "Only hospital administrators can manage hospital panels." }, { status: 403 });
    }

    if (action === "create") {
      const name = String(body.favorite_name || "").trim();
      const testIds = Array.isArray(body.test_ids) ? body.test_ids.map(String).filter(Boolean) : [];
      if (!name) return Response.json({ error: "Panel name is required." }, { status: 400 });
      if (testIds.length === 0) return Response.json({ error: "Select at least one test." }, { status: 400 });
      const hospital = administered[0];
      const created = await base44.asServiceRole.entities.DoctorLabFavorite.create({
        doctor_id: user.id,
        favorite_name: name,
        test_ids: testIds,
        is_shared: true,
        hospital_user_id: user.id,
        hospital_name: hospital ? hospital.hospital_name : "",
      });
      return Response.json({ panel: created });
    }

    if (action === "update" || action === "delete") {
      const id = String(body.id || "");
      if (!id) return Response.json({ error: "Panel id is required." }, { status: 400 });
      let existing = null;
      try { existing = await base44.asServiceRole.entities.DoctorLabFavorite.get(id); } catch (e) { existing = null; }
      if (!existing || !existing.id || !existing.is_shared) {
        return Response.json({ error: "Panel not found." }, { status: 404 });
      }
      // Ownership: the hospital admin who owns the panel, or a platform admin.
      if (!isAdmin && existing.hospital_user_id !== user.id) {
        return Response.json({ error: "You can only manage your own hospital's panels." }, { status: 403 });
      }
      if (action === "delete") {
        await base44.asServiceRole.entities.DoctorLabFavorite.delete(id);
        return Response.json({ ok: true });
      }
      const name = String(body.favorite_name || "").trim();
      const testIds = Array.isArray(body.test_ids) ? body.test_ids.map(String).filter(Boolean) : [];
      if (!name) return Response.json({ error: "Panel name is required." }, { status: 400 });
      if (testIds.length === 0) return Response.json({ error: "Select at least one test." }, { status: 400 });
      const updated = await base44.asServiceRole.entities.DoctorLabFavorite.update(id, { favorite_name: name, test_ids: testIds });
      return Response.json({ panel: updated });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}