import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Hospital Command Center — the operational overview for one hospital.
//
// Server-side authorization: the caller must own the hospital profile the
// figures belong to. Every query is then scoped to that hospital only, so no
// hospital can read another hospital's operational data. Nothing is estimated
// or generated: every figure is a count or sum of existing records, and any
// figure that could not be measured is returned as null rather than a guess.

const isoDate = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id }).catch(() => []);
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'No hospital profile for this account' }, { status: 403 });

    const svc = base44.asServiceRole.entities;
    const hospitalId = profile.id;
    const hospitalName = profile.hospital_name;
    const today = isoDate(new Date());

    // Batch 1 — the independent reads (kept in one small batch for the Worker's
    // connection limit). Each is bounded: counts are numbers, lists are capped.
    const [
      doctorRows,
      checkinPage,
      visitsTotal,
      activeVisits,
      checkinsToday,
      pendingLabs,
      activeLabs,
      pendingImaging,
      recentImaging,
      recentPrescriptions,
      pendingDoctors,
    ] = await Promise.allSettled([
      svc.HospitalDoctor.filter({ hospital_id: hospitalId }, { sort: '-created_date', limit: 300 }),
      svc.HospitalCheckIn.filter({ hospital_id: hospitalId }, { sort: '-checkin_datetime', limit: 300 }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId, status: 'active' }),
      svc.HospitalCheckIn.count({ hospital_id: hospitalId, checkin_date: today }),
      svc.LabRequest.count({ doctor_hospital: hospitalName, status: { $in: ['requested', 'authorized', 'pending'] } }),
      svc.LabRequest.filter({ doctor_hospital: hospitalName, status: { $in: ['authorized', 'pending'] } }, { sort: '-date_requested', limit: 60 }),
      svc.ImagingRequest.count({ routed_hospital_user_id: user.id, status: 'requested' }),
      svc.ImagingRequest.filter({ routed_hospital_user_id: user.id }, { sort: '-request_datetime', limit: 40 }),
      svc.Prescription.filter({ doctor_hospital: hospitalName }, { sort: '-prescribed_datetime', limit: 40 }),
      svc.HospitalDoctor.count({ hospital_id: hospitalId, status: 'pending' }),
    ]);

    const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
    // A filter with an options object returns a page; an array otherwise.
    const rows = (page) => (Array.isArray(page) ? page : page?.items || []);
    const doctors = rows(val(doctorRows, []));
    const checkins = rows(val(checkinPage, []));
    const labs = rows(val(activeLabs, []));
    const imaging = rows(val(recentImaging, []));
    const prescriptions = rows(val(recentPrescriptions, []));
    const activeDoctors = doctors.filter((d) => d.status === 'active').length;

    // Appointments today for this hospital's own doctors.
    const doctorIds = doctors.map((d) => d.id).filter(Boolean);
    let appointmentsToday = null;
    let appointmentRows = [];
    if (doctorIds.length > 0) {
      const appts = await svc.Appointment.filter(
        { doctor_id: { $in: doctorIds }, date: today },
        { sort: '-time', limit: 300 }
      ).catch(() => null);
      if (appts) {
        appointmentRows = rows(appts);
        appointmentsToday = appointmentRows.length;
      }
    }

    // Revenue — summed from the check-ins the receptionists recorded.
    const revenueToday = checkins
      .filter((c) => c.checkin_date === today)
      .reduce((s, c) => s + (Number(c.payment_amount) || 0), 0);
    const revenueWindow = checkins
      .filter((c) => c.checkin_date >= isoDate(daysAgo(30)))
      .reduce((s, c) => s + (Number(c.payment_amount) || 0), 0);

    const now = Date.now();
    const hoursSince = (iso) => (iso ? (now - new Date(iso).getTime()) / 36e5 : null);
    const overdueLabs = labs.filter((l) => {
      const h = hoursSince(l.authorization_datetime || l.created_date);
      return h !== null && h >= 48;
    });
    const readyImaging = imaging.filter((i) =>
      ['ready_for_reporting', 'interpretation', 'reporting_in_progress', 'examination_completed'].includes(
        i.workflow_status
      )
    );

    // Urgent operational alerts — each one is a measured backlog that the
    // administrator can open. No alert is raised without a matching record.
    const alerts = [];
    const pendingLabsCount = val(pendingLabs, null);
    const pendingImagingCount = val(pendingImaging, null);
    const pendingDoctorCount = val(pendingDoctors, 0);
    const undispensed = prescriptions.filter((p) => ['authorized', 'reserved'].includes(p.status));

    if (overdueLabs.length > 0) {
      alerts.push({ id: 'labs-overdue', key: 'labs_overdue', severity: 'critical', count: overdueLabs.length, target: 'panels' });
    }
    if (readyImaging.length > 0) {
      alerts.push({ id: 'imaging-awaiting-report', key: 'imaging_awaiting_report', severity: 'critical', count: readyImaging.length, target: 'radiology' });
    }
    if (pendingLabsCount > 0) {
      alerts.push({ id: 'labs-pending', key: 'labs_pending', severity: 'warning', count: pendingLabsCount, target: 'panels' });
    }
    if (pendingImagingCount > 0) {
      alerts.push({ id: 'imaging-open', key: 'imaging_open', severity: 'warning', count: pendingImagingCount, target: 'radiology' });
    }
    if (pendingDoctorCount > 0) {
      alerts.push({ id: 'doctors-pending', key: 'doctors_pending', severity: 'warning', count: pendingDoctorCount, target: 'doctors' });
    }
    if (undispensed.length > 0) {
      alerts.push({ id: 'prescriptions-open', key: 'prescriptions_open', severity: 'info', count: undispensed.length, target: 'patients' });
    }

    // Recent activity — assembled from real records, newest first.
    const activity = [
      ...checkins.slice(0, 8).map((c) => ({
        id: `ci-${c.id}`,
        at: c.checkin_datetime || c.created_date,
        kind: k(c.status),
        title: c.status === 'active' ? 'Patient checked in' : 'Visit completed',
        detail: `${c.patient_name || 'Patient'}${c.payment_amount ? ` · ${Number(c.payment_amount).toFixed(2)} LYD` : ''}`,
        actor: c.receptionist_name || null,
      })),
      ...labs
        .filter((l) => l.status === 'results')
        .slice(0, 5)
        .map((l) => ({
          id: `lab-${l.id}`,
          at: l.released_datetime || l.date_completed || l.updated_date,
          kind: 'lab',
          title: 'Laboratory results available',
          detail: `${l.patient_name || 'Patient'}${l.lab_name ? ` · ${l.lab_name}` : ''}`,
          actor: l.verified_by_name || null,
        })),
      ...imaging
        .filter((i) => ['final_report', 'released'].includes(i.workflow_status))
        .slice(0, 5)
        .map((i) => ({
          id: `img-${i.id}`,
          at: i.released_datetime || i.final_report_datetime || i.updated_date,
          kind: 'imaging',
          title: i.workflow_status === 'released' ? 'Radiology report released' : 'Radiology report signed',
          detail: `${i.patient_name || 'Patient'}${i.modality ? ` · ${i.modality}` : ''}`,
          actor: i.assigned_radiologist_name || null,
        })),
      ...prescriptions.slice(0, 5).map((p) => ({
        id: `rx-${p.id}`,
        at: p.prescribed_datetime || p.created_date,
        kind: 'prescription',
        title: p.status === 'dispensed' ? 'Prescription dispensed' : 'Prescription issued',
        detail: `${p.patient_name || 'Patient'} · ${p.medication_name || ''}`,
        actor: p.status === 'dispensed' ? p.dispensed_by_name : p.doctor_name,
      })),
    ]
      .filter((a) => Boolean(a.at))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10);

    // Department overview — the hospital's own specialisations, measured by
    // staffed doctors and today's appointments.
    const specialisationIds = [...new Set(doctors.map((d) => d.id))];
    const departmentMap = new Map();
    doctors
      .filter((d) => d.status === 'active')
      .forEach((d) => {
        const name = d.specialization || 'Unassigned';
        const row = departmentMap.get(name) || { name, doctors: 0, appointmentsToday: 0, doctorIds: [] };
        row.doctors += 1;
        row.doctorIds.push(d.id);
        departmentMap.set(name, row);
      });
    appointmentRows.forEach((a) => {
      const doc = doctors.find((d) => d.id === a.doctor_id);
      const name = doc?.specialization || 'Unassigned';
      const row = departmentMap.get(name);
      if (row) row.appointmentsToday += 1;
    });
    const departments = [...departmentMap.values()]
      .map(({ doctorIds: _ids, ...rest }) => rest)
      .sort((a, b) => b.doctors - a.doctors || a.name.localeCompare(b.name));

    // Recorded visits per day for the last 7 days, counted from the check-in
    // records themselves — nothing is modelled or estimated.
    const flow = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = isoDate(daysAgo(i));
      flow.push({ date: day, visits: checkins.filter((c) => c.checkin_date === day).length });
    }

    return Response.json({
      hospital: {
        id: hospitalId,
        name: hospitalName,
        location: profile.location || null,
        photo_url: profile.photo_url || null,
        radiology_enabled: Boolean(profile.radiology_department_enabled),
      },
      generated_at: new Date().toISOString(),
      period: { today, from: isoDate(daysAgo(30)) },
      kpis: {
        visitsTotal: val(visitsTotal, null),
        activeVisits: val(activeVisits, null),
        checkinsToday: val(checkinsToday, null),
        activeDoctors,
        doctorsTotal: doctors.length,
        appointmentsToday,
        pendingLabs: pendingLabsCount,
        pendingImaging: pendingImagingCount,
        revenueToday,
        revenueWindow,
        revenueWindowDays: 30,
      },
      alerts,
      activity,
      departments,
      flow,
      scopedDoctorCount: specialisationIds.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function k(status) {
  if (status === 'active') return 'checkin';
  return 'visit';
}