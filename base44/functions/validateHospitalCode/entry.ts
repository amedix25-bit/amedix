import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isActivated, loadAuthorization } from "../../shared/hospitalAuthorization.ts";
import { checkAttemptWindow, clearAttemptWindow, normalizeCode } from "../../shared/registrationCodes.ts";

// Public pre-registration check of an AMedix Hospital Code.
// A doctor must enter a hospital's code BEFORE creating an account. The code is
// validated here on the server (never in the browser): the hospital must exist,
// be active, have completed AMedix authorization, and the code must belong to it.
// Only the hospital's public identifying details are returned — a valid code
// grants no access to anything.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const code = normalizeCode(body.code);
    if (!code) return Response.json({ error: 'Please enter the hospital code.' }, { status: 400 });

    const gate = await checkAttemptWindow(base44, 'hospital_code');
    if (!gate.allowed) {
      return Response.json(
        { error: `Too many incorrect attempts. Please try again in ${gate.minutes} minute${gate.minutes === 1 ? '' : 's'}.` },
        { status: 429 }
      );
    }

    const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    const hospital = hospitals[0];
    if (!hospital) {
      return Response.json({ error: 'This hospital code is not valid. Please check it with the hospital.', attempts_remaining: gate.remaining }, { status: 401 });
    }
    if (hospital.status === 'suspended') {
      return Response.json({ error: 'This hospital account is currently suspended. Please contact the hospital.' }, { status: 403 });
    }
    if (hospital.hospital_code_status === 'deactivated') {
      return Response.json(
        { error: 'This hospital code has been deactivated by the hospital. Please ask the hospital administrator for an active code.' },
        { status: 403 }
      );
    }

    const authorization = await loadAuthorization(base44, hospital.id);
    if (!isActivated(authorization)) {
      return Response.json(
        { error: 'This hospital has not completed AMedix administrative authorization yet, so its code cannot be used.' },
        { status: 403 }
      );
    }

    await clearAttemptWindow(base44, 'hospital_code');
    return Response.json({
      valid: true,
      hospital_code: code,
      hospital_name: hospital.hospital_name,
      hospital_photo_url: hospital.photo_url || '',
      hospital_location: hospital.location || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}