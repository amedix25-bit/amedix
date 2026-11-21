import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getVapidKeys, configureWebPush, sendToUser, retryPending } from '../../shared/webPush.ts';
import {
  pushCategory,
  pushCopy,
  patientPushUrl,
  doctorPushUrl,
  PORTAL_ROUTES,
} from '../../shared/pushContent.ts';

// Server-side fan-out: turns one notification record into a Web Push to that
// user's enabled devices.
//
// Called by the notification workflows (as an app admin) and by nothing else:
//   { mode: "notification", entity: "PatientNotification", id: "<record id>" }
//   { mode: "retry" }
//
// Guarantees:
//  - the recipient is read from the notification record, never from the request;
//  - one notification is pushed at most once (PushDelivery is the dedupe key),
//    so a workflow re-run cannot produce a duplicate alert;
//  - the body is generic by category — no diagnosis, medication, result or name;
//  - a delivery result row is written for every attempt.

const RECIPIENT = {
  PatientNotification: { field: 'patient_user_id', portal: 'patient' },
  DoctorNotification: { field: 'doctor_user_id', portal: 'doctor' },
  LabNotification: { field: 'lab_user_id', portal: 'laboratory' },
  PharmacyNotification: { field: 'pharmacy_user_id', portal: 'pharmacy' },
  RadiologistNotification: { field: 'radiologist_user_id', portal: 'radiology' },
};

function statusOf(result) {
  if (result.sent > 0 && result.retry === 0 && result.failed === 0) return 'delivered';
  if (result.sent > 0) return 'partial';
  if (result.retry > 0) return 'retrying';
  if (result.devices === 0) return 'no_devices';
  return 'failed';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const keys = await getVapidKeys(base44);
    configureWebPush(keys);

    if (body.mode === 'retry') {
      const retried = await retryPending(base44);
      return Response.json({ mode: 'retry', ...retried });
    }

    const entityName = String(body.entity || '');
    const notificationId = String(body.id || '');
    const recipientConfig = RECIPIENT[entityName];

    if (!recipientConfig) {
      return Response.json({ error: 'Unsupported notification entity' }, { status: 400 });
    }
    if (!notificationId) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    // Deduplication: this notification has already been pushed.
    const previous = await base44.asServiceRole.entities.PushDelivery.filter(
      { notification_entity: entityName, notification_id: notificationId },
      { limit: 1 }
    );
    if ((previous.items || []).length > 0) {
      return Response.json({ skipped: true, reason: 'already_pushed' });
    }

    const record = await base44.asServiceRole.entities[entityName]
      .get(notificationId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!record) return Response.json({ error: 'Notification not found' }, { status: 404 });

    // A notification the user already read (or that was created read) is not
    // worth waking a device for.
    if (record.is_read === true) {
      return Response.json({ skipped: true, reason: 'already_read' });
    }

    let userId = record[recipientConfig.field];
    if (!userId && entityName === 'PatientNotification' && record.patient_id) {
      const profile = await base44.asServiceRole.entities.PatientProfile
        .get(record.patient_id)
        .catch(() => null);
      userId = profile?.user_id;
    }
    if (!userId) {
      return Response.json({ skipped: true, reason: 'no_recipient' });
    }

    const category = pushCategory(record.type, record.target);
    const copy = pushCopy(category);
    let url = PORTAL_ROUTES[recipientConfig.portal] || '/';
    if (entityName === 'PatientNotification') url = patientPushUrl(record);
    if (entityName === 'DoctorNotification') url = doctorPushUrl(record);

    const payload = {
      title: copy.title,
      body: copy.body,
      tag: `${copy.tag}-${notificationId}`,
      url,
      category,
      urgency: category === 'urgent' ? 'high' : 'normal',
      ttl: category === 'urgent' ? 3600 : 900,
    };

    const result = await sendToUser(base44, userId, payload, recipientConfig.portal);

    await base44.asServiceRole.entities.PushDelivery.create({
      notification_entity: entityName,
      notification_id: notificationId,
      user_id: userId,
      category,
      devices: result.devices,
      sent: result.sent,
      expired: result.expired,
      retry: result.retry,
      failed: result.failed,
      skipped: result.skipped,
      status: statusOf(result),
      detail: '',
      sent_datetime: new Date().toISOString(),
    });

    return Response.json({ category, url, ...result, status: statusOf(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}