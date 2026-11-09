import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildEligibilityIndex, evaluateAccount, logAccountAudit } from '../../shared/verifiedAccounts.ts';

// AMedix account governance — the administrator-only view of who may use the
// verified communication network, and the controls that change it.
//
// Reads: verified hospitals, verified doctors, verified patients, pending
// accounts, suspended accounts, flagged accounts and identified test accounts,
// plus the immutable audit trail. Writes: approve or reject verification,
// suspend / reactivate an account, classify and flag an account, and remove a
// confirmed test account from every messaging surface.
//
// Nothing here deletes clinical records or audit history: removing a test
// account withdraws it from directories and messaging and records exactly what
// was preserved.

function pageItems(result: any) {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

const STATUS_ACTIONS = {
  active: { action: 'account_reactivated', label: 'reactivated the account' },
  suspended: { action: 'account_suspended', label: 'suspended the account' },
  deactivated: { action: 'account_deactivated', label: 'deactivated the account' },
  blocked: { action: 'account_blocked', label: 'blocked the account' },
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'AMedix administrator access required.' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'overview');

    if (action === 'overview') {
      const index = await buildEligibilityIndex(base44);
      const evaluations = [...index.evaluations.values()].map((e) => ({
        user_id: e.user_id,
        account_type: e.account_type,
        display_name: e.display_name,
        email: e.email,
        status: e.status,
        verification_status: e.verification_status,
        classification: e.classification,
        review_state: e.review_state,
        review_note: e.review_note,
        eligible: e.eligible,
        verified: e.verified,
        reason: e.reason,
        blockers: e.blockers,
        test_evidence: e.test_evidence,
        profiles: e.profiles,
        specialty: (e.doctor && e.doctor.specialization) || '',
        hospital: (e.hospital && e.hospital.hospital_name) || (e.doctor && e.doctor.hospital) || '',
        cin: (e.patient && e.patient.cin) || '',
      }));

      const verified_hospitals = evaluations.filter((e) => e.account_type === 'hospital' && e.eligible);
      const verified_doctors = evaluations.filter((e) => e.account_type === 'doctor' && e.eligible);
      const verified_patients = evaluations.filter((e) => e.account_type === 'patient' && e.eligible);
      const pending_accounts = evaluations.filter(
        (e) => e.status === 'active' && !e.verified && e.classification === 'legitimate' && e.account_type !== 'none'
      );
      const suspended_accounts = evaluations.filter((e) => e.status !== 'active');
      const test_accounts = evaluations.filter((e) => e.classification === 'test_account' || e.classification === 'suspected_test');
      const flagged_accounts = evaluations.filter((e) => e.review_state === 'flagged' && !test_accounts.includes(e));

      let audit: any[] = [];
      try {
        audit = pageItems(
          await base44.asServiceRole.entities.AccountAuditLog.filter({}, { sort: '-datetime', limit: 120 })
        );
      } catch (err) {
        audit = [];
      }

      return Response.json({
        counts: {
          verified_hospitals: verified_hospitals.length,
          verified_doctors: verified_doctors.length,
          verified_patients: verified_patients.length,
          pending_accounts: pending_accounts.length,
          suspended_accounts: suspended_accounts.length,
          test_accounts: test_accounts.length,
          flagged_accounts: flagged_accounts.length,
        },
        groups: {
          verified_hospitals,
          verified_doctors,
          verified_patients,
          pending_accounts,
          suspended_accounts,
          test_accounts,
          flagged_accounts,
        },
        audit,
      });
    }

    const userId = String(body.user_id || '');
    if (!userId) return Response.json({ error: 'An account is required.' }, { status: 400 });
    if (userId === user.id && action !== 'classify') {
      return Response.json({ error: 'You cannot change the status of your own administrator account.' }, { status: 403 });
    }

    const evaluation = await evaluateAccount(base44, userId);
    const note = String(body.note || '').trim().slice(0, 500);
    const now = new Date().toISOString();
    const patch: any = {};
    let auditEntry: any = null;

    if (action === 'setStatus') {
      const status = String(body.status || '');
      if (!STATUS_ACTIONS[status]) return Response.json({ error: 'Invalid account status.' }, { status: 400 });
      patch.status = status;
      auditEntry = {
        action: STATUS_ACTIONS[status].action,
        action_label: `Administrator ${STATUS_ACTIONS[status].label}`,
        previous_value: evaluation.status,
        new_value: status,
        detail: note || `Account status set to ${status}.`,
      };
      // Suspending a doctor immediately withdraws their verification eligibility.
      if (status === 'suspended' && evaluation.account_type === 'doctor' && evaluation.profiles.doctor_id) {
        await base44.asServiceRole.entities.DoctorProfile.update(evaluation.profiles.doctor_id, { is_verified: false });
      }
    } else if (action === 'setVerification') {
      const decision = String(body.verification_status || '');
      if (!['verified', 'pending', 'rejected'].includes(decision)) {
        return Response.json({ error: 'Invalid verification decision.' }, { status: 400 });
      }
      if (evaluation.account_type === 'hospital' && decision === 'verified') {
        return Response.json(
          { error: 'Institutional verification is approved in Hospital Approvals, where the licence and authorization are recorded.' },
          { status: 400 }
        );
      }
      patch.verification_status = decision;
      if (evaluation.account_type === 'doctor' && evaluation.profiles.doctor_id) {
        await base44.asServiceRole.entities.DoctorProfile.update(evaluation.profiles.doctor_id, {
          is_verified: decision === 'verified',
        });
      }
      auditEntry = {
        action: decision === 'verified' ? 'verification_approved' : 'verification_rejected',
        action_label:
          decision === 'verified'
            ? 'Approved the account verification'
            : decision === 'rejected'
              ? 'Rejected the account verification'
              : 'Returned the account verification to pending',
        previous_value: evaluation.verification_status,
        new_value: decision,
        detail: note || '',
      };
    } else if (action === 'classify') {
      const classification = String(body.classification || '');
      if (!['legitimate', 'test_account', 'suspected_test', 'duplicate', 'under_review'].includes(classification)) {
        return Response.json({ error: 'Invalid classification.' }, { status: 400 });
      }
      patch.classification = classification;
      patch.review_state = ['test_account', 'suspected_test', 'duplicate', 'under_review'].includes(classification) ? 'flagged' : 'cleared';
      patch.review_note = note || evaluation.review_note || '';
      auditEntry = {
        action: classification === 'legitimate' ? 'account_cleared' : 'account_flagged',
        action_label:
          classification === 'legitimate'
            ? 'Cleared the account after review'
            : `Flagged the account as ${classification.replace('_', ' ')}`,
        previous_value: evaluation.classification,
        new_value: classification,
        detail: note || '',
      };
    } else if (action === 'removeTestAccount') {
      if (!['test_account', 'suspected_test'].includes(evaluation.classification)) {
        return Response.json(
          { error: 'The account must first be classified as a confirmed test account before it is removed.' },
          { status: 400 }
        );
      }
      patch.classification = 'test_account';
      patch.review_state = 'cleared';
      patch.status = 'blocked';
      patch.removal_requested = true;
      patch.removal_datetime = now;
      patch.removal_note =
        note ||
        'Removed from every AMedix messaging directory, contact list, search result and conversation creation option. Clinical records and audit history were preserved.';
      auditEntry = {
        action: 'test_account_removed',
        action_label: 'Removed the confirmed test account from the verified network',
        previous_value: evaluation.classification,
        new_value: 'test_account (removed)',
        detail: patch.removal_note,
      };
    } else {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    const existing = pageItems(
      await base44.asServiceRole.entities.AccountControl.filter({ user_id: userId }, { limit: 1 })
    )[0];

    const controlAudit = [
      ...((existing && existing.audit) || []),
      {
        datetime: now,
        action: auditEntry.action,
        action_label: auditEntry.action_label,
        actor_name: user.full_name || user.email,
        note: auditEntry.detail || '',
      },
    ].slice(-200);

    const row = {
      user_id: userId,
      account_type: evaluation.account_type,
      display_name: evaluation.display_name,
      email: evaluation.email,
      profiles: evaluation.profiles,
      test_evidence: evaluation.test_evidence,
      last_reviewed_by_name: user.full_name || user.email,
      last_reviewed_datetime: now,
      audit: controlAudit,
      ...patch,
    };

    const saved = existing
      ? await base44.asServiceRole.entities.AccountControl.update(existing.id, row)
      : await base44.asServiceRole.entities.AccountControl.create(row);

    // Re-evaluate so the stored state reflects exactly what the server enforces.
    const after = await evaluateAccount(base44, userId);
    await base44.asServiceRole.entities.AccountControl.update(saved.id, {
      messaging_eligible: after.eligible,
      blockers: after.blockers,
    });

    await logAccountAudit(base44, {
      userId,
      accountType: after.account_type,
      accountName: after.display_name,
      email: after.email,
      action: auditEntry.action,
      actionLabel: auditEntry.action_label,
      detail: auditEntry.detail,
      previousValue: auditEntry.previous_value,
      newValue: auditEntry.new_value,
      actorUserId: user.id,
      actorName: user.full_name || user.email,
      actorRole: 'admin',
    });

    return Response.json({ ok: true, account: { ...after, blockers: after.blockers } });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}