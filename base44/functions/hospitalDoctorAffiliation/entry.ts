import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Hospital review of a doctor's affiliation request. A doctor who registers (or
// joins an additional hospital) with the hospital's AMedix Hospital Code is
// placed in PENDING: the hospital administrator approves or rejects the
// affiliation, and only an approved affiliation activates clinical access at
// that hospital. Writes are service-role only, so a doctor can never approve
// their own affiliation.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const associationId = String(body.association_id || '');
    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }
    if (!associationId) return Response.json({ error: 'association_id is required.' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Hospital profile not found.' }, { status: 403 });

    const rows = await base44.asServiceRole.entities.HospitalDoctor.filter({ id: associationId });
    const association = rows[0];
    if (!association) return Response.json({ error: 'Affiliation request not found.' }, { status: 404 });
    if (association.hospital_user_id !== user.id) {
      return Response.json({ error: 'This affiliation request belongs to another hospital.' }, { status: 403 });
    }
    if (!['pending', 'rejected', 'deactivated'].includes(association.status)) {
      return Response.json({ error: 'This affiliation is already decided.' }, { status: 409 });
    }

    const stamp = new Date().toISOString();
    const status = action === 'approve' ? 'active' : 'rejected';
    await base44.asServiceRole.entities.HospitalDoctor.update(associationId, {
      status,
      decided_datetime: stamp,
      decided_by_name: user.full_name || profile.hospital_name,
      decision_note: String(body.note || '').trim(),
    });

    // Tell the doctor the decision without blocking the hospital's action.
    try {
      const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: association.doctor_id });
      const doctor = doctors[0];
      // The first approved hospital becomes the doctor's working hospital.
      if (action === 'approve' && doctor && !doctor.hospital) {
        await base44.asServiceRole.entities.DoctorProfile.update(doctor.id, { hospital: profile.hospital_name });
      }
      if (doctor?.user_id) {
        const users = await base44.asServiceRole.entities.User.filter({ id: doctor.user_id });
        const email = users[0]?.email;
        if (email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: action === 'approve'
              ? `Your affiliation with ${profile.hospital_name} is approved`
              : `Your affiliation request with ${profile.hospital_name} was not approved`,
            body: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#17324D;line-height:1.6">
              <p>${action === 'approve'
                ? `Your affiliation with <strong>${profile.hospital_name}</strong> has been approved. You can now select it as your working hospital in the Doctor Portal.`
                : `Your affiliation request with <strong>${profile.hospital_name}</strong> was not approved.`}</p>
              ${body.note ? `<p><strong>Note:</strong> ${String(body.note).slice(0, 500)}</p>` : ''}
            </div>`,
            category: 'transactional',
          });
        }
      }
    } catch (err) {
      /* notification only — the decision is recorded */
    }

    return Response.json({ ok: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}