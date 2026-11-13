// Shared AMedix account-eligibility rules for messaging.
//
// ONE rule set answers a single question for every account — may this account
// send or receive messages on AMedix, and if not, why. The messaging API, the
// directories, the colleague network and the administration dashboard all call
// these functions, so what the browser shows and what the server enforces can
// never drift apart.
//
// A doctor is eligible only when the account exists, the professional profile
// is verified and approved by AMedix administration, the identity document and
// the medical license were verified, and no administrative block applies.
// A hospital is eligible only when the facility account is active, its
// institutional registration is approved by AMedix administration and the
// authorization is activated. A patient is eligible only when a real account
// exists and the patient identity verification was completed. Every account
// must additionally be active (not suspended, deactivated, blocked or
// identified as a test account).

export const DOCTOR_APPROVAL_BLOCKER = "Professional verification and AMedix administrative approval are pending.";

const TEST_PATTERNS = [
  { re: /\bzzz+\b/i, label: "placeholder name (ZZZ)" },
  { re: /\btest\b/i, label: "test marker in the name" },
  { re: /\bdummy\b/i, label: "dummy marker in the name" },
  { re: /\bfake\b/i, label: "fake marker in the name" },
  { re: /\bsandbox\b/i, label: "sandbox marker in the name" },
  { re: /\bdemo\b/i, label: "demo marker in the name" },
  { re: /\bdo not use\b/i, label: "explicit do-not-use marker" },
  { re: /^qa[-_.]/i, label: "QA account marker" },
  { re: /^test[-_.\d]/i, label: "test account identifier" },
  { re: /[-_.]test\d*$/i, label: "test account identifier" },
];

const FAKE_USER_ID = /^(test-user|zzz-|fake-|dummy-|demo-)/i;
const FAKE_CIN = /(^|-)(TEST|TST)(-|$)/i;

export function looksLikeTestText(value) {
  const text = String(value || "");
  return TEST_PATTERNS.some(({ re }) => re.test(text));
}

// An account can hold more than one profile; the real one is the profile that
// is not named like a test record, so a stray test profile never re-labels the
// whole account.
function pickPrimary(rows) {
  if (!rows || rows.length === 0) return null;
  const clean = rows.find((r) => !looksLikeTestText(r.full_name));
  return clean || rows[0];
}

export function testEvidence(parts) {
  const evidence = [];
  const values = [
    parts.userName,
    parts.userEmail,
    parts.doctorName,
    parts.patientName,
    parts.hospitalName,
  ].filter(Boolean).map((v) => String(v));

  values.forEach((value) => {
    TEST_PATTERNS.forEach(({ re, label }) => {
      if (re.test(value)) evidence.push(`${label}: "${value}"`);
    });
  });

  if (FAKE_CIN.test(String(parts.patientCin || ""))) evidence.push(`test clinical identifier: "${parts.patientCin}"`);
  [parts.userId, parts.doctorUserId, parts.hospitalUserId].filter(Boolean).forEach((id) => {
    if (FAKE_USER_ID.test(String(id))) evidence.push(`non-account user reference: "${id}"`);
  });

  return [...new Set(evidence)].slice(0, 8);
}

