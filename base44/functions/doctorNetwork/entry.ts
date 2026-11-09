import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  buildEligibilityIndex,
  evaluateMessagingActor,
  evaluateAccount,
  eligibilityDenial,
} from '../../shared/verifiedAccounts.ts';

// AMedix doctor network — the nationwide directory every doctor working in the
// Doctor Portal appears in, regardless of hospital or verification stage. It is
// a directory of PROFESSIONAL contacts only: adding a colleague never grants
// access to that colleague's patients, records, notes or hospital information.
//
// Listing shows every active doctor. Being LISTED is not the same as being
// cleared for messaging: colleague requests and messaging still require the
// doctor to pass full verification, enforced server-side here and in the
// messaging API. Suspended, deactivated and quarantined test accounts are never
// listed.
// Predictive directory search: as soon as the doctor types two letters, every
// word of the name, specialty or hospital is matched by PREFIX, so "niza"
// finds NIZAR FATHI AGILA and "med" finds Internal Medicine. The full-text
// substring check stays as a fallback so any part of a word also matches.
function matchesSearch(haystack: string, query: string) {
  const text = String(haystack || "").toLowerCase();
  const words = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const tokens = String(query || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => words.some((w) => w.startsWith(token)) || text.includes(token));
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const doctorRows = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
    const doctor = (Array.isArray(doctorRows) ? doctorRows : doctorRows.items || [])[0];
    if (!doctor) return Response.json({ error: 'Doctor access required.' }, { status: 403 });

    const evaluation = await evaluateMessagingActor(base44, {
      role: 'doctor',
      userId: user.id,
      displayName: doctor.full_name,
      doctorId: doctor.id,
      doctor,
    });
    if (!evaluation.eligible) return Response.json(eligibilityDenial(evaluation), { status: 403 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || 'list');

    const connections = await (async () => {
      const [sent, received] = await Promise.all([
        base44.asServiceRole.entities.DoctorConnection.filter({ requester_doctor_id: doctor.id }, { limit: 500 }),
        base44.asServiceRole.entities.DoctorConnection.filter({ recipient_doctor_id: doctor.id }, { limit: 500 }),
      ]);
      return [...(Array.isArray(sent) ? sent : sent.items || []), ...(Array.isArray(received) ? received : received.items || [])];
    })();

    const colleagueIds = new Set(
      connections
        .filter((c) => c.status === 'accepted')
        .map((c) => (c.requester_doctor_id === doctor.id ? c.recipient_doctor_id : c.requester_doctor_id))
    );

    if (action === 'list') {
      const index = await buildEligibilityIndex(base44);
      const search = String(body.search || '').trim().toLowerCase();
      // Every active doctor account that holds a doctor profile is listed, so a
      // doctor who has entered the portal is immediately findable by colleagues.
      const doctors = [...index.evaluations.values()]
        .filter((e) => e.account_type === 'doctor' && e.doctor)
        .filter((e) => e.user_id && e.user_id !== user.id)
        .filter((e) => e.user_exists !== false)
        .filter((e) => !['test_account', 'suspected_test', 'duplicate'].includes(e.classification))
        .filter((e) => !e.status || e.status === 'active')
        .filter((e) => {
          if (!search) return true;
          const d = e.doctor || {};
          const specialties = Array.isArray(d.specialties) ? d.specialties.join(' ') : '';
          return matchesSearch([d.full_name, d.specialization, specialties, d.hospital].join(' '), search);
        })
        .sort((a, b) => String(a.display_name || '').localeCompare(String(b.display_name || '')))
        .map((e) => ({
          doctor_id: e.profiles.doctor_id,
          doctor_user_id: e.user_id,
          full_name: e.doctor.full_name,
          specialization: e.doctor.specialization || '',
          specialties: e.doctor.specialties || [],
          hospital: e.doctor.hospital || '',
          photo_url: e.doctor.photo_url || '',
          license_number: e.doctor.is_verified ? e.doctor.license_number || '' : '',
          verified: e.eligible === true,
          pending_reason: e.eligible ? '' : e.reason || '',
          is_colleague: colleagueIds.has(e.profiles.doctor_id),
        }));
      return Response.json({
        doctors,
        colleagues: doctors.filter((d) => d.is_colleague),
        total_doctors: doctors.length,
        total_verified_doctors: doctors.filter((d) => d.verified).length,
      });
    }

    if (action === 'addColleague' || action === 'removeColleague') {
      const doctorId = String(body.doctor_id || '');
      if (!doctorId) return Response.json({ error: 'Select a doctor.' }, { status: 400 });

      const targetRows = await base44.asServiceRole.entities.DoctorProfile.filter({ id: doctorId }, { limit: 1 });
      const target = (Array.isArray(targetRows) ? targetRows : targetRows.items || [])[0];
      if (!target || target.id === doctor.id) {
        return Response.json({ error: 'That doctor is not available.' }, { status: 400 });
      }

      // The colleague must be a verified, active doctor right now.
      const targetEvaluation = await evaluateAccount(base44, target.user_id);
      if (!targetEvaluation.eligible) {
        return Response.json(
          { error: `That doctor is not available in the verified network: ${targetEvaluation.reason}` },
          { status: 403 }
        );
      }

      const between = connections.filter(
        (c) =>
          (c.requester_doctor_id === doctor.id && c.recipient_doctor_id === doctorId) ||
          (c.recipient_doctor_id === doctor.id && c.requester_doctor_id === doctorId)
      );

      if (action === 'removeColleague') {
        for (const c of between) {
          await base44.asServiceRole.entities.DoctorConnection.delete(c.id);
        }
        return Response.json({ ok: true, is_colleague: false });
      }

      const accepted = between.find((c) => c.status === 'accepted');
      if (accepted) return Response.json({ ok: true, is_colleague: true });

      const pending = between[0];
      if (pending) {
        await base44.asServiceRole.entities.DoctorConnection.update(pending.id, {
          status: 'accepted',
          date_responded: new Date().toISOString().slice(0, 10),
        });
        return Response.json({ ok: true, is_colleague: true });
      }

      await base44.asServiceRole.entities.DoctorConnection.create({
        requester_doctor_id: doctor.id,
        requester_user_id: user.id,
        requester_name: doctor.full_name,
        recipient_doctor_id: target.id,
        recipient_user_id: target.user_id,
        recipient_name: target.full_name,
        status: 'accepted',
        date_requested: new Date().toISOString().slice(0, 10),
        date_responded: new Date().toISOString().slice(0, 10),
        datetime: new Date().toISOString(),
      });
      return Response.json({ ok: true, is_colleague: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}