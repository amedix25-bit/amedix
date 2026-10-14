import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { escapeRegex, todayStr } from "../../shared/pharmacyPrescription.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { recordStockMovement } from "../../shared/inventoryMovements.ts";

// Medication recall management. A recall is recorded by an administrator
// (affects matching stock across ALL affiliated pharmacies) or by a pharmacy
// (affects its own stock, e.g. a supplier notice). Recording a recall:
//   1. Quarantines every matching inventory batch (expired/recalled stock is
//      blocked from dispensing) and marks it pending disposal.
//   2. Notifies each affected pharmacy.
//   3. Identifies dispensing transactions that may have used the recalled
//      batch and notifies the affected patients and their prescribers, with
//      urgency-appropriate guidance.
// Every action — creation, quarantine, notifications, disposal, resolution —
// is recorded in the recall's auditable action history.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

function matchesScope(item, recall) {
  if (recall.strength && item.strength && String(item.strength).toLowerCase() !== String(recall.strength).toLowerCase()) return false;
  if (recall.batch_number && String(item.batch_number || '').toLowerCase() !== String(recall.batch_number).toLowerCase()) return false;
  return true;
}

// Loads prescriptions the recall may have reached: dispensed at an affected
// pharmacy, of the recalled medication (by name or active ingredient), and —
// when the recall names a batch — traced through the recorded batch numbers.
async function affectedPrescriptions(base44, recall, pharmacyIds) {
  const out = new Map();
  const medRegex = { $regex: `^${escapeRegex(recall.medication_name)}$`, $options: 'i' };
  const ingredientRegex = recall.active_ingredient
    ? { $regex: `^${escapeRegex(recall.active_ingredient)}$`, $options: 'i' }
    : null;
  for (const pharmacyId of pharmacyIds) {
    const queries = [{ medication_name: medRegex }];
    if (ingredientRegex) queries.push({ active_ingredient: ingredientRegex });
    for (const q of queries) {
      try {
        const page = await base44.asServiceRole.entities.Prescription.filter(
          { ...q, authorized_pharmacy_id: pharmacyId, status: 'dispensed' },
          { limit: 200 }
        );
        for (const p of page.items || []) {
          if (recall.batch_number) {
            const events = p.dispensing_events || [];
            const batchUsed = String(p.dispensed_batch_number || '') === recall.batch_number ||
              events.some((ev) => String(ev.batch_number || '') === recall.batch_number);
            if (!batchUsed) continue;
          }
          out.set(p.id, p);
        }
      } catch (e) { console.log('RECALL-PRESCRIPTIONS-ERROR:', e && e.message); }
    }
  }
  return [...out.values()];
}

