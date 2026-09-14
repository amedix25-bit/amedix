import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Portal login validation. The credentials only identify the user — this
// function determines, from the database, which portals their account is
// authorized for (patient / doctor / radiologist / lab / admin profiles plus
// the platform admin role) and whether the portal selected on the login page
// matches one of those roles.
const VALID_PORTALS = ['patient', 'doctor', 'radiologist', 'lab', 'hospital', 'admin'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The portal selected on the login page, passed in the payload.
    let portal = null;
    try {
      const body = await req.json();
      if (body && VALID_PORTALS.includes(body.portal)) portal = body.portal;
    } catch (err) {
      portal = null;
    }

    // Roles come from the database, never from the client.
    const [patients, doctors, radiologists, laboratories, hospitals] = await Promise.all([
      base44.asServiceRole.entities.PatientProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.LaboratoryProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id }),
    ]);

    const roles = [];
    if (user.role === 'admin') roles.push('admin');
    if (patients.length > 0) roles.push('patient');
    if (doctors.length > 0) roles.push('doctor');
    if (radiologists.length > 0) roles.push('radiologist');
    if (laboratories.length > 0) roles.push('lab');
    if (hospitals.length > 0) roles.push('hospital');

    const allowed = portal ? roles.includes(portal) : false;

    return Response.json({
      roles,
      allowed,
      full_name: user.full_name || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}