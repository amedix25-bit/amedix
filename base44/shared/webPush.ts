// Server-side Web Push delivery (VAPID + aes128gcm), shared by every function
// that needs to reach a device.
//
// Key handling: the VAPID key pair is generated once, on first use, and stored
// server-side in the admin-only PushConfig entity. The private key is never
// returned by any endpoint and never logged. If the pair is rotated, every
// existing subscription must re-subscribe (the browser will do so on next open).
//
// Delivery rules:
//  - 404 / 410 from the push service = the subscription is gone. It is marked
//    expired and never retried: retrying a dead endpoint is what gets a sender
//    rate-limited.
//  - 429 / 5xx / network = temporary. The payload is kept on the subscription
//    and retried with backoff by the retry scan, up to MAX_ATTEMPTS.
//  - Everything else (400 / 401 / 403) is a configuration or payload fault and
//    is recorded, not retried blindly.

import webpush from "npm:web-push@3.6.7";

const CONFIG_KEY = "vapid";
const VAPID_SUBJECT = "https://amedixly.com";
const MAX_ATTEMPTS = 3;
const BACKOFF_MINUTES = [2, 10, 30];
const DEFAULT_TTL_SECONDS = 900;

export const PUSH_CATEGORIES = [
  "medication",
  "laboratory",
  "imaging",
  "appointment",
  "message",
  "access",
  "general",
];

export function categoryAllowed(subscription, category) {
  const prefs = subscription?.categories || {};
  const key = category === "urgent" ? "imaging" : category;
  return prefs[key] !== false;
}

export function deviceLabel(userAgent, platform) {
  const ua = String(userAgent || "");
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad";
  if (/Android/i.test(ua)) return "Android device";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (platform === "ios") return "iPhone / iPad";
  return "Browser";
}

export function detectPlatform(userAgent) {
  const ua = String(userAgent || "");
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux|X11/i.test(ua)) return "desktop";
  return "other";
}

// Returns { publicKey, privateKey }. Generates the pair exactly once.
export async function getVapidKeys(base44) {
  const page = await base44.asServiceRole.entities.PushConfig.filter(
    { key: CONFIG_KEY },
    { limit: 1 }
  );
  let config = (page.items || [])[0];

  if (config && config.public_key && config.private_key) {
    return { publicKey: config.public_key, privateKey: config.private_key };
  }

  const generated = webpush.generateVAPIDKeys();
  const payload = {
    key: CONFIG_KEY,
    public_key: generated.publicKey,
    private_key: generated.privateKey,
    created_datetime: new Date().toISOString(),
  };

  config = config
    ? await base44.asServiceRole.entities.PushConfig.update(config.id, payload)
    : await base44.asServiceRole.entities.PushConfig.create(payload);

  return { publicKey: config.public_key, privateKey: config.private_key };
}

export function configureWebPush(keys) {
  webpush.setVapidDetails(VAPID_SUBJECT, keys.publicKey, keys.privateKey);
}

// One delivery attempt. Returns a normalized outcome and never throws.
export async function attemptSend(subscription, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: payload.ttl || DEFAULT_TTL_SECONDS, urgency: payload.urgency || "normal" }
    );
    return { ok: true };
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 0;
    const body = String(error?.body || error?.message || "");
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true, error: "push_expired", detail: body.slice(0, 200) };
    }
    if (statusCode === 429 || statusCode >= 500 || statusCode === 0) {
      return { ok: false, retryable: true, error: statusCode ? `push_${statusCode}` : "push_unreachable", detail: body.slice(0, 200) };
    }
    return { ok: false, error: `push_${statusCode || "rejected"}`, detail: body.slice(0, 200) };
  }
}

