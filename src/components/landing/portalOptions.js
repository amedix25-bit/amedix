import { User, Stethoscope, FlaskConical, Building2, Pill } from "lucide-react";

export const PORTAL_OPTIONS = [
  {
    key: "patient", icon: User, title: "I am a Patient",
    summary: "Access your clinical records with your unique CIN and control which doctors can see them.",
    description: "Log in to view your records, appointments, and test results — or create an account to receive your unique Clinical Identification Number (CIN) and QR code.",
  },
  {
    key: "doctor", icon: Stethoscope, title: "I am a Doctor",
    summary: "Search patients by CIN, manage appointments, clinical notes, and test requests.",
    description: "Log in to manage your patients, appointments, and clinical records — or register your professional account to get started.",
  },
  {
    key: "lab", icon: FlaskConical, title: "I am a Lab",
    summary: "Register your laboratory, manage technicians, and process laboratory requests.",
    description: "Register your laboratory, manage technicians, and process laboratory requests — or sign in to your Lab Portal.",
  },
  {
    key: "hospital", icon: Building2, title: "I am a Hospital",
    summary: "Register your hospital, manage receptionists, patient check-ins, and visit payments.",
    description: "Register your hospital, manage receptionists, patient check-ins, and visit payments — or sign in to your Hospital Portal.",
  },
  {
    key: "pharmacy", icon: Pill, title: "I am a Pharmacy",
    summary: "Manage medication stock, reserve prescriptions, and dispense to patients.",
    description: "Register your pharmacy, manage medication stock, and dispense authorized prescriptions — or sign in to your Pharmacy Portal.",
  },
];