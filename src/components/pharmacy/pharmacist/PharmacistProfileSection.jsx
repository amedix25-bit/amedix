import React from "react";
import { UserRound, Building2, ShieldCheck, Clock } from "lucide-react";

// The pharmacist's profile: their own account details and the pharmacy they
// belong to. Read-only — account management stays with the pharmacy
// administrator under the Pharmacists tab of the Pharmacy Portal.
export default function PharmacistProfileSection({ session, pharmacist, pharmacy }) {
  const name = pharmacist?.full_name || session?.full_name || "";
  const active = pharmacist ? pharmacist.is_active !== false : true;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{name}</p>
            <p className="text-xs text-muted-foreground">Pharmacist</p>
          </div>
          <span
            className={`ml-auto text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${
              active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            {active ? "Active" : "Deactivated"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="font-medium">{pharmacist?.username || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Active</p>
            <p className="font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {pharmacist?.last_active_datetime ? new Date(pharmacist.last_active_datetime).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{pharmacy?.pharmacy_name || "—"}</p>
            <p className="text-xs text-muted-foreground">{pharmacy?.pharmacy_number || "—"}</p>
          </div>
          {pharmacy?.status && (
            <span
              className={`ml-auto text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${
                pharmacy.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {pharmacy.status === "active" ? "Active" : pharmacy.status === "suspended" ? "Suspended" : "Pending Approval"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-medium">{pharmacy?.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{pharmacy?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium truncate">{pharmacy?.email || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}