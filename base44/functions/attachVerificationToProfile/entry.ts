import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Links already-created verification records to the newly created profile.
// The records are looked up with the app-user token (Row Level Security keeps
// the caller to their own records), and only then is the profile id attached
// with the service role — a user can never attach someone else's records or
// forge an association.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { record_ids, profile_type, patient_id, doctor_id } = body;
    if (profile_type !== 'patient' && profile_type !== 'doctor') {
      return Response.json({ error: 'Invalid profile type' }, { status: 400 });
    }
    const targetId = profile_type === 'patient' ? patient_id : doctor_id;
    if (typeof targetId !== 'string' || targetId.length === 0 || targetId.length > 100) {
      return Response.json({ error: 'Invalid profile' }, { status: 400 });
    }
    if (!Array.isArray(record_ids) || record_ids.length === 0 || record_ids.length > 5 || record_ids.some((id) => typeof id !== 'string' || id.length > 100)) {
      return Response.json({ error: 'Invalid records' }, { status: 400 });
    }

    const records = await base44.entities.IdentityVerification.filter({ id: { $in: record_ids } });
    const ownedIds = records.map((r) => r.id);
    if (ownedIds.length === 0) {
      return Response.json({ error: 'No matching records' }, { status: 404 });
    }

    const setField = profile_type === 'patient' ? 'patient_id' : 'doctor_id';
    await base44.asServiceRole.entities.IdentityVerification.updateMany(
      { id: { $in: ownedIds }, user_id: user.id, profile_type },
      { $set: { [setField]: targetId } }
    );

    return Response.json({ attached: ownedIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}