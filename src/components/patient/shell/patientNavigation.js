import { Home, CalendarDays, MessageSquareMore, FolderOpen, Heart, ClipboardList, ShieldPlus, Scissors, Syringe, Stethoscope, Files, FlaskConical, ScanLine, Pill, UserCircle, User, ShieldCheck } from "lucide-react";

export const NAV_SECTIONS = [
  { type: "item", key: "overview", label: "Home", icon: Home },
  { type: "item", key: "appointments", label: "Appointments", icon: CalendarDays },
  { type: "item", key: "messages", label: "Messages from Doctors", icon: MessageSquareMore },
  { type: "group", key: "record", label: "My Medical Record", icon: FolderOpen, items: [
    { key: "health", label: "Health Summary", icon: Heart },
    { key: "conditions", label: "Diagnoses & Conditions", icon: ClipboardList },
    { key: "allergies", label: "Allergies", icon: ShieldPlus },
    { key: "surgeries", label: "Surgeries & Procedures", icon: Scissors },
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