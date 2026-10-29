import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldCheck } from "lucide-react";

// A validated decision rule is only valid in the patients the rule was derived
// in. This field records the rule the clinician applied, why this patient was
// eligible, which exclusions were checked, whether the rule's required variables
// were documented, and the result AS DOCUMENTED — the app never calculates a
// score, states a cut-off, or turns the result into an order.
export const VALIDATED_RULES = [
  "HEART score — chest pain",
  "PERC rule — pulmonary embolism",
  "Wells score — pulmonary embolism",
  "Wells score — deep vein thrombosis",
  "Ottawa ankle rule",
  "Ottawa knee rule",
  "Canadian CT Head rule",
  "NEXUS criteria — cervical spine",
  "PECARN rule — paediatric head injury",
  "NIHSS — stroke severity (score documented)",
  "qSOFA — sepsis screen",
  "ABCD2 — transient ischaemic attack",
  "Alvarado score — appendicitis",
  "McIsaac / Centor score — pharyngitis",
  "Other validated rule — named in the note",
];

export default function DecisionRuleField({ value, onChange, ruleOptions }) {
  const v = value && typeof value === "object" ? value : {};
  const set = (patch) => onChange({ ...v, ...patch });
  const rules = Array.isArray(ruleOptions) && ruleOptions.length ? ruleOptions : VALIDATED_RULES;

  const ineligible = v.eligibility === "Not eligible — exclusion present";
  const applied = v.applied === "Applied";
  const variablesMissing = v.variables === "Some required variables not documented";

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1">
        <Label className="text-xs">Rule</Label>
        <Select value={v.rule || undefined} onValueChange={(val) => set({ rule: val })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select the validated rule..." />
          </SelectTrigger>
          <SelectContent>
            {rules.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">How the rule was used</Label>
        <Select value={v.applied || undefined} onValueChange={(val) => set({ applied: val })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {[
              "Applied",
              "Considered — not applied, not indicated",
              "Considered — not applied, not eligible",
              "Not used",
            ].map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Eligibility — inclusion criteria met, as documented</Label>
        <Textarea
          rows={2}
          value={v.eligibility_detail || ""}
          placeholder="The features that place this patient inside the rule's intended population."
          onChange={(e) => set({ eligibility_detail: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Exclusions checked</Label>
          <Select value={v.eligibility || undefined} onValueChange={(val) => set({ eligibility: val })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {[
                "Eligible — no exclusion present",
                "Not eligible — exclusion present",
                "Exclusions not checked",
              ].map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Required variables</Label>
          <Select value={v.variables || undefined} onValueChange={(val) => set({ variables: val })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {[
                "All required variables documented",
                "Some required variables not documented",
                "Not documented",
              ].map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Result as documented by the clinician</Label>
        <Input
          value={v.result || ""}
          placeholder="Score or category with its components, exactly as the source defines them"
          onChange={(e) => set({ result: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Limitations that apply here</Label>
        <Input
          value={v.limitations || ""}
          placeholder="Missing variables, unvalidated population, local validation status"
          onChange={(e) => set({ limitations: e.target.value })}
        />
      </div>

      {(ineligible || applied || variablesMissing) && (
        <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-700/60 px-2.5 py-2">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            {ineligible
              ? "An exclusion is recorded. A rule applied outside its eligible population does not carry its validated performance — document the clinical reasoning and do not rely on the result."
              : variablesMissing
                ? "Required variables are missing. The rule's result is not interpretable until they are documented."
                : "The result is recorded as documented by the clinician. AMedix calculated nothing and states no cut-off."}
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-start gap-1">
        <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
        No score is calculated or interpreted by AMedix, no threshold is stated here, and a rule is decision support only
        — never a substitute for the treating clinician's judgement or the local emergency protocol.
      </p>
    </div>
  );
}