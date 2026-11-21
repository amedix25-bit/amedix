# AMedix — Background Web Push Notifications

Scope: real Web Push (VAPID, aes128gcm) delivered by the server to a device, so an
alert can arrive while AMedix is closed. Built on the existing notification records —
no parallel notification system, and no change to any existing workflow.

---

## 1. What was built

| Piece | Where | What it does |
|---|---|---|
| Device subscription record | `PushSubscription` entity | One row per device + browser: push endpoint, encryption keys, platform, master switch, per-category switches, status, failure counters, pending retry payload. |
| VAPID key store | `PushConfig` entity | The app's Web Push signing pair. Generated once, server-side, on first use. |
| Delivery log | `PushDelivery` entity | One row per attempt: devices, sent, expired, retried, failed, skipped. Also the **deduplication key**, so one notification is pushed at most once. |
| Push engine | `base44/shared/webPush.ts` | VAPID signing, payload encryption, per-device outcome handling, retry backoff, `sendToUser`. |
| Content + routing | `base44/shared/pushContent.ts` | Privacy-safe copy per category and the deep link each push opens. |
| Registration | `pushSubscribe` function | Registers/refreshes this browser's subscription for the signed-in user, returns the public key, updates per-device preferences, lists devices. |
| Removal | `pushUnsubscribe` function | Removes one device or all devices of the signed-in user. |
| Self test | `pushTest` function | Sends one labelled test push to the caller's own devices (max one per minute). |
| Fan-out | `pushSend` function | Turns a notification record into a push for its recipient, and runs the retry scan. |
| Service worker | `public/sw.js` | Receives pushes with the app closed, shows the notification, opens the exact page on click. Never caches or intercepts app requests. |
| Browser plumbing | `src/lib/webPush.js`, `src/hooks/useWebPush.js` | Support detection, permission, subscribe/unsubscribe, preferences, test. |
| Settings UI | `src/pages/NotificationSettings.jsx` + `src/components/notifications/*` | The notification settings page: why permission is needed, enable/disable, per-category switches, device list, test, limitations, privacy note. |
| Event delivery | 5 entity workflows + 1 scheduled workflow | `Patient/Doctor/Lab/Pharmacy/Radiologist Notification Push` (on notification create) and `Push Delivery Retry` (every 10 min). |

### Reachable from every portal
`/notification-settings?portal=…` — linked from the Patient profile menu, the Doctor
Settings screen, and the shared sidebar used by the hospital, laboratory, pharmacy,
radiology and admin portals.

---

## 2. Delivery path

```
Portal event ──► existing notification record (unchanged)
                        │  entity trigger (create)
                        ▼
                   pushSend  ──► PushDelivery dedupe check
                        │
                        ├── pushCopy(category)  → generic title + body (no clinical detail)
                        ├── deep link (portal tab + record reference)
                        ▼
                webPush.deliver → one HTTPS request per device (VAPID + aes128gcm)
                        │
        ┌───────────────┼────────────────┬───────────────────┐
        ▼               ▼                ▼                   ▼
   accepted       404 / 410          429 / 5xx         400 / 401 / 403
   (sent)      → expired, off     → queued, backoff   → failed, recorded
                                   2 / 10 / 30 min
                                        │
                                        ▼
                              Push Delivery Retry (every 10 min)
                                        │
                              after 3 attempts → failed
```

**Medication reminders** use the existing server-side scheduler
(`createMedicationReminders`, every 5 minutes). The scheduler writes the patient
notification exactly as before; the push layer picks it up from there. Nothing
about reminder timing, deduplication or the dose log changed, so a reminder is
never delivered twice. Taken / snoozed / skipped is recorded in the patient
portal's medication alarm centre, which the push opens directly.

---

## 3. Security model

- **Subscription ownership** — `user_id` is always the signed-in account; it is never
  read from the request body. RLS allows a user to read/update/delete only their own
  device rows (admin excepted).
- **Endpoint stays server-side** — `endpoint`, `p256dh` and `auth` are never returned
  to the browser. The settings page receives only device id, label, platform, status
  and preferences.
- **VAPID private key** — stored in the admin-only `PushConfig` record, used only
  inside backend functions, never logged, never returned by any endpoint.
- **Send is admin/service only** — `pushSend` returns 403 unless the caller is an
  app admin (a workflow calls it as its creator). A user cannot push to another user.
- **No cross-user targeting** — the recipient is read from the notification record,
  never from the request.
- **Bounded** — 10 devices per account, 10 devices per delivery batch, payload TTL
  15 min (60 min for urgent), one test push per minute.
- **Expired endpoints are dropped, not retried** — retrying a dead endpoint is how a
  sender gets rate-limited by a push service.

## 4. Privacy model (lock screen)

The push body is chosen by category and never contains a diagnosis, medication name,
laboratory result, patient name, clinician name or note text.

| Category | Title | Body |
|---|---|---|
| Medication | Medication reminder | You have a medication reminder. Open AMedix to view it. |
| Laboratory | Laboratory update | There is an update on your laboratory requests. Open AMedix to view it. |
| Imaging / urgent | AMedix: attention needed | A clinical update needs your attention. Open AMedix to view it. |
| Appointment | Appointment update | Your appointment details have changed. Open AMedix to view them. |
| Message | New secure message | You have a new message in AMedix. |
| Access | Access update | There is a change to who can view your record. Open AMedix to review it. |
| Other | AMedix | You have a new notification. Open AMedix to view it. |

