import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Pharmacy administrator settings. Only configuration fields may be changed —
// transaction records, dispensing history and clinical records are never
// touched. Every change to an important setting is appended to the pharmacy's
// settings history (field, previous value, new value, who, when) and recorded
// in the clinical audit log.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }, { limit: 1 });
    const pharmacy = (profiles.items || profiles)[0];
    if (!pharmacy) return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (String(body?.action || 'update') !== 'update') {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }
    const EDITABLE_TEXT = ['address', 'phone', 'whatsapp_number', 'email', 'operating_hours', 'receipt_note'];
    const VALID_METHODS = ['cash', 'card', 'bank_transfer', 'insurance', 'mobile_wallet', 'other'];
    const now = new Date().toISOString();
    const byName = user.full_name || 'Administrator';
    const updates = {};
    const history = [...(pharmacy.settings_history || [])];

    for (const field of EDITABLE_TEXT) {
      if (body?.[field] === undefined) continue;
      const value = String(body[field]).trim();
      if (value === (pharmacy[field] || '')) continue;
      history.push({ field, old_value: pharmacy[field] || '', new_value: value, by_name: byName, datetime: now });
      updates[field] = value;
    }
    if (body?.payment_methods !== undefined) {
      const methods = Array.isArray(body.payment_methods)
        ? body.payment_methods.filter((m) => VALID_METHODS.includes(m))
        : [];
      const old = pharmacy.payment_methods || [];
      if (JSON.stringify(methods) !== JSON.stringify(old)) {
        history.push({ field: 'payment_methods', old_value: old.join(', '), new_value: methods.join(', '), by_name: byName, datetime: now });
        updates.payment_methods = methods;
      }
    }
    if (body?.low_stock_threshold !== undefined) {
      const threshold = Number(body.low_stock_threshold);
      if (Number.isFinite(threshold) && threshold >= 0 && threshold !== (pharmacy.low_stock_threshold ?? 10)) {
        history.push({
          field: 'low_stock_threshold',
          old_value: String(pharmacy.low_stock_threshold ?? 10),
          new_value: String(threshold),
          by_name: byName,
          datetime: now,
        });
        updates.low_stock_threshold = threshold;
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ profile: pharmacy, unchanged: true });
    }
    updates.settings_history = history;
    await base44.asServiceRole.entities.PharmacyProfile.update(pharmacy.id, updates);
    await logClinicalAudit(base44.asServiceRole, {
      actor_user_id: user.id,
      actor_name: byName,
      actor_role: 'pharmacy',
      action: 'pharmacy_settings_changed',
      action_label: `Updated pharmacy settings: ${Object.keys(updates).filter((k) => k !== 'settings_history').join(', ')}`,
    });
    return Response.json({ profile: { ...pharmacy, ...updates } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}