import React from "react";
import { Image } from "@/components/ui/image";
import PatientWaveArt from "@/components/patient/overview/PatientWaveArt";

const ARTWORK = {
  labs: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/4a0291e30_generated_image.png",
  imaging: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/853019d8a_generated_image.png",
  medications: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/59c3fe421_generated_image.png",
  messages: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/5575e9082_generated_image.png",
  heart: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/717b0a296_generated_image.png",
};

export default function PatientReferenceArt({ kind, className = "" }) {
  if (kind === "headerWave" || kind === "sidebarWave" || kind === "cinWave") {
    return <PatientWaveArt kind={kind} className={className} />;
  }
  return <Image src={ARTWORK[kind]} alt="" aria-hidden="true" fittingType="fit" quality={100} loading="eager" className={`pp-reference-art ${className}`} />;
}