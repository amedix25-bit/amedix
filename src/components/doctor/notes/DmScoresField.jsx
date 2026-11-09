import React from "react";
import FmScoresField from "@/components/doctor/notes/FmScoresField";
import { DM_SCORES, calculateDmScore } from "@/lib/dmScores";

// Dermatology instruments. The renderer is the shared one; this wrapper only supplies
// the dermatology registry, so a value saved here reads exactly like any other note's
// instruments.
export default function DmScoresField({ value, onChange, scores }) {
  return (
    <FmScoresField value={value} onChange={onChange} scores={scores} registry={DM_SCORES} calculate={calculateDmScore} />
  );
}