import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isActivated } from '../../shared/hospitalAuthorization.ts';
import { sanitizePrivacy, canSee, isRestricted } from '../../shared/doctorPublicPrivacy.ts';
import { clean, rows } from '../../shared/recordHelpers.ts';

// Patient-facing "Hospitals & Doctors" directory.
//
// It reads the EXISTING AMedix records only — hospital accounts, hospital
// administrative authorization, HospitalDoctor affiliations, verified
// DoctorProfile records and their DoctorProfessionalProfile — and never writes
// anything. Nothing is copied into a separate directory, so a doctor's profile
// update or an ended affiliation is reflected the moment this runs.
//
// Public rules enforced here:
//  * a hospital appears only when its account is active AND its AMedix
//    administrative authorization is activated (the same isActivated rule that
//    stands behind its hospital code);
//  * a doctor appears only when their professional profile is verified and they
//    hold an ACTIVE affiliation with that hospital — entering a hospital code
//    alone never puts anyone in a directory;
//  * a doctor therefore disappears from a hospital the moment the affiliation
//    is ended, deactivated or rejected, and duplicate affiliations are collapsed
//    to one entry per hospital;
//  * the owner's privacy settings are applied server-side, and no CIN, phone
//    number, document, licence number or clinical record is ever returned.

const lower = (value) => clean(value).toLowerCase();

const BLOCKED_STATUSES = ['suspended', 'blocked', 'deactivated'];

function educationOf(record) {
  return (Array.isArray(record?.education) ? record.education : [])
    .filter((entry) => entry && clean(entry.title))
    .map((entry) => ({
      type: clean(entry.type),
      title: clean(entry.title),
      institution: clean(entry.institution),
      field: clean(entry.field),
      country: clean(entry.country),
      start_year: clean(entry.start_year),
      end_year: clean(entry.end_year),
      notes: clean(entry.notes),
    }));
}

