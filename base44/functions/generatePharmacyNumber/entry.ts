import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Uniqueness check needs to see all pharmacy profiles (RLS hides other
    // pharmacies from the calling user), so use a read-only service-role lookup.
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `AMP-${new Date().getFullYear()}-${randomSuffix(4)}`;
      const existing = await base44.asServiceRole.entities.PharmacyProfile.filter({ pharmacy_number: candidate });
      if (existing.length === 0) {
        return Response.json({ pharmacy_number: candidate });
      }
    }

    return Response.json({ error: 'Could not generate a unique pharmacy number. Please try again.' }, { status: 500 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}