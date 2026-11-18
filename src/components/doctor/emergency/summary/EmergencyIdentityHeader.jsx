import React from "react";
import { Badge } from "@/components/ui/badge";
import { Droplet, Phone, ShieldAlert, User } from "lucide-react";
import { formatStamp } from "./EmergencySummaryUi";

// Patient identification at the top of the emergency summary. It is read
// straight from the patient's AMedix record — the CIN stays the identifier, no
// other health number is ever substituted.
export default function EmergencyIdentityHeader({ identity = {}, meta = {} }) {
  const contact = identity.emergency_contact;
  const sex = String(identity.sex_recorded || "").trim();
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {identity.photo_url ? (
            <img src={identity.photo_url} alt={identity.name || "Patient"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl font-bold leading-tight" dir="auto">
            {identity.name || "Patient name not recorded"}
          </p>
          {identity.name_ar ? (
            <p className="text-sm text-muted-foreground" dir="rtl">
              {identity.name_ar}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-mono text-xs font-semibold">CIN {identity.cin || "—"}</span>
            <span className="text-muted-foreground">DOB {identity.date_of_birth || "not documented"}</span>
            <span className="text-muted-foreground">Age {identity.age != null ? `${identity.age} yrs` : "—"}</span>
            <span className="text-muted-foreground">Sex {sex ? sex.replace(/_/g, " ") : "not documented"}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={identity.blood_group_known ? "border-red-200 bg-red-50 text-red-800" : "text-muted-foreground"}>
              <Droplet className="mr-1 h-3 w-3" />
              {identity.blood_group_known ? identity.blood_group : "Blood group not documented"}
              {identity.blood_group_known ? (identity.blood_group_verified ? " · verified" : " · unverified") : ""}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              Language {identity.preferred_language || "not documented"}
            </Badge>
            {identity.nationality ? (
              <Badge variant="secondary" className="text-[11px]">
                {identity.nationality}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Emergency contact</p>
          {contact ? (
            <p className="mt-0.5 text-sm">
              <span className="font-medium" dir="auto">{contact.name}</span>
              {contact.relationship ? <span className="text-muted-foreground"> · {contact.relationship}</span> : null}
              {contact.phone ? (
                <span className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {contact.phone}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">Not documented</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Substitute decision-maker / guardian</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {identity.guardian || "Not documented in AMedix"}
          </p>
        </div>
      </div>

      <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldAlert className="h-3 w-3" />
        Emergency summary for {meta.department || "the Emergency Department"}
        {meta.hospital ? ` · ${meta.hospital}` : ""} · Generated {formatStamp(meta.generated_at)}
      </p>
    </div>
  );
}