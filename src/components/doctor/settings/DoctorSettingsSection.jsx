import React from "react";
import { Button } from "@/components/ui/button";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import DoctorNameEdit from "@/components/doctor/DoctorNameEdit";
import DoctorSpecialtySelect from "@/components/doctor/DoctorSpecialtySelect";
import DoctorSignatureSettings from "@/components/doctor/signature/DoctorSignatureSettings";
import { Bell, Building2, Languages, PenLine, ShieldCheck, Stethoscope, User } from "lucide-react";

// Doctor Portal → Settings. Account, professional and language settings, all
// writing through the existing profile components — no parallel settings store.
function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function DoctorSettingsSection({ profile, onProfileUpdated, user, hospitalSession, onNavigate }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card icon={User} title="Account" description="The name and email your patients and hospitals see.">
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name: </span>{profile?.full_name || "Not set"}</p>
          <p><span className="text-muted-foreground">Email: </span>{user?.email || "—"}</p>
        </div>
        <div className="mt-3">
          <DoctorNameEdit profile={profile} onUpdated={onProfileUpdated} />
        </div>
      </Card>

      <Card icon={Stethoscope} title="Professional details" description="Your specialty drives which clinical documentation the portal opens.">
        <p className="mb-2 text-sm">
          <span className="text-muted-foreground">Specialty: </span>
          {profile?.specialization || "Not set"}
        </p>
        {profile ? <DoctorSpecialtySelect profile={profile} onSelected={onProfileUpdated} /> : null}
      </Card>

      <Card icon={Bell} title="Notifications" description="Which devices receive alerts, and what they may alert you about.">
        <p className="text-sm text-muted-foreground">
          Alerts never include a patient name, diagnosis or result on the lock screen.
        </p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => { window.location.href = "/notification-settings?portal=doctor"; }}
        >
          <Bell className="h-4 w-4" /> Manage notifications
        </Button>
      </Card>

      <Card icon={Building2} title="Hospital affiliation" description="Your AMedix hospital is verified for each portal session.">
        <p className="text-sm">
          <span className="text-muted-foreground">Current hospital: </span>
          {hospitalSession?.hospital_name || profile?.hospital || "Not verified"}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate({ key: "hospitals" })}>
          Manage my hospitals
        </Button>
      </Card>

      <Card icon={PenLine} title="My Professional Signature" description="Required on every laboratory request you issue. Stored privately and applied only when you sign.">
        <DoctorSignatureSettings profile={profile} user={user} />
      </Card>

      <Card icon={Languages} title="Language and region" description="The portal language applies to labels across your screens.">
        <AppLanguageSwitcher />
      </Card>

      <Card icon={ShieldCheck} title="Security" description="Your AMedix session and record access controls.">
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>Every patient record you open requires the patient&rsquo;s own authorization.</li>
          <li>Clinical notes are electronically signed with your name and the time of saving.</li>
          <li>Access to records, messaging and prescribing is recorded in the audit history.</li>
          <li>To change your password, sign out and use &ldquo;Forgot password&rdquo; on the sign-in screen.</li>
        </ul>
      </Card>
    </div>
  );
}