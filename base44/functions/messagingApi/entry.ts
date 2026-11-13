import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CATEGORY_KEYS,
  THREAD_STATUSES,
  PATIENT_MESSAGE_TYPES,
  PATIENT_MESSAGE_TYPE_KEYS,
  cleanText,
  queryRows,
  makeThreadRef,
  resolveMessagingActor,
  findActiveAffiliation,
  findCareLink,
  findDoctorPairThread,
  findPatientThread,
  isVerifiedDoctor,
  participantsFor,
  logMessageAudit,
  notifyRecipient,
  hospitalNotificationRecipients,
  previewOf,
  sanitizeAttachments,
  threadChannel,
} from "../../shared/messaging.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";
import {
  evaluateAccount,
  evaluateMessagingActor,
  buildEligibilityIndex,
  eligibleEvaluations,
  eligibilityDenial,
  logAccountAudit,
} from "../../shared/verifiedAccounts.ts";

// Secure AMedix messaging. Three channels, one authorization core:
//   hospital — doctor ↔ hospital administration (two-way)
//   doctor   — doctor ↔ doctor, hospital-verified doctors only (two-way)
//   patient  — doctor → patient (STRICTLY one-way; a patient can read, never send)
// Every read, write, attachment download, assignment and status change is
// authorized HERE on the server. The browser's visibility is never the security
// boundary. All writes go through the service role after verification, and every
// event is recorded in the append-only audit trail.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || "");
    const actor = await resolveMessagingActor(base44, user);
    if (!actor) {
      return Response.json({ error: "This account has no messaging access." }, { status: 403 });
    }

    // The account's own verified standing, resolved from the database — never
    // from anything the browser sent.
    const actorCheck = await evaluateMessagingActor(base44, actor);

    const now = () => new Date().toISOString();
    const isPatientActor = actor.role === "patient";
    const doctorLabel = (name) => {
      const value = String(name || "Doctor").trim();
      return /^dr\.?\s/i.test(value) ? value : `Dr. ${value}`;
    };

    const publicActor = () => ({
      role: actor.role,
      display_name: actor.displayName,
      user_id: actor.userId,
      hospital_user_id: actor.hospitalUserId || "",
      hospital_name: actor.hospitalName || "",
      staff_role: actor.staffRole || "",
      department: actor.department || "",
      doctor_id: actor.doctorId || "",
      specialty: actor.specialty || "",
      verified: actor.verified === true,
      patient_id: actor.patientId || "",
      patient_cin: actor.patientCin || "",
    });

    // Which side of the conversation the signed-in account holds. "peer" is the
    // second doctor of a doctor ↔ doctor conversation.
    const viewerSide = (thread) => {
      const channel = threadChannel(thread);
      if (channel === "patient") return actor.role === "patient" ? "patient" : "doctor";
      if (channel === "doctor") return thread.doctor_user_id === user.id ? "doctor" : "peer";
      return actor.role === "doctor" ? "doctor" : "hospital";
    };

    const ownUnread = (thread) => {
      const side = viewerSide(thread);
      if (side === "doctor") return thread.doctor_unread_count || 0;
      if (side === "hospital" || side === "peer") return thread.hospital_unread_count || 0;
      return thread.patient_unread_count || 0;
    };

    // A conversation is loaded only when this account is one of its parties.
    // Nothing is ever trusted from the browser — the id alone grants nothing.
    const loadThread = async (threadId) => {
      if (!threadId) return null;
      const rows = await queryRows(base44, "MessageThread", { id: String(threadId) }, { limit: 1 });
      const thread = rows[0];
      if (!thread) return null;
      const channel = threadChannel(thread);
      if (channel === "doctor") {
        if (actor.role !== "doctor") return null;
        return [thread.doctor_user_id, thread.peer_doctor_user_id].includes(user.id) ? thread : null;
      }
      if (channel === "patient") {
        if (actor.role === "patient") return thread.patient_user_id === user.id ? thread : null;
        return thread.doctor_user_id === user.id ? thread : null;
      }
      if (actor.role === "doctor" && thread.doctor_user_id !== user.id) return null;
      if (actor.role === "hospital" && thread.hospital_user_id !== actor.hospitalUserId) return null;
      if (actor.role === "patient") return null;
      return thread;
    };

    const denyThread = async (threadId, reason) => {
      await logMessageAudit(base44, {
        thread: { id: threadId },
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "access_denied",
        actionLabel: "blocked an unauthorized conversation access attempt",
        detail: reason || "",
      });
      return Response.json({ error: "You are not authorized to access this conversation." }, { status: 403 });
    };

    const counterpartFor = (thread) => {
      const channel = threadChannel(thread);
      const side = viewerSide(thread);
      if (channel === "doctor") {
        const name = side === "doctor" ? thread.peer_doctor_name : thread.doctor_name;
        const subtitle = (side === "doctor" ? thread.peer_doctor_specialization : thread.doctor_specialization) || "";
        const hospital = side === "doctor" ? thread.peer_doctor_hospital : "";
        return { name: doctorLabel(name), subtitle, hospital: hospital || "" };
      }
      if (channel === "patient") {
        if (actor.role === "patient") {
          return { name: doctorLabel(thread.doctor_name), subtitle: thread.doctor_specialization || "", hospital: thread.hospital_name || "" };
        }
        return { name: thread.patient_name || "Patient", subtitle: thread.patient_cin ? `CIN ${thread.patient_cin}` : "", hospital: "" };
      }
      return {
        name: actor.role === "doctor" ? thread.hospital_name || "Hospital" : doctorLabel(thread.doctor_name),
        subtitle: actor.role === "doctor" ? "" : thread.doctor_specialization || "",
        hospital: "",
      };
    };

    const decorate = (thread) => ({
      ...thread,
      channel: threadChannel(thread),
      viewer_side: viewerSide(thread),
      viewer_unread: ownUnread(thread),
      counterpart_name: counterpartFor(thread).name,
      counterpart_subtitle: counterpartFor(thread).subtitle,
    });

    const unreadSummary = async () => {
      let threads = [];
      if (actor.role === "doctor") {
        const own = await queryRows(base44, "MessageThread", { doctor_user_id: user.id }, { limit: 500 });
        const peer = await queryRows(base44, "MessageThread", { peer_doctor_user_id: user.id }, { limit: 500 });
        threads = [...own, ...peer];
      } else if (actor.role === "hospital") {
        threads = await queryRows(base44, "MessageThread", { hospital_user_id: actor.hospitalUserId }, { limit: 500 });
      } else {
        threads = await queryRows(base44, "MessageThread", { patient_user_id: user.id }, { limit: 300 });
      }
      const unique = new Map(threads.map((t) => [t.id, t]));
      const by_channel = { hospital: 0, doctor: 0, patient: 0 };
      let threadsUnread = 0;
      let messagesUnread = 0;
      unique.forEach((t) => {
        const n = ownUnread(t);
        if (n > 0) {
          threadsUnread += 1;
          messagesUnread += n;
          by_channel[threadChannel(t)] += n;
        }
      });
      const notifs = await queryRows(base44, "MessageNotification", { recipient_user_id: user.id, is_read: false }, { limit: 200 });
      return { threads_unread: threadsUnread, messages_unread: messagesUnread, notifications_unread: notifs.length, by_channel };
    };

    // ---- Verified-accounts-only gate ----
    // Every action except reading the messaging context needs an account that is
    // both verified and active, evaluated here on every request. A hidden button,
    // a typed recipient id or a saved conversation link therefore grants nothing.
    const actorEligibility = {
      eligible: actorCheck.eligible,
      verified: actorCheck.verified,
      account_type: actorCheck.account_type,
      status: actorCheck.status,
      classification: actorCheck.classification,
      reason: actorCheck.reason,
      blockers: actorCheck.blockers,
    };

    if (action !== "context" && !actorCheck.eligible) {
      await logAccountAudit(base44, {
        userId: user.id,
        accountType: actorCheck.account_type,
        accountName: actorCheck.display_name,
        email: user.email || "",
        action: "messaging_blocked",
        actionLabel: "rejected a messaging action from an ineligible account",
        detail: `${action}: ${actorCheck.reason}`,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
      });
      return Response.json(eligibilityDenial(actorCheck), { status: 403 });
    }

    // The other party of a conversation must still be eligible right now — a
    // conversation that exists gives no ongoing right to message an account that
    // has since been suspended or lost verification.
    const counterpartEligibility = async (thread) => {
      const channel = threadChannel(thread);
      const ids = [];
      if (channel === "doctor") {
        const peerId = thread.doctor_user_id === user.id ? thread.peer_doctor_user_id : thread.doctor_user_id;
        if (peerId && peerId !== user.id) ids.push(peerId);
      } else if (channel === "patient") {
        if (thread.patient_user_id && thread.patient_user_id !== user.id) ids.push(thread.patient_user_id);
      } else if (actor.role === "doctor") {
        if (thread.hospital_user_id) ids.push(thread.hospital_user_id);
      } else if (actor.role === "hospital") {
        if (thread.doctor_user_id) ids.push(thread.doctor_user_id);
      }
      for (const id of ids) {
        const evaluation = await evaluateAccount(base44, id);
        if (!evaluation.eligible) return evaluation;
      }
      return null;
    };

    const rejectCounterpart = async (evaluation, threadId) => {
      await logAccountAudit(base44, {
        userId: evaluation.user_id,
        accountType: evaluation.account_type,
        accountName: evaluation.display_name,
        action: "security_rejection",
        actionLabel: "blocked a message involving an ineligible account",
        detail: evaluation.reason,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
      });
      await logMessageAudit(base44, {
        thread: { id: threadId || "" },
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "send_blocked",
        actionLabel: "blocked a message to an account that is no longer eligible",
        detail: `${evaluation.account_type}: ${evaluation.reason}`,
      });
      return Response.json(
        { error: `This conversation cannot continue: ${evaluation.reason}`, code: "RECIPIENT_INELIGIBLE" },
        { status: 403 }
      );
    };

    // Actions a patient account may ever reach. Everything else is refused
    // before any handler runs — a patient cannot compose, reply or manage.
    const PATIENT_ACTIONS = ["context", "listThreads", "thread", "attachmentUrl", "notifications", "markNotificationsRead"];
    if (isPatientActor && !PATIENT_ACTIONS.includes(action)) {
      await logMessageAudit(base44, {
        thread: {},
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: "patient",
        action: "send_blocked",
        actionLabel: "attempted an action outside the one-way patient channel",
        detail: action,
      });
      return Response.json({ error: "Patients can read messages from their doctors but cannot reply or start a conversation." }, { status: 403 });
    }

    if (action === "context") {
      const unread = await unreadSummary();
      if (actor.role === "doctor") {
        const affiliations = await queryRows(
          base44,
          "HospitalDoctor",
          { doctor_id: actor.doctorId, status: "active" },
          { limit: 50 }
        );
        const hospitals = affiliations.map((a) => ({
          hospital_user_id: a.hospital_user_id,
          hospital_id: a.hospital_id,
          hospital_name: a.hospital_name,
          specialization: a.specialization,
        }));
        const currentHospital = String(actor.doctor.hospital || "").trim().toLowerCase();
        if (currentHospital && !hospitals.some((h) => String(h.hospital_name || "").trim().toLowerCase() === currentHospital)) {
          const allHospitals = await queryRows(base44, "HospitalProfile", {}, { limit: 500 });
          const match = allHospitals.find((h) => String(h.hospital_name || "").trim().toLowerCase() === currentHospital);
          hospitals.push({
            hospital_user_id: match ? match.user_id : "",
            hospital_id: match ? match.id : "",
            hospital_name: actor.doctor.hospital,
            specialization: actor.doctor.specialization || "",
          });
        }
        // Only hospitals that are institutionally verified, approved by AMedix
        // administration and active may be written to — a hospital that is
        // pending, suspended or unregistered never appears as a recipient.
        const hospitalIndex = await buildEligibilityIndex(base44);
        const verifiedHospitals = hospitals
          .map((h) => {
            const evaluation = h.hospital_user_id ? hospitalIndex.evaluations.get(h.hospital_user_id) : null;
            return {
              ...h,
              verified: !!evaluation && evaluation.eligible,
              verification_reason: evaluation ? evaluation.reason : "No eligible hospital account",
            };
          })
          .filter((h) => h.verified);

        return Response.json({
          actor: publicActor(),
          eligibility: actorEligibility,
          hospitals: verifiedHospitals,
          unread,
          staff: [],
          departments: [],
          patient_message_types: PATIENT_MESSAGE_TYPES,
        });
      }
      if (actor.role === "patient") {
        return Response.json({
          actor: publicActor(),
          eligibility: actorEligibility,
          hospitals: [],
          departments: [],
          staff: [],
          unread,
          patient_message_types: [],
        });
      }
      const doctors = await queryRows(
        base44,
        "HospitalDoctor",
        { hospital_user_id: actor.hospitalUserId, status: "active" },
        { limit: 500 }
      );
      const departments = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();
      const staff = await queryRows(
        base44,
        "HospitalMessagingStaff",
        actor.isAdmin ? { hospital_user_id: actor.hospitalUserId } : { hospital_user_id: actor.hospitalUserId, status: "active" },
        { limit: 100 }
      );
      return Response.json({
        actor: publicActor(),
        hospitals: [
          {
            hospital_user_id: actor.hospitalUserId,
            hospital_id: actor.hospitalId || "",
            hospital_name: actor.hospitalName,
            specialization: "",
          },
        ],
        departments,
        staff,
        unread,
        patient_message_types: [],
      });
    }

    if (action === "listThreads") {
      const channel = isPatientActor
        ? "patient"
        : ["hospital", "doctor", "patient"].includes(String(body.channel || ""))
          ? String(body.channel)
          : "hospital";

      let rows = [];
      if (actor.role === "hospital") {
        rows = await queryRows(base44, "MessageThread", { hospital_user_id: actor.hospitalUserId }, { limit: 300 });
      } else if (actor.role === "patient") {
        rows = await queryRows(base44, "MessageThread", { patient_user_id: user.id }, { limit: 300 });
      } else if (channel === "doctor") {
        const own = await queryRows(base44, "MessageThread", { doctor_user_id: user.id }, { limit: 300 });
        const peer = await queryRows(base44, "MessageThread", { peer_doctor_user_id: user.id }, { limit: 300 });
        rows = [...own, ...peer];
      } else {
        rows = await queryRows(base44, "MessageThread", { doctor_user_id: user.id }, { limit: 300 });
      }

      const unique = new Map(rows.map((t) => [t.id, t]));
      let threads = [...unique.values()].filter((t) => threadChannel(t) === channel);

      if (actor.role === "hospital") {
        threads = threads.filter((t) => t.hospital_user_id === actor.hospitalUserId);
      }
      if (actor.role === "doctor" && channel === "hospital") {
        if (body.hospital_user_id) threads = threads.filter((t) => t.hospital_user_id === String(body.hospital_user_id));
        if (body.hospital_name) threads = threads.filter((t) => t.hospital_name === String(body.hospital_name));
      }
      if (body.status && THREAD_STATUSES.includes(body.status)) threads = threads.filter((t) => t.status === body.status);
      if (body.category) threads = threads.filter((t) => t.category === String(body.category));
      if (channel === "hospital") {
        if (body.announcement_only) threads = threads.filter((t) => t.is_announcement);
        else if (!body.include_announcements) threads = threads.filter((t) => !t.is_announcement);
      }
      if (body.unread_only) threads = threads.filter((t) => ownUnread(t) > 0);
      if (body.search) {
        const s = String(body.search).toLowerCase();
        threads = threads.filter((t) =>
          [
            t.subject,
            t.last_message_preview,
            t.doctor_name,
            t.hospital_name,
            t.peer_doctor_name,
            t.peer_doctor_hospital,
            t.patient_name,
            t.patient_cin,
            t.assigned_staff_name,
            t.thread_ref,
            t.category,
            t.assigned_department,
          ]
            .join(" ")
            .toLowerCase()
            .includes(s)
        );
      }

      threads.sort((a, b) => String(b.last_activity_datetime || "").localeCompare(String(a.last_activity_datetime || "")));
      return Response.json({ threads: threads.map(decorate), channel, unread: await unreadSummary() });
    }

    if (action === "thread") {
      const thread = await loadThread(body.thread_id);
      if (!thread) return denyThread(body.thread_id, "thread lookup");

      const channel = threadChannel(thread);
      const side = viewerSide(thread);
      let messages = await queryRows(base44, "MessageEntry", { thread_id: thread.id }, { sort: "created_date", limit: 500 });
      const audit = await queryRows(base44, "MessageAuditEvent", { thread_id: thread.id }, { sort: "-created_date", limit: 200 });

      const previousUnread = ownUnread(thread);
      let fresh = thread;
      if (body.mark_read !== false && previousUnread > 0) {
        const stamp = now();
        const messageQuery = { thread_id: thread.id };
        const messageSet = {};
        const threadSet = {};
        if (side === "doctor") {
          messageQuery.read_by_doctor = false;
          messageSet.read_by_doctor = true;
          messageSet.doctor_read_datetime = stamp;
          threadSet.doctor_unread_count = 0;
          threadSet.doctor_last_read_datetime = stamp;
        } else if (side === "patient") {
          messageQuery.read_by_patient = false;
          messageSet.read_by_patient = true;
          messageSet.patient_read_datetime = stamp;
          threadSet.patient_unread_count = 0;
          threadSet.patient_last_read_datetime = stamp;
        } else {
          messageQuery.read_by_hospital = false;
          messageSet.read_by_hospital = true;
          messageSet.hospital_read_datetime = stamp;
          threadSet.hospital_unread_count = 0;
          threadSet.hospital_last_read_datetime = stamp;
        }
        try {
          await base44.asServiceRole.entities.MessageEntry.updateMany(messageQuery, { $set: messageSet });
        } catch (err) {
          // message-level read flags are best-effort; the conversation counter below is authoritative
        }
        fresh = await base44.asServiceRole.entities.MessageThread.update(thread.id, threadSet);
        messages = messages.map((m) => ({ ...m, ...messageSet }));
        await logMessageAudit(base44, {
          thread,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: channel === "patient" ? "message_read" : "conversation_read",
          actionLabel: channel === "patient" ? "read the doctor's message" : "read the conversation",
          detail: `${previousUnread} unread message(s) read`,
        });
      }

      if (body.mark_read !== false) {
        try {
          await base44.asServiceRole.entities.MessageNotification.updateMany(
            { recipient_user_id: user.id, thread_id: thread.id, is_read: false },
            { $set: { is_read: true, read_datetime: now() } }
          );
        } catch (err) {
          // the notification list refresh reflects the stored state either way
        }
        if (side === "patient") {
          try {
            await base44.asServiceRole.entities.PatientNotification.updateMany(
              { patient_user_id: user.id, related_id: thread.id, is_read: false },
              { $set: { is_read: true } }
            );
          } catch (err) {
            // best-effort — the patient's bell reconciles on its next load
          }
        }
      }

      // Delivery / read indicator for the viewing side, computed server-side so
      // the browser never has to guess whose flag means what.
      const readByCounterpart = (m) => {
        if (channel === "patient") return side === "patient" ? true : m.read_by_patient === true;
        if (channel === "doctor") return side === "doctor" ? m.read_by_hospital === true : m.read_by_doctor === true;
        return side === "doctor" ? m.read_by_hospital === true : m.read_by_doctor === true;
      };
      const decorated = messages.map((m) => ({ ...m, read_by_counterpart: readByCounterpart(m) }));

      // A patient always gets an approved contact route for anything that needs
      // a person — the one-way channel is never an emergency service.
      let hospital_contact = null;
      if (channel === "patient") {
        try {
          const rows = thread.hospital_user_id
            ? await queryRows(base44, "HospitalProfile", { user_id: thread.hospital_user_id }, { limit: 1 })
            : await queryRows(base44, "HospitalProfile", { hospital_name: thread.hospital_name }, { limit: 1 });
          if (rows[0]) hospital_contact = { name: rows[0].hospital_name, phone: rows[0].phone || "", location: rows[0].location || "" };
        } catch (err) {
          hospital_contact = thread.hospital_name ? { name: thread.hospital_name, phone: "", location: "" } : null;
        }
      }

      return Response.json({
        thread: decorate(fresh),
        messages: decorated,
        audit,
        actor: publicActor(),
        one_way: channel === "patient",
        counterpart: counterpartFor(fresh),
        hospital_contact,
      });
    }

    // ---- Verified doctor directory (doctor ↔ doctor) ----
    if (action === "doctorDirectory") {
      if (actor.role !== "doctor") return Response.json({ error: "Doctor access required." }, { status: 403 });
      if (!isVerifiedDoctor(actor.doctor)) {
        return Response.json({ error: "Only verified doctors can use doctor-to-doctor messaging." }, { status: 403 });
      }
      const search = cleanText(body.search, 80).toLowerCase();
      const index = await buildEligibilityIndex(base44);
      const doctors = eligibleEvaluations(index, "doctor")
        .filter((e) => e.user_id !== user.id)
        .filter((e) => {
          if (!search) return true;
          const d = e.doctor || {};
          return [d.full_name, d.specialization, d.hospital].join(" ").toLowerCase().includes(search);
        })
        .slice(0, 40)
        .map((e) => ({
          doctor_id: e.profiles.doctor_id,
          doctor_user_id: e.user_id,
          full_name: e.doctor.full_name,
          specialization: e.doctor.specialization || "",
          hospital: e.doctor.hospital || "",
          photo_url: e.doctor.photo_url || "",
          verified: true,
        }));
      return Response.json({ doctors });
    }

    // ---- Authorized patients (doctor → patient) ----
    if (action === "patientDirectory") {
      if (actor.role !== "doctor") return Response.json({ error: "Doctor access required." }, { status: 403 });
      const links = await queryRows(base44, "AccessRequest", { doctor_id: actor.doctorId, status: "approved" }, { limit: 500 });
      const ids = [...new Set(links.map((l) => l.patient_id).filter(Boolean))].slice(0, 200);
      let profiles = [];
      if (ids.length > 0) {
        try {
          profiles = await queryRows(base44, "PatientProfile", { id: { $in: ids } }, { limit: 200 });
        } catch (err) {
          const batches = [];
          for (let i = 0; i < ids.length; i += 10) {
            batches.push(await Promise.all(ids.slice(i, i + 10).map((id) => queryRows(base44, "PatientProfile", { id }, { limit: 1 }))));
          }
          profiles = batches.flat().map((r) => r[0]).filter(Boolean);
        }
      }
      const search = cleanText(body.search, 80).toLowerCase();
      const index = await buildEligibilityIndex(base44);
      const patients = profiles
        .filter((p) => {
          const evaluation = p.user_id ? index.evaluations.get(p.user_id) : null;
          return !!evaluation && evaluation.eligible && evaluation.account_type === "patient";
        })
        .filter((p) => !search || [p.full_name, p.cin].join(" ").toLowerCase().includes(search))
        .sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || "")))
        .slice(0, 200)
        .map((p) => ({
          patient_id: p.id,
          patient_user_id: p.user_id,
          full_name: p.full_name,
          cin: p.cin || "",
          gender: p.gender || "",
          date_of_birth: p.date_of_birth || "",
        }));
      return Response.json({ patients });
    }

    if (action === "send") {
      if (actor.role === "patient") {
        return Response.json({ error: "This is a one-way message channel — patients cannot reply." }, { status: 403 });
      }
      const attachments = sanitizeAttachments(body.attachments);
      const text = cleanText(body.body, 5000);
      if (!text && attachments.length === 0) {
        return Response.json({ error: "Write a message or attach a file." }, { status: 400 });
      }

      // Anti-spam / rate limiting: a burst of messages from one account is
      // refused rather than delivered.
      const recent = await queryRows(base44, "MessageEntry", { sender_user_id: user.id }, { sort: "-created_date", limit: 8 });
      const cutoff = Date.now() - 60 * 1000;
      if (recent.length >= 8 && recent.every((m) => new Date(m.created_date || m.datetime || 0).getTime() > cutoff)) {
        return Response.json({ error: "You are sending messages too quickly. Please wait a moment." }, { status: 429 });
      }

      let thread = null;
      const requestedChannel = ["hospital", "doctor", "patient"].includes(String(body.channel || ""))
        ? String(body.channel)
        : "hospital";

      if (body.thread_id) {
        thread = await loadThread(body.thread_id);
        if (!thread) return denyThread(body.thread_id, "send to thread");
        const existingChannel = threadChannel(thread);
        if (existingChannel === "patient" && actor.role !== "doctor") {
          return Response.json({ error: "Only the treating doctor can write in this conversation." }, { status: 403 });
        }
        if (existingChannel === "doctor" && actor.role !== "doctor") {
          return Response.json({ error: "Only doctors can write in this conversation." }, { status: 403 });
        }
        const counterpart = await counterpartEligibility(thread);
        if (counterpart) return rejectCounterpart(counterpart, thread.id);
      } else if (requestedChannel === "doctor") {
        // ---- doctor ↔ doctor: both accounts must be verified ----
        if (actor.role !== "doctor") return Response.json({ error: "Doctor access required." }, { status: 403 });
        if (!isVerifiedDoctor(actor.doctor)) {
          return Response.json({ error: "Only verified doctors can start a doctor-to-doctor conversation." }, { status: 403 });
        }
        const peerUserId = String(body.peer_user_id || "");
        if (!peerUserId) return Response.json({ error: "Select the doctor you are writing to." }, { status: 400 });
        if (peerUserId === user.id) return Response.json({ error: "You cannot start a conversation with yourself." }, { status: 400 });
        const peerRows = await queryRows(base44, "DoctorProfile", { user_id: peerUserId }, { limit: 1 });
        const peer = peerRows[0];
        if (!peer || !isVerifiedDoctor(peer)) {
          return Response.json({ error: "That doctor's account is not verified." }, { status: 403 });
        }
        const peerEvaluation = await evaluateAccount(base44, peerUserId);
        if (!peerEvaluation.eligible) return rejectCounterpart(peerEvaluation, "");
        const subject = cleanText(body.subject, 200);
        if (!subject) return Response.json({ error: "A conversation subject is required." }, { status: 400 });

        thread = await findDoctorPairThread(base44, user.id, peerUserId);
        if (!thread) {
          const affiliations = await queryRows(base44, "HospitalDoctor", { doctor_id: actor.doctorId, status: "active" }, { limit: 1 });
          thread = await base44.asServiceRole.entities.MessageThread.create({
            thread_ref: makeThreadRef(),
            channel: "doctor",
            one_way: false,
            hospital_user_id: affiliations[0] ? affiliations[0].hospital_user_id : "",
            hospital_name: affiliations[0] ? affiliations[0].hospital_name : "",
            doctor_user_id: user.id,
            doctor_id: actor.doctorId,
            doctor_name: actor.doctor.full_name,
            doctor_specialization: actor.specialty || "",
            peer_doctor_user_id: peerUserId,
            peer_doctor_id: peer.id,
            peer_doctor_name: peer.full_name,
            peer_doctor_specialization: peer.specialization || "",
            peer_doctor_hospital: peer.hospital || "",
            subject,
            category: "medical_administration",
            status: "in_progress",
            participant_user_ids: [user.id, peerUserId],
            created_by_role: "doctor",
            is_announcement: false,
            message_count: 0,
            last_message_preview: "",
            last_message_datetime: now(),
            last_activity_datetime: now(),
            doctor_unread_count: 0,
            hospital_unread_count: 0,
            status_history: [{ to: "in_progress", by_name: actor.displayName, by_role: "doctor", datetime: now() }],
            assignment_history: [],
          });
          await logMessageAudit(base44, {
            thread,
            actorUserId: user.id,
            actorName: actor.displayName,
            actorRole: "doctor",
            action: "conversation_created",
            actionLabel: `opened a doctor-to-doctor conversation with ${doctorLabel(peer.full_name)}`,
            detail: subject,
          });
        }
      } else if (requestedChannel === "patient") {
        // ---- doctor → patient: requires an explicit, approved care relationship ----
        if (actor.role !== "doctor") return Response.json({ error: "Doctor access required." }, { status: 403 });
        const patientId = String(body.patient_id || "");
        if (!patientId) return Response.json({ error: "Select the patient you are writing to." }, { status: 400 });
        const patientRows = await queryRows(base44, "PatientProfile", { id: patientId }, { limit: 1 });
        const patient = patientRows[0];
        if (!patient || !patient.user_id) return Response.json({ error: "Patient record not found." }, { status: 404 });
        // The patient must hold a real, verified and active account before any
        // clinical instruction is delivered to them.
        const patientEvaluation = await evaluateAccount(base44, patient.user_id);
        if (!patientEvaluation.eligible) return rejectCounterpart(patientEvaluation, "");
        const link = await findCareLink(base44, actor.doctorId, patientId);
        if (!link) {
          await logMessageAudit(base44, {
            thread: { id: "" },
            actorUserId: user.id,
            actorName: actor.displayName,
            actorRole: "doctor",
            action: "access_denied",
            actionLabel: "attempted to message a patient without an approved care relationship",
            detail: patient.cin || patientId,
          });
          return Response.json({ error: "This patient has not granted you access to their record, so you cannot message them." }, { status: 403 });
        }
        const messageType = PATIENT_MESSAGE_TYPE_KEYS.includes(String(body.patient_message_type || ""))
          ? String(body.patient_message_type)
          : "general";
        const subject = cleanText(body.subject, 200) || `Message from ${doctorLabel(actor.doctor.full_name)}`;
        const affiliations = await queryRows(base44, "HospitalDoctor", { doctor_id: actor.doctorId, status: "active" }, { limit: 1 });

        thread = await findPatientThread(base44, user.id, patientId);
        if (!thread) {
          thread = await base44.asServiceRole.entities.MessageThread.create({
            thread_ref: makeThreadRef(),
            channel: "patient",
            one_way: true,
            hospital_user_id: affiliations[0] ? affiliations[0].hospital_user_id : "",
            hospital_id: affiliations[0] ? affiliations[0].hospital_id || "" : "",
            hospital_name: affiliations[0] ? affiliations[0].hospital_name : actor.doctor.hospital || "",
            doctor_user_id: user.id,
            doctor_id: actor.doctorId,
            doctor_name: actor.doctor.full_name,
            doctor_specialization: actor.specialty || "",
            patient_user_id: patient.user_id,
            patient_id: patient.id,
            patient_cin: patient.cin || "",
            patient_name: patient.full_name,
            patient_message_type: messageType,
            subject,
            category: "medical_administration",
            status: "in_progress",
            participant_user_ids: [user.id, patient.user_id],
            created_by_role: "doctor",
            is_announcement: false,
            message_count: 0,
            last_message_preview: "",
            last_message_datetime: now(),
            last_activity_datetime: now(),
            doctor_unread_count: 0,
            hospital_unread_count: 0,
            patient_unread_count: 0,
            status_history: [{ to: "in_progress", by_name: actor.displayName, by_role: "doctor", datetime: now() }],
            assignment_history: [],
          });
          await logMessageAudit(base44, {
            thread,
            actorUserId: user.id,
            actorName: actor.displayName,
            actorRole: "doctor",
            action: "conversation_created",
            actionLabel: "opened a one-way message to a patient under their care",
            detail: `${patient.cin || patientId} (${messageType})`,
          });
        }
      } else {
        // ---- doctor ↔ hospital (unchanged behaviour) ----
        const category = String(body.category || "");
        if (!CATEGORY_KEYS.includes(category)) {
          return Response.json({ error: "Select a valid communication category." }, { status: 400 });
        }
        const subject = cleanText(body.subject, 200);
        if (!subject) return Response.json({ error: "A conversation subject is required." }, { status: 400 });

        let affiliation = null;
        if (actor.role === "doctor") {
          const hospitalUserId = String(body.hospital_user_id || "");
          if (!hospitalUserId) return Response.json({ error: "Select the hospital you are writing to." }, { status: 403 });
          affiliation = await findActiveAffiliation(base44, hospitalUserId, actor.doctorId);
          if (!affiliation) {
            return Response.json({ error: "You are not actively affiliated with that hospital." }, { status: 403 });
          }
        } else {
          const doctorId = String(body.doctor_id || "");
          if (!doctorId) return Response.json({ error: "Select a doctor." }, { status: 400 });
          affiliation = await findActiveAffiliation(base44, actor.hospitalUserId, doctorId);
          if (!affiliation) {
            return Response.json({ error: "That doctor is not actively affiliated with your hospital." }, { status: 403 });
          }
        }

        // The other party of a new hospital conversation must be eligible too.
        const hospitalCounterpart = await evaluateAccount(
          base44,
          actor.role === "doctor" ? affiliation.hospital_user_id : affiliation.doctor_user_id
        );
        if (!hospitalCounterpart.eligible) return rejectCounterpart(hospitalCounterpart, "");

        const participants = participantsFor(affiliation.doctor_user_id, affiliation.hospital_user_id, null);
        thread = await base44.asServiceRole.entities.MessageThread.create({
          thread_ref: makeThreadRef(),
          channel: "hospital",
          one_way: false,
          hospital_user_id: affiliation.hospital_user_id,
          hospital_id: affiliation.hospital_id || "",
          hospital_name: affiliation.hospital_name,
          doctor_user_id: affiliation.doctor_user_id,
          doctor_id: affiliation.doctor_id,
          doctor_name: affiliation.doctor_name,
          doctor_specialization: affiliation.specialization || "",
          subject,
          category,
          status: "pending",
          participant_user_ids: participants,
          created_by_role: actor.role,
          is_announcement: false,
          message_count: 0,
          last_message_preview: "",
          last_message_datetime: now(),
          last_activity_datetime: now(),
          doctor_unread_count: 0,
          hospital_unread_count: 0,
          status_history: [{ to: "pending", by_name: actor.displayName, by_role: actor.role, datetime: now() }],
          assignment_history: [],
        });
        await logMessageAudit(base44, {
          thread,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "conversation_created",
          actionLabel: "opened a conversation",
          detail: `${subject} (${category})`,
        });
      }

      const channel = threadChannel(thread);
      const side = viewerSide(thread);
      const stamp = now();

      let readFlags;
      if (channel === "patient") {
        readFlags = {
          read_by_doctor: true,
          read_by_hospital: true,
          read_by_patient: false,
          doctor_read_datetime: stamp,
          hospital_read_datetime: stamp,
          patient_read_datetime: "",
        };
      } else if (channel === "doctor") {
        readFlags =
          side === "doctor"
            ? { read_by_doctor: true, read_by_hospital: false, doctor_read_datetime: stamp, hospital_read_datetime: "" }
            : { read_by_doctor: false, read_by_hospital: true, hospital_read_datetime: stamp, doctor_read_datetime: "" };
      } else {
        const isDoctor = actor.role === "doctor";
        readFlags = {
          read_by_doctor: isDoctor,
          read_by_hospital: !isDoctor,
          doctor_read_datetime: isDoctor ? stamp : "",
          hospital_read_datetime: !isDoctor ? stamp : "",
        };
      }

      const message = await base44.asServiceRole.entities.MessageEntry.create({
        thread_id: thread.id,
        thread_ref: thread.thread_ref,
        channel,
        hospital_user_id: thread.hospital_user_id,
        hospital_name: thread.hospital_name,
        doctor_user_id: thread.doctor_user_id,
        doctor_id: thread.doctor_id,
        participant_user_ids:
          thread.participant_user_ids ||
          participantsFor(thread.doctor_user_id, thread.hospital_user_id, thread.assigned_staff_user_id),
        sender_user_id: user.id,
        sender_name: actor.displayName,
        sender_role: actor.role,
        sender_title:
          actor.role === "doctor"
            ? actor.specialty
            : actor.department || (actor.isAdmin ? "Hospital Administration" : "Hospital Staff"),
        body: text,
        attachments,
        kind: body.correction_of ? "correction" : "message",
        corrects_message_id: body.correction_of ? String(body.correction_of) : "",
        ...readFlags,
        datetime: stamp,
      });

      const updates = {
        message_count: (thread.message_count || 0) + 1,
        last_message_preview: previewOf(text, attachments),
        last_message_datetime: stamp,
        last_activity_datetime: stamp,
      };
      if (channel === "patient") {
        updates.patient_unread_count = (thread.patient_unread_count || 0) + 1;
        updates.doctor_unread_count = 0;
        updates.hospital_unread_count = 0;
        updates.doctor_last_read_datetime = stamp;
        if (body.patient_message_type && PATIENT_MESSAGE_TYPE_KEYS.includes(String(body.patient_message_type))) {
          updates.patient_message_type = String(body.patient_message_type);
        }
      } else if (side === "doctor") {
        updates.hospital_unread_count = (thread.hospital_unread_count || 0) + 1;
        updates.doctor_unread_count = 0;
        updates.doctor_last_read_datetime = stamp;
      } else {
        updates.doctor_unread_count = (thread.doctor_unread_count || 0) + 1;
        updates.hospital_unread_count = 0;
        updates.hospital_last_read_datetime = stamp;
      }
      if (channel === "hospital" && thread.status === "resolved") {
        updates.status = "in_progress";
        updates.status_history = [
          ...(thread.status_history || []),
          { from: "resolved", to: "in_progress", by_name: actor.displayName, by_role: actor.role, note: "Reopened by a new message", datetime: stamp },
        ];
      }
      if (channel === "hospital" && actor.role === "hospital" && !thread.assigned_staff_user_id && !actor.isAdmin) {
        updates.assigned_staff_user_id = actor.userId;
        updates.assigned_staff_name = actor.displayName;
        if (!thread.assigned_department && actor.department) updates.assigned_department = actor.department;
        updates.assignment_history = [
          ...(thread.assignment_history || []),
          {
            action: "assigned",
            staff_user_id: actor.userId,
            staff_name: actor.displayName,
            department: updates.assigned_department || "",
            by_name: actor.displayName,
            note: "Auto-assigned on first reply",
            datetime: stamp,
          },
        ];
        updates.participant_user_ids = participantsFor(thread.doctor_user_id, thread.hospital_user_id, actor.userId);
      }
      const updatedThread = await base44.asServiceRole.entities.MessageThread.update(thread.id, updates);

      await logMessageAudit(base44, {
        thread: updatedThread,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "message_sent",
        actionLabel: channel === "patient" ? "sent a one-way message to a patient" : "sent a message",
        detail: text.slice(0, 200),
      });
      if (attachments.length > 0) {
        await logMessageAudit(base44, {
          thread: updatedThread,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "attachment_uploaded",
          actionLabel: `attached ${attachments.length} file(s)`,
          detail: attachments.map((a) => a.file_name).join(", "),
        });
      }

      const isFirstMessage = (thread.message_count || 0) === 0;
      const kind = isFirstMessage ? "new_message" : "reply";
      const notificationMessage = previewOf(text, attachments);

      if (channel === "doctor") {
        const peerUserId = side === "doctor" ? thread.peer_doctor_user_id : thread.doctor_user_id;
        await notifyRecipient(base44, {
          recipientUserId: peerUserId,
          recipientRole: "doctor",
          threadId: thread.id,
          hospitalUserId: thread.hospital_user_id,
          hospitalName: thread.hospital_name,
          doctorUserId: thread.doctor_user_id,
          kind: isFirstMessage ? "new_message" : "reply",
          title: `${doctorLabel(actor.displayName)} sent you a message`,
          message: notificationMessage,
          actorName: actor.displayName,
          actorUserId: user.id,
          category: thread.category,
          dedupeKey: `msg:${message.id}`,
        });
      } else if (channel === "patient") {
        // The patient is told a message arrived — never what it contains.
        try {
          await createPatientNotification(base44.asServiceRole, {
            patient_id: thread.patient_id,
            patient_user_id: thread.patient_user_id,
            type: "doctor_message",
            title: `New message from ${doctorLabel(thread.doctor_name)}`,
            message: `${doctorLabel(thread.doctor_name)}${thread.doctor_specialization ? ` (${thread.doctor_specialization})` : ""} sent you a message in your AMedix record.`,
            target: "messages",
            related_id: thread.id,
          });
        } catch (err) {
          // the message itself is stored; the notification is best-effort
        }
      } else if (actor.role === "doctor") {
        const recipients = await hospitalNotificationRecipients(base44, thread.hospital_user_id);
        for (const r of recipients) {
          await notifyRecipient(base44, {
            recipientUserId: r.userId,
            recipientRole: "hospital",
            threadId: thread.id,
            hospitalUserId: thread.hospital_user_id,
            hospitalName: thread.hospital_name,
            doctorUserId: thread.doctor_user_id,
            kind,
            title: `New message from ${doctorLabel(thread.doctor_name)}`,
            message: notificationMessage,
            actorName: actor.displayName,
            actorUserId: user.id,
            category: thread.category,
            dedupeKey: `msg:${message.id}`,
          });
        }
      } else {
        await notifyRecipient(base44, {
          recipientUserId: thread.doctor_user_id,
          recipientRole: "doctor",
          threadId: thread.id,
          hospitalUserId: thread.hospital_user_id,
          hospitalName: thread.hospital_name,
          doctorUserId: thread.doctor_user_id,
          kind: "reply",
          title: isFirstMessage ? `${thread.hospital_name} started a conversation` : `${thread.hospital_name} replied`,
          message: notificationMessage,
          actorName: actor.displayName,
          actorUserId: user.id,
          category: thread.category,
          dedupeKey: `msg:${message.id}`,
        });
      }

      return Response.json({ thread: decorate(updatedThread), message });
    }

    if (action === "updateThread") {
      if (actor.role !== "hospital") return Response.json({ error: "Only hospital personnel can manage conversations." }, { status: 403 });
      const thread = await loadThread(body.thread_id);
      if (!thread) return denyThread(body.thread_id, "manage thread");
      if (threadChannel(thread) !== "hospital") {
        return Response.json({ error: "This conversation cannot be managed here." }, { status: 403 });
      }

      const stamp = now();
      const updates = {};
      const statusHistory = [...(thread.status_history || [])];
      const assignmentHistory = [...(thread.assignment_history || [])];
      const systemLines = [];
      let newlyAssignedStaff = null;

      if (body.status && THREAD_STATUSES.includes(body.status) && body.status !== thread.status) {
        updates.status = body.status;
        statusHistory.push({ from: thread.status, to: body.status, by_name: actor.displayName, by_role: "hospital", note: cleanText(body.note, 300), datetime: stamp });
        if (body.status === "resolved") updates.resolved_datetime = stamp;
        systemLines.push(`Status changed to ${body.status.replace("_", " ")}`);
      }

      if (body.assigned_department !== undefined) {
        const department = cleanText(body.assigned_department, 120);
        if (department !== (thread.assigned_department || "")) {
          updates.assigned_department = department;
          assignmentHistory.push({ action: "department_assigned", department, by_name: actor.displayName, note: cleanText(body.note, 300), datetime: stamp });
          systemLines.push(`Assigned to ${department || "no"} department`);
        }
      }

      if (body.assigned_staff_user_id !== undefined) {
        const staffUserId = String(body.assigned_staff_user_id || "");
        if (staffUserId !== (thread.assigned_staff_user_id || "")) {
          let staffName = "Unassigned";
          if (staffUserId) {
            if (staffUserId === actor.hospitalUserId) {
              const hospitals = await queryRows(base44, "HospitalProfile", { user_id: actor.hospitalUserId }, { limit: 1 });
              staffName = hospitals[0] ? hospitals[0].hospital_name : "Hospital Administration";
            } else {
              const staff = await queryRows(base44, "HospitalMessagingStaff", { hospital_user_id: actor.hospitalUserId, user_id: staffUserId, status: "active" }, { limit: 1 });
              if (staff.length === 0) return Response.json({ error: "That staff member is not authorized for this hospital." }, { status: 403 });
              staffName = staff[0].name;
              if (!updates.assigned_department && staff[0].department) updates.assigned_department = staff[0].department;
            }
          }
          updates.assigned_staff_user_id = staffUserId;
          updates.assigned_staff_name = staffUserId ? staffName : "";
          updates.participant_user_ids = participantsFor(thread.doctor_user_id, thread.hospital_user_id, staffUserId);
          assignmentHistory.push({
            action: thread.assigned_staff_user_id ? "transferred" : "assigned",
            staff_user_id: staffUserId,
            staff_name: staffName,
            department: updates.assigned_department || thread.assigned_department || "",
            by_name: actor.displayName,
            note: cleanText(body.note, 300),
            datetime: stamp,
          });
          systemLines.push(staffUserId ? `${thread.assigned_staff_user_id ? "Transferred" : "Assigned"} to ${staffName}` : "Unassigned");
          if (staffUserId) newlyAssignedStaff = { userId: staffUserId, name: staffName };
        }
      }

      if (Object.keys(updates).length === 0) return Response.json({ thread });

      updates.status_history = statusHistory;
      updates.assignment_history = assignmentHistory;
      updates.last_activity_datetime = stamp;
      const updated = await base44.asServiceRole.entities.MessageThread.update(thread.id, updates);

      if (systemLines.length > 0) {
        await base44.asServiceRole.entities.MessageEntry.create({
          thread_id: thread.id,
          thread_ref: thread.thread_ref,
          channel: "hospital",
          hospital_user_id: thread.hospital_user_id,
          hospital_name: thread.hospital_name,
          doctor_user_id: thread.doctor_user_id,
          doctor_id: thread.doctor_id,
          participant_user_ids: updated.participant_user_ids || thread.participant_user_ids,
          sender_user_id: user.id,
          sender_name: actor.displayName,
          sender_role: "hospital",
          sender_title: actor.department || "Hospital Administration",
          body: systemLines.join(" · "),
          attachments: [],
          kind: "system",
          read_by_hospital: true,
          read_by_doctor: false,
          datetime: stamp,
        });
      }

      await logMessageAudit(base44, {
        thread: updated,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: "hospital",
        action: updates.status ? "status_changed" : "conversation_assigned",
        actionLabel: updates.status ? "changed the conversation status" : "updated the conversation assignment",
        detail: systemLines.join(" · "),
      });

      if (systemLines.length > 0) {
        await notifyRecipient(base44, {
          recipientUserId: thread.doctor_user_id,
          recipientRole: "doctor",
          threadId: thread.id,
          hospitalUserId: thread.hospital_user_id,
          hospitalName: thread.hospital_name,
          doctorUserId: thread.doctor_user_id,
          kind: updates.status ? "status" : "assignment",
          title: `${thread.hospital_name}: ${thread.subject}`,
          message: systemLines.join(" · "),
          actorName: actor.displayName,
          actorUserId: user.id,
          category: thread.category,
          dedupeKey: `update:${stamp}`,
        });
      }

      if (newlyAssignedStaff && newlyAssignedStaff.userId !== user.id) {
        await notifyRecipient(base44, {
          recipientUserId: newlyAssignedStaff.userId,
          recipientRole: "hospital",
          threadId: thread.id,
          hospitalUserId: thread.hospital_user_id,
          hospitalName: thread.hospital_name,
          doctorUserId: thread.doctor_user_id,
          kind: "assignment",
          title: "A conversation was assigned to you",
          message: `${thread.subject} · ${thread.doctor_name}`,
          actorName: actor.displayName,
          actorUserId: user.id,
          category: thread.category,
          dedupeKey: `assigned:${newlyAssignedStaff.userId}:${stamp}`,
        });
      }

      return Response.json({ thread: decorate(updated) });
    }

    if (action === "announcement") {
      if (actor.role !== "hospital") return Response.json({ error: "Only hospital personnel can send announcements." }, { status: 403 });
      if (!actor.isAdmin && actor.staffRole !== "manager") {
        return Response.json({ error: "Only the hospital administrator or a messaging manager can send announcements." }, { status: 403 });
      }
      const subject = cleanText(body.subject, 200);
      const category = String(body.category || "general_administration");
      const text = cleanText(body.body, 5000);
      const scope = body.scope === "department" ? "department" : "hospital";
      const department = scope === "department" ? cleanText(body.department, 120) : "";
      if (!subject || !text) return Response.json({ error: "A subject and a message are required." }, { status: 400 });
      if (!CATEGORY_KEYS.includes(category)) return Response.json({ error: "Select a valid category." }, { status: 400 });
      if (scope === "department" && !department) return Response.json({ error: "Select the department to notify." }, { status: 400 });

      const affiliations = await queryRows(base44, "HospitalDoctor", { hospital_user_id: actor.hospitalUserId, status: "active" }, { limit: 300 });
      const index = await buildEligibilityIndex(base44);
      const targets = affiliations
        .filter((a) => {
          const evaluation = a.doctor_user_id ? index.evaluations.get(a.doctor_user_id) : null;
          return !!evaluation && evaluation.eligible;
        })
        .filter((a) => (scope === "department" ? a.specialization === department : true))
        .slice(0, 150);
      if (targets.length === 0) return Response.json({ error: "No affiliated doctors match that audience." }, { status: 400 });

      const stamp = now();
      let created = 0;
      for (let i = 0; i < targets.length; i += 6) {
        const batch = targets.slice(i, i + 6);
        const results = await Promise.allSettled(
          batch.map(async (affiliation) => {
            const thread = await base44.asServiceRole.entities.MessageThread.create({
              thread_ref: makeThreadRef(),
              channel: "hospital",
              one_way: false,
              hospital_user_id: affiliation.hospital_user_id,
              hospital_id: affiliation.hospital_id || "",
              hospital_name: affiliation.hospital_name,
              doctor_user_id: affiliation.doctor_user_id,
              doctor_id: affiliation.doctor_id,
              doctor_name: affiliation.doctor_name,
              doctor_specialization: affiliation.specialization || "",
              subject,
              category,
              status: "resolved",
              resolved_datetime: stamp,
              participant_user_ids: participantsFor(affiliation.doctor_user_id, affiliation.hospital_user_id, null),
              created_by_role: "hospital",
              is_announcement: true,
              announcement_scope: scope,
              target_department: department,
              message_count: 1,
              last_message_preview: text.slice(0, 140),
              last_message_datetime: stamp,
              last_activity_datetime: stamp,
              doctor_unread_count: 1,
              hospital_unread_count: 0,
              hospital_last_read_datetime: stamp,
              status_history: [{ to: "resolved", by_name: actor.displayName, by_role: "hospital", note: "Hospital announcement", datetime: stamp }],
              assignment_history: [],
            });
            await base44.asServiceRole.entities.MessageEntry.create({
              thread_id: thread.id,
              thread_ref: thread.thread_ref,
              channel: "hospital",
              hospital_user_id: thread.hospital_user_id,
              hospital_name: thread.hospital_name,
              doctor_user_id: thread.doctor_user_id,
              doctor_id: thread.doctor_id,
              participant_user_ids: thread.participant_user_ids,
              sender_user_id: user.id,
              sender_name: actor.displayName,
              sender_role: "hospital",
              sender_title: scope === "department" ? `${department} Announcement` : "Hospital Announcement",
              body: text,
              attachments: sanitizeAttachments(body.attachments),
              kind: "announcement",
              read_by_doctor: false,
              read_by_hospital: true,
              datetime: stamp,
            });
            await notifyRecipient(base44, {
              recipientUserId: affiliation.doctor_user_id,
              recipientRole: "doctor",
              threadId: thread.id,
              hospitalUserId: thread.hospital_user_id,
              hospitalName: thread.hospital_name,
              doctorUserId: thread.doctor_user_id,
              kind: "announcement",
              title: `Announcement from ${thread.hospital_name}`,
              message: subject,
              actorName: actor.displayName,
              actorUserId: user.id,
              category,
              dedupeKey: `announcement:${subject}`,
            });
            await logMessageAudit(base44, {
              thread,
              actorUserId: user.id,
              actorName: actor.displayName,
              actorRole: "hospital",
              action: "announcement_sent",
              actionLabel: scope === "department" ? `sent a ${department} announcement` : "sent a hospital-wide announcement",
              detail: subject,
            });
            return thread;
          })
        );
        created += results.filter((r) => r.status === "fulfilled").length;
      }
      return Response.json({ created, recipients: targets.length });
    }

    if (action === "directory") {
      if (actor.role !== "hospital") return Response.json({ error: "Hospital access required." }, { status: 403 });
      const affiliations = await queryRows(base44, "HospitalDoctor", { hospital_user_id: actor.hospitalUserId, status: "active" }, { limit: 500 });
      const index = await buildEligibilityIndex(base44);
      const doctors = affiliations
        .filter((a) => {
          const evaluation = a.doctor_user_id ? index.evaluations.get(a.doctor_user_id) : null;
          return !!evaluation && evaluation.eligible;
        })
        .map((a) => ({
          doctor_id: a.doctor_id,
          doctor_user_id: a.doctor_user_id,
          doctor_name: a.doctor_name,
          specialization: a.specialization || "",
          department: a.specialization || "",
          joined_datetime: a.joined_datetime || "",
        }));
      return Response.json({ doctors });
    }

    if (action === "staff") {
      if (actor.role !== "hospital") return Response.json({ error: "Hospital access required." }, { status: 403 });
      const staff = await queryRows(
        base44,
        "HospitalMessagingStaff",
        actor.isAdmin ? { hospital_user_id: actor.hospitalUserId } : { hospital_user_id: actor.hospitalUserId, status: "active" },
        { limit: 100 }
      );
      return Response.json({ staff });
    }

    if (action === "addStaff") {
      if (actor.role !== "hospital" || !actor.isAdmin) {
        return Response.json({ error: "Only the hospital administrator can designate messaging staff." }, { status: 403 });
      }
      const email = cleanText(body.email, 200).toLowerCase();
      const department = cleanText(body.department, 120);
      if (!email || !department) return Response.json({ error: "Email and department are required." }, { status: 400 });
      if (email === String(user.email || "").toLowerCase()) {
        return Response.json({ error: "You already manage this hospital." }, { status: 400 });
      }
      // A designated staff member gains access to hospital conversations, so an
      // account already behind that email must itself be active and not a test
      // or flagged account.
      let staffAccount = null;
      try {
        const rows = await base44.asServiceRole.entities.User.filter({ email }, { limit: 1 });
        staffAccount = (Array.isArray(rows) ? rows : rows.items || [])[0] || null;
      } catch (err) {
        staffAccount = null;
      }
      if (staffAccount) {
        const staffEvaluation = await evaluateAccount(base44, staffAccount.id);
        if (staffEvaluation.status !== "active" || staffEvaluation.classification === "test_account") {
          return Response.json(
            { error: `That account cannot be designated as messaging staff: ${staffEvaluation.reason}` },
            { status: 403 }
          );
        }
      }
      const existing = await queryRows(base44, "HospitalMessagingStaff", { hospital_user_id: actor.hospitalUserId, email }, { limit: 1 });
      if (existing.length > 0) {
        const updated = await base44.asServiceRole.entities.HospitalMessagingStaff.update(existing[0].id, {
          department,
          role: body.role === "manager" ? "manager" : "staff",
          status: existing[0].user_id ? "active" : "invited",
          name: cleanText(body.name, 120) || existing[0].name || email,
        });
        return Response.json({ staff: updated });
      }
      const staff = await base44.asServiceRole.entities.HospitalMessagingStaff.create({
        hospital_user_id: actor.hospitalUserId,
        hospital_id: actor.hospitalId || "",
        hospital_name: actor.hospitalName,
        user_id: "",
        name: cleanText(body.name, 120) || email,
        email,
        department,
        role: body.role === "manager" ? "manager" : "staff",
        status: "invited",
        added_by_name: actor.displayName,
        added_datetime: now(),
      });
      await logMessageAudit(base44, {
        thread: { hospital_user_id: actor.hospitalUserId, hospital_name: actor.hospitalName },
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: "hospital",
        action: "staff_designated",
        actionLabel: "designated a messaging staff member",
        detail: `${staff.name} — ${department}`,
      });
      return Response.json({ staff });
    }

    if (action === "removeStaff") {
      if (actor.role !== "hospital" || !actor.isAdmin) {
        return Response.json({ error: "Only the hospital administrator can change messaging staff." }, { status: 403 });
      }
      const staffId = String(body.staff_id || "");
      const rows = await queryRows(base44, "HospitalMessagingStaff", { id: staffId, hospital_user_id: actor.hospitalUserId }, { limit: 1 });
      if (rows.length === 0) return Response.json({ error: "Staff member not found." }, { status: 404 });
      const updated = await base44.asServiceRole.entities.HospitalMessagingStaff.update(staffId, {
        // Re-activating restores the invitation until the person signs in.
        status: body.reactivate ? (rows[0].user_id ? "active" : "invited") : "suspended",
      });
      await logMessageAudit(base44, {
        thread: { hospital_user_id: actor.hospitalUserId, hospital_name: actor.hospitalName },
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: "hospital",
        action: body.reactivate ? "staff_reactivated" : "staff_suspended",
        actionLabel: body.reactivate ? "reactivated a messaging staff member" : "suspended a messaging staff member",
        detail: rows[0].name,
      });
      return Response.json({ staff: updated });
    }

    if (action === "notifications") {
      const rows = isPatientActor
        ? []
        : await queryRows(base44, "MessageNotification", { recipient_user_id: user.id }, { sort: "-created_date", limit: 50 });
      return Response.json({ notifications: rows, unread: await unreadSummary() });
    }

    if (action === "markNotificationsRead") {
      const stamp = now();
      const query = Array.isArray(body.ids) && body.ids.length > 0
        ? { recipient_user_id: user.id, id: { $in: body.ids.map((i) => String(i)) } }
        : { recipient_user_id: user.id, is_read: false };
      try {
        await base44.asServiceRole.entities.MessageNotification.updateMany(query, { $set: { is_read: true, read_datetime: stamp } });
      } catch (err) {
        // no-op — the list refresh below reflects the stored state
      }
      return Response.json({ ok: true, unread: await unreadSummary() });
    }

    if (action === "attachmentUrl") {
      const thread = await loadThread(body.thread_id);
      if (!thread) return denyThread(body.thread_id, "attachment access");
      const uri = String(body.file_uri || "");
      if (!uri.startsWith("private/")) return Response.json({ error: "Invalid attachment." }, { status: 400 });
      const messages = await queryRows(base44, "MessageEntry", { thread_id: thread.id }, { limit: 500 });
      const belongs = messages.some((m) => (m.attachments || []).some((a) => a.file_uri === uri));
      if (!belongs) {
        await logMessageAudit(base44, {
          thread,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "access_denied",
          actionLabel: "attempted to open an attachment outside the conversation",
          detail: uri,
        });
        return Response.json({ error: "This attachment does not belong to the conversation." }, { status: 403 });
      }
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      await logMessageAudit(base44, {
        thread,
        actorUserId: user.id,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "attachment_viewed",
        actionLabel: "opened an attachment",
        detail: uri,
      });
      return Response.json({ signed_url: signed.signed_url });
    }

    return Response.json({ error: "Unknown messaging action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}