import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyReceptionistSession, touchReceptionistActivity, unauthorized } from "../../shared/hospitalAuth.ts";
import { eligibleHospitalDoctors } from "../../shared/patientAccess.ts";

// The treating-doctor list for the receptionist check-in screen. Only doctors
// with an ACTIVE association at the receptionist's own hospital AND an active,
// verified doctor account are returned — inactive, suspended, unverified and
// unauthorized accounts never reach the dropdown. Selecting one is verified
// again by the check-in function; this list is presentation only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const rec = await verifyReceptionistSession(base44, body.receptionist_id, body.session_token);
    if (!rec) return unauthorized();

    const doctors = await eligibleHospitalDoctors(base44, rec.hospital_id);
    await touchReceptionistActivity(base44, rec.id);
    return Response.json({ doctors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}