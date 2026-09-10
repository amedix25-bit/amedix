import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ScanLine, Check, X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Patient Portal → Radiology Requests.
// Pending radiologist access requests for the patient's imaging orders, with
// Accept / Decline. Accepting authorizes the radiologist to view ONLY that
// one imaging request — never the rest of the medical record.
export default function PatientRadiologyRequests({ profile }) {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const list = await base44.entities.ImagingRequestAccess.filter(
        { patient_id: profile.id },
        "-date_requested"
      );
      setItems(list);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  const respond = async (item, action) => {
    setBusyId(item.id);
    try {
      await base44.functions.invoke("radiologyRespondAccess", { access_id: item.id, action });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
        <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No radiology requests</p>
        <p className="text-xs mt-1">
          You'll be notified when a radiologist requests access to one of your imaging requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border bg-card p-4 ${
            item.status === "accepted" ? "border-emerald-200" : item.status === "declined" ? "border-red-200" : "border-amber-200 bg-amber-50/30"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium flex flex-wrap items-center gap-2">
                {item.scan_type} — {item.examination}
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    item.status === "accepted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : item.status === "declined"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {item.status}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Imaging order by Dr. {item.doctor_name} · {item.request_date || item.date_requested}
                {item.request_ref ? ` · Ref: ${item.request_ref}` : ""}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Radiologist requesting access: <span className="font-medium text-foreground">{item.radiologist_name}</span>
              </p>
            </div>

            <div className="shrink-0">
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respond(item, "accept")} disabled={busyId === item.id}>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respond(item, "decline")} disabled={busyId === item.id}>
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
              {item.status === "accepted" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {item.radiologist_name} can view this imaging request only
                </span>
              )}
              {item.status === "declined" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  <X className="w-3.5 h-3.5" />
                  {item.radiologist_name} cannot view this request
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}