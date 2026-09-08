// Shared helper for creating patient portal notifications.
// `client` is a Base44 SDK client (user-scoped or service-role).
export async function createPatientNotification(client, data) {
  if (!data.patient_id || !data.title) {
    throw new Error('Notification requires patient_id and title');
  }
  return await client.entities.PatientNotification.create({
    type: data.type || 'other',
    is_read: false,
    ...data,
  });
}