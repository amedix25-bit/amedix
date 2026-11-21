import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientMedicalIdCard from "@/components/patient/PatientMedicalIdCard";
import MedicalCardActions from "@/components/patient/card/MedicalCardActions";

function day(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PatientMedicalCard({ profile }) {
  const { t, lang } = usePatientLanguage();
  const [card, setCard] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [walletConfigured, setWalletConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState("");

  const load = useCallback(async (action = "get") => {
    const response = await base44.functions.invoke("medicalCard", { action });
    const data = response.data || {};
    if (data.error) throw new Error(data.error);
    setCard(data.card);
    setWalletConfigured(Boolean(data.walletConfigured));
  }, []);

  const loadCardDetails = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [conditionList, allergyList] = await Promise.all([
        base44.entities.MedicalCondition.filter({ patient_id: profile.id }),
        base44.entities.Allergy.filter({ patient_id: profile.id }),
      ]);
      setConditions(conditionList || []);
      setAllergies(allergyList || []);
    } catch (err) {
      console.error(err);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadCardDetails();
  }, [loadCardDetails]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await load("get");
      } catch (err) {
        if (alive) setError(t("Your medical card could not be loaded. Please try again."));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load, t]);

  const manage = async (action) => {
    setError("");
    setBusy(action);
    try {
      await load(action);
      setConfirming("");
    } catch (err) {
      setError(t("The card could not be updated. Please try again."));
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        {t("Loading your medical card...")}
      </div>
    );
  }

  if (error && !card) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
          {t("My Medical Card")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Your AMedix digital medical card identifies you at hospitals, laboratories and pharmacies. It shows identification only — never your clinical record.")}
        </p>
      </div>

      {card && (
        <>
          <PatientMedicalIdCard
            profile={profile}
            card={card}
            conditions={conditions}
            allergyText={allergies.map((a) => a.allergen).filter(Boolean).join(", ")}
            emergencyContact={profile?.emergency_contacts?.[0]}
            onConditionsChanged={loadCardDetails}
          />

          <MedicalCardActions
            card={card}
            verifyUrl={card.verify_url}
            walletConfigured={walletConfigured}
            lang={lang}
            t={t}
          />

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">{t("Card details")}</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">{t("Status")}</dt>
                <dd className="text-sm font-medium capitalize text-foreground">{t(card.status)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("Issued")}</dt>
                <dd className="text-sm font-medium text-foreground">{day(card.issued_datetime)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("Valid until")}</dt>
                <dd className="text-sm font-medium text-foreground">{day(card.expires_datetime)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("Card number")}</dt>
                <dd className="break-all font-mono text-sm font-medium text-foreground">{card.card_number}</dd>
              </div>
              {card.revoked_reason && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">{t("Revocation reason")}</dt>
                  <dd className="text-sm font-medium text-foreground">{card.revoked_reason}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {confirming === "reissue" ? (
                <>
                  <Button size="sm" onClick={() => manage("reissue")} disabled={busy === "reissue"} className="gap-2">
                    {busy === "reissue" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {t("Confirm reissue")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming("")}>{t("Cancel")}</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setConfirming("reissue")}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t("Reissue card")}
                </Button>
              )}

              {card.status !== "revoked" && (
                confirming === "revoke" ? (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => manage("revoke")} disabled={busy === "revoke"} className="gap-2">
                      {busy === "revoke" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {t("Confirm revoke")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirming("")}>{t("Cancel")}</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => setConfirming("revoke")}>
                    <ShieldOff className="h-4 w-4" aria-hidden="true" />
                    {t("Revoke card")}
                  </Button>
                )
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("Reissuing makes the previous card stop verifying immediately. A PDF or Wallet card already saved on a phone is checked against the current status every time its code is scanned.")}
            </p>
          </div>

          {Array.isArray(card.audit) && card.audit.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">{t("Card history")}</h3>
              <ul className="mt-3 space-y-2">
                {card.audit.slice().reverse().map((entry, index) => (
                  <li key={`${entry.datetime}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="capitalize text-foreground">{t(entry.action)}</span>
                    <span className="text-xs text-muted-foreground">{day(entry.datetime)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}