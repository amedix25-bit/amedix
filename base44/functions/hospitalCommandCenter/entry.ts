import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildCommandCenter } from '../../shared/hospitalCommand.ts';

// Hospital Command Center — the operational overview for one hospital.
//
// Server-side authorization: the caller must own the hospital profile the
// figures belong to. Every query is then scoped to that hospital only, so no
// hospital can read another hospital's operational data. The derivation itself
// lives in base44/shared/hospitalCommand.ts and is unit-tested against fixtures.

const isoDate = (d) => d.toISOString().slice(0, 10);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id }).catch(() => []);
    const profile = (Array.isArray(profiles) ? profiles : profiles?.items || [])[0];
    if (!profile) return Response.json({ error: 'No hospital profile for this account' }, { status: 403 });

    const svc = base44.asServiceRole.entities;
    const hospitalId = profile.id;
    const hospitalName = profile.hospital_name;
    const today = isoDate(new Date());

    // Bounded reads only: counts are numbers, lists are capped and sorted.
    const settled = await Promise.allSettled([
      svc.HospitalDoctor.filter({ hospital_id: hospitalId }, { sort: '-created_date', limit: 300 }),
      svc.HospitalCheckIn.filter({ hospital_id: hospitalId }, { sort: '-checkin_datetime', limit: 300 }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId, status: 'active' }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId, checkin_date: today }),
      svc.LabRequest.filter(
        { doctor_hospital: hospitalName, status: { $in: ['requested', 'authorized', 'pending'] } },
        { sort: '-date_requested', limit: 60 }
      ),
      svc.LabRequest.count({
        doctor_hospital: hospitalName,
        status: { $in: ['requested', 'authorized', 'pending'] },
      }),
      svc.ImagingRequest.filter({ routed_hospital_user_id: user.id }, { sort: '-request_datetime', limit: 40 }),
      svc.ImagingRequest.count({ routed_hospital_user_id: user.id, status: 'requested' }),
      svc.Prescription.filter({ doctor_hospital: hospitalName }, { sort: '-prescribed_datetime', limit: 40 }),
      svc.HospitalDoctor.count({ hospital_id: hospitalId, status: 'pending' }),
    ]);

    const ok = (i, fallback) => (settled[i].status === 'fulfilled' ? settled[i].value : fallback);
    const doctorsPage = ok(0, []);
    const doctorRows = Array.isArray(doctorsPage) ? doctorsPage : doctorsPage?.items || [];
    const doctorIds = doctorRows.map((d) => d.id).filter(Boolean);

    // Appointments today for this hospital's own doctors only.
    let appointmentsPage = null;
    if (doctorIds.length > 0) {
      appointmentsPage = await svc.Appointment.filter(
        { doctor_id: { $in: doctorIds }, date: today },
        { sort: '-time', limit: 300 }
      ).catch(() => null);
      if (appointmentsPage === null) appointmentsPage = null;
    }

    const data = buildCommandCenter({
      profile,
      user,
      doctorsPage,
      checkinsPage: ok(1, []),
      appointmentsPage,
      labsPage: ok(5, []),
      imagingPage: ok(7, []),
      prescriptionsPage: ok(9, []),
      visitsTotal: settled[2].status === 'fulfilled' ? settled[2].value : null,
      activeVisits: settled[3].status === 'fulfilled' ? settled[3].value : null,
      checkinsToday: settled[4].status === 'fulfilled' ? settled[4].value : null,
      pendingLabs: settled[6].status === 'fulfilled' ? settled[6].value : null,
      pendingImaging: settled[8].status === 'fulfilled' ? settled[8].value : null,
      pendingDoctors: settled[10].status === 'fulfilled' ? settled[10].value : 0,
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}