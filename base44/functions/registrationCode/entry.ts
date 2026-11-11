import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DEFAULT_EXPIRY_DAYS,
  INSTITUTION_TYPES,
  TYPE_LABEL,
  auditEntry,
  checkAttemptWindow,
  clearAttemptWindow,
  codeState,
  issueAdministrationCode,
  resolveAdministrationCode,
} from "../../shared/registrationCodes.ts";

// AMedix Administration Codes.
//   action: "validate" — public, pre-registration. Confirms an institutional
//                        registration code is valid for the requested
//                        institution type. It grants nothing else.
//   action: "issue" / "list" / "revoke" / "disable" — AMedix administrators only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'validate');

    if (action === 'validate') {
      const institutionType = String(body.institution_type || '').trim();
      if (!INSTITUTION_TYPES.includes(institutionType)) {
        return Response.json({ error: 'Unknown institution type.' }, { status: 400 });
      }
      const gate = await checkAttemptWindow(base44, `administration_code:${institutionType}`);
      if (!gate.allowed) {
        return Response.json(
          { error: `Too many incorrect attempts. Please try again in ${gate.minutes} minute${gate.minutes === 1 ? '' : 's'}.` },
          { status: 429 }
        );
      }
      const result = await resolveAdministrationCode(base44, { code: body.code, institutionType });
      if (!result.ok) {
        return Response.json({ error: result.error, attempts_remaining: gate.remaining }, { status: result.status });
      }
      await clearAttemptWindow(base44, `administration_code:${institutionType}`);
      const record = result.record;
      return Response.json({
        valid: true,
        institution_type: institutionType,
        institution_label: TYPE_LABEL[institutionType],
        assigned_institution_name: record.assigned_institution_name || '',
        code_preview: record.code_preview || '',
        expiry_datetime: record.expiry_datetime || '',
      });
    }

    // ── Everything below is AMedix administration only ──────────────────────
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const actor = { user_id: user.id, name: user.full_name || user.email || 'AMedix administrator', role: 'admin' };

    if (action === 'issue') {
      const institutionType = String(body.institution_type || '').trim();
      if (!INSTITUTION_TYPES.includes(institutionType)) {
        return Response.json({ error: 'Choose the institution type the code is for.' }, { status: 400 });
      }
      const issued = await issueAdministrationCode(base44, {
        institutionType,
        assignedInstitutionName: body.assigned_institution_name,
        expiryDays: body.expiry_days || DEFAULT_EXPIRY_DAYS,
        maxUses: body.max_uses,
        notes: body.notes,
        actor,
      });
      // The plain code is returned exactly once and never stored.
      return Response.json({
        code: issued.code,
        code_id: issued.record.id,
        institution_type: institutionType,
        expiry_datetime: issued.record.expiry_datetime,
      });
    }

    if (action === 'list') {
      const codes = await base44.asServiceRole.entities.RegistrationCode.list('-created_date', 200);
      return Response.json({
        codes: codes.map((c) => ({
          id: c.id,
          institution_type: c.institution_type,
          assigned_institution_name: c.assigned_institution_name || '',
          code_preview: c.code_preview || '',
          state: codeState(c),
          max_uses: c.max_uses || 1,
          used_count: c.used_count || 0,
          expiry_datetime: c.expiry_datetime || '',
          issued_by_name: c.issued_by_name || '',
          issued_datetime: c.issued_datetime || '',
          used_by_email: c.used_by_email || '',
          used_datetime: c.used_datetime || '',
          revoke_reason: c.revoke_reason || '',
          notes: c.notes || '',
        })),
      });
    }

    if (action === 'revoke' || action === 'disable') {
      const id = String(body.code_id || '');
      if (!id) return Response.json({ error: 'code_id is required.' }, { status: 400 });
      const rows = await base44.asServiceRole.entities.RegistrationCode.filter({ id });
      const record = rows[0];
      if (!record) return Response.json({ error: 'Code not found.' }, { status: 404 });
      if (record.status === 'used') {
        return Response.json({ error: 'This code has already been used and cannot be withdrawn.' }, { status: 409 });
      }
      const status = action === 'revoke' ? 'revoked' : 'disabled';
      await base44.asServiceRole.entities.RegistrationCode.update(id, {
        status,
        revoked_datetime: new Date().toISOString(),
        revoked_by_name: actor.name,
        revoke_reason: String(body.reason || '').trim(),
        audit: [
          ...(record.audit || []),
          auditEntry({
            action: status,
            actionLabel: status === 'revoked' ? 'Code revoked by AMedix administration' : 'Code disabled by AMedix administration',
            actor,
            detail: String(body.reason || '').trim(),
          }),
        ],
      });
      return Response.json({ ok: true, status });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}