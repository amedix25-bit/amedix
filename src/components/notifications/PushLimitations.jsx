import React from "react";
import { AlertTriangle, Info, Lock, Smartphone } from "lucide-react";

// What the user must be told honestly: when push cannot work, and what it
// never guarantees. No promise of delivery is made anywhere in this app.
export default function PushLimitations({ support }) {
  return (
    <div className="space-y-3">
      {support?.reason === "ios_needs_home_screen" && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4" /> iPhone and iPad need one extra step
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Open AMedix in Safari.</li>
            <li>Tap Share, then “Add to Home Screen”.</li>
            <li>Open AMedix from the Home Screen icon and enable notifications there.</li>
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Apple only allows web notifications in an app added to the Home Screen, and only on iOS 16.4 or later.
          </p>
        </div>
      )}

      {support?.reason === "browser_unsupported" && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> This browser cannot receive background notifications
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use Chrome on Android, Chrome or Edge on a computer, or Safari 16.4 or later. Older Safari on macOS does not
            support web push.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4" /> What notifications can and cannot do
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Notifications arrive while AMedix is closed, as long as the device is on and connected.</li>
          <li>A phone that is powered off, in airplane mode, out of coverage, or with notifications blocked receives nothing until it is back online and AMedix is opened.</li>
          <li>Delivery can be delayed by the operating system, battery saver or Do Not Disturb. It is never guaranteed.</li>
          <li>Inside AMedix, every notification is always available in the portal, whether or not a push arrived.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="h-4 w-4" /> Your privacy on the lock screen
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Previews are deliberately generic. They never include a diagnosis, a medication name, a laboratory result, a
          patient name or a clinical note. The detail is only shown after you sign in and pass the usual access checks.
        </p>
      </div>
    </div>
  );
}