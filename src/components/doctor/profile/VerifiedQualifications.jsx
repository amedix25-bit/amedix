import React from "react";
import { BadgeCheck, Building2, ShieldCheck, ShieldQuestion, Stethoscope } from "lucide-react";

// AMedix-verified facts — the licence, the specialty and the hospital are the
// only parts of the professional profile the platform itself confirms. They are
// shown apart from anything the doctor wrote about themselves, so a reader can
// never mistake a self-reported statement for a verified one.
function Fact({ icon: Icon, label, value, verified, detail }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
      {detail ? <p className="truncate text-xs text-muted-foreground">{detail}</p> : null}
      <span
        className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          verified ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        {verified ? <ShieldCheck className="h-3 w-3" /> : <ShieldQuestion className="h-3 w-3" />}
        {verified ? "Verified by AMedix" : "Not verified"}
      </span>
    </div>
  );
}

export default function VerifiedQualifications({ verified, className = "" }) {
  if (!verified) return null;
  const licenceDetail = verified.licence_verified
    ? verified.licence_number
      ? `Licence ${verified.licence_number}`
      : "Professional licence verified"
    : "";

  return (
    <section className={className}>
      <h3 className="mb-2 flex items-center gap-1.5 font-heading text-sm font-semibold">
        <BadgeCheck className="h-4 w-4 text-success" />
        Verified qualifications
      </h3>
      <div className="grid gap-2 sm:grid-cols-3">
        <Fact
          icon={BadgeCheck}
          label="Medical licence"
          value={verified.licence_verified ? "Verified" : "Not verified"}
          detail={licenceDetail}
          verified={verified.licence_verified}
        />
        <Fact
          icon={Stethoscope}
          label="Specialty"
          value={verified.specialty || "Not recorded"}
          detail={verified.specialties?.length > 1 ? verified.specialties.join(", ") : ""}
          verified={verified.specialty_verified}
        />
        <Fact
          icon={Building2}
          label="Hospital affiliation"
          value={verified.hospital || "Not recorded"}
          verified={verified.hospital_verified}
        />
      </div>
    </section>
  );
}