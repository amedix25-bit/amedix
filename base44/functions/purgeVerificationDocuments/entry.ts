import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  hasRetainedDocument, purgeUpdate, RETENTION_POLICY,
} from '../../shared/documentRetention.ts';
// deployment smoke check

// AMedix Zero-Retention Document Verification Policy — cleanup sweep.
//
// Removes every trace of a submitted identity document from verification
// records created before the policy existed: the storage reference of the
// document (and of its original and back side), the document's name, type and
// size, every value read from the document, and every complete number.
//
// The decision itself is never touched: status, document category, the
// automated outcome, the verification timestamp, the audit trail attached to
// the record and the record id all stay exactly as they are, so existing
// verifications, registrations and accounts keep working.
//
// Nothing outside a verification record is scanned: patient medical records,
// clinical documents, prescriptions, laboratory and radiology reports and
// every other operational healthcare record are left untouched.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const datetime = new Date().toISOString();
    let cursor = null;
    let scanned = 0;
    let scrubbed = 0;

    for (let page = 0; page < 200; page += 1) {
      const result = await base44.asServiceRole.entities.IdentityVerification.list({
        sort: '-created_date',
        limit: 100,
        ...(cursor ? { cursor } : {}),
      });
      const items = result?.items || [];
      if (items.length === 0) break;

      const retained = items.filter(hasRetainedDocument);
      if (retained.length > 0) {
        await base44.asServiceRole.entities.IdentityVerification.bulkUpdate(
          retained.map((record) => ({ id: record.id, ...purgeUpdate(record, datetime) }))
        );
        scrubbed += retained.length;
      }
      scanned += items.length;
      if (!result?.has_more) break;
      cursor = result.next_cursor;
    }

    return Response.json({
      retention_policy: RETENTION_POLICY,
      scanned,
      scrubbed,
      completed_datetime: datetime,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}