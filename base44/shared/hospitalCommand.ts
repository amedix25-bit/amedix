// Pure derivation for the Hospital Command Center. Kept out of the function so
// it can be tested against fixtures without any database access: every figure
// returned here is a count or sum of the records passed in, and a figure that
// had no measurable source is returned as null rather than as zero.

const isoDate = (d) => d.toISOString().slice(0, 10);

export function daysAgo(n, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

const rows = (page) => (Array.isArray(page) ? page : page?.items || []);

export function buildCommandCenter(input) {
  const {
    profile,
    user,
    doctorsPage,
    checkinsPage,
    appointmentsPage,
    labsPage,
    imagingPage,
    prescriptionsPage,
    visitsTotal,
    activeVisits,
    checkinsToday,
    pendingLabs,
    pendingImaging,
    pendingDoctors,
    now = new Date(),
  } = input;

  const doctors = rows(doctorsPage);
  const checkins = rows(checkinsPage);
  const appointmentRows = rows(appointmentsPage);
  const labs = rows(labsPage);
  const imaging = rows(imagingPage);
  const prescriptions = rows(prescriptionsPage);

  const today = isoDate(now);
  const activeDoctors = doctors.filter((d) => d.status === 'active').length;

  const revenueToday = checkins
    .filter((c) => c.checkin_date === today)
    .reduce((s, c) => s + (Number(c.payment_amount) || 0), 0);
  const revenueWindow = checkins
    .filter((c) => c.checkin_date >= isoDate(daysAgo(30, now)))
    .reduce((s, c) => s + (Number(c.payment_amount) || 0), 0);

  const stamp = now.getTime();
  const hoursSince = (iso) => (iso ? (stamp - new Date(iso).getTime()) / 36e5 : null);

  const overdueLabs = labs.filter((l) => {
    const h = hoursSince(l.authorization_datetime || l.created_date);
    if (h === null || !Number.isFinite(h)) return false;
    return h >= 48 && ['authorized', 'pending', 'requested'].includes(l.status);
  });
  const readyImaging = imaging.filter((i) =>
    ['ready_for_reporting', 'interpretation', 'reporting_in_progress', 'examination_completed'].includes(
      i.workflow_status
    )
  );
  const undispensed = prescriptions.filter((p) => ['authorized', 'reserved'].includes(p.status));

  const alerts = [];
  if (overdueLabs.length > 0) {
    alerts.push({ id: 'labs-overdue', key: 'labs_overdue', severity: 'critical', count: overdueLabs.length, target: 'panels' });
  }
  if (readyImaging.length > 0) {
    alerts.push({
      id: 'imaging-awaiting-report',
      key: 'imaging_awaiting_report',
      severity: 'critical',
      count: readyImaging.length,
      target: 'radiology',
    });
  }
  if (pendingLabs > 0) {
    alerts.push({ id: 'labs-pending', key: 'labs_pending', severity: 'warning', count: pendingLabs, target: 'panels' });
  }
  if (pendingImaging > 0) {
    alerts.push({ id: 'imaging-open', key: 'imaging_open', severity: 'warning', count: pendingImaging, target: 'radiology' });
  }
  if (pendingDoctors > 0) {
    alerts.push({ id: 'doctors-pending', key: 'doctors_pending', severity: 'warning', count: pendingDoctors, target: 'doctors' });
  }
  if (undispensed.length > 0) {
    alerts.push({
      id: 'prescriptions-open',
      key: 'prescriptions_open',
      severity: 'info',
      count: undispensed.length,
      target: 'patients',
    });
  }

  const activity = [
    ...checkins.slice(0, 8).map((c) => ({
      id: `ci-${c.id}`,
      at: c.checkin_datetime || c.created_date,
      kind: c.status === 'active' ? 'checkin' : 'visit',
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

  const departmentMap = new Map();
  doctors
    .filter((d) => d.status === 'active')
    .forEach((d) => {
      const name = d.specialization || 'Unassigned';
      const row = departmentMap.get(name) || { name, doctors: 0, appointmentsToday: 0 };
      row.doctors += 1;
      departmentMap.set(name, row);
    });
  appointmentRows.forEach((a) => {
    const doc = doctors.find((d) => d.id === a.doctor_id);
    const row = departmentMap.get(doc?.specialization || 'Unassigned');
    if (row) row.appointmentsToday += 1;
  });
  const departments = [...departmentMap.values()].sort(
    (a, b) => b.doctors - a.doctors || a.name.localeCompare(b.name)
  );

  const flow = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = isoDate(daysAgo(i, now));
    flow.push({ date: day, visits: checkins.filter((c) => c.checkin_date === day).length });
  }

  return {
    hospital: {
      id: profile.id,
      name: profile.hospital_name,
      location: profile.location || null,
      photo_url: profile.photo_url || null,
      radiology_enabled: Boolean(profile.radiology_department_enabled),
    },
    generated_at: now.toISOString(),
    viewer: user?.full_name || null,
    period: { today, from: isoDate(daysAgo(30, now)) },
    kpis: {
      visitsTotal,
      activeVisits,
      checkinsToday,
      activeDoctors,
      doctorsTotal: doctors.length,
      appointmentsToday: appointmentsPage === null ? null : appointmentRows.length,
      pendingLabs,
      pendingImaging,
      revenueToday,
      revenueWindow,
      revenueWindowDays: 30,
    },
    alerts,
    activity,
    departments,
    flow,
  };
}