import React from "react";
import { CalendarDays, Clock, MapPin, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientAppointmentDetails({ appointment, open, onOpenChange, onManage }) {
  const { t, locale } = usePatientLanguage();
  if (!appointment) return null;
  const rows = [
    [Stethoscope, t("Doctor"), appointment.doctor_name],
    [CalendarDays, t("Date"), appointment.date && new Date(`${appointment.date}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })],
    [Clock, t("Time"), appointment.time],
    [MapPin, t("Location"), appointment.location],
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t("Upcoming Appointment")}</DialogTitle></DialogHeader>
    {appointment.reason && <p className="font-semibold">{appointment.reason}</p>}
    <dl className="space-y-3">{rows.map(([Icon, label, value]) => value && <div key={label} className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 text-primary" /><dt className="text-muted-foreground">{label}</dt><dd className="ml-auto text-right">{value}</dd></div>)}</dl>
    {appointment.notes && <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>}
    <Button onClick={() => { onOpenChange(false); onManage(); }}>{t("Manage Appointment")}</Button>
  </DialogContent></Dialog>;
}