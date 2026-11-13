import React from "react";
import { Award, BookOpen, Building2, GraduationCap, Link2, MapPin, Microscope, UserRound } from "lucide-react";
import DoctorAvatar from "@/components/DoctorAvatar";
import VerifiedQualifications from "./VerifiedQualifications";
import { displayDoctor } from "@/lib/messaging";
import {
  ACHIEVEMENT_TYPES,
  EDUCATION_TYPES,
  labelOf,
  yearRange,
} from "@/lib/professionalProfile";

// Read-only presentation of a physician's professional identity. Everything
// that can be hidden by the owner is already filtered out server-side before it
// reaches this component, so what is rendered here is exactly what may be seen.
const ACHIEVEMENT_ICONS = {
  award: Award,
  publication: BookOpen,
  conference: Microscope,
  accomplishment: GraduationCap,
  experience: UserRound,
};

function SectionTitle({ icon: Icon, title, children }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

const SelfReported = () => (
  <span className="shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
    Self-reported
  </span>
);

function EducationList({ entries }) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.entry_id} className="flex items-start gap-3 rounded-xl border border-border p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{entry.title}</p>
            <p className="text-xs text-muted-foreground">
              {[labelOf(EDUCATION_TYPES, entry.type, "Qualification"), entry.institution, entry.field, entry.country, yearRange(entry)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {entry.notes ? <p className="mt-1 text-xs text-foreground/80">{entry.notes}</p> : null}
          </div>
          <SelfReported />
        </li>
      ))}
    </ul>
  );
}

function AchievementList({ entries }) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const Icon = ACHIEVEMENT_ICONS[entry.type] || Award;
        return (
          <li key={entry.entry_id} className="flex items-start gap-3 rounded-xl border border-border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{entry.title}</p>
              <p className="text-xs text-muted-foreground">
                {[labelOf(ACHIEVEMENT_TYPES, entry.type, "Achievement"), entry.organization, entry.year]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {entry.detail ? <p className="mt-1 text-xs text-foreground/80">{entry.detail}</p> : null}
              {entry.link ? (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-info hover:underline"
                >
                  <Link2 className="h-3 w-3" /> View source
                </a>
              ) : null}
            </div>
            <SelfReported />
          </li>
        );
      })}
    </ul>
  );
}

export default function PhysicianProfileView({ profile, actions }) {
  if (!profile) return null;
  const meta = [
    profile.verified?.specialty,
    profile.workplace || profile.verified?.hospital,
    profile.location,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-primary via-primary to-doctor-blue/70" />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end gap-3">
            <DoctorAvatar
              photoUrl={profile.photo_url}
              name={profile.full_name}
              className="h-20 w-20 text-xl ring-4 ring-card"
            />
            <div className="min-w-0 flex-1 pb-0.5">
              <h2 className="truncate font-heading text-lg font-bold text-foreground sm:text-xl">
                {displayDoctor(profile.full_name)}
              </h2>
              {profile.professional_title ? (
                <p className="truncate text-sm text-muted-foreground">{profile.professional_title}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2 pb-0.5">{actions}</div> : null}
          </div>

          {meta.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {profile.verified?.specialty ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <UserRound className="h-3.5 w-3.5" /> {profile.verified.specialty}
                </span>
              ) : null}
              {profile.workplace || profile.verified?.hospital ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {profile.workplace || profile.verified?.hospital}
                </span>
              ) : null}
              {profile.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </span>
              ) : null}
            </p>
          )}
        </div>
      </header>

      {profile.restricted && (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          This physician shares their full professional profile with their connections only. Connect to view
          their education, achievements and biography.
        </p>
      )}

      <VerifiedQualifications verified={profile.verified} />

      {profile.bio ? (
        <section className="rounded-2xl border border-border bg-card p-4">
          <SectionTitle icon={UserRound} title="Professional biography" />
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
        </section>
      ) : null}

      {(profile.education?.length > 0 || !profile.restricted) && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <SectionTitle icon={GraduationCap} title="Education & Qualifications">
            <span className="text-[10px] text-muted-foreground">Entered by the physician</span>
          </SectionTitle>
          {profile.education?.length > 0 ? (
            <EducationList entries={profile.education} />
          ) : (
            <p className="text-xs text-muted-foreground">No education or qualifications have been added yet.</p>
          )}
        </section>
      )}

      {(profile.achievements?.length > 0 || !profile.restricted) && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <SectionTitle icon={Award} title="Achievements & Experience">
            <span className="text-[10px] text-muted-foreground">Entered by the physician</span>
          </SectionTitle>
          {profile.achievements?.length > 0 ? (
            <AchievementList entries={profile.achievements} />
          ) : (
            <p className="text-xs text-muted-foreground">No achievements or experience have been added yet.</p>
          )}
        </section>
      )}

      <p className="rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        Professional information only. A connection between physicians never grants access to patients, clinical
        records, notes or hospital information.
      </p>
    </div>
  );
}