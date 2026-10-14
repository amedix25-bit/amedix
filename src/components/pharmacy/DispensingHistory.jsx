import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";

// The dispensing history of one prescription — every Fill Prescription
// transaction with its quantity, pharmacist, pharmacy and remaining
// quantity. Shared by the Pharmacy, Patient and Doctor portals.
export default function DispensingHistory({ prescription, title }) {
  const { t } = useAppLanguage();
  const events = prescription.dispensing_events || [];
  if (events.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title || t("Dispensing History")}
      </p>
      <div className="mt-2 space-y-1.5">
        {events.map((ev, i) => (
          <div key={i} className="flex items-start justify-between gap-2 text-xs">
            <span className="min-w-0">
              <span className="font-medium">{ev.quantity}</span>
              {ev.consumed_refill && (
                <span className="ml-1 text-muted-foreground">({t("refill")})</span>
              )}
              {" · "}
              {new Date(ev.datetime).toLocaleString()}
              {" · "}
              {ev.pharmacist_name || "—"}
              {ev.pharmacy_name ? `, ${ev.pharmacy_name}` : ""}
              {typeof ev.payment_amount === "number" && (
                <span className="ml-1 font-medium">
                  {" · "}
                  {t("Paid {amount}", { amount: ev.payment_amount })}
                  {ev.payment_method ? ` (${ev.payment_method})` : ""}
                </span>
              )}
            </span>
            {typeof ev.remaining_after === "number" && (
              <span className={`shrink-0 ${ev.remaining_after > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {ev.remaining_after > 0
                  ? t("{count} remaining", { count: ev.remaining_after })
                  : t("Complete")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}