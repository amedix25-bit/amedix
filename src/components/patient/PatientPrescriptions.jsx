import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Pill, Loader2, ShieldCheck, QrCode, MapPin } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionAvailability from "@/components/pharmacy/PrescriptionAvailability";
import QrCodeCard from "@/components/QrCodeCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

function AuthorizationFlow({ prescription, onAuthorized }) {
  const { t } = usePatientLanguage();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAuthorize = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("authorizePrescriptionPharmacy", {
        prescription_id: prescription.id,
        pharmacy_id: selected.pharmacy_id,
      });
      onAuthorized?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("Failed to authorize the pharmacy."));
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-primary" />
        {t("Choose a Pharmacy")}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {t("The pharmacy only sees this prescription after you select it and explicitly allow dispensing.")}
      </p>
      <div className="mt-3">
        <PrescriptionAvailability
          medicationName={prescription.medication_name}
          strength={prescription.strength}
          activeIngredient={prescription.active_ingredient}
          onSelect={setSelected}
        />
      </div>
      {selected && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">{selected.pharmacy_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {selected.address || "—"} · {selected.quantity_in_stock} in stock
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={submitting} className="gap-1.5 mt-3">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {t("Allow Pharmacy to Dispense")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Allow Pharmacy Access?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "You are giving {pharmacy} (A&M Pharmacy Number {number}) permission to dispense this prescription and reserve the medication for you.",
                    { pharmacy: selected.pharmacy_name, number: selected.pharmacy_number || "—" }
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                <Button onClick={handleAuthorize} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("Yes, Allow")}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSelected(null)}>
            {t("Change")}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}

// The patient's Prescriptions page: full dispensing journey, authorization of
// a pharmacy with live stock, and the CIN QR code to present at the counter.
export default function PatientPrescriptions() {
  const { user } = useAuth();
  const { t } = usePatientLanguage();
  const [items, setItems] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, page] = await Promise.all([
          base44.entities.PatientProfile.filter({ user_id: user.id }, { limit: 1 }),
          base44.entities.Prescription.filter({ patient_user_id: user.id }, { sort: "-created_date", limit: 100 }),
        ]);
        setProfile((profiles.items || profiles)[0] || null);
        setItems(page.items || page);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    };
    if (user) load();
  }, [user]);

  if (!items) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-lg">
          {t("Your prescriptions and their journey through affiliated pharmacies — from issue to dispensing.")}
        </p>
        {profile && (
          <Button variant="outline" size="sm" onClick={() => setQrOpen((s) => !s)} className="gap-1.5 shrink-0">
            <QrCode className="w-4 h-4" />
            {t("My CIN QR Code")}
          </Button>
        )}
      </div>

      {qrOpen && profile && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 flex-wrap">
          <QrCodeCard cin={profile.cin} size={140} />
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("Present this QR code at any affiliated pharmacy so the pharmacist can identify your account and dispense your authorized prescriptions.")}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-border bg-card">
          {t("No prescriptions yet. Prescriptions issued by your doctors appear here.")}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-primary" />
                    {p.medication_name}{p.strength ? ` ${p.strength}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.prescription_id} · {t("Prescribed by")} {p.doctor_name || "—"} · {p.date_prescribed}
                  </p>
                </div>
                <PrescriptionStatusBadge status={p.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                <div><span className="text-muted-foreground">{t("Dosage")}:</span> {p.dosage || "—"}</div>
                <div><span className="text-muted-foreground">{t("Frequency")}:</span> {p.frequency || "—"}</div>
                <div><span className="text-muted-foreground">{t("Duration")}:</span> {p.duration || "—"}</div>
                <div><span className="text-muted-foreground">{t("Quantity")}:</span> {p.quantity || "—"}</div>
              </div>
              {p.special_instructions && (
                <p className="text-xs text-muted-foreground mt-2">{t("Instructions")}: {p.special_instructions}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {t("Refills")}: {p.refills_used || 0}/{p.refills_authorized || 0} {t("used")}
              </p>

              {p.authorized_pharmacy_name ? (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {p.authorized_pharmacy_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.authorized_pharmacy_address || "—"}
                    {p.reservation_code && p.status !== "dispensed" ? ` · ${t("Reservation")} ${p.reservation_code}` : ""}
                  </p>
                  {p.status === "dispensed" && p.dispensed_datetime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("Dispensed")} {new Date(p.dispensed_datetime).toLocaleString()} · {p.dispensed_by_name || ""}
                    </p>
                  )}
                </div>
              ) : p.status === "issued" ? (
                <AuthorizationFlow prescription={p} onAuthorized={() => {
                  const load = async () => {
                    const page = await base44.entities.Prescription.filter(
                      { patient_user_id: user.id },
                      { sort: "-created_date", limit: 100 }
                    );
                    setItems(page.items || page);
                  };
                  load();
                }} />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}