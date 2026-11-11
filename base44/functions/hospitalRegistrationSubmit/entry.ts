import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  auditEntry,
  escapeHtml,
  notifyAdministration,
  notifyHospital,
  registrationReference,
} from "../../shared/hospitalAuthorization.ts";
import {
  consumeAdministrationCode,
  resolveAdministrationCode,
} from "../../shared/registrationCodes.ts";

const DEFAULT_PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer"];

// Hospital self-registration. Nothing here can produce an authorized hospital:
// the profile is created in pending_approval state by the server, the hospital
// cannot set its own status, and no Hospital Code exists until AMedix
// administration approves the institution and the hospital activates its
// issued authorization code. Runs with the service role so the client can
// never create these records directly.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hospitalName = String(body.hospital_name || '').trim();
    const location = String(body.location || '').trim();
    const phone = String(body.phone || '').trim();
    const photoUrl = String(body.photo_url || '').trim();
    const licenseUri = String(body.license_file_uri || '').trim();
    const licenseName = String(body.license_file_name || '').trim();

    if (hospitalName.length < 3) {
      return Response.json({ error: 'Hospital name is required.' }, { status: 400 });
    }
    if (location.length < 3) {
      return Response.json({ error: 'Location / address is required.' }, { status: 400 });
    }
    if (phone.length < 6) {
      return Response.json({ error: 'A valid contact number is required.' }, { status: 400 });
    }
    if (!photoUrl) {
      return Response.json({ error: 'The hospital photo is required.' }, { status: 400 });
    }
    if (!licenseUri) {
      return Response.json({ error: 'The hospital registration / licence document is required for verification.' }, { status: 400 });
    }

    // Mandatory AMedix Administration Code — re-validated here, server-side, so
    // a hospital can never reach registration without one issued for hospitals.
    const resolvedCode = await resolveAdministrationCode(base44, {
      code: body.registration_code,
      institutionType: 'hospital',
      actor: { user_id: user.id, name: hospitalName, role: 'hospital' },
    });
    if (!resolvedCode.ok) {
      return Response.json({ error: resolvedCode.error }, { status: resolvedCode.status });
    }

    const profiles = await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: user.id });
    if (profiles.length > 0) {
      const existing = await base44.asServiceRole.entities.HospitalAuthorization.filter({
        hospital_profile_id: profiles[0].id,
      });
      if (existing.length > 0) {
        return Response.json({
          status: existing[0].status,
          request_reference: existing[0].request_reference || '',
          already_submitted: true,
        });
      }
      return Response.json({ error: 'This account already has a hospital profile.' }, { status: 409 });
    }

    const profile = await base44.asServiceRole.entities.HospitalProfile.create({
      user_id: user.id,
      hospital_name: hospitalName,
      location,
      phone,
      photo_url: photoUrl,
      payment_methods: DEFAULT_PAYMENT_METHODS,
    });

    const reference = registrationReference();
    const now = new Date().toISOString();
    const documents = Array.isArray(body.additional_documents)
      ? body.additional_documents
          .filter((d) => d && typeof d.file_uri === 'string' && d.file_uri)
          .slice(0, 5)
          .map((d) => ({ file_uri: d.file_uri, file_name: String(d.file_name || 'Document') }))
      : [];

    await base44.asServiceRole.entities.HospitalAuthorization.create({
      hospital_profile_id: profile.id,
      hospital_user_id: user.id,
      request_reference: reference,
      hospital_name: hospitalName,
      location,
      contact_phone: phone,
      contact_email: String(user.email || '').toLowerCase(),
      photo_url: photoUrl,
      license_file_uri: licenseUri,
      license_file_name: licenseName || 'Registration document',
      additional_documents: documents,
      status: 'pending',
      submitted_datetime: now,
      code_status: 'none',
      code_version: 0,
      failed_attempts: 0,
      hospital_code_issued: false,
      audit: [
        auditEntry({
          action: 'submitted',
          actionLabel: 'Registration submitted for AMedix approval',
          actor: { user_id: user.id, name: user.full_name || hospitalName, role: 'hospital' },
          detail: `Reference ${reference}`,
        }),
      ],
    });

    await consumeAdministrationCode(base44, {
      record: resolvedCode.record,
      user,
      institutionId: profile.id,
      actor: { user_id: user.id, name: hospitalName, role: 'hospital' },
    });

    const safeName = escapeHtml(hospitalName);
    const safeRef = escapeHtml(reference);
    await notifyAdministration(base44, {
      subject: `Hospital registration awaiting approval — ${hospitalName} (${reference})`,
      body: `
        <p>A hospital has submitted a registration request and is waiting for administrative authorization.</p>
        <p><strong>Institution:</strong> ${safeName}<br/>
        <strong>Reference:</strong> ${safeRef}<br/>
        <strong>Location:</strong> ${escapeHtml(location)}<br/>
        <strong>Contact phone:</strong> ${escapeHtml(phone)}<br/>
        <strong>Contact email:</strong> ${escapeHtml(user.email || '')}<br/>
        <strong>Submitted document:</strong> ${escapeHtml(licenseName || 'Registration document')}</p>
        <p>Open the Hospital Approvals workspace in the AMedix administration dashboard to review the submitted documentation and record a decision. No Hospital Code can be created for this institution until it is approved and its authorization code is activated.</p>`,
    });

    await notifyHospital(base44, user.email, {
      subject: `AMedix hospital registration received — ${hospitalName}`,
      body: `
        <p>Your registration for <strong>${safeName}</strong> has been received.</p>
        <p><strong>Reference:</strong> ${safeRef}</p>
        <p>The account is in <strong>Pending Administrative Approval</strong>. You can sign in to the hospital portal to follow the review; your AMedix Hospital Code stays locked until AMedix administration approves the institution and you activate the authorization code issued to you.</p>`,
    });

    return Response.json({ status: 'pending', request_reference: reference });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}