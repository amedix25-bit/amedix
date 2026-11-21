import React from "react";
import { BellRing, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import useWebPush from "@/hooks/useWebPush";
import DevicePreferences from "@/components/notifications/DevicePreferences";
import PushLimitations from "@/components/notifications/PushLimitations";

// The whole notification-settings surface for one signed-in account.
export default function PushSettingsCard({ portal = "patient" }) {
  const push = useWebPush(portal);
  const { support, thisDevice, devices, busy, error, notice, permission } = push;

  const otherDevices = devices.filter((d) => d.id !== thisDevice?.id);

  if (push.loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading notification settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BellRing className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Device notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get a short alert on this device when something in your account needs attention, even when AMedix is
              closed.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
          </p>
        )}

        {support.supported && !thisDevice && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4" /> Why AMedix asks for notification permission
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              AMedix uses notifications only for your own account: medication reminders, laboratory and imaging updates,
              appointment changes, access changes and secure messages. The preview never shows a diagnosis, a medication
              name, a result or a patient name. Nothing is sent for marketing, and you can turn this off at any time on
              this page.
            </p>
            {permission === "denied" ? (
              <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
                Notifications are blocked for AMedix in this browser. Open the browser’s site settings for this page,
                allow notifications, then reload.
              </p>
            ) : (
              <Button className="mt-3" onClick={push.enable} disabled={busy === "enable"}>
                {busy === "enable" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                Enable notifications on this device
              </Button>
            )}
          </div>
        )}

        {thisDevice && (
          <div className="mt-4">
            <DevicePreferences
              device={thisDevice}
              isThisDevice
              busy={busy}
              onSetEnabled={push.setEnabled}
              onSetCategory={push.setCategory}
              onRemove={(id) => push.disableThisDevice(id)}
              onTest={push.sendTest}
            />
          </div>
        )}
      </div>

      {otherDevices.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading text-base font-semibold text-foreground">Other devices</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Devices signed in to this account. Removing one stops all notifications to it.
          </p>
          <div className="mt-3 space-y-3">
            {otherDevices.map((device) => (
              <DevicePreferences
                key={device.id}
                device={device}
                isThisDevice={false}
                busy={busy}
                onSetEnabled={push.setEnabled}
                onSetCategory={push.setCategory}
                onRemove={push.remove}
                onTest={push.sendTest}
              />
            ))}
          </div>
        </div>
      )}

      <PushLimitations support={support} />
    </div>
  );
}