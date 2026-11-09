import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  DEFAULT_EXPIRY_DAYS,
  auditEntry,
  codeState,
  escapeHtml,
  generateAuthorizationCode,
  hashAuthorizationCode,
  isActivated,
  loadAuthorizationById,
  maskCode,
  notifyHospital,
  publicAuthorization,
  randomSalt,
  withAudit,
} from "../../shared/hospitalAuthorization.ts";

// AMedix administration only. Every action is authorized here from the
// database role — never from the browser — and every state change is written
// with an audit entry. Authorization codes are hashed before storage and the
// plain code is returned exactly once, at issue time.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const actor = { user_id: user.id, name: user.full_name || user.email || 'AMedix administrator', role: 'admin' };

    const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

    if (action === 'list') {
      const auths = rows(await base44.asServiceRole.entities.HospitalAuthorization.list('-submitted_datetime', 200));
      const profiles = rows(await base44.asServiceRole.entities.HospitalProfile.list('-created_date', 500));
      const statusFor = (auth) => {
        const profile =
          profiles.find((p) => p.id === auth.hospital_profile_id) ||
          profiles.find((p) => p.user_id === auth.hospital_user_id);
        return profile ? profile.status || 'active' : 'none';
      };
      return Response.json({
        items: auths.map((r) => ({ ...publicAuthorization(r, { includeAdminOnly: true }), hospital_status: statusFor(r) })),
      });
    }

    const auth = await loadAuthorizationById(base44, String(body.id || ''));
    if (!auth) return Response.json({ error: 'Authorization request not found.' }, { status: 404 });

    const stamp = () => new Date().toISOString();

    // The hospital account behind a registration — matched by profile id, then by
    // the registering account id, so a record written before the profile resolved
    // is still tied to its institution.
    const loadHospitalProfiles = async (record) => {
      const byId = record.hospital_profile_id
        ? rows(await base44.asServiceRole.entities.HospitalProfile.filter({ id: record.hospital_profile_id }))
        : [];
      if (byId.length > 0) return byId;
      return record.hospital_user_id
        ? rows(await base44.asServiceRole.entities.HospitalProfile.filter({ user_id: record.hospital_user_id }))
        : [];
    };

    const deleteMatching = async (entityName, query) => {
      const found = rows(await base44.asServiceRole.entities[entityName].filter(query));
      for (const record of found) await base44.asServiceRole.entities[entityName].delete(record.id);
    };

    if (action === 'set_hospital_status') {
      const next = String(body.status || '');
      if (!['active', 'suspended'].includes(next)) {
        return Response.json({ error: 'Select active or inactive.' }, { status: 400 });
      }
      const profiles = await loadHospitalProfiles(auth);
      if (profiles.length === 0) {
        return Response.json({ error: 'No hospital account is linked to this registration yet.' }, { status: 404 });
      }
      const reason = String(body.reason || '').trim();
      for (const profile of profiles) {
        await base44.asServiceRole.entities.HospitalProfile.update(profile.id, { status: next });
      }
      const label = next === 'active' ? 'Hospital account set active' : 'Hospital account set inactive';
      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        audit: withAudit(
          auth,
          auditEntry({
            action: next === 'active' ? 'hospital_reactivated' : 'hospital_deactivated',
            actionLabel: label,
            actor,
            detail: reason || (next === 'active' ? 'Full hospital access restored' : 'Hospital access withdrawn'),
          })
        ),
      });
      return Response.json({
        authorization: { ...publicAuthorization(updated, { includeAdminOnly: true }), hospital_status: next },
      });
    }

    if (action === 'delete_hospital') {
      const confirmName = String(body.confirm_name || '').trim().toLowerCase();
      if (!confirmName || confirmName !== String(auth.hospital_name || '').trim().toLowerCase()) {
        return Response.json(
          { error: 'Type the hospital name exactly to confirm deleting this hospital.' },
          { status: 400 }
        );
      }
      const profiles = await loadHospitalProfiles(auth);
      for (const profile of profiles) {
        await deleteMatching('HospitalDoctor', { hospital_id: profile.id });
        await deleteMatching('HospitalReceptionist', { hospital_id: profile.id });
        await deleteMatching('HospitalMessagingStaff', { hospital_id: profile.id });
        await deleteMatching('RadiologyStaff', { hospital_id: profile.id });
        await base44.asServiceRole.entities.HospitalProfile.delete(profile.id);
      }
      // The registration record goes with the hospital, but the deletion itself is
      // kept in the administrative audit log so the institution's history is not lost.
      await base44.asServiceRole.entities.AccountAuditLog.create({
        user_id: auth.hospital_user_id || '',
        account_type: 'hospital',
        account_name: auth.hospital_name || '',
        email: auth.contact_email || '',
        action: 'account_deactivated',
        action_label: 'Hospital deleted by AMedix administration',
        detail: `Registration ${auth.request_reference || ''} and hospital account removed. Clinical records were preserved.`,
        actor_user_id: user.id,
        actor_name: actor.name,
        actor_role: 'admin',
        datetime: stamp(),
      }).catch(() => null);
      await base44.asServiceRole.entities.HospitalAuthorization.delete(auth.id);
      return Response.json({ deleted: true });
    }

    if (action === 'approve') {
      if (auth.status === 'approved') {
        return Response.json({ authorization: publicAuthorization(auth, { includeAdminOnly: true }) });
      }
      const note = String(body.note || '').trim();
      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        status: 'approved',
        decision_datetime: stamp(),
        reviewed_by_user_id: user.id,
        reviewed_by_name: actor.name,
        rejection_reason: '',
        admin_notes: note || auth.admin_notes || '',
        audit: withAudit(
          auth,
          auditEntry({ action: 'approved', actionLabel: 'Institution approved by AMedix administration', actor, detail: note })
        ),
      });
      await notifyHospital(base44, auth.contact_email, {
        subject: `AMedix registration approved — ${auth.hospital_name}`,
        body: `<p>Your institution <strong>${escapeHtml(auth.hospital_name)}</strong> has been approved by AMedix administration.</p>
          <p>A single-use authorization code will be issued to your registration, or has already been issued. Sign in to the hospital portal, enter the code in the activation field, and only then can you create your AMedix Hospital Code.</p>
          <p><strong>Reference:</strong> ${escapeHtml(auth.request_reference || '')}</p>`,
      });
      return Response.json({ authorization: publicAuthorization(updated, { includeAdminOnly: true }) });
    }

    if (action === 'reject') {
      const reason = String(body.reason || '').trim();
      if (reason.length < 5) {
        return Response.json({ error: 'A rejection reason is required.' }, { status: 400 });
      }
      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        status: 'rejected',
        decision_datetime: stamp(),
        reviewed_by_user_id: user.id,
        reviewed_by_name: actor.name,
        rejection_reason: reason,
        code_status: auth.code_status === 'used' ? auth.code_status : 'revoked',
        code_revoked_datetime: auth.code_status === 'used' ? auth.code_revoked_datetime || '' : stamp(),
        code_revoke_reason: auth.code_status === 'used' ? auth.code_revoke_reason || '' : 'Registration not approved',
        audit: withAudit(
          auth,
          auditEntry({ action: 'rejected', actionLabel: 'Registration not approved', actor, detail: reason })
        ),
      });
      await notifyHospital(base44, auth.contact_email, {
        subject: `AMedix registration decision — ${auth.hospital_name}`,
        body: `<p>Your registration for <strong>${escapeHtml(auth.hospital_name)}</strong> was not approved.</p>
          <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
          <p>Please contact AMedix administration if you believe this decision should be reviewed.</p>`,
      });
      return Response.json({ authorization: publicAuthorization(updated, { includeAdminOnly: true }) });
    }

    if (action === 'save_notes') {
      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        admin_notes: String(body.notes || '').trim(),
      });
      return Response.json({ authorization: publicAuthorization(updated, { includeAdminOnly: true }) });
    }

    if (action === 'issue_code' || action === 'regenerate_code') {
      if (auth.status !== 'approved') {
        return Response.json({ error: 'Approve the institution before issuing an authorization code.' }, { status: 409 });
      }
      if (isActivated(auth)) {
        return Response.json({ error: 'This hospital has already activated its authorization. A new code cannot be issued.' }, { status: 409 });
      }
      const days = Math.min(30, Math.max(1, Number(body.expiry_days) || DEFAULT_EXPIRY_DAYS));
      const plain = generateAuthorizationCode();
      const salt = randomSalt();
      const hash = await hashAuthorizationCode(plain, salt);
      const preview = maskCode(plain);
      const issuedAt = stamp();
      const expiry = new Date(Date.now() + days * 86400000).toISOString();
      const previousOutstanding = codeState(auth) === 'issued' || codeState(auth) === 'expired';

      const history = [
        ...(auth.code_history || []),
        ...(previousOutstanding
          ? [
              {
                action: 'revoked',
                preview: auth.authorization_code_preview || '',
                datetime: issuedAt,
                by_name: actor.name,
                note: 'Superseded by a newly issued code',
              },
            ]
          : []),
        {
          action: action === 'regenerate_code' ? 'regenerated' : 'issued',
          preview,
          expiry_datetime: expiry,
          datetime: issuedAt,
          by_name: actor.name,
          note: `Valid for ${days} day${days === 1 ? '' : 's'}, single use`,
        },
      ];

      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        authorization_code_hash: hash,
        authorization_code_salt: salt,
        authorization_code_preview: preview,
        code_status: 'issued',
        code_version: (auth.code_version || 0) + 1,
        code_issued_datetime: issuedAt,
        code_issued_by_name: actor.name,
        code_expiry_datetime: expiry,
        code_used_datetime: '',
        code_revoked_datetime: '',
        code_revoke_reason: '',
        failed_attempts: 0,
        locked_until: '',
        code_history: history,
        audit: withAudit(
          auth,
          auditEntry({
            action: action === 'regenerate_code' ? 'code_regenerated' : 'code_issued',
            actionLabel:
              action === 'regenerate_code'
                ? `Authorization code regenerated — ${preview}`
                : `Authorization code issued — ${preview}`,
            actor,
            detail: `Expires ${expiry}`,
          })
        ),
      });

      await notifyHospital(base44, auth.contact_email, {
        subject: `AMedix authorization code issued — ${auth.hospital_name}`,
        body: `<p>An authorization code has been issued for <strong>${escapeHtml(auth.hospital_name)}</strong> and is available in your approved registration dashboard.</p>
          <p>The code is single use and expires on ${escapeHtml(expiry)}. Enter it in the activation field to unlock your AMedix Hospital Code. For security it is never sent by email and is shown only once to the administrator who issued it.</p>`,
      });

      // The plain code is returned to the administrator exactly once and never stored.
      return Response.json({
        authorization: publicAuthorization(updated, { includeAdminOnly: true }),
        issued_code: plain,
        expiry_datetime: expiry,
      });
    }

    if (action === 'revoke_code') {
      const reason = String(body.reason || '').trim();
      if (reason.length < 3) {
        return Response.json({ error: 'A revocation reason is required.' }, { status: 400 });
      }
      if (auth.code_status === 'used') {
        return Response.json({ error: 'This code was already used to activate the hospital and cannot be revoked.' }, { status: 409 });
      }
      const revokedAt = stamp();
      const updated = await base44.asServiceRole.entities.HospitalAuthorization.update(auth.id, {
        code_status: 'revoked',
        code_revoked_datetime: revokedAt,
        code_revoke_reason: reason,
        code_history: [
          ...(auth.code_history || []),
          { action: 'revoked', preview: auth.authorization_code_preview || '', datetime: revokedAt, by_name: actor.name, note: reason },
        ],
        audit: withAudit(
          auth,
          auditEntry({
            action: 'code_revoked',
            actionLabel: `Authorization code revoked — ${auth.authorization_code_preview || ''}`,
            actor,
            detail: reason,
          })
        ),
      });
      await notifyHospital(base44, auth.contact_email, {
        subject: `AMedix authorization code withdrawn — ${auth.hospital_name}`,
        body: `<p>The authorization code issued to <strong>${escapeHtml(auth.hospital_name)}</strong> has been withdrawn.</p>
          <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
          <p>Please contact AMedix administration to have a new code issued.</p>`,
      });
      return Response.json({ authorization: publicAuthorization(updated, { includeAdminOnly: true }) });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}