The service worker truncates any body over 140 characters as a second guard, and the
detail is only shown after sign-in and the portal's normal access checks. A push
never grants access: the doctor link opens Find Patient with the CIN prefilled, and
the record is re-authorised server-side as usual.

---

## 5. Measured results (executed in this environment)

These are real runs against the live push service, using synthetic device
subscriptions with valid encryption keys. They verify the whole server pipeline:
VAPID signing, payload encryption, HTTPS delivery, and every failure branch.

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | VAPID key generation + persistence | **PASS** | `pushSubscribe` returned a 87-char public key; second call returned the same key |
| 2 | Encrypted push reaches the push service | **PASS** | Request to `fcm.googleapis.com` was accepted at the network and answered by the service (not a local crypto/format error) |
| 3 | Dead subscription (404/410) | **PASS** | device → `status: expired`, `enabled: false`, `last_error: push_expired`, no retry queued |
| 4 | Temporary failure → retry queue | **PASS** | device → `pending_attempts: 1`, `pending_payload` kept, `next_retry_datetime` +2 min |
| 5 | Retry backoff | **PASS** | after the retry window: `attempts: 2`, next retry pushed to +10 min, failures 2 |
| 6 | Retry cap → permanent failure | **PASS** | 3rd attempt: `status: failed`, pending cleared, `failures: 3` |
| 7 | Workflow-driven fan-out | **PASS** | creating a real `PatientNotification` produced a `PushDelivery` row (`category: medication`, 1 device, expired 1) within seconds — the entity workflow fires |
| 8 | Duplicate prevention | **PASS** | re-invoking `pushSend` for the same notification returned `skipped: already_pushed` |
| 9 | Idle scheduler run | **PASS** | `pushSend {mode:"retry"}` with nothing due: `attempted: 0`, no writes |
| 10 | Production build | **PASS** | `vite build` exit 0, `dist/sw.js` emitted (service worker will be served at `/sw.js`) |

All synthetic test devices and test notifications were deleted after the run
(`PushSubscription.count = 0`, test notifications = 0).

## 6. Device results — NOT MEASURED

I cannot produce genuine per-device delivery results: that requires a physical
device, a real browser push service subscription and a human tapping "Allow" on the
permission prompt. No browser is available in this environment, so no row below is
claimed as tested. Filling them in is a five-minute task per device using the
in-app test button.

| Device | Support expected | Result |
|---|---|---|
| Android — Chrome | Yes (Chrome 42+ / Android 6+) | **not measured** |
| iPhone — Safari, Home Screen web app | Yes, **only** after "Add to Home Screen", iOS 16.4+ | **not measured** |
| iPhone — Safari, in a normal tab | No — Apple does not deliver web push to a Safari tab | **not measured (expected: unavailable, with instructions shown)** |
| Desktop — Chrome / Edge | Yes | **not measured** |
| Desktop — Safari | Safari 16.4+ on macOS 13+; older versions cannot | **not measured** |
| Desktop — Firefox | Yes (not part of the requested matrix) | **not measured** |

### How to run it (per device)
1. Sign in to AMedix on the device.
2. Open **Notification settings** (patient profile menu, or the sidebar link in a
   professional portal).
3. Read the explanation, tap **Enable notifications on this device**, and allow.
4. Tap **Send test** and confirm the notification appears in the notification tray /
   lock screen with the generic wording.
5. Lock the device or close the browser tab, then tap **Send test** again from another
   signed-in session — this is the real background test.
6. Record the outcome above. Turn the category switches off and repeat step 5 to
   confirm a disabled category is not delivered.

## 7. Platform limitations (stated in the app, not hidden)

- **iPhone/iPad:** web push requires the site to be added to the Home Screen and
  iOS 16.4 or later. In a Safari tab it is unavailable, and the settings page says so
  with the three steps instead of showing a dead button.
- **Powered off / offline / airplane mode / Do Not Disturb / battery saver:** no
  delivery until the device is online again. The app never claims otherwise.
- **Delivery is best-effort.** No push system guarantees delivery; the in-app
  notification is always the authoritative record.
- **Desktop Safari below 16.4** cannot receive web push.
- **In-app browsers** (Instagram, Facebook, some Android webviews) generally cannot
  subscribe.

## 8. Not done / deferred

- **Publishing:** the service worker only exists at `/sw.js` after the app is
  published. Until then the settings page reports that notifications cannot be
  enabled in this browser.
- **MessageNotification** has no push workflow — messaging already writes
  patient/doctor notifications, and adding it would risk a duplicate alert. Confirm
  on a device before changing that.
- **In-portal entry buttons** for the laboratory, pharmacy, hospital and radiology
  portals are on the shared sidebar link; a dedicated button inside each profile
  screen is a cosmetic follow-up.
- **Push action buttons** (taken / snooze / skip directly on the notification) are
  not used: the click opens the medication alarm centre, which performs those
  actions after authentication. Adding push actions would duplicate that logic
  outside the authenticated session.
- **VAPID key rotation** is not exposed in the UI. Rotating requires regenerating the
  `PushConfig` record; every device then re-subscribes on its next visit.
