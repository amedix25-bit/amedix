// Server-side professional signature enforcement, shared by every clinical
// document that must be signed before it is issued (imaging requests,
// prescriptions). A signature image on its own never authorises signing: the
// record must belong to the authenticated doctor and be their active
// signature. Every signer field is written here, so values sent by the browser
// are never trusted.

export async function verifyDoctorSignature(base44, user, doctor, payload) {
  const signatureId = String(payload?.signature_record_id || "").trim();
  if (!signatureId) {
    return {
      error: "A professional signature is required before this document can be issued.",
      status: 400,
      signature_required: true,
    };
  }

  const signature = await base44.asServiceRole.entities.DoctorSignature.get(signatureId)
    .catch((e) => (e && e.status === 404 ? null : Promise.reject(e)));

  if (!signature) {
    return { error: "The signature could not be verified. Please sign again.", status: 403 };
  }
  if (signature.user_id !== user.id || signature.status !== "active" || !signature.signature_file_uri) {
    return { error: "This signature does not belong to the signed-in doctor.", status: 403 };
  }
  if (signature.doctor_id && String(signature.doctor_id) !== String(doctor.id)) {
    return { error: "This signature does not belong to the signed-in doctor.", status: 403 };
  }

  const version = Number(signature.version) || 1;
  const source = ["saved_profile", "drawn_now", "uploaded_now"].indexOf(payload.signature_source) >= 0
    ? payload.signature_source
    : "saved_profile";

  return { signature, version, source };
}

// Records the signing event against the issued document. Written with the
// service role: doctors cannot create these records directly through the
// client API.
export async function recordDocumentSignature(base44, {
  documentType,
  documentId,
  documentReference,
  patient,
  user,
  doctor,
  signature,
  version,
  source,
  payload,
}) {
  const signedAt = new Date().toISOString();
  const reference = `SIG-V${version}-${String(documentReference || signature.id).slice(-4).toUpperCase()}`;

  const record = await base44.asServiceRole.entities.DocumentSignature.create({
    document_type: documentType,
    document_id: String(documentId),
    document_reference: String(documentReference || ""),
    patient_id: String(patient?.id || payload?.patient_id || ""),
    patient_name: patient?.full_name || payload?.patient_name || "",
    patient_cin: patient?.cin || payload?.patient_cin || "",
    doctor_id: String(doctor.id),
    doctor_user_id: user.id,
    doctor_name: doctor.full_name || signature.doctor_name || "",
    doctor_license: doctor.license_number || "",
    signature_record_id: signature.id,
    signature_version: version,
    signature_source: source,
    signature_reference: reference,
    signed_datetime: signedAt,
  });

  return { record, reference, signedAt };
}