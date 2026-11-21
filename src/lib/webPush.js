import { base44 } from "@/api/base44Client";

// Browser-side Web Push plumbing.
//
// Nothing here decides what a notification says — the server builds a
// privacy-safe payload. This module only asks the browser for permission,
// registers the service worker, creates/removes the device subscription and
// stores it against the signed-in account.

export const CATEGORY_OPTIONS = [
  { key: "medication", label: "Medication reminders" },
  { key: "laboratory", label: "Laboratory updates" },
  { key: "imaging", label: "Imaging and urgent results" },
  { key: "appointment", label: "Appointments" },
  { key: "message", label: "Secure messages" },
  { key: "access", label: "Access changes" },
  { key: "general", label: "Other account notices" },
];

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.navigator.standalone === true
  );
}

export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Why push can or cannot work in this browser, in plain terms.
export function pushSupport() {
  if (typeof window === "undefined") return { supported: false, reason: "unavailable" };

  const ios = isIOSDevice();
  const standalone = isStandalone();
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  if (ios && !standalone) {
    return { supported: false, ios, standalone, reason: "ios_needs_home_screen" };
  }
  if (!hasApis) {
    return { supported: false, ios, standalone, reason: "browser_unsupported" };
  }
  if (window.isSecureContext === false) {
    return { supported: false, ios, standalone, reason: "insecure_context" };
  }
  return { supported: true, ios, standalone, reason: null };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function browserSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

const DEVICE_KEY = "amedix_push_device_id";

export async function loadPushState(portal) {
  const response = await base44.functions.invoke("pushSubscribe", { action: "list", portal });
  const subscription = await browserSubscription();
  const storedId = window.localStorage.getItem(DEVICE_KEY) || "";
  return {
    publicKey: response.data.public_key,
    devices: response.data.devices || [],
    hasBrowserSubscription: !!subscription,
    // Which of the account's devices is this browser. Stored locally when this
    // browser subscribes; the server never sends endpoints back to the page.
    deviceId: storedId && (response.data.devices || []).some((d) => d.id === storedId) ? storedId : "",
  };
}

// Must be called from a click handler: the browser only shows the permission
// prompt in response to a user gesture.
export async function enablePush(portal) {
  const support = pushSupport();
  if (!support.supported) {
    throw new Error(
      support.reason === "ios_needs_home_screen"
        ? "On iPhone and iPad, add AMedix to your Home Screen first, then enable notifications inside the installed app."
        : "This browser does not support background notifications."
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked for AMedix in this browser. Allow them in the browser's site settings, then try again."
        : "Notification permission was not granted."
    );
  }

  const { data } = await base44.functions.invoke("pushSubscribe", { action: "list", portal });
  const registration = await registerWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });
  }

  const saved = await base44.functions.invoke("pushSubscribe", {
    subscription: subscription.toJSON(),
    portal,
  });

  if (saved.data?.device?.id) {
    window.localStorage.setItem(DEVICE_KEY, saved.data.device.id);
  }

  return saved.data;
}

export async function disableThisBrowser(deviceId) {
  try {
    const subscription = await browserSubscription();
    if (subscription) await subscription.unsubscribe();
  } catch (error) {
    // The browser may already have dropped it — the server record is still removed.
  }
  window.localStorage.removeItem(DEVICE_KEY);
  if (deviceId) {
    const response = await base44.functions.invoke("pushUnsubscribe", { id: deviceId });
    return response.data;
  }
  return { removed: 0 };
}

export async function removeDevice(deviceId) {
  const response = await base44.functions.invoke("pushUnsubscribe", { id: deviceId });
  return response.data;
}

export async function updateDevice(deviceId, patch) {
  const response = await base44.functions.invoke("pushSubscribe", {
    action: "update",
    id: deviceId,
    ...patch,
  });
  return response.data;
}

export async function sendTestNotification() {
  const response = await base44.functions.invoke("pushTest", {});
  return response.data;
}