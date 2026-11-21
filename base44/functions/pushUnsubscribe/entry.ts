import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Removes a device subscription, or every device of the signed-in user.
// Only the owner's own records can be reached: the delete runs on the user's
// own token, and the id is additionally checked against that user's list.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const page = await base44.entities.PushSubscription.filter(
      { user_id: user.id },
      { limit: 50 }
    );
    const devices = page.items || [];

    if (body.all === true) {
      await Promise.allSettled(devices.map((d) => base44.entities.PushSubscription.delete(d.id)));
      return Response.json({ removed: devices.length, devices: [] });
    }

    const id = String(body.id || '').trim();
    const endpoint = String(body.endpoint || '').trim();
    const target = devices.find((d) => (id && d.id === id) || (endpoint && d.endpoint === endpoint));

    if (!target) return Response.json({ error: 'Device not found' }, { status: 404 });

    await base44.entities.PushSubscription.delete(target.id);
    return Response.json({
      removed: 1,
      devices: devices
        .filter((d) => d.id !== target.id)
        .map((d) => ({
          id: d.id,
          device_label: d.device_label,
          platform: d.platform,
          enabled: d.enabled !== false,
          status: d.status,
          categories: d.categories || {},
        })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}