import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { evaluateAccount } from '../../shared/verifiedAccounts.ts';
import { sanitizePrivacy } from '../../shared/doctorPublicPrivacy.ts';

// AMedix professional profile API.
//
// A doctor's professional identity is PUBLIC WITHIN THE PHYSICIAN NETWORK and
// nothing more. This function is the only way another doctor can read it, and it
// applies the owner's privacy settings SERVER-SIDE: a field the owner has hidden
// is never sent to the browser, so it cannot be uncovered in the client.
//
// This surface is deliberately separate from patient data. Reading a colleague's
// professional profile never touches a patient record, never implies an access
// request, and a connection between two physicians grants no clinical
// permission of any kind.

const EDUCATION_TYPES = ['degree', 'residency', 'fellowship', 'certification'];
const ACHIEVEMENT_TYPES = ['award', 'publication', 'conference', 'accomplishment', 'experience'];

const rows = (result) => (Array.isArray(result) ? result : (result && result.items) || []);
const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);
const year = (value) => {
  const digits = String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length === 4 ? digits : '';
};
const safeLink = (value) => {
  const raw = text(value, 400);
  return /^https?:\/\//i.test(raw) ? raw : '';
};
const entryId = () => `pe_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function sanitizeEducation(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((item) => ({
    entry_id: text(item?.entry_id, 60) || entryId(),
    type: EDUCATION_TYPES.includes(item?.type) ? item.type : 'degree',
    title: text(item?.title, 160),
    institution: text(item?.institution, 160),
    field: text(item?.field, 120),
    country: text(item?.country, 80),
    start_year: year(item?.start_year),
    end_year: year(item?.end_year),
    notes: text(item?.notes, 300),
  })).filter((item) => item.title);
}

function sanitizeAchievements(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((item) => ({
    entry_id: text(item?.entry_id, 60) || entryId(),
    type: ACHIEVEMENT_TYPES.includes(item?.type) ? item.type : 'accomplishment',
    title: text(item?.title, 180),
    organization: text(item?.organization, 160),
    year: year(item?.year),
    detail: text(item?.detail, 400),
    link: safeLink(item?.link),
  })).filter((item) => item.title);
}

const privacyOf = (record) => sanitizePrivacy(record?.privacy);

// What AMedix itself has verified — always shown as verified, never mixed with
// the doctor's own entries.
async function verifiedFacts(base44, doctor) {
  const [verifications, associations] = await Promise.all([
    base44.asServiceRole.entities.IdentityVerification.filter(
      { user_id: doctor.user_id, profile_type: 'doctor' },
      { sort: '-created_date', limit: 20 }
    ),
    base44.asServiceRole.entities.HospitalDoctor.filter({ doctor_id: doctor.id, status: 'active' }, { limit: 20 }),
  ]);
  const licence = rows(verifications).find((v) => v.document_type === 'medical_license' && v.status === 'verified');
  const activeHospitals = rows(associations).map((a) => a.hospital_name).filter(Boolean);
  return {
    specialty: doctor.specialization || '',
    specialties: Array.isArray(doctor.specialties) ? doctor.specialties : [],
    specialty_verified: doctor.is_verified === true,
    licence_verified: !!licence,
    licence_number: doctor.license_number || '',
    hospital: activeHospitals[0] || doctor.hospital || '',
    hospital_verified: activeHospitals.length > 0,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ownRows = rows(await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 }));
    const mine = ownRows[0] || null;
    if (!mine) return Response.json({ error: 'Doctor access required.' }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'get');

    // ---- save my own professional profile --------------------------------
    if (action === 'save') {
      const patch = {
        doctor_id: mine.id,
        doctor_user_id: user.id,
        professional_title: text(body.professional_title, 140),
        workplace: text(body.workplace, 160),
        location: text(body.location, 120),
        bio: text(body.bio, 1200),
        education: sanitizeEducation(body.education),
        achievements: sanitizeAchievements(body.achievements),
        privacy: sanitizePrivacy(body.privacy),
        updated_datetime: new Date().toISOString(),
      };
      if (typeof body.photo_url === 'string') patch.photo_url = text(body.photo_url, 500);

      const existing = rows(await base44.entities.DoctorProfessionalProfile.filter({ doctor_id: mine.id }, { limit: 1 }))[0];
      const saved = existing
        ? await base44.entities.DoctorProfessionalProfile.update(existing.id, patch)
        : await base44.entities.DoctorProfessionalProfile.create(patch);
      return Response.json({ saved: true, profile: saved });
    }

    // ---- open another doctor's professional profile ----------------------
    const doctorId = text(body.doctor_id, 100) || mine.id;
    const targetRows = await base44.asServiceRole.entities.DoctorProfile.filter({ id: doctorId }, { limit: 1 });
    const target = rows(targetRows)[0] || null;
    if (!target) return Response.json({ error: 'This physician could not be found.' }, { status: 404 });

    const isSelf = target.user_id === user.id;
    const [recordRows, sent, received] = await Promise.all([
      base44.asServiceRole.entities.DoctorProfessionalProfile.filter({ doctor_id: target.id }, { limit: 1 }),
      base44.asServiceRole.entities.DoctorConnection.filter({ requester_doctor_id: mine.id, recipient_doctor_id: target.id }, { limit: 5 }),
      base44.asServiceRole.entities.DoctorConnection.filter({ recipient_doctor_id: mine.id, requester_doctor_id: target.id }, { limit: 5 }),
    ]);
    const record = rows(recordRows)[0] || null;
    const privacy = privacyOf(record);
    const links = [...rows(sent), ...rows(received)];
    const accepted = links.find((c) => c.status === 'accepted');
    const pendingOut = rows(sent).find((c) => c.status === 'pending');
    const pendingIn = rows(received).find((c) => c.status === 'pending');
    const isColleague = !!accepted;

    const verified = await verifiedFacts(base44, target);

    // A profile limited to connections shows the professional card only.
    const restricted = !isSelf && privacy.visibility === 'connections' && !isColleague;
    // A connections-only profile still shows the name, specialty and the AMedix
    // verification badges — that is the card a colleague needs in order to decide
    // whether to connect. Everything the owner wrote about themselves stays closed.
    const canSee = (key) => {
      if (isSelf) return true;
      if (restricted) return key === 'show_specialty' && privacy.show_specialty !== false;
      return privacy[key] !== false;
    };

    const view = {
      doctor_id: target.id,
      doctor_user_id: target.user_id,
      is_self: isSelf,
      full_name: target.full_name || '',
      photo_url: canSee('show_photo') ? target.photo_url || record?.photo_url || '' : '',
      professional_title: canSee('show_title') ? record?.professional_title || '' : '',
      workplace: canSee('show_workplace') ? record?.workplace || '' : '',
      location: canSee('show_location') ? record?.location || '' : '',
      bio: canSee('show_bio') ? record?.bio || '' : '',
      education: canSee('show_education') ? record?.education || [] : [],
      achievements: canSee('show_achievements') ? record?.achievements || [] : [],
      verified: {
        ...verified,
        licence_number: canSee('show_license') || isSelf ? verified.licence_number : '',
        specialty: canSee('show_specialty') ? verified.specialty : '',
        specialties: canSee('show_specialty') ? verified.specialties : [],
        hospital: canSee('show_workplace') ? verified.hospital : '',
      },
      restricted,
      visibility: privacy.visibility,
      privacy: isSelf ? privacy : undefined,
      connection: {
        is_colleague: isColleague,
        pending: pendingIn ? 'incoming' : pendingOut ? 'outgoing' : '',
        can_message: isColleague && target.user_id !== user.id,
      },
      has_profile: !!record,
    };

    // Whether the target can currently be connected with at all.
    if (!isSelf) {
      try {
        const targetEvaluation = await evaluateAccount(base44, target.user_id);
        view.connection.available = targetEvaluation.eligible === true;
        if (!targetEvaluation.eligible) view.connection.unavailable_reason = targetEvaluation.reason || 'This physician is not available in the verified network.';
        view.connection.can_message = view.connection.can_message && view.connection.available;
      } catch {
        view.connection.available = true;
      }
    }

    return Response.json(view);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}