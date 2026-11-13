import { base44 } from "@/api/base44Client";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";

// The stored document of a clinical note, when one has been saved.
export async function storedNotePdfUrl(noteId) {
  const res = await base44.functions.invoke("clinicalNotePdf", { action: "link", note_id: noteId });
  return res.data?.url || null;
}

// Renders the note's official AMedix document and keeps it with the note
// (stored privately). Used for notes that were written before documents were
// saved, so every note ends up with its own PDF.
export async function saveNotePdf(note, { logo } = {}) {
  const [artwork, profile] = await Promise.all([
    logo ? Promise.resolve(logo) : loadRequestLogo(),
    note.patient_id
      ? base44.entities.PatientProfile.get(note.patient_id).catch(() => null)
      : Promise.resolve(null),
  ]);
  const doc = await generateClinicalNotePdf(note, { logo: artwork, profile });
  const name = `${note.note_reference || "ClinicalNote"}${note.patient_cin ? `_${note.patient_cin}` : ""}.pdf`;
  const file = new File([doc.output("blob")], name, { type: "application/pdf" });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  await base44.functions.invoke("clinicalNotePdf", {
    action: "attach",
    note_id: note.id,
    file_uri,
    file_name: name,
  });
  return name;
}