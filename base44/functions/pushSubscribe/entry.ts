import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getVapidKeys, detectPlatform, deviceLabel } from '../../shared/webPush.ts';

// Registers (or refreshes) one device's push subscription for the signed-in
// user, and returns the app's VAPID public key so the browser can subscribe.
//
// Security:
//  - the record is always written for the signed-in user; user_id is never
//    taken from the request body;
//  - the push endpoint must be an https URL issued by a push service;
//  - endpoint / p256dh / auth are never returned to the browser — the endpoint
//    is a capability URL and stays server-side;
//  - a user may hold at most MAX_DEVICES devices.

const MAX_DEVICES = 10;

const DEFAULT_CATEGORIES = {
  medication: true,
  laboratory: true,
  imaging: true,
  appointment: true,
  message: true,
  access: true,
  general: true,
};

function publicDevice(record) {
  return {
    id: record.id,
    device_label: record.device_label || 'Browser',
    platform: record.platform || 'other',
    enabled: record.enabled !== false,
    status: record.status || 'active',
    categories: record.categories || DEFAULT_CATEGORIES,
    last_success_datetime: record.last_success_datetime || '',
    created_datetime: record.created_datetime || '',
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const keys = await getVapidKeys(base44);

    const existingPage = await base44.entities.PushSubscription.filter(
      { user_id: user.id },
      { limit: 50 }
    );
    const existingDevices = existingPage.items || [];

    // Per-device preferences: master switch and category switches.
    if (body.action === 'update') {
      const deviceId = String(body.id || '').trim();
      const device = existingDevices.find((d) => d.id === deviceId);
      if (!device) return Response.json({ error: 'Device not found' }, { status: 404 });

      const patch = { last_seen_datetime: new Date().toISOString() };
      if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
      if (body.categories && typeof body.categories === 'object') {
        const next = { ...(device.categories || DEFAULT_CATEGORIES) };
        for (const key of Object.keys(DEFAULT_CATEGORIES)) {
          if (typeof body.categories[key] === 'boolean') next[key] = body.categories[key];
        }
        patch.categories = next;
      }

      const updated = await base44.entities.PushSubscription.update(device.id, patch);
      return Response.json({
        public_key: keys.publicKey,
        device: publicDevice(updated),
        devices: existingDevices.map((d) => publicDevice(d.id === device.id ? updated : d)),
      });
    }

    // Listing only: the settings screen needs the public key and the devices.
    if (body.action === 'list' || !body.subscription) {
      return Response.json({
        public_key: keys.publicKey,
        devices: existingDevices.map(publicDevice),
      });
    }

    const subscription = body.subscription || {};
    const endpoint = String(subscription.endpoint || '').trim();
    const p256dh = String(subscription.keys?.p256dh || '').trim();
    const auth = String(subscription.keys?.auth || '').trim();

    if (!/^https:\/\/[^\s]{10,900}$/.test(endpoint)) {
      return Response.json({ error: 'Invalid push endpoint' }, { status: 400 });
    }
    if (!p256dh || !auth || p256dh.length > 200 || auth.length > 200) {
      return Response.json({ error: 'Invalid push keys' }, { status: 400 });
    }

    const userAgent = String(req.headers.get('user-agent') || '').slice(0, 300);
    const platform = detectPlatform(userAgent);
    const nowIso = new Date().toISOString();
    const existing = existingDevices.find((d) => d.endpoint === endpoint);

    let saved;
    if (existing) {
      saved = await base44.entities.PushSubscription.update(existing.id, {
        p256dh,
        auth,
        user_agent: userAgent,
        platform,
        portal: body.portal || existing.portal || 'patient',
        enabled: true,
        status: 'active',
        failure_count: 0,
        last_error: '',
        last_seen_datetime: nowIso,
        pending_payload: '',
        pending_attempts: 0,
        next_retry_datetime: '',
      });
    } else {
      if (existingDevices.length >= MAX_DEVICES) {
        return Response.json(
          { error: `You can enable at most ${MAX_DEVICES} devices. Remove one first.` },
          { status: 429 }
        );
      }
      saved = await base44.entities.PushSubscription.create({
        user_id: user.id,
        user_email: user.email || '',
        portal: body.portal || 'patient',
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        platform,
        device_label: String(body.device_label || '').slice(0, 60) || deviceLabel(userAgent, platform),
        enabled: true,
        categories: DEFAULT_CATEGORIES,
        status: 'active',
        failure_count: 0,
        last_error: '',
        last_seen_datetime: nowIso,
        created_datetime: nowIso,
      });
    }

    const refreshed = await base44.entities.PushSubscription.filter(
      { user_id: user.id },
      { limit: 50 }
    );

    return Response.json({
      public_key: keys.publicKey,
      device: publicDevice(saved),
      devices: (refreshed.items || []).map(publicDevice),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}