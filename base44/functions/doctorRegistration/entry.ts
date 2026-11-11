import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Doctor registration that can be started, interrupted and resumed.
//
// The registration belongs to the signed-in account: progress is saved in
// DoctorRegistrationDraft (readable/writable only by that account), verified
// documents are reused instead of re-uploaded, and submitting always reuses an
// existing DoctorProfile rather than creating a duplicate.
//
// The only unauthenticated call is `lookup`, and it answers with a state code
// alone — never any saved registration information — so entering someone
// else's email reveals nothing but that a registration exists.

const IDENTITY_DOCUMENTS = ['birth_certificate', 'personal_card', 'passport', 'national_id'];
const LICENSE_DOCUMENTS = ['medical_license'];
const FORM_FIELDS = ['first_name', 'middle_name', 'last_name', 'specialization', 'hospital', 'phone', 'license_number'];
const SAVED_STEPS = ['details', 'identity_verification', 'license_verification'];

const clean = (value, max) => String(value == null ? '' : value).trim().slice(0, max || 200);
const rows = (result) => (Array.isArray(result) ? result : (result && result.items) || []);

const formOf = (draft) => {
  const form = {};
  FORM_FIELDS.forEach((key) => { form[key] = (draft && draft[key]) || ''; });
  return form;
};

// A verification only counts when it is this account's own record, passed, and
// belongs to a doctor registration — a draft can never point at someone else's
// document or at a failed attempt.
async function findVerified(base44, userId, verificationId, documentTypes) {
  const id = clean(verificationId, 100);
  if (!id) return null;
  const found = rows(await base44.entities.IdentityVerification.filter({ id }));
  const record = found[0];
  if (!record) return null;
  if (record.user_id !== userId) return null;
  if (record.profile_type !== 'doctor') return null;
  // A submitted document (pending review) or an approved one satisfies the
  // registration step — approval itself stays with AMedix administration.
  if (!['verified', 'pending'].includes(record.status)) return null;
  if (!documentTypes.includes(record.document_type)) return null;
  return record;
}

// Recovery for a registration interrupted right after a successful
// verification: the verified document of this account is reused instead of
// asking the doctor to scan it again.
async function latestVerified(base44, userId, documentTypes) {
  const list = rows(await base44.entities.IdentityVerification.filter(
    { user_id: userId, profile_type: 'doctor', status: { $in: ['verified', 'pending'] } },
    { sort: '-created_date', limit: 20 }
  ));
  return list.find((record) => documentTypes.includes(record.document_type) && !record.doctor_id) || null;
}

