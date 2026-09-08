import React from "react";
import LabNotificationsBar from "@/components/lab/portal/LabNotificationsBar";

// Top notification bar for the Technician Portal — same data and read state
// as the Lab Portal bar.
export default function TechnicianNotificationsBar({ session }) {
  return <LabNotificationsBar session={session} />;
}