import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { todayStr } from "../../shared/pharmacyPrescription.ts";

// Daily inventory safety scan — invoked by the "Pharmacy Expiry Alerts"
// workflow; an administrator can also run it on demand.
// For every pharmacy inventory batch:
//   - EXPIRED stock is auto-quarantined (blocked from dispensing) and the
//     pharmacy is alerted once.
//   - Batches expiring within 90 days are flagged and the pharmacy is alerted
//     once (deduplicated via expiry_alerted_datetime).
//   - safety_status is kept current so the portal shows expiry warnings.
// Every alert is a PharmacyNotification (type expiry_alert, target inventory).
// Runs without user auth (scheduled invocation); manual runs require admin.
const TZ = 'Africa/Tripoli';
const EXPIRING_HORIZON_DAYS = 90;

function horizonStr(days) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}

function medLabel(item) {
  return `${item.medication_name}${item.strength ? ` ${item.strength}` : ''}${item.batch_number ? ` (batch ${item.batch_number})` : ''}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = todayStr();
    const horizon = horizonStr(EXPIRING_HORIZON_DAYS);

    // Paginate through all inventory batches.
    let items = [];
    let cursor = undefined;
    for (;;) {
      const page = await base44.asServiceRole.entities.PharmacyInventory.filter(
        {}, cursor ? { limit: 500, cursor } : { limit: 500 }
      );
      items = items.concat(page.items || []);
      if (!page.has_more || !page.next_cursor) break;
      cursor = page.next_cursor;
    }

    let quarantined = 0;
    let flaggedExpiring = 0;
    let notified = 0;

    for (const item of items) {
      const expiry = item.expiry_date || '';
      const isExpired = expiry && expiry < today;
      const isExpiring = expiry && expiry >= today && expiry <= horizon;

      if (isExpired) {
        const newlyQuarantined = !item.is_quarantined;
        const update = { safety_status: 'expired' };
        if (newlyQuarantined) {
          update.is_quarantined = true;
          update.quarantine_reason = 'expired';
          update.quarantined_datetime = new Date().toISOString();
          update.quarantine_action = 'pending_disposal';
        }
        await base44.asServiceRole.entities.PharmacyInventory.update(item.id, update);
        if (newlyQuarantined) {
          quarantined++;
          await base44.asServiceRole.entities.PharmacyNotification.create({
            pharmacy_id: item.pharmacy_id,
            pharmacy_user_id: item.pharmacy_user_id,
            type: 'expiry_alert',
            title: 'Expired Stock Quarantined',
            message: `${medLabel(item)} expired on ${expiry} and was automatically quarantined. It is blocked from dispensing — dispose of it under Inventory.`,
            target: 'inventory',
            is_read: false,
          });
          notified++;
        }
      } else if (isExpiring) {
        if (item.safety_status !== 'expiring' || !item.expiry_alerted_datetime) {
          await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
            safety_status: 'expiring',
            expiry_alerted_datetime: new Date().toISOString(),
          });
          flaggedExpiring++;
          await base44.asServiceRole.entities.PharmacyNotification.create({
            pharmacy_id: item.pharmacy_id,
            pharmacy_user_id: item.pharmacy_user_id,
            type: 'expiry_alert',
            title: 'Stock Expiring Soon',
            message: `${medLabel(item)} expires on ${expiry} — within ${EXPIRING_HORIZON_DAYS} days. Plan to use it first or arrange replacement.`,
            target: 'inventory',
            is_read: false,
          });
          notified++;
        }
      } else if (item.safety_status && item.safety_status !== 'ok') {
        await base44.asServiceRole.entities.PharmacyInventory.update(item.id, { safety_status: 'ok' });
      }
    }

    return Response.json({ scanned: items.length, quarantined, flaggedExpiring, notified, date: today });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}