function achievementsOf(record) {
  return (Array.isArray(record?.achievements) ? record.achievements : [])
    .filter((entry) => entry && clean(entry.title))
    .map((entry) => ({
      type: clean(entry.type),
      title: clean(entry.title),
      organization: clean(entry.organization),
      year: clean(entry.year),
      detail: clean(entry.detail),
      link: /^https?:\/\//i.test(clean(entry.link)) ? clean(entry.link) : '',
    }));
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'directory');
    const svc = base44.asServiceRole;

    const [hospitalRows, authRows, assocRows, doctorRows, proRows, controlRows] = await Promise.all([
      svc.entities.HospitalProfile.filter({}, { sort: 'hospital_name', limit: 1000 }),
      svc.entities.HospitalAuthorization.filter({}, { limit: 2000 }),
      svc.entities.HospitalDoctor.filter({ status: 'active' }, { limit: 3000 }),
      svc.entities.DoctorProfile.filter({ is_verified: true }, { limit: 500 }),
      svc.entities.DoctorProfessionalProfile.filter({}, { limit: 2000 }),
      svc.entities.AccountControl.filter({}, { limit: 2000 }),
    ]);

    const authByHospital = new Map();
    rows(authRows).forEach((row) => {
      if (row.hospital_profile_id) authByHospital.set(row.hospital_profile_id, row);
    });
    const proByDoctor = new Map();
    rows(proRows).forEach((row) => {
      if (row.doctor_id) proByDoctor.set(row.doctor_id, row);
    });
    const controlByUser = new Map();
    rows(controlRows).forEach((row) => {
      if (row.user_id) controlByUser.set(row.user_id, row);
    });

    // Only hospitals that are both active accounts and administratively
    // authorized on AMedix are part of the public directory.
    const hospitals = rows(hospitalRows).filter((h) => {
      if (!h || h.status === 'suspended') return false;
      return isActivated(authByHospital.get(h.id));
    });
    const hospitalById = new Map(hospitals.map((h) => [h.id, h]));

    const accountUsable = (userId) => {
      const control = controlByUser.get(userId);
      if (!control) return true;
      if (BLOCKED_STATUSES.includes(control.status)) return false;
      if (control.classification === 'test_account') return false;
      return true;
    };

    // Verified doctors only, and only those backed by a real account.
    const doctorById = new Map();
    rows(doctorRows).forEach((doctor) => {
      if (!doctor.user_id || !clean(doctor.full_name)) return;
      if (!accountUsable(doctor.user_id)) return;
      doctorById.set(doctor.id, doctor);
    });

    // One active affiliation per doctor per hospital — duplicates collapse.
    const affiliationByDoctor = new Map();
    rows(assocRows).forEach((assoc) => {
      const hospital = hospitalById.get(assoc.hospital_id);
      const doctor = doctorById.get(assoc.doctor_id);
      if (!hospital || !doctor) return;
      const list = affiliationByDoctor.get(doctor.id) || [];
      if (list.some((item) => item.hospital_id === hospital.id)) return;
      list.push({
        hospital_id: hospital.id,
        hospital_name: clean(hospital.hospital_name),
        hospital_location: clean(hospital.location),
        photo_url: clean(hospital.photo_url),
        department: clean(assoc.specialization) || clean(doctor.specialization),
      });
      affiliationByDoctor.set(doctor.id, list);
    });

    const buildDoctor = (doctor, detailed) => {
      const professional = proByDoctor.get(doctor.id) || null;
      const privacy = sanitizePrivacy(professional?.privacy);
      const affiliations = affiliationByDoctor.get(doctor.id) || [];
      const specialty = canSee(privacy, 'show_specialty') ? clean(doctor.specialization) : '';
      const education = canSee(privacy, 'show_education') ? educationOf(professional) : [];
      const entry: Record<string, any> = {
        doctor_id: doctor.id,
        full_name: clean(doctor.full_name),
        photo_url: canSee(privacy, 'show_photo') ? clean(doctor.photo_url) || clean(professional?.photo_url) : '',
        specialty,
        specialties:
          canSee(privacy, 'show_specialty') && Array.isArray(doctor.specialties)
            ? doctor.specialties.map(clean).filter(Boolean)
            : [],
        professional_title: canSee(privacy, 'show_title') ? clean(professional?.professional_title) : '',
        workplace: canSee(privacy, 'show_workplace') ? clean(professional?.workplace) : '',
        location: canSee(privacy, 'show_location') ? clean(professional?.location) : '',
        education,
        hospitals: affiliations.map((item) => ({
          hospital_id: item.hospital_id,
          hospital_name: item.hospital_name,
          department: item.department,
        })),
        restricted: isRestricted(privacy),
      };
      if (detailed) {
        entry.bio = canSee(privacy, 'show_bio') ? clean(professional?.bio, 4000) : '';
        entry.achievements = canSee(privacy, 'show_achievements') ? achievementsOf(professional) : [];
      }
      return entry;
    };

    if (action === 'doctor') {
      const doctor = doctorById.get(String(body.doctor_id || ''));
      if (!doctor || !(affiliationByDoctor.get(doctor.id) || []).length) {
        return Response.json({ error: 'This physician is not available in the directory.' }, { status: 404 });
      }
      return Response.json({ doctor: buildDoctor(doctor, true) });
    }

    const doctors = [];
    affiliationByDoctor.forEach((_affiliations, doctorId) => {
      const doctor = doctorById.get(doctorId);
      if (doctor) doctors.push(buildDoctor(doctor, false));
    });

    const hospitalCards = hospitals.map((hospital) => ({
      hospital_id: hospital.id,
      hospital_name: clean(hospital.hospital_name),
      photo_url: clean(hospital.photo_url),
      location: clean(hospital.location),
      operating_hours: clean(hospital.operating_hours),
      phone: '',
      doctor_count: doctors.filter((doctor) => doctor.hospitals.some((h) => h.hospital_id === hospital.id)).length,
    }));

    const specialties = [...new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

    return Response.json({
      hospitals: hospitalCards.sort((a, b) => a.hospital_name.localeCompare(b.hospital_name)),
      doctors: doctors
        .filter((doctor) => lower(doctor.full_name))
        .sort((a, b) => a.full_name.localeCompare(b.full_name)),
      specialties,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}