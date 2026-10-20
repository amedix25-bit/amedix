import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Radiology reporting assistant (Phase 5.4) — FORMATTING assistance for a
// section the radiologist dictated or typed. The suggestion is ALWAYS
// returned for the radiologist to review and explicitly accept; it never
// replaces their text automatically, never finalizes a report, never makes
// clinical decisions, and never sends anything to doctors or patients.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id });
    const radiologist = profiles[0];
    if (!radiologist || radiologist.status !== "active") {
      return Response.json({ error: "Only active radiologists can use the reporting assistant." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const section = String(payload.section || "findings").slice(0, 60);
    const text = String(payload.text || "").trim();
    if (!text) return Response.json({ error: "Nothing to format — dictate or type the section first." }, { status: 400 });
    if (text.length > 12000) return Response.json({ error: "The section is too long to format." }, { status: 400 });
    const examination = String(payload.examination || "").slice(0, 200);

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the AMedix radiology report FORMATTING assistant. A radiologist wrote or dictated the "${section}" section of a report for: ${examination || "an imaging study"}.

RADIOLOGIST'S ORIGINAL TEXT:
"""
${text}
"""

RULES (strict):
1. Reformat ONLY: fix grammar, spelling, spacing and punctuation; structure the wording as clear professional radiology prose; expand obvious dictation artifacts.
2. NEVER add, remove, change or reinterpret ANY clinical statement, finding, measurement, number, laterality, negation, or impression. If unsure what was meant, keep the original wording.
3. NEVER invent clinical content and NEVER add a diagnosis that is not already stated.
4. Use standard radiology terminology spelling for terms the radiologist clearly intended.
5. Return the reformatted text as "suggestion". It will be SHOWN to the radiologist as a proposal — they decide whether to apply it.`,
      response_json_schema: {
        type: "object",
        properties: { suggestion: { type: "string" } },
        required: ["suggestion"],
      },
    });

    const suggestion = llm && typeof llm.suggestion === "string" && llm.suggestion.trim()
      ? llm.suggestion.trim()
      : text;
    return Response.json({ suggestion, section });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}