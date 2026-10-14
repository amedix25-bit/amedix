import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Doctor-facing lab request history. The authenticated user's own DoctorProfile
// is the only trusted source of the ordering doctor identity — any client
// supplied doctor id is ignored, so a doctor can only ever read their own
// requests. All filtering happens server-side; no other doctor's records can
// be reached through this endpoint.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};

    const profiles = await base44.entities.DoctorProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = profiles[0];

    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const q = { doctor_id: doctor.id };

    const search = String(payload.search || "").trim();
    if (search) {
      q.$or = [
        { patient_name: { $regex: esc(search), $options: "i" } },
        { patient_cin: { $regex: esc(search), $options: "i" } },
        { request_id: { $regex: esc(search), $options: "i" } },
      ];
    }
    if (payload.status) q.status = String(payload.status);
    const from = String(payload.from || "").trim();
    const to = String(payload.to || "").trim();
    if (from || to) {
      q.date_requested = {};
      if (from) q.date_requested.$gte = from;
      if (to) q.date_requested.$lte = to;
    }
    const test = String(payload.test || "").trim();
    if (test) q["tests.name"] = { $regex: esc(test), $options: "i" };

    const limit = Math.min(Math.max(parseInt(payload.limit, 10) || 25, 10), 100);
    const page = await base44.entities.LabRequest.filter(
      q,
      { sort: "-created_date", limit, cursor: payload.cursor || undefined }
    );

    return Response.json({
      requests: page.items || [],
      next_cursor: page.next_cursor || null,
      has_more: !!page.has_more,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}