async function resolveVerification(base44, userId, draft, fieldKey, documentTypes, submittedId) {
  return (await findVerified(base44, userId, submittedId, documentTypes))
    || (await findVerified(base44, userId, draft && draft[fieldKey], documentTypes))
    || (await latestVerified(base44, userId, documentTypes));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'resume');

    if (action === 'lookup') {
      const email = clean(body.email, 200).toLowerCase();
      if (!email) return Response.json({ state: 'none' });
      const users = rows(await base44.asServiceRole.entities.User.filter({ email }));
      if (users.length === 0) return Response.json({ state: 'none' });
      const userId = users[0].id;
      const [profiles, drafts] = await Promise.all([
        base44.asServiceRole.entities.DoctorProfile.filter({ user_id: userId }),
        base44.asServiceRole.entities.DoctorRegistrationDraft.filter({ user_id: userId }),
      ]);
      const profile = rows(profiles)[0] || null;
      const draft = rows(drafts)[0] || null;
      if (profile) {
        if (draft && draft.status === 'rejected') return Response.json({ state: 'rejected' });
        return Response.json({ state: profile.is_verified ? 'active' : 'pending_verification' });
      }
      if (draft) return Response.json({ state: draft.status === 'rejected' ? 'rejected' : 'incomplete' });
      // The account exists but belongs to another portal — not a doctor registration.
      const [patients, laboratories, hospitals, pharmacies, radiologists] = await Promise.all([
        base44.asServiceRole.entities.PatientProfile.filter({ user_id: userId }),
        base44.asServiceRole.entities.LaboratoryProfile.filter({ user_id: userId }),
        base44.asServiceRole.entities.HospitalProfile.filter({ user_id: userId }),
        base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: userId }),
        base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: userId }),
      ]);
      if ([patients, laboratories, hospitals, pharmacies, radiologists].some((list) => rows(list).length > 0)) {
        return Response.json({ state: 'other_account' });
      }
      return Response.json({ state: 'incomplete' });
    }

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = clean(user.email, 200).toLowerCase();
    const now = new Date().toISOString();

    if (action === 'resume' || action === 'status') {
      const [profiles, drafts] = await Promise.all([
        base44.entities.DoctorProfile.filter({ user_id: user.id }),
        base44.entities.DoctorRegistrationDraft.filter({ user_id: user.id }),
      ]);
      const profile = rows(profiles)[0] || null;
      const draft = rows(drafts)[0] || null;

      if (profile) {
        const state = draft && draft.status === 'rejected'
          ? 'rejected'
          : (profile.is_verified ? 'active' : 'pending_verification');
        if (draft && draft.status !== state) {
          try {
            await base44.entities.DoctorRegistrationDraft.update(draft.id, { status: state, doctor_id: profile.id });
          } catch (err) {
            // the status is always derived from the profile first
          }
        }
        return Response.json({
          state,
          resumed: false,
          doctor_id: profile.id,
          doctor_name: profile.full_name || '',
          rejection_reason: (draft && draft.rejection_reason) || '',
        });
      }

      if (!draft) return Response.json({ state: 'incomplete', resumed: false, restores: null });
      if (draft.status === 'rejected') {
        return Response.json({ state: 'rejected', resumed: true, rejection_reason: draft.rejection_reason || '' });
      }
      if (action === 'status') return Response.json({ state: 'incomplete', resumed: true });

      const identity = await resolveVerification(base44, user.id, draft, 'identity_verification_id', IDENTITY_DOCUMENTS);
      const license = await resolveVerification(base44, user.id, draft, 'license_verification_id', LICENSE_DOCUMENTS);
      return Response.json({
        state: 'incomplete',
        resumed: true,
        draft_id: draft.id,
        restores: {
          fields: formOf(draft),
          step: draft.step || 'details',
          identity: identity ? { status: identity.status, verification_id: identity.id, method: identity.document_type } : null,
          license: license ? { status: license.status, verification_id: license.id } : null,
        },
      });
    }

    if (action === 'save') {
      const profiles = rows(await base44.entities.DoctorProfile.filter({ user_id: user.id }));
      if (profiles.length > 0) {
        // A submitted registration is closed: the account already has a profile,
        // so no draft may be edited into a second one.
        return Response.json({ saved: false, state: profiles[0].is_verified ? 'active' : 'pending_verification' });
      }
      const drafts = rows(await base44.entities.DoctorRegistrationDraft.filter({ user_id: user.id }));
      const draft = drafts[0] || null;
      if (draft && draft.status === 'rejected') {
        return Response.json({ saved: false, state: 'rejected', rejection_reason: draft.rejection_reason || '' });
      }

      const patch = { last_saved_datetime: now };
      FORM_FIELDS.forEach((key) => {
        if (body[key] !== undefined) patch[key] = clean(body[key], 300);
      });
      if (body.step && SAVED_STEPS.includes(body.step)) patch.step = body.step;

      if (body.identity_verification_id !== undefined) {
        const record = await findVerified(base44, user.id, body.identity_verification_id, IDENTITY_DOCUMENTS);
        patch.identity_verification_id = record ? record.id : '';
        patch.identity_method = record ? record.document_type : '';
        patch.identity_verified = !!record;
      }
      if (body.license_verification_id !== undefined) {
        const record = await findVerified(base44, user.id, body.license_verification_id, LICENSE_DOCUMENTS);
        patch.license_verification_id = record ? record.id : '';
        patch.license_verified = !!record;
      }

      const saved = draft
        ? await base44.entities.DoctorRegistrationDraft.update(draft.id, patch)
        : await base44.entities.DoctorRegistrationDraft.create({ ...patch, user_id: user.id, email, status: 'incomplete' });
      return Response.json({ saved: true, draft_id: saved.id, state: 'incomplete' });
    }

    if (action === 'submit') {
      const profiles = rows(await base44.entities.DoctorProfile.filter({ user_id: user.id }));
      if (profiles.length > 0) {
        // Duplicate protection: one account, one doctor profile. A fully
        // registered doctor is sent to the portal or the login, never re-created.
        const existing = profiles[0];
        return Response.json({
          state: existing.is_verified ? 'active' : 'pending_verification',
          doctor_id: existing.id,
          duplicate: true,
        });
      }

      const first = clean(body.first_name, 120);
      const middle = clean(body.middle_name, 120);
      const last = clean(body.last_name, 120);
      const specialization = clean(body.specialization, 160);
      const hospital = clean(body.hospital, 200);
      const phone = clean(body.phone, 60);
      const licenseNumber = clean(body.license_number, 80);
      if (!first || !last || !specialization) {
        return Response.json({ error: 'Your name and specialty are required.' }, { status: 400 });
      }
      if (!licenseNumber) {
        return Response.json({ error: 'Your medical license number is required.' }, { status: 400 });
      }

      const drafts = rows(await base44.entities.DoctorRegistrationDraft.filter({ user_id: user.id }));
      const draft = drafts[0] || null;
      if (draft && draft.status === 'rejected') {
        return Response.json({ error: 'This registration was not approved. Please contact AMedix administration.' }, { status: 403 });
      }

      const identity = await resolveVerification(base44, user.id, draft, 'identity_verification_id', IDENTITY_DOCUMENTS, body.identity_verification_id);
      const license = await resolveVerification(base44, user.id, draft, 'license_verification_id', LICENSE_DOCUMENTS, body.license_verification_id);
      if (!identity || !license) {
        return Response.json({ error: 'Verification is required before you can continue.' }, { status: 400 });
      }

      const profile = await base44.entities.DoctorProfile.create({
        user_id: user.id,
        full_name: [first, middle, last].filter(Boolean).join(' '),
        first_name: first,
        middle_name: middle,
        last_name: last,
        name_edited: true,
        specialization,
        specialties: [specialization],
        license_number: licenseNumber,
        hospital,
        phone,
        is_verified: false,
      });

      // Attach the already-verified documents to the new profile — the same
      // records are reused, so a resumed registration never creates duplicates.
      try {
        await base44.asServiceRole.entities.IdentityVerification.updateMany(
          { id: { $in: [identity.id, license.id] }, user_id: user.id, profile_type: 'doctor' },
          { $set: { doctor_id: profile.id } }
        );
      } catch (err) {
        // the profile itself is never rolled back for a link failure
      }

      const patch = {
        status: 'pending_verification',
        step: 'submitted',
        doctor_id: profile.id,
        submitted_datetime: now,
        last_saved_datetime: now,
        first_name: first,
        middle_name: middle,
        last_name: last,
        specialization,
        hospital,
        phone,
        license_number: licenseNumber,
        identity_verification_id: identity.id,
        identity_method: identity.document_type,
        identity_verified: true,
        license_verification_id: license.id,
        license_verified: true,
      };
      try {
        if (draft) await base44.entities.DoctorRegistrationDraft.update(draft.id, patch);
        else await base44.entities.DoctorRegistrationDraft.create({ ...patch, user_id: user.id, email });
      } catch (err) {
        // the profile and its verification links are authoritative
      }

      return Response.json({ state: 'pending_verification', doctor_id: profile.id });
    }

    if (action === 'review') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const draftId = clean(body.draft_id, 100);
      const decision = String(body.decision || '');
      if (!draftId || decision !== 'rejected') {
        return Response.json({ error: 'Invalid review decision' }, { status: 400 });
      }
      const draft = await base44.asServiceRole.entities.DoctorRegistrationDraft
        .get(draftId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!draft) return Response.json({ error: 'Not found' }, { status: 404 });
      const updated = await base44.asServiceRole.entities.DoctorRegistrationDraft.update(draftId, {
        status: 'rejected',
        rejection_reason: clean(body.reason, 400),
      });
      return Response.json({ state: 'rejected', draft: updated });
    }

    return Response.json({ error: 'Unknown registration action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}