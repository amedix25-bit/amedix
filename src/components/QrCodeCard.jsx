import React from "react";

export default function QrCodeCard({ cin, size = 160 }) {
  if (!cin) return null;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(cin)}&margin=2`;
  return (
    <div className="inline-flex flex-col items-center rounded-xl border border-border bg-white p-3">
      <img
        src={qrSrc}
        alt={`QR code linked to CIN ${cin}`}
        width={size}
        height={size}
        className="rounded-md"
      />
    </div>
  );
}