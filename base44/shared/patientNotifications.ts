// Shared helper for creating patient portal notifications.
// `client` is a Base44 SDK client (user-scoped or service-role).
export async function createPatientNotification(client, data) {
  if (!data.patient_id || !data.title) {
    throw new Error('Notification requires patient_id and title');
  }
  let patient_user_id = data.patient_user_id;
  if (!patient_user_id) {
    const profile = await client.entities.PatientProfile.get(data.patient_id);
    patient_user_id = profile?.user_id;
  }
  return await client.entities.PatientNotification.create({
    type: data.type || 'other',
    is_read: false,
    ...data,
    patient_user_id,
  });
}