import React from "react";

// Renders a QR code for the patient's card. `value` is the payload that is
// encoded (the secure card verification link); `cin` is only used as a
// fallback label when no payload is available.
export default function QrCodeCard({ cin, value, size = 160 }) {
  const payload = value || cin;
  if (!payload) return null;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&margin=2`;
  return (
    <div className="inline-flex flex-col items-center rounded-xl border border-border bg-white p-3">
      <img
        src={qrSrc}
        alt={cin ? `QR code linked to CIN ${cin}` : "QR code"}
        width={size}
        height={size}
        className="rounded-md"
      />
    </div>
  );
}