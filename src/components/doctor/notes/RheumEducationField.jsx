import React from "react";
import { BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EDUCATION_TOPICS,
  coreTopics,
  educationEntry,
  toggleEducation,
} from "@/lib/rheumEducation";

// What was actually taught, and whether the patient confirmed understanding.
// The content is shown so it can be read out and discussed; recording it is a
// clinical statement that it was delivered.
export default function RheumEducationField({ value, onChange }) {
  const markCore = () => {
    const all = coreTopics();
    let next = value;
    all.forEach((key) => {
      next = toggleEducation(next, key, { discussed: true });
    });
    onChange(next);
  };

  const insertWarningSigns = () => {
    const topic = EDUCATION_TOPICS.find((t) => t.key === "warning_signs");
    const text = (topic ? topic.points : []).join(" ");
    onChange({ ...(value || {}), warning_signs: text });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={markCore}>
          <BookOpen className="w-4 h-4" /> Mark core topics discussed
        </Button>
        <p className="text-[11px] text-muted-foreground">Understanding is confirmed by teach-back, never assumed.</p>
      </div>

      <div className="space-y-2">
        {EDUCATION_TOPICS.map((topic) => {
          const entry = educationEntry(value, topic.key);
          return (
            <div key={topic.key} className="rounded-lg border border-border p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium">
                  {topic.label}
                  {topic.core && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary">core</span>}
                </p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px]">
                    <Checkbox
                      checked={!!entry.discussed}
                      onCheckedChange={(v) => onChange(toggleEducation(value, topic.key, { discussed: !!v }))}
                    />
                    Discussed
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px]">
                    <Checkbox
                      checked={!!entry.understood}
                      onCheckedChange={(v) => onChange(toggleEducation(value, topic.key, { understood: !!v }))}
                    />
                    Understood
                  </label>
                </div>
              </div>
              <details className="group">
                <summary className="text-[11px] text-primary cursor-pointer select-none">Key points to discuss</summary>
                <ul className="mt-1.5 space-y-1 list-disc pl-4 text-[11px] text-muted-foreground">
                  {topic.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Written materials given</Label>
        <Input
          placeholder="e.g. methotrexate safety leaflet, flare action plan"
          value={(value && value.materials) || ""}
          onChange={(e) => onChange({ ...(value || {}), materials: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Warning signs given to the patient</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={insertWarningSigns}>
            <AlertTriangle className="w-3.5 h-3.5" /> Insert standard list
          </Button>
        </div>
        <Textarea
          rows={3}
          placeholder="What the patient was told to return or seek urgent care for"
          value={(value && value.warning_signs) || ""}
          onChange={(e) => onChange({ ...(value || {}), warning_signs: e.target.value })}
        />
      </div>
    </div>
  );
}