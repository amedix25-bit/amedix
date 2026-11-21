import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getVapidKeys, configureWebPush, subscriptionsForUser, deliver } from '../../shared/webPush.ts';

// Sends one clearly-labelled test notification to the caller's own devices.
// Rate limited to one test per minute per account so it cannot be used to
// hammer a push service, and it can never target another user.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const recent = await base44.asServiceRole.entities.PushDelivery.filter(
      { user_id: user.id, notification_entity: 'PushTest' },
      { sort: '-sent_datetime', limit: 1 }
    );
    const last = (recent.items || [])[0];
    if (last?.sent_datetime && Date.now() - new Date(last.sent_datetime).getTime() < 60000) {
      return Response.json(
        { error: 'Please wait a minute before sending another test notification.' },
        { status: 429 }
      );
    }

    const keys = await getVapidKeys(base44);
    configureWebPush(keys);

    const subscriptions = await subscriptionsForUser(base44, user.id);
    if (subscriptions.length === 0) {
      return Response.json({ devices: 0, sent: 0, error: 'No device is enabled yet.' }, { status: 200 });
    }

    const result = await deliver(base44, subscriptions, {
      title: 'AMedix test notification',
      body: 'Notifications are working on this device.',
      tag: 'amedix-test',
      url: '/notification-settings',
      category: 'general',
      ttl: 120,
      urgency: 'high',
    });

    await base44.asServiceRole.entities.PushDelivery.create({
      notification_entity: 'PushTest',
      notification_id: `test-${Date.now()}`,
      user_id: user.id,
      category: 'general',
      devices: subscriptions.length,
      sent: result.sent,
      expired: result.expired,
      retry: result.retry,
      failed: result.failed,
      skipped: result.skipped,
      status: result.sent > 0 ? 'delivered' : result.retry > 0 ? 'retrying' : 'failed',
      detail: 'manual test',
      sent_datetime: new Date().toISOString(),
    });

    return Response.json({ devices: subscriptions.length, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}