// Send one payload to a set of subscriptions, recording the outcome on each
// record. Temporary failures leave a pending payload for the retry scan.
export async function deliver(base44, subscriptions, payload) {
  const results = { sent: 0, expired: 0, retry: 0, failed: 0, skipped: 0 };
  const nowIso = new Date().toISOString();

  for (const subscription of subscriptions) {
    if (!subscription?.endpoint || !subscription?.p256dh || !subscription?.auth) {
      results.skipped++;
      continue;
    }
    if (subscription.status === "expired" || subscription.enabled === false) {
      results.skipped++;
      continue;
    }
    if (payload.category && !categoryAllowed(subscription, payload.category)) {
      results.skipped++;
      continue;
    }

    const outcome = await attemptSend(subscription, payload);

    if (outcome.ok) {
      results.sent++;
      await base44.asServiceRole.entities.PushSubscription
        .update(subscription.id, {
          status: "active",
          failure_count: 0,
          last_error: "",
          last_success_datetime: nowIso,
          pending_payload: "",
          pending_attempts: 0,
          next_retry_datetime: "",
        })
        .catch(() => null);
      continue;
    }

    if (outcome.expired) {
      results.expired++;
      await base44.asServiceRole.entities.PushSubscription
        .update(subscription.id, {
          status: "expired",
          enabled: false,
          last_error: outcome.error,
          pending_payload: "",
          next_retry_datetime: "",
        })
        .catch(() => null);
      continue;
    }

    const attempts = (subscription.pending_attempts || 0) + 1;
    if (outcome.retryable && attempts < MAX_ATTEMPTS) {
      results.retry++;
      const wait = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
      await base44.asServiceRole.entities.PushSubscription
        .update(subscription.id, {
          failure_count: (subscription.failure_count || 0) + 1,
          last_error: outcome.error,
          pending_payload: JSON.stringify(payload),
          pending_attempts: attempts,
          next_retry_datetime: new Date(Date.now() + wait * 60000).toISOString(),
        })
        .catch(() => null);
      continue;
    }

    results.failed++;
    await base44.asServiceRole.entities.PushSubscription
      .update(subscription.id, {
        status: "failed",
        failure_count: (subscription.failure_count || 0) + 1,
        last_error: outcome.error,
        pending_payload: "",
        pending_attempts: 0,
        next_retry_datetime: "",
      })
      .catch(() => null);
  }

  return results;
}

// Re-attempt payloads whose backoff has elapsed. Called by the retry workflow.
export async function retryPending(base44, limit = 100) {
  const page = await base44.asServiceRole.entities.PushSubscription.filter(
    { status: { $in: ["active", "failed"] } },
    { limit: 200 }
  );

  const now = Date.now();
  const due = (page.items || []).filter(
    (s) =>
      s.pending_payload &&
      s.next_retry_datetime &&
      new Date(s.next_retry_datetime).getTime() <= now
  );

  const results = { attempted: 0, sent: 0, expired: 0, retry: 0, failed: 0, skipped: 0 };
  for (const subscription of due.slice(0, limit)) {
    let payload = null;
    try {
      payload = JSON.parse(subscription.pending_payload);
    } catch (error) {
      await base44.asServiceRole.entities.PushSubscription
        .update(subscription.id, { pending_payload: "", pending_attempts: 0, next_retry_datetime: "" })
        .catch(() => null);
      continue;
    }
    results.attempted++;
    const outcome = await deliver(base44, [{ ...subscription, pending_attempts: subscription.pending_attempts || 0 }], payload);
    results.sent += outcome.sent;
    results.expired += outcome.expired;
    results.retry += outcome.retry;
    results.failed += outcome.failed;
    results.skipped += outcome.skipped;
  }

  return results;
}

// All deliverable devices of one user.
export async function subscriptionsForUser(base44, userId, portal) {
  const query = { user_id: userId };
  if (portal) query.portal = portal;
  const page = await base44.asServiceRole.entities.PushSubscription.filter(query, { limit: 50 });
  return page.items || [];
}

export async function sendToUser(base44, userId, payload, portal) {
  const subscriptions = await subscriptionsForUser(base44, userId, portal);
  if (subscriptions.length === 0) return { sent: 0, expired: 0, retry: 0, failed: 0, skipped: 0, devices: 0 };
  const result = await deliver(base44, subscriptions, payload);
  return { ...result, devices: subscriptions.length };
}