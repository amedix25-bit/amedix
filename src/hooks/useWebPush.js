import { useCallback, useEffect, useState } from "react";
import {
  pushSupport,
  loadPushState,
  enablePush,
  disableThisBrowser,
  removeDevice,
  updateDevice,
  sendTestNotification,
} from "@/lib/webPush";

// One state machine for the notification settings screen: what this browser
// can do, which devices the account has, and the actions on them.
export default function useWebPush(portal = "patient") {
  const [support] = useState(() => pushSupport());
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const state = await loadPushState(portal);
      setDevices(state.devices);
      setDeviceId(state.deviceId);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not load notification settings.");
    } finally {
      setLoading(false);
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
    }
  }, [portal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (key, action, successMessage) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      if (successMessage) setNotice(successMessage);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const thisDevice = devices.find((d) => d.id === deviceId);

  return {
    support,
    permission,
    devices,
    thisDevice,
    loading,
    busy,
    error,
    notice,
    clearMessages: () => {
      setError("");
      setNotice("");
    },
    enable: () => run("enable", () => enablePush(portal), "Notifications are now on for this device."),
    disableThisDevice: () =>
      run("disable", () => disableThisBrowser(thisDevice?.id), "Notifications are off for this device."),
    remove: (id) => run(`remove-${id}`, () => removeDevice(id), "Device removed."),
    setEnabled: (id, enabled) =>
      run(`enabled-${id}`, () => updateDevice(id, { enabled }), enabled ? "Device re-enabled." : "Device paused."),
    setCategory: (device, categories) =>
      run(`category-${device.id}`, () => updateDevice(device.id, { categories }), "Preferences saved."),
    sendTest: () =>
      run("test", async () => {
        const result = await sendTestNotification();
        if (!result.devices) throw new Error("No device is enabled yet — turn notifications on first.");
        if (!result.sent) throw new Error("The test could not be delivered. Check the browser's notification permission.");
      }, "Test notification sent — check your notification tray."),
    refresh,
  };
}