import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { emailAdministration, escapeHtml, registrationReference } from "../../shared/registrationCodes.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function nextInstitutionNumber(base44, institutionType) {
  const year = new Date().getFullYear();
  const prefix = institutionType === 'laboratory' ? 'AML' : 'AMP';
  const entity = institutionType === 'laboratory' ? 'LaboratoryProfile' : 'PharmacyProfile';
  const field = institutionType === 'laboratory' ? 'lab_number' : 'pharmacy_number';
  for (let i = 0; i < 10; i += 1) {
    const candidate = `${prefix}-${year}-${randomBlock(4)}`;
    const clash = await base44.asServiceRole.entities[entity].filter({ [field]: candidate });
    if (clash.length === 0) return candidate;
  }
  throw new Error('Could not allocate an institution number.');
}

// AMedix administration review of laboratory and pharmacy registrations.
// Only an administrator can list, approve, reject or suspend an institution,
// and an institution profile is created by the server at approval time — never
// by the applicant.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const actorName = user.full_name || user.email || 'AMedix administrator';
    const stamp = new Date().toISOString();

    if (action === 'list') {
      const rows = await base44.asServiceRole.entities.InstitutionRegistration.list('-created_date', 200);
      return Response.json({
        registrations: rows.map((r) => ({
          id: r.id,
          institution_type: r.institution_type,
          status: r.status,
          legal_name: r.legal_name || '',
          registration_number: r.registration_number || '',
          license_number: r.license_number || '',
          license_file_name: r.license_file_name || '',
          address: r.address || '',
          phone: r.phone || '',
          responsible_person_name: r.responsible_person_name || '',
          responsible_person_license: r.responsible_person_license || '',
          administrator_name: r.administrator_name || '',
          administrator_email: r.administrator_email || '',
          email: r.email || '',
          logo_url: r.logo_url || '',
          registration_reference: r.registration_reference || '',
          registration_code_preview: r.registration_code_preview || '',
          submitted_datetime: r.submitted_datetime || '',
          reviewed_by_name: r.reviewed_by_name || '',
          reviewed_datetime: r.reviewed_datetime || '',
          decision_note: r.decision_note || '',
          profile_id: r.profile_id || '',
        })),
      });
    }

    const id = String(body.registration_id || '');
    if (!id) return Response.json({ error: 'registration_id is required.' }, { status: 400 });
    const rows = await base44.asServiceRole.entities.InstitutionRegistration.filter({ id });
    const record = rows[0];
    if (!record) return Response.json({ error: 'Registration not found.' }, { status: 404 });

    if (action === 'approve') {
      if (record.status === 'approved' && record.profile_id) {
        return Response.json({ ok: true, status: 'approved', profile_id: record.profile_id });
      }
      let profileId = record.profile_id;
      if (!profileId) {
        const entity = record.institution_type === 'laboratory' ? 'LaboratoryProfile' : 'PharmacyProfile';
        const numberField = record.institution_type === 'laboratory' ? 'lab_number' : 'pharmacy_number';
        const nameField = record.institution_type === 'laboratory' ? 'lab_name' : 'pharmacy_name';
        const number = await nextInstitutionNumber(base44, record.institution_type);
        const profile = await base44.asServiceRole.entities[entity].create({
          user_id: record.user_id,
          [nameField]: record.legal_name,
          [numberField]: number,
          address: record.address || '',
          phone: record.phone || '',
          whatsapp_number: record.whatsapp_number || '',
          email: record.email || record.administrator_email || '',
          logo_url: record.logo_url || '',
          status: 'active',
        });
        profileId = profile.id;
      } else {
        const entity = record.institution_type === 'laboratory' ? 'LaboratoryProfile' : 'PharmacyProfile';
        await base44.asServiceRole.entities[entity].update(profileId, { status: 'active' });
      }

      await base44.asServiceRole.entities.InstitutionRegistration.update(id, {
        status: 'approved',
        profile_id: profileId,
        reviewed_by_user_id: user.id,
        reviewed_by_name: actorName,
        reviewed_datetime: stamp,
        decision_note: String(body.note || '').trim(),
      });

      await emailAdministration(base44, {
        subject: `${record.institution_type === 'laboratory' ? 'Laboratory' : 'Pharmacy'} approved — ${record.legal_name}`,
        body: `<p><strong>${escapeHtml(record.legal_name)}</strong> was approved and activated by ${escapeHtml(actorName)}.</p>
          <p><strong>Reference:</strong> ${escapeHtml(record.registration_reference || '')}<br/>
          <strong>Account:</strong> ${escapeHtml(record.email || '')}<br/>
          <strong>Approved:</strong> ${escapeHtml(stamp)}</p>`,
      });

      return Response.json({ ok: true, status: 'approved', profile_id: profileId });
    }

    if (action === 'reject' || action === 'suspend') {
      const reason = String(body.reason || '').trim();
      if (action === 'reject' && !reason) {
        return Response.json({ error: 'A rejection reason is required.' }, { status: 400 });
      }
      const status = action === 'reject' ? 'rejected' : 'suspended';
      await base44.asServiceRole.entities.InstitutionRegistration.update(id, {
        status,
        reviewed_by_user_id: user.id,
        reviewed_by_name: actorName,
        reviewed_datetime: stamp,
        decision_note: reason,
      });
      if (record.profile_id) {
        const entity = record.institution_type === 'laboratory' ? 'LaboratoryProfile' : 'PharmacyProfile';
        await base44.asServiceRole.entities[entity].update(record.profile_id, { status: 'suspended' });
      }
      return Response.json({ ok: true, status });
    }

    if (action === 'reference') {
      return Response.json({ reference: record.registration_reference || registrationReference('IREG') });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}