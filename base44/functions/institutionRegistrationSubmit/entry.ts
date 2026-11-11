import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  TYPE_LABEL,
  consumeAdministrationCode,
  emailAdministration,
  escapeHtml,
  registrationReference,
  resolveAdministrationCode,
} from "../../shared/registrationCodes.ts";

const LABEL = { laboratory: 'Laboratory', pharmacy: 'Pharmacy' };

// Registration submission for a laboratory or a pharmacy. Requires a valid
// AMedix Administration Code issued for that institution type — checked again
// here, server-side, so neither a direct call nor a modified browser can reach
// this step without one. The institution is created in pending state and gains
// nothing until AMedix administration approves it.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const institutionType = String(body.institution_type || '').trim();
    if (!LABEL[institutionType]) {
      return Response.json({ error: 'Unknown institution type.' }, { status: 400 });
    }

    const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 200);
    const fields = {
      legal_name: clean(body.legal_name),
      registration_number: clean(body.registration_number),
      license_number: clean(body.license_number),
      address: clean(body.address, 300),
      phone: clean(body.phone, 40),
      whatsapp_number: clean(body.whatsapp_number, 40),
      responsible_person_name: clean(body.responsible_person_name),
      responsible_person_license: clean(body.responsible_person_license),
      administrator_name: clean(body.administrator_name),
      administrator_email: clean(body.administrator_email),
      administrator_phone: clean(body.administrator_phone, 40),
      logo_url: clean(body.logo_url, 500),
      license_file_uri: clean(body.license_file_uri, 500),
      license_file_name: clean(body.license_file_name),
    };

    const missing = [
      ['legal_name', 'The legal institution name is required.'],
      ['registration_number', 'The registration number is required.'],
      ['license_number', 'The licence number is required.'],
      ['address', 'The address is required.'],
      ['phone', 'A contact number is required.'],
      ['responsible_person_name', 'The responsible person is required.'],
      ['administrator_name', 'The authorised administrator is required.'],
      ['license_file_uri', 'The licence document is required for verification.'],
    ].find(([key]) => !fields[key]);
    if (missing) return Response.json({ error: missing[1] }, { status: 400 });

    // Duplicate protection: one institution per account, no second registration.
    const existing = await base44.asServiceRole.entities.InstitutionRegistration.filter({ user_id: user.id });
    const open = existing.find((r) => ['pending', 'approved'].includes(r.status) && r.institution_type === institutionType);
    if (open) {
      return Response.json({ status: open.status, reference: open.registration_reference || '', already_submitted: true });
    }
    const [labs, pharmacies] = await Promise.all([
      base44.asServiceRole.entities.LaboratoryProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }),
    ]);
    if (labs.length > 0 || pharmacies.length > 0) {
      return Response.json({ error: 'This account already has an institutional profile.' }, { status: 409 });
    }

    const actor = { user_id: user.id, name: user.full_name || fields.legal_name, role: institutionType };
    const resolved = await resolveAdministrationCode(base44, { code: body.registration_code, institutionType, actor });
    if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });

    const reference = registrationReference(institutionType === 'laboratory' ? 'IREG-LAB' : 'IREG-PHM');
    const registration = await base44.asServiceRole.entities.InstitutionRegistration.create({
      institution_type: institutionType,
      status: 'pending',
      user_id: user.id,
      email: String(user.email || '').toLowerCase(),
      ...fields,
      registration_code_preview: resolved.record.code_preview || '',
      registration_reference: reference,
      submitted_datetime: new Date().toISOString(),
    });

    await consumeAdministrationCode(base44, {
      record: resolved.record,
      user,
      institutionId: registration.id,
      actor,
    });

    const label = TYPE_LABEL[institutionType];
    await emailAdministration(base44, {
      subject: `${label} registration awaiting approval — ${fields.legal_name} (${reference})`,
      body: `
        <p>A ${label.toLowerCase()} has completed registration with a valid AMedix Administration Code and is waiting for review.</p>
        <p><strong>Institution:</strong> ${escapeHtml(fields.legal_name)}<br/>
        <strong>Reference:</strong> ${escapeHtml(reference)}<br/>
        <strong>Registration number:</strong> ${escapeHtml(fields.registration_number)}<br/>
        <strong>Licence number:</strong> ${escapeHtml(fields.license_number)}<br/>
        <strong>Address:</strong> ${escapeHtml(fields.address)}<br/>
        <strong>Responsible person:</strong> ${escapeHtml(fields.responsible_person_name)}<br/>
        <strong>Administrator:</strong> ${escapeHtml(fields.administrator_name)}<br/>
        <strong>Account email:</strong> ${escapeHtml(user.email || '')}<br/>
        <strong>Code:</strong> ${escapeHtml(resolved.record.code_preview || '')}</p>
        <p>Review the submitted licence in the AMedix Administration console. The institution stays pending and inactive until it is approved.</p>`,
    });

    return Response.json({ status: 'pending', reference, institution_type: institutionType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}