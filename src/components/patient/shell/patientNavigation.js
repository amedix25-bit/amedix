import { Home, CalendarDays, MessageSquareMore, FolderOpen, Heart, Syringe, Stethoscope, Files, FlaskConical, ScanLine, Pill, UserCircle, User, ShieldCheck, Building2, CreditCard } from "lucide-react";

export const NAV_SECTIONS = [
  { type: "item", key: "overview", label: "Home", icon: Home },
  { type: "item", key: "appointments", label: "Appointments", icon: CalendarDays },
  { type: "item", key: "medicalcard", label: "My Medical Card", icon: CreditCard },
  { type: "item", key: "messages", label: "Messages from Doctors", icon: MessageSquareMore },
  { type: "item", key: "directory", label: "Hospitals & Doctors", icon: Building2 },
  { type: "group", key: "record", label: "My Medical Record", icon: FolderOpen, items: [
    { key: "health", label: "Health Summary", icon: Heart },

    { key: "vaccinations", label: "Vaccinations", icon: Syringe },
    { key: "doctorvisits", label: "Visit Summaries", icon: Stethoscope },
    { key: "documents", label: "Reports & Documents", icon: Files },
  ] },
  { type: "item", key: "labs", label: "Lab Tests & Results", icon: FlaskConical },
  { type: "item", key: "imaging", label: "Imaging & Scans", icon: ScanLine },
  { type: "item", key: "drugs", label: "Medications & Prescriptions", icon: Pill },
  { type: "group", key: "settings", label: "Profile & Settings", icon: UserCircle, items: [
    { key: "profile", label: "Personal Information", icon: User },
    { key: "access", label: "Access & Privacy", icon: ShieldCheck },
  ] },
];
export const patientNavLabel = (key) => NAV_SECTIONS.flatMap((group) => group.items || [group]).find((item) => item.key === key)?.label || "";