function pageItems(result) {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

async function fetchAll(base44, entity, query = {}, limit = 2000) {
  try {
    return pageItems(await base44.asServiceRole.entities[entity].filter(query, { limit }));
  } catch (err) {
    return [];
  }
}

async function fetchOne(base44, entity, query) {
  const rows = await fetchAll(base44, entity, query, 1);
  return rows[0] || null;
}

async function loadUser(base44, userId) {
  if (!userId) return null;
  try {
    return await base44.asServiceRole.entities.User.get(userId);
  } catch (err) {
    return null;
  }
}

async function loadAllUsers(base44, userIds) {
  const map = new Map();
  try {
    const rows = pageItems(await base44.asServiceRole.entities.User.list({ limit: 5000 }));
    rows.forEach((u) => map.set(u.id, u));
  } catch (err) {
    // User listing is privileged on some deployments — fall back to per-id reads.
  }
  const missing = [...new Set(userIds.filter((id) => id && !map.has(id)))].slice(0, 400);
  for (let i = 0; i < missing.length; i += 25) {
    await Promise.all(missing.slice(i, i + 25).map(async (id) => {
      const u = await loadUser(base44, id);
      if (u) map.set(id, u);
    }));
  }
  return map;
}

// One account's raw records, loaded in parallel.
export async function loadAccountSnapshot(base44, userId) {
  const [user, doctorRows, hospitalRows, patientRows, verifications, drafts, controls] = await Promise.all([
    loadUser(base44, userId),
    fetchAll(base44, "DoctorProfile", { user_id: userId }, 5),
    fetchAll(base44, "HospitalProfile", { user_id: userId }, 5),
    fetchAll(base44, "PatientProfile", { user_id: userId }, 20),
    fetchAll(base44, "IdentityVerification", { user_id: userId }, 100),
    fetchAll(base44, "DoctorRegistrationDraft", { user_id: userId }, 5),
    fetchAll(base44, "AccountControl", { user_id: userId }, 5),
  ]);
  const hospital = hospitalRows[0] || null;
  const authorization = hospital ? await fetchOne(base44, "HospitalAuthorization", { hospital_profile_id: hospital.id }) : null;
  return {
    user,
    userId,
    doctor: pickPrimary(doctorRows),
    hospitals: hospitalRows,
    hospital,
    authorization,
    patient: pickPrimary(patientRows),
    patients: patientRows,
    verifications,
    draft: drafts[0] || null,
    control: controls[0] || null,
  };
}

function identityVerifiedFor(verifications, profileType) {
  return (verifications || []).some(
    (v) => v.status === "verified" && (!v.profile_type || v.profile_type === profileType)
  );
}

// The single evaluation every surface uses. Pure function of the records.
export function evaluateSnapshot(snap) {
  const { user, doctor, hospital, authorization, patient, draft, verifications, control } = snap;
  const accountType = hospital ? "hospital" : doctor ? "doctor" : patient ? "patient" : "none";

  const blockers = [];
  const evidence = testEvidence({
    userId: snap.userId,
    userName: user && user.full_name,
    userEmail: user && user.email,
    doctorName: doctor && doctor.full_name,
    patientName: patient && patient.full_name,
    patientCin: patient && patient.cin,
    hospitalName: hospital && hospital.hospital_name,
    doctorUserId: doctor && doctor.user_id,
    hospitalUserId: hospital && hospital.user_id,
  });

  // An administrator account is not a messaging participant: it is never
  // classified as a test account by name, only by an explicit administrative
  // decision, so the audit does not report the administrator as fake.
  const isAdminAccount = !!user && user.role === "admin";
  const classification = control && control.classification && control.classification !== "legitimate"
    ? control.classification
    : evidence.length > 0 && !isAdminAccount
      ? "test_account"
      : "legitimate";

  if (classification === "test_account") blockers.push("This account was identified as a test account and cannot use messaging.");
  else if (classification === "suspected_test") blockers.push("This account is under administrative review as a suspected test account.");
  else if (classification === "duplicate") blockers.push("This account was identified as a duplicate and is awaiting administrative review.");

  const status = (control && control.status) || "active";
  if (status === "suspended") blockers.push("This account is suspended.");
  else if (status === "deactivated") blockers.push("This account is deactivated.");
  else if (status === "blocked") blockers.push("This account is blocked for security reasons.");

  let verified = false;
  if (accountType === "doctor") {
    if (!user) blockers.push("This doctor profile has no active AMedix account.");
    if (doctor.is_verified !== true) blockers.push(DOCTOR_APPROVAL_BLOCKER);
    if (draft && draft.status === "rejected") blockers.push("The doctor registration was rejected by administration.");
    if (draft && draft.status === "pending_verification" && doctor.is_verified !== true) {
      blockers.push("The doctor registration is still awaiting verification.");
    }
    // The doctor's professional verification is the decision of the hospital
    // they work at: that hospital reviews the doctor and approves them, and the
    // approval is what opens the verified network. The identity and licence
    // documents are checked once, at registration, and are never re-gated here.
    if (control && control.verification_status === "rejected") blockers.push("AMedix administration rejected the doctor's verification.");
    verified = doctor.is_verified === true && !(control && control.verification_status === "rejected");
  } else if (accountType === "hospital") {
    if (!user) blockers.push("This hospital profile has no active AMedix account.");
    if (hospital.status === "suspended") blockers.push("This hospital account is suspended.");
    if (!authorization || authorization.status !== "approved") {
      blockers.push("Institutional verification and AMedix approval are pending.");
    } else if (!authorization.activated_datetime) {
      blockers.push("The institutional authorization has not been activated.");
    }
    if (control && control.verification_status === "rejected") blockers.push("AMedix administration rejected the institution's verification.");
    verified = !!authorization && authorization.status === "approved" && !!authorization.activated_datetime;
  } else if (accountType === "patient") {
    if (!user) blockers.push("This patient record has no active AMedix account.");
    const patientVerified = identityVerifiedFor(verifications, "patient");
    const override = control && control.verification_status === "verified";
    if (!patientVerified && !override) blockers.push("The patient identity verification has not been completed.");
    if (control && control.verification_status === "rejected") blockers.push("AMedix administration rejected the patient's verification.");
    verified = patientVerified || override;
  } else {
    blockers.push("This account has no verified doctor, hospital or patient profile.");
  }

  const eligible = blockers.length === 0 && verified;

  return {
    user_id: snap.userId,
    account_type: accountType,
    display_name:
      (hospital && hospital.hospital_name) ||
      (doctor && doctor.full_name) ||
      (patient && patient.full_name) ||
      (user && user.full_name) ||
      "",
    email: (user && user.email) || "",
    verified,
    status,
    verification_status: (control && control.verification_status) || (verified ? "verified" : "pending"),
    classification,
    review_state: (control && control.review_state) || (evidence.length > 0 ? "flagged" : "none"),
    review_note: (control && control.review_note) || "",
    test_evidence: evidence,
    eligible,
    reason: blockers[0] || "",
    blockers,
    user_exists: !!user,
    profiles: {
      doctor_id: doctor ? doctor.id : "",
      hospital_id: hospital ? hospital.id : "",
      hospital_authorization_id: authorization ? authorization.id : "",
      patient_id: patient ? patient.id : "",
    },
    doctor,
    hospital,
    patient,
  };
}

export async function evaluateAccount(base44, userId) {
  const snap = await loadAccountSnapshot(base44, userId);
  return evaluateSnapshot(snap);
}

// Bulk evaluation for directories: one set of queries for every account.
export async function buildEligibilityIndex(base44) {
  const [doctors, hospitals, authorizations, patients, verifications, drafts, controls] = await Promise.all([
    fetchAll(base44, "DoctorProfile"),
    fetchAll(base44, "HospitalProfile"),
    fetchAll(base44, "HospitalAuthorization"),
    fetchAll(base44, "PatientProfile"),
    fetchAll(base44, "IdentityVerification"),
    fetchAll(base44, "DoctorRegistrationDraft"),
    fetchAll(base44, "AccountControl"),
  ]);

  const userIds = [
    ...doctors.map((d) => d.user_id),
    ...hospitals.map((h) => h.user_id),
    ...patients.map((p) => p.user_id),
  ].filter(Boolean);
  const users = await loadAllUsers(base44, userIds);

  const byUser = (rows) => {
    const map = new Map();
    rows.forEach((r) => {
      if (!r.user_id) return;
      if (!map.has(r.user_id)) map.set(r.user_id, []);
      map.get(r.user_id).push(r);
    });
    return map;
  };
  const doctorsByUser = byUser(doctors);
  const hospitalsByUser = byUser(hospitals);
  const patientsByUser = byUser(patients);
  const verificationsByUser = byUser(verifications);
  const draftsByUser = byUser(drafts);
  const controlsByUser = byUser(controls);
  const authByHospital = new Map(authorizations.map((a) => [a.hospital_profile_id, a]));

  const evaluations = new Map();
  const allUserIds = new Set([...users.keys(), ...doctorsByUser.keys(), ...hospitalsByUser.keys(), ...patientsByUser.keys()]);

  allUserIds.forEach((userId) => {
    const hospital = (hospitalsByUser.get(userId) || [])[0] || null;
    const snap = {
      userId,
      user: users.get(userId) || null,
      doctor: pickPrimary(doctorsByUser.get(userId) || []),
      hospitals: hospitalsByUser.get(userId) || [],
      hospital,
      authorization: hospital ? authByHospital.get(hospital.id) || null : null,
      patient: pickPrimary(patientsByUser.get(userId) || []),
      patients: patientsByUser.get(userId) || [],
      verifications: verificationsByUser.get(userId) || [],
      draft: (draftsByUser.get(userId) || [])[0] || null,
      control: (controlsByUser.get(userId) || [])[0] || null,
    };
    evaluations.set(userId, evaluateSnapshot(snap));
  });

  return {
    evaluations,
    users,
    doctors,
    hospitals,
    authorizations,
    patients,
    controls,
    doctorsByUser,
    hospitalsByUser,
    patientsByUser,
  };
}

export function eligibleEvaluations(index, accountType) {
  return [...index.evaluations.values()]
    .filter((e) => e.account_type === accountType && e.eligible)
    .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)));
}

