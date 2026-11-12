import { base44 } from "@/api/base44Client";

// Doctor signature storage. Signatures live in private storage behind a record
// only the owning doctor (and an AMedix administrator) can read; a signature
// image on its own never authorises signing — the signing session is what does.

export const SIGNATURE_MAX_BYTES = 1024 * 1024; // 1 MB
export const SIGNATURE_ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export function validateSignatureFile(file) {
  if (!file) return "Choose a signature image (PNG or JPG).";
  if (!SIGNATURE_ACCEPTED_TYPES.includes(file.type)) return "Only PNG or JPG images are accepted.";
  if (file.size > SIGNATURE_MAX_BYTES) return "The image must be 1 MB or smaller.";
  return "";
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The signature image could not be read."));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToFile(dataUrl, name) {
  const [meta, b64] = String(dataUrl).split(",");
  const mime = (meta.match(/data:(.*?);/) || [])[1] || "image/png";
  const bytes = atob(b64 || "");
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new File([buffer], name, { type: mime });
}

// The doctor's current professional signature, or null when none is saved.
export async function loadMySignature() {
  const user = await base44.auth.me();
  const rows = await base44.entities.DoctorSignature.filter({ user_id: user.id });
  return (rows || []).find((r) => r.status !== "deleted") || null;
}

export async function signaturePreviewUrl(fileUri) {
  if (!fileUri) return "";
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 600 });
  return signed_url;
}

function withAudit(record, action, label, actorName, detail) {
  const now = new Date().toISOString();
  return [
    ...(record.audit || []),
    { datetime: now, action, action_label: label, actor_name: actorName || "", detail: detail || "" },
  ];
}

// Creates or replaces the doctor's signature. Every save bumps the version so
// each signed document can be traced to the exact signature it carries.
export async function saveMySignature({ doctorProfile, existing, dataUrl, file, source }) {
  const user = await base44.auth.me();
  const upload = file || dataUrlToFile(dataUrl, "signature.png");
  const invalid = validateSignatureFile(upload);
  if (invalid) throw new Error(invalid);

  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: upload }); // stored privately
  const now = new Date().toISOString();
  const actorName = doctorProfile?.full_name || user.full_name || user.email || "";
  const fields = {
    signature_file_uri: file_uri,
    signature_file_name: upload.name,
    mime_type: upload.type,
    file_size: upload.size,
    source,
    status: "active",
    updated_datetime: now,
  };

  if (existing?.id) {
    const version = (existing.version || 1) + 1;
    return base44.entities.DoctorSignature.update(existing.id, {
      ...fields,
      version,
      audit: withAudit(existing, "replaced", "Professional signature replaced", actorName, `Version ${version} · ${source}`),
    });
  }

  return base44.entities.DoctorSignature.create({
    ...fields,
    user_id: user.id,
    doctor_id: doctorProfile?.id || "",
    doctor_name: doctorProfile?.full_name || actorName,
    version: 1,
    created_datetime: now,
    audit: [{ datetime: now, action: "created", action_label: "Professional signature created", actor_name: actorName, detail: source }],
  });
}

// Deleted from the doctor's view, kept as a record so the history survives —
// and never usable for signing again.
export async function removeMySignature(record, actorName) {
  if (!record?.id) return;
  await base44.entities.DoctorSignature.update(record.id, {
    status: "deleted",
    updated_datetime: new Date().toISOString(),
    audit: withAudit(record, "deleted", "Professional signature deleted", actorName, ""),
  });
}

// The image to embed in the generated PDF, read through a short-lived signed
// link only for the doctor who owns the signature.
export async function signatureImageDataUrl(fileUri) {
  const url = await signaturePreviewUrl(fileUri);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("load failed");
    const blob = await res.blob();
    return { data_url: await blobToDataUrl(blob), format: blob.type === "image/jpeg" ? "JPEG" : "PNG" };
  } catch (e) {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("The saved signature could not be loaded."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    return { data_url: canvas.toDataURL("image/png"), format: "PNG" };
  }
}