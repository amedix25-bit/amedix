import React from "react";
import { useId } from "react";

export default function PatientWaveArt({ kind, className = "" }) {
  const id = useId().replace(/:/g, "");
  return <svg className={`pp-reference-art ${className}`} viewBox="0 0 300 180" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="hsl(var(--pp-blue-top))" stopOpacity=".1" /><stop offset="1" stopColor="hsl(var(--pp-accent))" stopOpacity=".18" /></linearGradient></defs>
    {kind === "cinWave" ? <>
      <path d="M0 130C80 105 138 195 300 152V180H0Z" fill="hsl(var(--card) / .32)" />
      <path d="M0 67H45L56 31L72 97L88 51L103 67H183" fill="none" stroke="hsl(var(--card) / .7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </> : <>
      <path d={kind === "headerWave" ? "M0 165C86 182 112 38 217 67C260 76 276 122 300 118V180H0Z" : "M0 160C86 147 145 75 300 45V180H0Z"} fill={`url(#${id})`} />
      <path d={kind === "headerWave" ? "M0 164C87 181 114 34 217 65C263 79 278 121 300 115" : "M0 168C81 153 177 75 300 50"} fill="none" stroke="hsl(var(--card) / .65)" strokeWidth="1.3" />
      <path d="M0 178C121 163 203 103 300 98V180H0Z" fill="hsl(var(--pp-blue-bottom) / .3)" />
    </>}
  </svg>;
}