// The actor's own standing. A designated hospital staff member inherits the
// facility's standing and must still hold an active, non-blocked account.
export async function evaluateMessagingActor(base44, actor) {
  if (!actor) return { eligible: false, reason: "This account has no messaging access.", blockers: ["No messaging role"], account_type: "none" };

  if (actor.role === "hospital" && actor.isAdmin === false) {
    const facility = await evaluateAccount(base44, actor.hospitalUserId);
    const staff = await evaluateAccount(base44, actor.userId);
    const blockers = [...facility.blockers];
    if (staff.status && staff.status !== "active") blockers.push("Your own staff account is no longer active.");
    return {
      ...facility,
      role: "hospital",
      user_id: actor.userId,
      display_name: actor.displayName,
      account_type: "hospital",
      eligible: facility.eligible && (!staff.status || staff.status === "active"),
      blockers,
      reason: blockers[0] || "",
    };
  }

  const evaluation = await evaluateAccount(base44, actor.userId);
  return { ...evaluation, role: actor.role };
}

export async function logAccountAudit(base44, params) {
  try {
    await base44.asServiceRole.entities.AccountAuditLog.create({
      user_id: params.userId || "",
      account_type: params.accountType || "",
      account_name: params.accountName || "",
      email: params.email || "",
      action: params.action,
      action_label: params.actionLabel || params.action,
      detail: params.detail || "",
      previous_value: params.previousValue || "",
      new_value: params.newValue || "",
      actor_user_id: params.actorUserId || "",
      actor_name: params.actorName || "System",
      actor_role: params.actorRole || "system",
      datetime: new Date().toISOString(),
    });
  } catch (err) {
    // The audit write is always attempted; it never masks the action's result.
  }
}

export function eligibilityDenial(evaluation, fallback = "This account is not eligible for AMedix messaging.") {
  const reason = evaluation && evaluation.reason ? evaluation.reason : fallback;
  return {
    error: reason,
    code: "ACCOUNT_INELIGIBLE",
    blockers: (evaluation && evaluation.blockers) || [],
  };
}