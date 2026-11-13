import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// The AMedix hospital directory for the Doctor Portal hospital gate: every
// registered hospital with an ACTIVE account, so the doctor can find and
// select the hospital they work in before entering its AMedix Hospital Code.
// Only names, locations and logos are returned — never the hospital codes.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { items } = await base44.asServiceRole.entities.HospitalProfile.filter(
      { status: "active" },
      { sort: "hospital_name", limit: 200 }
    );
    // Hospitals whose administrator account was deleted are orphans — their
    // email no longer exists, so they are removed from the directory.
    const withOwner = await Promise.all(items.map(async (h) => {
      try {
        await base44.asServiceRole.entities.User.get(h.user_id);
        return h;
      } catch {
        return null;
      }
    }));
    return Response.json({
      hospitals: withOwner
        .filter(Boolean)
        .map((h) => ({
          hospital_id: h.id,
          hospital_name: h.hospital_name,
          hospital_location: h.location || "",
          hospital_photo_url: h.photo_url || "",
        })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}