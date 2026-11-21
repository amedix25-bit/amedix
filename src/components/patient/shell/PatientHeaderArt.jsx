import React from "react";

// Soft medical cross and ECG trace behind the patient header — decoration only.
export default function PatientHeaderArt() {
  return (
    <svg className="pp-header-art" viewBox="0 0 420 200" fill="none" aria-hidden="true">
      <path
        d="M300 16h46a12 12 0 0 1 12 12v46h46a12 12 0 0 1 12 12v46a12 12 0 0 1-12 12h-46v46a12 12 0 0 1-12 12h-46a12 12 0 0 1-12-12v-46h-46a12 12 0 0 1-12-12V86a12 12 0 0 1 12-12h46V28a12 12 0 0 1 12-12Z"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M0 140h88l18-38 24 76 28-108 24 70h60"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}