function patientMessage(recall, prescription) {
  const med = `${prescription.medication_name}${prescription.strength ? ` ${prescription.strength}` : ''}`;
  const batch = recall.batch_number ? ` (batch ${recall.batch_number})` : '';
  if (recall.urgency === 'immediate') {
    return `URGENT RECALL: ${med}${batch} dispensed from ${prescription.dispensed_pharmacy_name || 'your pharmacy'} on ${prescription.dispensed_datetime ? prescription.dispensed_datetime.slice(0, 10) : 'a previous visit'} has been recalled (${recall.reason}). Stop taking the medication and contact your pharmacy or doctor immediately.`;
  }
  if (recall.urgency === 'urgent') {
    return `RECALL: ${med}${batch} dispensed from ${prescription.dispensed_pharmacy_name || 'your pharmacy'} has been recalled (${recall.reason}). Contact your pharmacy or doctor as soon as possible for guidance before your next dose.`;
  }
  return `RECALL: ${med}${batch} dispensed from ${prescription.dispensed_pharmacy_name || 'your pharmacy'} has been recalled (${recall.reason}). This is not an emergency — contact your pharmacy to exchange the medication and follow your doctor's guidance.`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'create');

    // ---- Create a recall -------------------------------------------------
    if (action === 'create') {
      const medicationName = String(body?.medication_name || '').trim();
      const urgency = String(body?.urgency || '');
      const reason = String(body?.reason || '').trim();
      if (!medicationName || !urgency || !reason) {
        return Response.json({ error: 'Medication name, urgency and reason are required.' }, { status: 400 });
      }
      if (!['immediate', 'urgent', 'routine'].includes(urgency)) {
        return Response.json({ error: 'Urgency must be immediate, urgent or routine.' }, { status: 400 });
      }

      const isAdmin = user.role === 'admin';
      let pharmacy = null;
      if (!isAdmin) {
        const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }, { limit: 1 });
        pharmacy = (profiles.items || profiles)[0] || null;
        if (!pharmacy) return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });
      }

      const recall = {
        recall_id: `REC-${todayStr().replace(/-/g, '')}-${randomSuffix(4)}`,
        medication_name: medicationName,
        active_ingredient: String(body?.active_ingredient || '').trim(),
        strength: String(body?.strength || '').trim(),
        batch_number: String(body?.batch_number || '').trim(),
        urgency,
        reason,
        source: String(body?.source || '').trim(),
        status: 'active',
        issued_by_user_id: user.id,
        issued_by_name: user.full_name || 'AMedix',
        issued_by_role: isAdmin ? 'admin' : 'pharmacy',
        pharmacy_ids: [],
        affected_prescription_ids: [],
        actions: [],
        created_datetime: new Date().toISOString(),
      };

      // 1. Quarantine matching stock.
      const nameRegex = { $regex: `^${escapeRegex(medicationName)}$`, $options: 'i' };
      const ingredientRegex = recall.active_ingredient
        ? { $regex: `^${escapeRegex(recall.active_ingredient)}$`, $options: 'i' }
        : null;
      let matched = new Map();
      for (const q of ingredientRegex ? [{ medication_name: nameRegex }, { active_ingredient: ingredientRegex }] : [{ medication_name: nameRegex }]) {
        const page = await base44.asServiceRole.entities.PharmacyInventory.filter(q, { limit: 500 });
        for (const item of page.items || []) {
          if (!isAdmin && item.pharmacy_id !== pharmacy.id) continue;
          if (!matchesScope(item, recall)) continue;
          matched.set(item.id, item);
        }
      }

      const pharmacyIds = new Set();
      const quarantineActions = [];
      for (const item of matched.values()) {
        if (!item.is_quarantined) {
          await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
            is_quarantined: true,
            quarantine_reason: `recalled (${recall.recall_id})`,
            quarantined_datetime: new Date().toISOString(),
            quarantine_action: 'pending_disposal',
            recall_id: recall.recall_id,
            recall_urgency: urgency,
            safety_status: 'ok',
          });
          await recordStockMovement(base44.asServiceRole, {
            pharmacy_id: item.pharmacy_id,
            pharmacy_user_id: item.pharmacy_user_id,
            inventory_id: item.id,
            medication_name: item.medication_name,
            strength: item.strength || '',
            batch_number: item.batch_number || '',
            expiry_date: item.expiry_date || '',
            movement_type: 'quarantine',
            quantity_before: item.quantity_in_stock ?? null,
            quantity_change: 0,
            quantity_after: item.quantity_in_stock ?? null,
            reason: `Recalled (${recall.recall_id}): ${recall.reason}`,
            reference: recall.recall_id,
            performed_by_user_id: recall.issued_by_user_id,
            performed_by_name: recall.issued_by_name,
            performed_by_role: recall.issued_by_role,
          });
          await logClinicalAudit(base44.asServiceRole, {
            actor_user_id: recall.issued_by_user_id,
            actor_name: recall.issued_by_name,
            actor_role: recall.issued_by_role === 'admin' ? 'admin' : 'pharmacy',
            action: 'recall_quarantine',
            action_label: `Quarantined ${item.medication_name}${item.strength ? ` ${item.strength}` : ''}${item.batch_number ? ` (batch ${item.batch_number})` : ''} under recall ${recall.recall_id}`,
          });
          quarantineActions.push(item);
        } else if (item.recall_id === recall.recall_id) {
          quarantineActions.push(item);
        }
        pharmacyIds.add(item.pharmacy_id);
      }
      recall.pharmacy_ids = [...pharmacyIds];

      // 2. Notify each affected pharmacy.
      for (const pharmacyId of pharmacyIds) {
        try {
          const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ id: pharmacyId }, { limit: 1 });
          const p = (profiles.items || profiles)[0];
          if (p) {
            await base44.asServiceRole.entities.PharmacyNotification.create({
              pharmacy_id: p.id,
              pharmacy_user_id: p.user_id,
              type: 'recall',
              recall_id: recall.recall_id,
              title: urgency === 'immediate' ? 'URGENT — Medication Recall (Stop Dispensing)' : `Medication Recall (${urgency})`,
              message: `${medicationName}${recall.strength ? ` ${recall.strength}` : ''}${recall.batch_number ? ` batch ${recall.batch_number}` : ''} recalled: ${reason}. ${quarantineActions.filter((i) => i.pharmacy_id === p.id).length} batch(es) quarantined in your inventory — quarantine and dispose under Inventory.`,
              target: 'inventory',
              is_read: false,
            });
          }
        } catch (e) { console.log('RECALL-NOTIFY-ERROR:', e && e.message); }
      }

      // 3. Identify and notify affected dispensing transactions.
      const affected = await affectedPrescriptions(base44, recall, recall.pharmacy_ids);
      recall.affected_prescription_ids = affected.map((p) => p.id);
      for (const p of affected) {
        try {
          await createPatientNotification(base44.asServiceRole, {
            patient_id: p.patient_id,
            type: 'recall',
            title: urgency === 'immediate' ? 'URGENT — Medication Recall' : 'Medication Recall Notice',
            message: patientMessage(recall, p),
            target: 'prescriptions',
            related_id: p.id,
          });
        } catch (e) { console.log('RECALL-PATIENT-NOTIFY-ERROR:', e && e.message); }
        if (p.doctor_user_id) {
          try {
            await base44.asServiceRole.entities.DoctorNotification.create({
              doctor_user_id: p.doctor_user_id,
              doctor_id: p.doctor_id || '',
              type: 'recall',
              title: `Medication Recall (${urgency})`,
              message: `${recall.medication_name}${recall.strength ? ` ${recall.strength}` : ''} was recalled (${recall.reason}). Your prescription for ${p.patient_name} (Ref ${p.prescription_id || p.id}) was dispensed from the affected stock — review the patient's treatment and contact them as needed.`,
              patient_id: p.patient_id,
              patient_name: p.patient_name,
              patient_cin: p.patient_cin,
              related_id: p.id,
              target: 'find_patient',
              datetime: new Date().toISOString(),
              is_read: false,
            });
          } catch (e) { console.log('RECALL-DOCTOR-NOTIFY-ERROR:', e && e.message); }
        }
      }

      recall.actions = [
        { action: 'created', by_name: recall.issued_by_name, datetime: recall.created_datetime, details: `Urgency ${urgency}. Source: ${recall.source || 'not specified'}.` },
        { action: 'quarantined', by_name: recall.issued_by_name, datetime: new Date().toISOString(), details: `${quarantineActions.length} batch(es) across ${pharmacyIds.size} pharmacy(ies) quarantined and blocked from dispensing.` },
        { action: 'patients_notified', by_name: recall.issued_by_name, datetime: new Date().toISOString(), details: `${affected.length} dispensed prescription(s) traced — patients and prescribers notified.` },
      ];

      const created = await base44.asServiceRole.entities.MedicationRecall.create(recall);

      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: user.id,
        actor_name: recall.issued_by_name,
        actor_role: isAdmin ? 'admin' : 'pharmacy',
        action: 'recorded_medication_recall',
        action_label: `recorded a ${urgency} recall of ${medicationName}${recall.batch_number ? ` (batch ${recall.batch_number})` : ''}`,
        patient_id: '',
        patient_cin: '',
        patient_name: '',
        document_id: recall.recall_id,
      });

      return Response.json({
        recall: created,
        quarantined_items: quarantineActions.length,
        affected_prescriptions: affected.length,
      });
    }

    // ---- Dispose quarantined stock ---------------------------------------
    if (action === 'dispose') {
      const inventoryId = String(body?.inventory_id || '');
      if (!inventoryId) return Response.json({ error: 'Missing inventory item.' }, { status: 400 });
      const item = await base44.asServiceRole.entities.PharmacyInventory.get(inventoryId);
      if (!item) return Response.json({ error: 'Inventory item not found.' }, { status: 404 });
      const isAdmin = user.role === 'admin';
      if (!isAdmin && item.pharmacy_user_id !== user.id) {
        return Response.json({ error: 'This stock does not belong to your pharmacy.' }, { status: 403 });
      }
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: 0,
        quarantine_action: 'disposed',
        updated_datetime: new Date().toISOString(),
      });
      await recordStockMovement(base44.asServiceRole, {
        pharmacy_id: item.pharmacy_id,
        pharmacy_user_id: item.pharmacy_user_id,
        inventory_id: item.id,
        medication_name: item.medication_name,
        strength: item.strength || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        movement_type: 'disposal',
        quantity_before: item.quantity_in_stock ?? null,
        quantity_change: -(item.quantity_in_stock || 0),
        quantity_after: 0,
        reason: item.quarantine_reason || 'Quarantined stock disposed',
        reference: item.recall_id || '',
        performed_by_user_id: user.id,
        performed_by_name: user.full_name || 'Pharmacy',
        performed_by_role: 'pharmacy',
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: user.id,
        actor_name: user.full_name || 'Pharmacy',
        actor_role: isAdmin ? 'admin' : 'pharmacy',
        action: 'recall_disposal',
        action_label: `Disposed quarantined ${item.medication_name}${item.strength ? ` ${item.strength}` : ''}${item.batch_number ? ` (batch ${item.batch_number})` : ''}`,
      });
      if (item.recall_id) {
        try {
          const recall = await base44.asServiceRole.entities.MedicationRecall.filter({ recall_id: item.recall_id }, { limit: 1 });
          const rec = (recall.items || recall)[0];
          if (rec) {
            const actions = [...(rec.actions || []), {
              action: 'disposed',
              by_name: user.full_name || 'Pharmacy',
              datetime: new Date().toISOString(),
              details: `${item.medication_name}${item.strength ? ` ${item.strength}` : ''}${item.batch_number ? ` (batch ${item.batch_number})` : ''} was disposed of.`,
            }];
            await base44.asServiceRole.entities.MedicationRecall.update(rec.id, { actions });
          }
        } catch (e) { console.log('RECALL-DISPOSE-LOG-ERROR:', e && e.message); }
      }
      return Response.json({ ok: true });
    }

    // ---- Resolve a recall -------------------------------------------------
    if (action === 'resolve') {
      const recallId = String(body?.recall_id || '');
      if (!recallId) return Response.json({ error: 'Missing recall.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.MedicationRecall.filter({ recall_id: recallId }, { limit: 1 });
      const rec = (page.items || page)[0];
      if (!rec) return Response.json({ error: 'Recall not found.' }, { status: 404 });
      const isAdmin = user.role === 'admin';
      if (!isAdmin && rec.issued_by_user_id !== user.id) {
        return Response.json({ error: 'Only the issuer or an administrator can resolve this recall.' }, { status: 403 });
      }
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.MedicationRecall.update(rec.id, {
        status: 'resolved',
        resolved_datetime: now,
        resolved_by_name: user.full_name || 'AMedix',
        actions: [...(rec.actions || []), {
          action: 'resolved',
          by_name: user.full_name || 'AMedix',
          datetime: now,
          details: 'Recall resolved. Quarantined batches remain blocked until disposed or explicitly released.',
        }],
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: user.id,
        actor_name: user.full_name || 'AMedix',
        actor_role: isAdmin ? 'admin' : 'pharmacy',
        action: 'recall_resolved',
        action_label: `Resolved recall ${rec.recall_id} (${rec.medication_name})`,
      });
      return Response.json({ ok: true, resolved_datetime: now });
    }

    // ---- Acknowledge a recall --------------------------------------------
    // The pharmacy (or an administrator) confirms it has seen the recall
    // notification. The acknowledgement is recorded in the recall's action
    // history and the clinical audit log.
    if (action === 'acknowledge') {
      const recallId = String(body?.recall_id || '');
      if (!recallId) return Response.json({ error: 'Missing recall.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.MedicationRecall.filter({ recall_id: recallId }, { limit: 1 });
      const rec = (page.items || page)[0];
      if (!rec) return Response.json({ error: 'Recall not found.' }, { status: 404 });
      if (rec.status !== 'active') {
        return Response.json({ error: 'This recall is already resolved.' }, { status: 400 });
      }
      const isAdmin = user.role === 'admin';
      let ackPharmacyName = '';
      if (!isAdmin) {
        const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }, { limit: 1 });
        const p = (profiles.items || profiles)[0] || null;
        if (!p) return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });
        if (!(rec.pharmacy_ids || []).includes(p.id)) {
          return Response.json({ error: 'This recall does not affect your pharmacy.' }, { status: 403 });
        }
        ackPharmacyName = p.pharmacy_name;
      }
      const now = new Date().toISOString();
      const byName = user.full_name || 'Pharmacy';
      await base44.asServiceRole.entities.MedicationRecall.update(rec.id, {
        actions: [...(rec.actions || []), {
          action: 'acknowledged',
          by_name: byName,
          datetime: now,
          details: `Acknowledged by ${ackPharmacyName || 'an administrator'}. Affected stock is quarantined and blocked from dispensing.`,
        }],
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: user.id,
        actor_name: byName,
        actor_role: isAdmin ? 'admin' : 'pharmacy',
        action: 'recall_acknowledged',
        action_label: `Acknowledged recall ${rec.recall_id} (${rec.medication_name})`,
      });
      return Response.json({ ok: true, acknowledged_datetime: now });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}