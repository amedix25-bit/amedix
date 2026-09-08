import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Invoked daily by the "Medication Duration Sync" workflow.
// Marks prescribed medications as inactive once their prescribed duration has ended,
// while keeping the full historical medication record intact.
// Runs without user auth (scheduled invocation), so entity access uses the service role.
const TZ = 'Africa/Tripoli';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
    const today = fmt.format(new Date());

    const active = await base44.asServiceRole.entities.Medication.filter({ is_active: true });
    const expired = active.filter((m) => m.end_date && m.end_date < today);
    if (expired.length === 0) return Response.json({ deactivated: 0, date: today });

    await base44.asServiceRole.entities.Medication.bulkUpdate(
      expired.map((m) => ({ id: m.id, is_active: false, stopped_date: m.end_date }))
    );
    return Response.json({ deactivated: expired.length, date: today });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}