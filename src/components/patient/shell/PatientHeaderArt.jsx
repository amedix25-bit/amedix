import React from "react";

// Elegant flowing blue waves behind the patient header — decoration only,
// no medical illustrations. Soft gradients keep the header text readable.
export default function PatientHeaderArt() {
  return (
    <svg className="pp-header-art" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ppWaveNavy" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#002d72" stopOpacity="0.40" />
          <stop offset="55%" stopColor="#0b4aa2" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="ppWaveRoyal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.09" />
        </linearGradient>
        <linearGradient id="ppWaveLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="ppWaveWhite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 0h1440v58c-180 42-360-16-560 6S520 118 320 104C190 95 90 74 0 58Z" fill="url(#ppWaveNavy)" />
      <path
        d="M0 52c150 48 330-14 520 10s330 78 560 46c130-18 240-44 360-62v52c-170 44-350-4-560 22s-340 76-540 52C230 168 110 138 0 120Z"
        fill="url(#ppWaveRoyal)"
      />
      <path
        d="M0 132c170 54 340-6 540 22s340 84 560 52c130-18 230-40 340-54v56c-170 44-350-6-560 24s-350 80-550 52C220 262 100 232 0 210Z"
        fill="url(#ppWaveLight)"
      />
      <path d="M0 214c180 52 350-8 560 18s340 76 560 46c120-16 220-38 320-50v72H0Z" fill="url(#ppWaveWhite)" />
    </svg>
  );
}