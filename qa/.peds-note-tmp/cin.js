import { base44 } from "@/api/base44Client";

// Unambiguous characters only (no 0/O, 1/I) so the CIN is easy to read aloud.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomGroup() {
  let group = "";
  for (let i = 0; i < 3; i++) {
    group += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return group;
}

/**
 * Generates a unique, permanent CIN in the format 7F3-829-461.
 * The CIN is fully random (never derived from the date of birth or any
 * personal data), never chosen by the patient, and checked against the
 * database to guarantee uniqueness.
 */
export async function generateUniqueCIN() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const cin = `${randomGroup()}-${randomGroup()}-${randomGroup()}`;
    const existing = await base44.entities.PatientProfile.filter({ cin });
    if (!existing || existing.length === 0) {
      return cin;
    }
  }
  throw new Error("Unable to generate a unique CIN. Please try again.");
}