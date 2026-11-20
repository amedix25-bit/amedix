import React, { useState } from "react";
import { Info, ShieldCheck, ChevronDown, CheckCircle2, XCircle, Lock, Stethoscope, UserRound, UserCog } from "lucide-react";
import { REGISTRATION_FIELD_GROUPS, VISIBILITY, VISIBILITY_NOTES } from "@/lib/registrationFieldCatalog";

const ROLE_ICONS = { patient: UserRound, doctor: Stethoscope, admin: UserCog };

function VisibilityChip({ role, value }) {
  const Icon = ROLE_ICONS[role];
  const style = VISIBILITY[value] || VISIBILITY.no;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.className}`}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}

function FieldRow({ field }) {
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{field.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground break-words">Stored in: {field.stored}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            field.required ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {field.required ? "Mandatory" : "Optional"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Visible to</span>
        <VisibilityChip role="patient" value={field.patient} />
        <VisibilityChip role="doctor" value={field.doctor} />
        <VisibilityChip role="admin" value={field.admin} />
      </div>
    </div>
  );
}

function Group({ group, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{group.step}</p>
          <p className="mt-0.5 text-sm font-semibold">{group.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{group.note}</p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div>
          {group.fields.map((field) => (
            <FieldRow key={field.label} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}

// Documents what patient registration collects: which items are mandatory, who
// can see each one, and where it ends up in the patient record. Documentation
// only — it changes no permission and no workflow.
export default function RegistrationInformationOverview() {
  const [openKeys, setOpenKeys] = useState([REGISTRATION_FIELD_GROUPS[0].key]);

  const toggle = (key) =>
    setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const total = REGISTRATION_FIELD_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);
  const mandatory = REGISTRATION_FIELD_GROUPS.reduce(
    (sum, g) => sum + g.fields.filter((f) => f.required).length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Registration information overview</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {total} items are collected during patient registration, {mandatory} of them mandatory. Expand a section to
              see what is required, who can see it, and where it is stored.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(VISIBILITY).map(([key, style]) => (
            <span key={key} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.className}`}>
              {style.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Access rules that apply to all of it</h4>
        </div>
        <ul className="mt-2 space-y-2">
          {VISIBILITY_NOTES.map((note) => (
            <li key={note} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {REGISTRATION_FIELD_GROUPS.map((group) => (
          <Group key={group.key} group={group} open={openKeys.includes(group.key)} onToggle={() => toggle(group.key)} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-sm font-semibold">How it is organised in the patient profile</h4>
        <ul className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
            <span>
              One profile record holds identity, contact, lifestyle and preventive-care answers; the CIN is generated
              once and never changes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
            <span>
              Each condition, admission, surgery, family entry, allergy, medication, screening and chronic-care item is
              its own record linked to the patient — so a doctor can read them individually rather than as one block of
              text.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
            <span>Uploaded documents are stored privately and opened through short-lived signed links only.</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <span>Nothing in this preview writes any of it: no profile, no records, no CIN, no documents.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}