import React, { useState } from "react";
import DocumentVerificationCard from "@/components/verification/DocumentVerificationCard";
import PassportScanUpload from "@/components/verification/PassportScanUpload";

// The Verification Process section: the user chooses exactly ONE identity
// verification method — Birth Certificate, Personal Card or Passport. A
// successful verification of the selected method is sufficient to verify the
// account; the other methods are not required. The backend re-validates the
// chosen method — this UI never decides the verdict.
const METHODS = [
  { key: "birth_certificate", title: "Birth Certificate", description: "Upload a clear photo or PDF", twoSided: false },
  { key: "personal_card", title: "Personal Card", description: "Upload clear photos of both sides, or one PDF containing both sides", twoSided: true },
  { key: "passport", title: "Passport", description: "Scan your passport or upload an existing document", twoSided: false },
];

export default function VerificationMethodSelector({
  profileType, fullName = "", cin = "", birthCertificateReadOnly = false, dateOfBirth = "", nationalIdNumber = "", result, onResult, t,
}) {
  const [method, setMethod] = useState("");
  // Identity values entered inside this section (doctor registration). For
  // patients the Birth Certificate fields come from the registration form.
  const [entered, setEntered] = useState({
    date_of_birth: "", national_id_number: "", personal_card_number: "", passport_number: "",
  });

  const chooseMethod = (key) => {
    setMethod(key);
    // Switching methods invalidates any previous verdict.
    onResult(null);
  };

  const setValue = (key, value) => {
    setEntered((s) => ({ ...s, [key]: value }));
    onResult(null);
  };

  const configs = {
    birth_certificate: {
      documentType: "birth_certificate",
      title: t("Birth Certificate"),
      description: t("Upload a clear photo or PDF"),
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
      documentType: "personal_card",
      title: t("Personal Card"),
      description: t("Upload clear photos of both sides, or one PDF containing both sides"),
      twoSided: true,
      fields: [
        { key: "full_name", label: t("Full Name"), readOnly: true },
        { key: "personal_card_number", label: t("Personal Card Number"), placeholder: t("Personal Card Number") },
      ],
      values: { full_name: fullName, personal_card_number: entered.personal_card_number },
    },
    passport: {
      documentType: "passport",
      title: t("Passport"),
      description: t("Passport — Scan your passport or upload an existing document"),
      twoSided: false,
      frontSlot: ({ file, setFile }) => (
        <PassportScanUpload patientName={fullName} cin={cin} file={file} onFile={setFile} t={t} />
      ),
      fields: [
        { key: "full_name", label: t("Full Name"), readOnly: true },
        { key: "passport_number", label: t("Passport Number"), placeholder: t("Passport Number") },
      ],
      values: { full_name: fullName, passport_number: entered.passport_number },
    },
  };

  const config = method ? configs[method] : null;

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-2">
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
        {t("Choose one verification method — successfully verifying it verifies your account. The other methods are not required.")}
      </p>
      {config && (
        <DocumentVerificationCard
          profileType={profileType}
          documentType={config.documentType}
          title={config.title}
          description={config.description}
          twoSided={config.twoSided}
          fields={config.fields}
          values={config.values}
          onValueChange={setValue}
          frontSlot={config.frontSlot}
          result={result}
          onResult={onResult}
          t={t}
        />
      )}
    </div>
  );
}