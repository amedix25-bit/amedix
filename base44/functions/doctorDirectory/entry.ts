import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Colleague directory eligibility — only doctor profiles backed by a REAL
// user account are eligible, and a doctor who lists a hospital is only
// eligible when that hospital is a registered, active facility account.
// Keeps orphaned doctor profiles (removed account / unregistered facility)
// out of colleague search and suggestions.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole;

    const [profiles, hospitals] = await Promise.all([
      svc.entities.DoctorProfile.filter({ is_verified: true }, { limit: 1000 }),
      svc.entities.HospitalProfile.filter({ status: "active" }, { limit: 1000 }),
    ]);
    const hospitalNames = new Set(
      (hospitals.items || hospitals).map((h) => String(h.hospital_name || "").trim().toLowerCase())
    );

    // Verify each doctor's user account individually (the User entity
    // supports get-by-id, not listing).
    const items = profiles.items || profiles;
    const userIds = [...new Set(items.map((d) => d.user_id).filter(Boolean))];
    const accounts = new Set();
    for (let i = 0; i < userIds.length; i += 50) {
      await Promise.all(userIds.slice(i, i + 50).map(async (uid) => {
        try {
          const u = await svc.entities.User.get(uid);
          if (u) accounts.add(uid);
        } catch (err) {
          // No account for this user id — the doctor stays excluded.
        }
      }));
    }

    const eligible = items
      .filter((d) => {
        if (!d.user_id || !accounts.has(d.user_id)) return false;
        if (d.hospital && !hospitalNames.has(String(d.hospital).trim().toLowerCase())) return false;
        return true;
      })
      .map((d) => d.id);

    return Response.json({ doctor_ids: eligible });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}