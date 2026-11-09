import React from "react";
import FmScoresField from "@/components/doctor/notes/FmScoresField";
import { IM_SCORES, calculateImScore } from "@/lib/imScores";

// Internal medicine instruments. The renderer is the shared one; this wrapper only
// supplies the internal-medicine registry, so a value saved here reads exactly like
// any other note's instruments.
export default function ImScoresField({ value, onChange, scores }) {
  return (
    <FmScoresField
      value={value}
      onChange={onChange}
      scores={scores}
      registry={IM_SCORES}
      calculate={calculateImScore}
    />
  );
}