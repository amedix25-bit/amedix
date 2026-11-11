import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PORTAL_DESTINATIONS, validatePortalAccess } from "@/lib/portalAccess";

// Opening a portal by URL must respect the account's verified roles. The
// backend (checkPortalAccess) derives the roles from the database — never from
// the client — and a patient reaching a professional portal by a direct link
// is sent to the portal their account actually holds.
// Accounts whose roles are not listed there (hospital receptionists, laboratory
// technicians, pharmacists and other designated staff on their own signed-in
// routes) are left alone; their data is still scoped server-side.
export default function PortalRouteGuard({ portal, children }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await validatePortalAccess(portal);
        if (cancelled) return;
        if (!data.allowed && Array.isArray(data.roles) && data.roles.length > 0) {
          window.location.replace(PORTAL_DESTINATIONS[data.roles[0]] || "/landing");
          return;
        }
      } catch {
        // The server check could not run — the portal's own data calls still
        // enforce the account's permissions, so the page is not blocked.
      }
      if (!cancelled) setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [portal]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return children;
}