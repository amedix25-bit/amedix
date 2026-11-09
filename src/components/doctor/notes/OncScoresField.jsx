import React from "react";
import FmScoresField from "@/components/doctor/notes/FmScoresField";
import { ONC_SCORES, calculateOncScore } from "@/lib/oncScores";

// Oncology instruments. The renderer is the shared one; this wrapper only supplies the
// oncology registry, so a value saved here reads exactly like any other note's
// instruments.
export default function OncScoresField({ value, onChange, scores }) {
  return (
    <FmScoresField
      value={value}
      onChange={onChange}
      scores={scores}
      registry={ONC_SCORES}
      calculate={calculateOncScore}
    />
  );
}