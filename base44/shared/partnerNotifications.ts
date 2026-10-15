// Partner notifications through the existing AMedix notification system.
// Pharmacies receive PharmacyNotification records (shown by the pharmacy
// notification bell) and laboratories receive LabNotification records (shown
// by the laboratory notifications bar). Every notification is created with the
// service role (only the backend may create a partner notification), is
// scoped to the partner organization, and carries a dedupe key so repeated
// lifecycle scans or admin actions never duplicate a notice.
//
// Payment notices are only ever TRUE confirmations: a pending payment is
// announced as awaiting verification, never as paid.

export async function notifyPartner(svc, partnerType, partner, { title, message, dedupeKey = '' }) {
  try {
    if (!partner || !partner.partner_id || !partner.partner_user_id) return null;
    const entity = partnerType === 'laboratory' ? svc.entities.LabNotification : svc.entities.PharmacyNotification;
    if (dedupeKey) {
      const existing = await entity.filter({ dedupe_key: dedupeKey }, { limit: 1 });
      if ((existing.items || existing).length > 0) return null;
    }
    const base = {
      type: 'other',
      title: String(title || '').slice(0, 120),
      message: String(message || '').slice(0, 500),
      is_read: false,
      dedupe_key: dedupeKey || '',
    };
    if (partnerType === 'laboratory') {
      return await entity.create({ ...base, laboratory_id: partner.partner_id, lab_user_id: partner.partner_user_id });
    }
    return await entity.create({ ...base, pharmacy_id: partner.partner_id, pharmacy_user_id: partner.partner_user_id });
  } catch (err) {
    console.error('notifyPartner failed:', err && err.message);
    return null;
  }
}