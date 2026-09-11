import React from "react";
import { cn } from "@/lib/utils";

// Vector AMedix brand mark: a DNA double-helix ring woven around serif "AM"
// initials with a stethoscope hooked over the letterforms and its chest
// piece at the bottom right. Everything uses currentColor, so the mark
// adapts automatically to light and dark surfaces — dark navy on light
// backgrounds, white on dark ones.
export default function AmedixMark({ className }) {
  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AMedix logo"
      className={cn("w-full h-full", className)}
    >
      {/* Serif AM initials */}
      <text
        x="250"
        y="302"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="150"
        fontWeight="700"
        letterSpacing="2"
      >
        AM
      </text>

      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {/* DNA strand 1 */}
        <path
          strokeWidth="13"
          d="M 460 250 A 75 75 0 0 1 432 355 A 75 75 0 0 0 355 432 A 75 75 0 0 1 250 460 A 75 75 0 0 0 145 432 A 75 75 0 0 1 69 355 A 75 75 0 0 0 40 250 A 75 75 0 0 1 69 145 A 75 75 0 0 0 145 68 A 75 75 0 0 1 250 40 A 75 75 0 0 0 355 68 A 75 75 0 0 1 432 145 A 75 75 0 0 0 460 250 Z"
        />
        {/* DNA strand 2 — phase-shifted so the two strands weave through each other */}
        <path
          strokeWidth="13"
          d="M 460 250 A 75 75 0 0 0 432 355 A 75 75 0 0 1 355 432 A 75 75 0 0 0 250 460 A 75 75 0 0 1 145 432 A 75 75 0 0 0 69 355 A 75 75 0 0 1 40 250 A 75 75 0 0 0 69 145 A 75 75 0 0 1 145 68 A 75 75 0 0 0 250 40 A 75 75 0 0 1 355 68 A 75 75 0 0 0 432 145 A 75 75 0 0 1 460 250 Z"
        />
        {/* Stethoscope — earpiece hook over the M, tube across the A, chest piece bottom right */}
        <path
          strokeWidth="11"
          d="M 366 128 C 386 122 394 144 376 157 C 338 174 288 162 250 170 C 214 178 190 204 186 238 C 182 272 198 300 228 312 C 274 330 330 332 356 320"
        />
        <circle cx="372" cy="332" r="16" fill="currentColor" stroke="none" />
        <circle cx="372" cy="332" r="6.5" strokeWidth="4" />
      </g>
    </svg>
  );
}