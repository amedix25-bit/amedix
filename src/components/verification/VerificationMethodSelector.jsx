import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import DocumentVerificationCard from "@/components/verification/DocumentVerificationCard";

// The Verification Process section: the user chooses exactly ONE identity
// document — Passport, Driver's Licence or Birth Certificate (Personal Card is
// kept for accounts that already used it). The number printed on the document
// is read and compared with the number entered here by the AMedix automated
// engine, immediately — no queue, no review, no approval by anyone.
const METHODS = [
  { key: "passport", title: "Passport", twoSided: false },
  { key: "drivers_licence", title: "Driver's Licence", twoSided: true },
  { key: "birth_certificate", title: "Birth Certificate", twoSided: false },
  { key: "personal_card", title: "Personal Card", twoSided: true },
];

const METHOD_KEYS = METHODS.map((m) => m.key);

export default function VerificationMethodSelector({
  profileType, fullName = "", fullNameAr = "", cin = "", birthCertificateReadOnly = false,
  dateOfBirth = "", nationalIdNumber = "", result, onResult, t, initialMethod = "",
}) {
  const [method, setMethod] = useState(initialMethod);
  const [entered, setEntered] = useState({
    date_of_birth: "", national_id_number: "", personal_card_number: "", passport_number: "", licence_number: "",
  });

  // A returning account reopens the document it already submitted (pending,
  // approved or rejected) so its real state is shown instead of a blank form.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const page = await base44.entities.IdentityVerification.filter(
          { user_id: me.id, profile_type: profileType },
          { sort: "-created_date", limit: 1 }
        );
        const latest = (page.items || [])[0];
        if (cancelled || !latest || !METHOD_KEYS.includes(latest.document_type)) return;
        setMethod((cur) => cur || latest.document_type);
        onResult({
          status: latest.status,
          verification_id: latest.id,
          reason: latest.reason || "",
          review_reason: latest.review_reason || "",
          submitted_datetime: latest.attempted_datetime || "",
        });
      } catch (err) {
        // No saved submission — the form simply starts empty.
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType]);

  const chooseMethod = (key) => {
    setMethod(key);
    onResult(null);
  };

  const setValue = (key, value) => {
    setEntered((s) => ({ ...s, [key]: value }));
    onResult(null);
  };

  const description = t("Photograph the document, choose a photo from your gallery, or upload a PDF.");

  const configs = {
    passport: {
      title: t("Passport"),
      twoSided: false,
      fields: [
        { key: "full_name", label: t("Full Name"), readOnly: true },
        { key: "passport_number", label: t("Passport Number"), placeholder: t("Passport Number") },
      ],
      values: { full_name: fullName, passport_number: entered.passport_number },
    },
    drivers_licence: {
      title: t("Driver's Licence"),
      twoSided: true,
      fields: [
        { key: "full_name", label: t("Full Name"), readOnly: true },
        { key: "licence_number", label: t("Licence Number"), placeholder: t("Licence Number") },
      ],
      values: { full_name: fullNameAr || fullName, licence_number: entered.licence_number },
    },
    birth_certificate: {
      title: t("Birth Certificate"),
      twoSided: false,
      fields: [
        { key: "date_of_birth", label: t("Date of Birth"), readOnly: birthCertificateReadOnly, type: "date" },
        { key: "national_id_number", label: t("National ID Number"), readOnly: birthCertificateReadOnly },
      ],
      values: {
        date_of_birth: birthCertificateReadOnly ? dateOfBirth : entered.date_of_birth,
        national_id_number: birthCertificateReadOnly ? nationalIdNumber : entered.national_id_number,
      },
    },
    personal_card: {
      title: t("Personal Card"),
      twoSided: true,
      fields: [
        { key: "full_name", label: t("Full Name"), readOnly: true },
        { key: "personal_card_number", label: t("Personal Card Number"), placeholder: t("Personal Card Number") },
      ],
      values: { full_name: fullNameAr || fullName, personal_card_number: entered.personal_card_number },
    },
  };

  const config = method ? configs[method] : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => chooseMethod(m.key)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left rtl:text-right transition-colors ${
              method === m.key ? "border-primary bg-accent" : "border-border hover:border-primary/40"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                method === m.key ? "border-primary" : "border-muted-foreground/40"
              }`}
            >
              {method === m.key && <span className="w-2 h-2 rounded-full bg-primary" />}
            </span>
            <span className="text-sm font-medium">{t(m.title)}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("Choose one document — the number printed on it is checked automatically against the number you enter. The other documents are not required.")}
      </p>
      {config?.twoSided && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium">
          {t("You must photograph both sides of this document — the front and the back.")}
        </p>
      )}
      {config && (
        <DocumentVerificationCard
          profileType={profileType}
          documentType={method}
          title={config.title}
          description={description}
          twoSided={config.twoSided}
          fields={config.fields}
          values={config.values}
          onValueChange={setValue}
          result={result}
          onResult={onResult}
          t={t}
        />
      )}
    </div>
  );
}