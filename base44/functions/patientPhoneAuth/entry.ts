import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  CODE_TTL_MINUTES,
  GLOBAL_HOURLY_CAP,
  MAX_ATTEMPTS,
  MAX_SENDS_PER_WINDOW,
  RESEND_COOLDOWN_SECONDS,
  SEND_WINDOW_MINUTES,
  constantTimeEqual,
  generateSixDigitCode,
  hashCode,
  normalizeLibyanPhone,
  sendSmsCode,
} from '../../shared/signupOtp.ts';
import {
  PATIENT_SESSION_HOURS,
  REGISTRATION_TOKEN_MINUTES,
  findSession,
  generateUniqueCin,
  newSessionToken,
  phoneVariants,
  sessionExpiry,
  tokenFingerprint,
} from '../../shared/patientPhoneAuth.ts';

// Phone-only patient access. The number is verified by an SMS code delivered
// through Resala, and the verified number earns a server-validated patient
// session scoped to exactly one PatientProfile. No email address is ever asked
// for, and no clinical record is recreated — an existing patient is linked to
// their number, so the CIN, history, prescriptions and permissions are kept.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const serviceRole = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (!['send', 'verify', 'complete', 'context', 'logout'].includes(action)) {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    const apiKey = secrets.get('resala');
    if (!apiKey) {
      return Response.json(
        { error: 'SMS sign-in is not configured for this app yet.' },
        { status: 503 }
      );
    }

    const otpStore = serviceRole.entities.SignupOtp;
    const now = Date.now();

    // ---------------------------------------------------------------- send
    if (action === 'send') {
      const phone = normalizeLibyanPhone(body?.phone);
      if (!phone) {
        return Response.json(
          { error: 'Enter a valid Libyan mobile number (091, 092, 093 or 094 followed by 7 digits).' },
          { status: 400 }
        );
      }

      const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      const recentTotal = await otpStore.count({ created_date: { $gte: hourAgo } });
      if (recentTotal >= GLOBAL_HOURLY_CAP) {
        return Response.json(
          { error: 'Too many verification requests right now. Please try again later.' },
          { status: 429 }
        );
      }

      const { items } = await otpStore.filter({ destination: phone }, { sort: '-created_date', limit: 10 });
      const lastWait = items[0]?.cooldown_until ? new Date(items[0].cooldown_until).getTime() : 0;
      if (lastWait > now) {
        return Response.json(
          {
            error: `Please wait ${Math.ceil((lastWait - now) / 1000)} seconds before requesting another code.`,
            retry_after: Math.ceil((lastWait - now) / 1000),
          },
          { status: 429 }
        );
      }

      const windowStart = now - SEND_WINDOW_MINUTES * 60 * 1000;
      const recentForPhone = items.filter((item) => new Date(item.created_date).getTime() >= windowStart).length;
      if (recentForPhone >= MAX_SENDS_PER_WINDOW) {
        return Response.json(
          { error: 'Too many codes were requested for this number. Please try again later.' },
          { status: 429 }
        );
      }

      let sent;
      try {
        sent = await sendSmsCode(apiKey, phone);
      } catch (smsError) {
        return Response.json({ error: smsError.message }, { status: 502 });
      }

      // A newer code always supersedes any code still outstanding.
      await otpStore
        .updateMany({ destination: phone, status: 'pending' }, { $set: { status: 'expired' } })
        .catch(() => null);

      const salt = crypto.randomUUID();
      const challenge = await otpStore.create({
        channel: 'sms',
        destination: phone,
        challenge_token: crypto.randomUUID(),
        code_hash: await hashCode(sent.pin, salt),
        code_salt: salt,
        status: 'pending',
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        expires_datetime: new Date(now + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
        cooldown_until: new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
        sent_datetime: new Date(now).toISOString(),
        provider_pin_id: sent.providerPinId,
      });

      return Response.json({
        ok: true,
        phone,
        challenge_token: challenge.challenge_token,
        expires_in: CODE_TTL_MINUTES * 60,
        resend_after: RESEND_COOLDOWN_SECONDS,
      });
    }

    // -------------------------------------------------------------- verify
    if (action === 'verify') {
      const challengeToken = typeof body?.challenge_token === 'string' ? body.challenge_token : '';
      const code = String(body?.code || '').replace(/\D/g, '');

      if (!/^[0-9a-fA-F-]{20,64}$/.test(challengeToken)) {
        return Response.json({ error: 'Request a code first.' }, { status: 400 });
      }
      if (!/^\d{4,6}$/.test(code)) {
        return Response.json({ error: 'Enter the 6-digit code you received.' }, { status: 400 });
      }

      const { items } = await otpStore.filter({ challenge_token: challengeToken }, { limit: 1 });
      const challenge = items[0];
      if (!challenge || challenge.channel !== 'sms') {
        return Response.json({ error: 'This code is no longer valid. Request a new one.' }, { status: 404 });
      }
      if (challenge.status === 'locked') {
        return Response.json(
          { error: 'Too many incorrect attempts. Request a new code.', locked: true },
          { status: 429 }
        );
      }
      if (challenge.status !== 'pending') {
        return Response.json({ error: 'This code has expired. Request a new one.', expired: true }, { status: 400 });
      }
      if (new Date(challenge.expires_datetime).getTime() < now) {
        await otpStore.update(challenge.id, { status: 'expired' }).catch(() => null);
        return Response.json({ error: 'This code has expired. Request a new one.', expired: true }, { status: 400 });
      }

      const maxAttempts = challenge.max_attempts || MAX_ATTEMPTS;
      if ((challenge.attempts || 0) >= maxAttempts) {
        await otpStore.update(challenge.id, { status: 'locked' }).catch(() => null);
        return Response.json(
          { error: 'Too many incorrect attempts. Request a new code.', locked: true },
          { status: 429 }
        );
      }

      const submitted = await hashCode(code, challenge.code_salt);
      if (!constantTimeEqual(submitted, challenge.code_hash)) {
        const attempts = (challenge.attempts || 0) + 1;
        const locked = attempts >= maxAttempts;
        await otpStore.update(challenge.id, { attempts, status: locked ? 'locked' : 'pending' });
        return Response.json(
          {
            error: locked
              ? 'Too many incorrect attempts. Request a new code.'
              : `That code is not correct. ${maxAttempts - attempts} attempt${maxAttempts - attempts === 1 ? '' : 's'} left.`,
            attempts_remaining: Math.max(maxAttempts - attempts, 0),
            locked,
          },
          { status: locked ? 429 : 400 }
        );
      }

      await otpStore.update(challenge.id, {
        status: 'verified',
        attempts: (challenge.attempts || 0) + 1,
        verified_datetime: new Date().toISOString(),
      });

      const phone = challenge.destination;

      // Who is this number? An existing link wins, then exactly one matching
      // patient record. An ambiguous number is never guessed at.
      const linked = await serviceRole.entities.PatientPhoneIdentity.filter(
        { phone, status: 'active' },
        { limit: 1 }
      );
      let profile = null;

      if (linked.items?.[0]?.patient_id) {
        profile = await serviceRole.entities.PatientProfile.get(linked.items[0].patient_id).catch((error) =>
          error.status === 404 ? null : Promise.reject(error)
        );
        if (!profile) {
          return Response.json(
            { error: 'This number is linked to a patient record that is no longer available. Please contact AMedix support.' },
            { status: 409 }
          );
        }
      } else {
        const matches = await serviceRole.entities.PatientProfile.filter(
          { phone: { $in: phoneVariants(phone) } },
          { limit: 5 }
        );
        const candidates = matches.items || [];
        if (candidates.length > 1) {
          return Response.json(
            { error: 'More than one patient record uses this number. Please contact AMedix support.' },
            { status: 409 }
          );
        }
        if (candidates.length === 1) {
          profile = candidates[0];
          await serviceRole.entities.PatientPhoneIdentity.create({
            phone,
            patient_id: profile.id,
            patient_user_id: profile.user_id || '',
            cin: profile.cin || '',
            status: 'active',
            link_method: 'verified_phone_match',
            provider: 'resala',
            verified_datetime: new Date().toISOString(),
            last_sign_in_datetime: new Date().toISOString(),
          });
        }
      }

      const token = newSessionToken();

      if (!profile) {
        // Verified number with no patient record yet: this token may only
        // submit personal details.
        await serviceRole.entities.PatientSession.create({
          token_fingerprint: await tokenFingerprint(token),
          status: 'registration',
          phone,
          provider: 'resala',
          verified_datetime: new Date().toISOString(),
          expires_datetime: sessionExpiry(REGISTRATION_TOKEN_MINUTES / 60),
        });
        return Response.json({ ok: true, token, phone, needs_details: true });
      }

      await serviceRole.entities.PatientSession.create({
        token_fingerprint: await tokenFingerprint(token),
        status: 'active',
        phone,
        patient_id: profile.id,
        patient_user_id: profile.user_id || '',
        cin: profile.cin || '',
        patient_name: profile.full_name || '',
        provider: 'resala',
        verified_datetime: new Date().toISOString(),
        expires_datetime: sessionExpiry(PATIENT_SESSION_HOURS),
      });
      await serviceRole.entities.PatientPhoneIdentity.updateMany(
        { phone, status: 'active' },
        { $set: { last_sign_in_datetime: new Date().toISOString() } }
      ).catch(() => null);

      return Response.json({
        ok: true,
        token,
        phone,
        patient: {
          patient_id: profile.id,
          cin: profile.cin || '',
          full_name: profile.full_name || '',
          preferred_language: profile.preferred_language || 'en',
        },
      });
    }

    // ------------------------------------------------------------ complete
    if (action === 'complete') {
      const session = await findSession(serviceRole, body?.token);
      if (!session) return Response.json({ error: 'Your verification has expired. Please request a new code.' }, { status: 401 });
      if (session.status !== 'registration') {
        return Response.json({ error: 'This registration is already complete.' }, { status: 400 });
      }

      const details = body?.details || {};
      const clean = (value) => String(value || '').trim().slice(0, 120);
      const firstName = clean(details.first_name);
      const fatherName = clean(details.father_name);
      const grandfatherName = clean(details.grandfather_name);
      const lastName = clean(details.last_name);
      const dateOfBirth = clean(details.date_of_birth);
      const gender = ['male', 'female', 'other'].includes(details.gender) ? details.gender : '';

      if (firstName.length < 2 || fatherName.length < 2 || lastName.length < 2) {
        return Response.json({ error: 'Enter your first name, father\u2019s name and last name.' }, { status: 400 });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || new Date(dateOfBirth).getTime() > now) {
        return Response.json({ error: 'Enter your date of birth.' }, { status: 400 });
      }
      if (!gender) {
        return Response.json({ error: 'Select your sex.' }, { status: 400 });
      }

      const fullName = [firstName, fatherName, grandfatherName, lastName].filter(Boolean).join(' ');
      const identity = await serviceRole.entities.PatientPhoneIdentity.create({
        phone: session.phone,
        status: 'linking',
        link_method: 'new_registration',
        provider: 'resala',
        verified_datetime: session.verified_datetime || new Date().toISOString(),
        last_sign_in_datetime: new Date().toISOString(),
      });

      // A phone-only patient has no Base44 account, so their record carries a
      // namespaced identity that can never collide with a real user id.
      const patientUserId = `phone:${identity.id}`;
      const cin = await generateUniqueCin(serviceRole);

      const profile = await serviceRole.entities.PatientProfile.create({
        user_id: patientUserId,
        cin,
        full_name: fullName,
        first_name: firstName,
        father_name: fatherName,
        grandfather_name: grandfatherName,
        last_name: lastName,
        middle_name: fatherName,
        date_of_birth: dateOfBirth,
        gender,
        nationality: clean(details.nationality),
        address: clean(details.address),
        identification_number: clean(details.identification_number),
        phone: session.phone,
        phone_numbers: [{ label: 'Primary', number: session.phone }],
        preferred_language: details.preferred_language === 'ar' ? 'ar' : 'en',
        medication_info_completed: false,
      });

      await serviceRole.entities.PatientPhoneIdentity.update(identity.id, {
        patient_id: profile.id,
        patient_user_id: patientUserId,
        cin,
        status: 'active',
      });

      await serviceRole.entities.PatientSession.update(session.id, {
        status: 'active',
        patient_id: profile.id,
        patient_user_id: patientUserId,
        cin,
        patient_name: fullName,
        expires_datetime: sessionExpiry(PATIENT_SESSION_HOURS),
        last_used_datetime: new Date().toISOString(),
      });

      return Response.json({
        ok: true,
        token: body?.token,
        patient: {
          patient_id: profile.id,
          cin,
          full_name: fullName,
          preferred_language: profile.preferred_language,
        },
      });
    }

    // ------------------------------------------------------------- context
    if (action === 'context') {
      const session = await findSession(serviceRole, body?.token);
      if (!session || session.status !== 'active' || !session.patient_id) {
        return Response.json({ error: 'Please sign in with your phone number.' }, { status: 401 });
      }

      const profile = await serviceRole.entities.PatientProfile.get(session.patient_id).catch((error) =>
        error.status === 404 ? null : Promise.reject(error)
      );
      if (!profile) {
        return Response.json({ error: 'This patient record is no longer available.' }, { status: 404 });
      }

      const scope = { patient_id: profile.id };
      const [appointments, labRequests, imaging, documents, medications] = await Promise.all([
        serviceRole.entities.Appointment.count(scope),
        serviceRole.entities.LabRequest.count(scope),
        serviceRole.entities.ImagingRequest.count(scope),
        serviceRole.entities.MedicalDocument.count(scope),
        serviceRole.entities.Medication.count(scope),
      ]);

      await serviceRole.entities.PatientSession.update(session.id, {
        last_used_datetime: new Date().toISOString(),
      }).catch(() => null);

      return Response.json({
        ok: true,
        patient: {
          patient_id: profile.id,
          cin: profile.cin || '',
          full_name: profile.full_name || '',
          preferred_language: profile.preferred_language || 'en',
          phone: session.phone,
        },
        counts: { appointments, labRequests, imaging, documents, medications },
        expires_datetime: session.expires_datetime,
      });
    }

    // -------------------------------------------------------------- logout
    const session = await findSession(serviceRole, body?.token);
    if (session) {
      await serviceRole.entities.PatientSession.update(session.id, {
        status: 'revoked',
        revoked_datetime: new Date().toISOString(),
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: 'We could not complete this request. Please try again.' },
      { status: 500 }
    );
  }
}