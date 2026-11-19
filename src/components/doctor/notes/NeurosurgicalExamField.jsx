import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/doctor/dictation/DictationTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
import {
  NSG_CLONUS,
  NSG_CN_STATUS,
  NSG_CONSCIOUSNESS,
  NSG_COORDINATION,
  NSG_GAIT,
  NSG_MENINGEAL,
  NSG_MRC,
  NSG_ORIENTATION,
  NSG_PLANTAR,
  NSG_PUPIL_REACTIVITY,
  NSG_PUPIL_SIZE,
  NSG_REFLEX,
  NSG_SENSORY_SIDE,
  NSG_SPINE_TENDERNESS,
} from "@/lib/neurosurgeryExam";

// Structured neurosurgical neurological examination.
//
// Every component is recorded as examined. Nothing defaults to normal, nothing
// is graded into a severity band, and a component left as "Not documented" is
// printed as not documented rather than as a normal finding.
function Sel({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground leading-snug">{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Not documented" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

export default function NeurosurgicalExamField({ value, onChange }) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const pupils = v.pupils || {};
  const motor = v.motor || {};
  const sensory = v.sensory || {};
  const reflexes = v.reflexes || {};
  const coordination = v.coordination || {};
  const meningeal = v.meningeal || {};
  const spine = v.spine || {};
  const cn = v.cranial_nerves || {};

  const set = (patch) => onChange({ ...v, ...patch });
  const setIn = (group, patch) => set({ [group]: { ...(v[group] || {}), ...patch } });

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
        <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        Record what was examined. An unexamined component stays not documented — it is never printed as normal, and no
        severity category is assigned from these values.
      </p>

      <Group title="Conscious level & orientation">
        <div className="grid gap-2 sm:grid-cols-2">
          <Sel label="Conscious level" value={v.consciousness} onChange={(x) => set({ consciousness: x })} options={NSG_CONSCIOUSNESS} />
          <Sel label="Orientation" value={v.orientation} onChange={(x) => set({ orientation: x })} options={NSG_ORIENTATION} />
        </div>
      </Group>

      <Group title="Pupils">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Sel label="Right pupil size" value={pupils.right_size} onChange={(x) => setIn("pupils", { right_size: x })} options={NSG_PUPIL_SIZE} />
          <Sel label="Right reactivity" value={pupils.right_reactivity} onChange={(x) => setIn("pupils", { right_reactivity: x })} options={NSG_PUPIL_REACTIVITY} />
          <Sel label="Left pupil size" value={pupils.left_size} onChange={(x) => setIn("pupils", { left_size: x })} options={NSG_PUPIL_SIZE} />
          <Sel label="Left reactivity" value={pupils.left_reactivity} onChange={(x) => setIn("pupils", { left_reactivity: x })} options={NSG_PUPIL_REACTIVITY} />
        </div>
      </Group>

      <Group title="Cranial nerves">
        <Sel label="Cranial nerve examination" value={cn.status} onChange={(x) => setIn("cranial_nerves", { status: x })} options={NSG_CN_STATUS} />
        <Textarea
          rows={2}
          className="text-xs"
          value={cn.detail || ""}
          onChange={(e) => setIn("cranial_nerves", { detail: e.target.value })}
          placeholder="Nerve by nerve: which nerve is affected, on which side, and how (e.g. III right ptosis and dilated pupil; VII left lower motor neurone weakness)"
        />
      </Group>

      <Group title="Motor function (MRC 0–5)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Sel label="Right arm" value={motor.right_arm} onChange={(x) => setIn("motor", { right_arm: x })} options={NSG_MRC} />
          <Sel label="Left arm" value={motor.left_arm} onChange={(x) => setIn("motor", { left_arm: x })} options={NSG_MRC} />
          <Sel label="Right leg" value={motor.right_leg} onChange={(x) => setIn("motor", { right_leg: x })} options={NSG_MRC} />
          <Sel label="Left leg" value={motor.left_leg} onChange={(x) => setIn("motor", { left_leg: x })} options={NSG_MRC} />
        </div>
        <Textarea
          rows={2}
          className="text-xs"
          value={motor.other || ""}
          onChange={(e) => setIn("motor", { other: e.target.value })}
          placeholder="Other motor findings — facial, neck, trunk, drift, tone, bulk, abnormal posturing"
        />
      </Group>

      <Group title="Sensory function">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Sensory level</Label>
            <Input className="h-8 text-xs" value={sensory.level || ""} onChange={(e) => setIn("sensory", { level: e.target.value })} placeholder="e.g. T4" />
          </div>
          <Sel
            label="Modality"
            value={sensory.modality}
            onChange={(x) => setIn("sensory", { modality: x })}
            options={["Light touch", "Pin prick", "Light touch and pin prick", "Proprioception", "Temperature", "Multiple modalities", "Not documented"]}
          />
          <Sel label="Side" value={sensory.side} onChange={(x) => setIn("sensory", { side: x })} options={NSG_SENSORY_SIDE} />
        </div>
        <Textarea
          rows={2}
          className="text-xs"
          value={sensory.detail || ""}
          onChange={(e) => setIn("sensory", { detail: e.target.value })}
          placeholder="Distribution and character of the change, and the dermatomes involved"
        />
      </Group>

      <Group title="Reflexes, plantar response and clonus">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Sel label="Biceps" value={reflexes.biceps} onChange={(x) => setIn("reflexes", { biceps: x })} options={NSG_REFLEX} />
          <Sel label="Supinator" value={reflexes.supinator} onChange={(x) => setIn("reflexes", { supinator: x })} options={NSG_REFLEX} />
          <Sel label="Triceps" value={reflexes.triceps} onChange={(x) => setIn("reflexes", { triceps: x })} options={NSG_REFLEX} />
          <Sel label="Knee" value={reflexes.knee} onChange={(x) => setIn("reflexes", { knee: x })} options={NSG_REFLEX} />
          <Sel label="Ankle" value={reflexes.ankle} onChange={(x) => setIn("reflexes", { ankle: x })} options={NSG_REFLEX} />
          <Sel label="Plantar response" value={reflexes.plantar} onChange={(x) => setIn("reflexes", { plantar: x })} options={NSG_PLANTAR} />
          <Sel label="Clonus" value={reflexes.clonus} onChange={(x) => setIn("reflexes", { clonus: x })} options={NSG_CLONUS} />
        </div>
      </Group>

      <Group title="Coordination, cerebellar signs and gait">
        <div className="grid gap-2 sm:grid-cols-2">
          <Sel label="Coordination" value={coordination.finding} onChange={(x) => setIn("coordination", { finding: x })} options={NSG_COORDINATION} />
          <Sel label="Gait" value={v.gait} onChange={(x) => set({ gait: x })} options={NSG_GAIT} />
        </div>
        <Textarea
          rows={2}
          className="text-xs"
          value={coordination.detail || ""}
          onChange={(e) => setIn("coordination", { detail: e.target.value })}
          placeholder="Finger–nose, heel–shin, rapid alternating movements, Romberg, nystagmus, tremor"
        />
      </Group>

      <Group title="Meningeal signs">
        <div className="grid gap-2 sm:grid-cols-3">
          <Sel label="Neck stiffness" value={meningeal.neck} onChange={(x) => setIn("meningeal", { neck: x })} options={NSG_MENINGEAL} />
          <Sel label="Kernig sign" value={meningeal.kernig} onChange={(x) => setIn("meningeal", { kernig: x })} options={NSG_MENINGEAL} />
          <Sel label="Brudzinski sign" value={meningeal.brudzinski} onChange={(x) => setIn("meningeal", { brudzinski: x })} options={NSG_MENINGEAL} />
        </div>
      </Group>

      <Group title="Spinal examination">
        <div className="grid gap-2 sm:grid-cols-2">
          <Sel label="Spinal tenderness" value={spine.tenderness} onChange={(x) => setIn("spine", { tenderness: x })} options={NSG_SPINE_TENDERNESS} />
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Deformity / alignment</Label>
            <Input className="h-8 text-xs" value={spine.deformity || ""} onChange={(e) => setIn("spine", { deformity: e.target.value })} placeholder="e.g. kyphosis, gibbus, list" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Dermatomal level</Label>
            <Input className="h-8 text-xs" value={spine.dermatome || ""} onChange={(e) => setIn("spine", { dermatome: e.target.value })} placeholder="e.g. L5 right" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Myotomal level</Label>
            <Input className="h-8 text-xs" value={spine.myotome || ""} onChange={(e) => setIn("spine", { myotome: e.target.value })} placeholder="e.g. L5 — EHL 3/5" />
          </div>
        </div>
        <Textarea
          rows={2}
          className="text-xs"
          value={spine.detail || ""}
          onChange={(e) => setIn("spine", { detail: e.target.value })}
          placeholder="Column findings — range of movement, step-off, paraspinal spasm, sciatic tension signs, sacral sensation"
        />
      </Group>
    </div>
  );
}