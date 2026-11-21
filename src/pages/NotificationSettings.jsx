import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PushSettingsCard from "@/components/notifications/PushSettingsCard";

const PORTAL_HOME = {
  patient: "/patient",
  doctor: "/doctor",
  laboratory: "/lab-portal",
  pharmacy: "/pharmacy-portal",
  hospital: "/hospital-portal",
  radiology: "/radiologist",
  admin: "/admin",
};

// Notification settings for the signed-in account. Reachable from every portal;
// the portal only decides which one to return to.
export default function NotificationSettings() {
  const params = new URLSearchParams(window.location.search);
  const portal = params.get("portal") || "patient";
  const backTo = PORTAL_HOME[portal] || "/";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to your portal
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Notification settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which devices receive AMedix notifications, and what they may alert you about.
        </p>
        <div className="mt-6">
          <PushSettingsCard portal={portal} />
        </div>
      </div>
    </div>
  );
}