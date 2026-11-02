import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CATEGORY_KEYS,
  THREAD_STATUSES,
  cleanText,
  queryRows,
  makeThreadRef,
  resolveMessagingActor,
  findActiveAffiliation,
  participantsFor,
  logMessageAudit,
  notifyRecipient,
  hospitalNotificationRecipients,
  previewOf,
  sanitizeAttachments,
} from "../../shared/messaging.ts";

// Secure doctor–hospital messaging. Every read, write, attachment download,
// assignment and status change is authorized HERE on the server — the browser's
// visibility is never the security boundary. A doctor sees only conversations
// they are a participant in; hospital personnel act only inside their own
// hospital. All writes go through the service role after verification, and
// every event is recorded in an append-only audit trail.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) || {};
    const action = String(body.action || "");
    const actor = await resolveMessagingActor(base44, user);
    if (!actor) {
      return Response.json({ error: "This account has no doctor or hospital messaging access." }, { status: 403 });
    }

    const now = () => new Date().toISOString();

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
    });

    // Authorizes a thread for the current actor. Doctors match on their own
    // user id, hospital personnel on their hospital's key.
    const loadThread = async (threadId) => {
      if (!threadId) return null;
      const rows = await queryRows(base44, "MessageThread", { id: String(threadId) }, { limit: 1 });
      const thread = rows[0];
      if (!thread) return null;
      if (actor.role === "doctor" && thread.doctor_user_id !== user.id) return null;
      if (actor.role === "hospital" && thread.hospital_user_id !== actor.hospitalUserId) return null;
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

    const unreadSummary = async () => {
      const query = actor.role === "doctor" ? { doctor_user_id: user.id } : { hospital_user_id: actor.hospitalUserId };
      const threads = await queryRows(base44, "MessageThread", query, { limit: 500 });
      let threadsUnread = 0;
      let messagesUnread = 0;
      threads.forEach((t) => {
        const n = actor.role === "doctor" ? t.doctor_unread_count || 0 : t.hospital_unread_count || 0;
        if (n > 0) {
          threadsUnread += 1;
          messagesUnread += n;
        }
      });
      const notifs = await queryRows(base44, "MessageNotification", { recipient_user_id: user.id, is_read: false }, { limit: 200 });
      return { threads_unread: threadsUnread, messages_unread: messagesUnread, notifications_unread: notifs.length };
    };

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
        return Response.json({ actor: publicActor(), hospitals, unread, staff: [], departments: [] });
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
      });
    }

    if (action === "listThreads") {
      const query = actor.role === "doctor" ? { doctor_user_id: user.id } : { hospital_user_id: actor.hospitalUserId };
      if (actor.role === "doctor" && body.hospital_user_id) query.hospital_user_id = String(body.hospital_user_id);
      if (actor.role === "doctor" && body.hospital_name) query.hospital_name = String(body.hospital_name);
      if (body.status && THREAD_STATUSES.includes(body.status)) query.status = body.status;
      if (body.category) query.category = String(body.category);
      let threads = await queryRows(base44, "MessageThread", query, { sort: "-last_activity_datetime", limit: 200 });
      if (body.announcement_only) threads = threads.filter((t) => t.is_announcement);
      else if (!body.include_announcements) threads = threads.filter((t) => !t.is_announcement);
      if (body.unread_only) {
        threads = threads.filter((t) => (actor.role === "doctor" ? (t.doctor_unread_count || 0) : (t.hospital_unread_count || 0)) > 0);
      }
      if (body.search) {
        const s = String(body.search).toLowerCase();
        threads = threads.filter((t) =>
          [t.subject, t.last_message_preview, t.doctor_name, t.assigned_staff_name, t.thread_ref, t.category, t.assigned_department]
            .join(" ")
            .toLowerCase()
            .includes(s)
        );
      }
      return Response.json({ threads, unread: await unreadSummary() });
    }

    if (action === "thread") {
      const thread = await loadThread(body.thread_id);
      if (!thread) return denyThread(body.thread_id, "thread lookup");
      let messages = await queryRows(base44, "MessageEntry", { thread_id: thread.id }, { sort: "created_date", limit: 500 });
      const audit = await queryRows(base44, "MessageAuditEvent", { thread_id: thread.id }, { sort: "-created_date", limit: 200 });

      const isDoctor = actor.role === "doctor";
      const previousUnread = isDoctor ? thread.doctor_unread_count || 0 : thread.hospital_unread_count || 0;
      let fresh = thread;
      if (body.mark_read !== false && previousUnread > 0) {
        const stamp = now();
        try {
          await base44.asServiceRole.entities.MessageEntry.updateMany(
            isDoctor ? { thread_id: thread.id, read_by_doctor: false } : { thread_id: thread.id, read_by_hospital: false },
            { $set: isDoctor ? { read_by_doctor: true, doctor_read_datetime: stamp } : { read_by_hospital: true, hospital_read_datetime: stamp } }
          );
        } catch (err) {
          // message-level read flags are best-effort; the conversation counter below is authoritative
        }
        fresh = await base44.asServiceRole.entities.MessageThread.update(thread.id, {
          ...(isDoctor
            ? { doctor_unread_count: 0, doctor_last_read_datetime: stamp }
            : { hospital_unread_count: 0, hospital_last_read_datetime: stamp }),
        });
        messages = messages.map((m) =>
          isDoctor ? { ...m, read_by_doctor: true } : { ...m, read_by_hospital: true }
        );
        await logMessageAudit(base44, {
          thread,
          actorUserId: user.id,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "conversation_read",
          actionLabel: "read the conversation",
          detail: `${previousUnread} unread message(s) read`,
        });
      }
      return Response.json({ thread: fresh, messages, audit, actor: publicActor() });
    }

    if (action === "send") {
      const attachments = sanitizeAttachments(body.attachments);
      const text = cleanText(body.body, 5000);
      if (!text && attachments.length === 0) {
        return Response.json({ error: "Write a message or attach a file." }, { status: 400 });
      }

      let thread = null;
      let affiliation = null;

      if (body.thread_id) {
        thread = await loadThread(body.thread_id);
        if (!thread) return denyThread(body.thread_id, "send to thread");
        if (thread.status === "resolved" && body.kind !== "announcement") {
          // handled below by reopening
        }
      } else {
        const category = String(body.category || "");
        if (!CATEGORY_KEYS.includes(category)) {
          return Response.json({ error: "Select a valid communication category." }, { status: 400 });
        }
        const subject = cleanText(body.subject, 200);
        if (!subject) return Response.json({ error: "A conversation subject is required." }, { status: 400 });

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

        const participants = participantsFor(affiliation.doctor_user_id, affiliation.hospital_user_id, null);
        thread = await base44.asServiceRole.entities.MessageThread.create({
          thread_ref: makeThreadRef(),
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

      const isDoctor = actor.role === "doctor";
      const stamp = now();
      const message = await base44.asServiceRole.entities.MessageEntry.create({
        thread_id: thread.id,
        thread_ref: thread.thread_ref,
        hospital_user_id: thread.hospital_user_id,
        hospital_name: thread.hospital_name,
        doctor_user_id: thread.doctor_user_id,
        doctor_id: thread.doctor_id,
        participant_user_ids: thread.participant_user_ids || participantsFor(thread.doctor_user_id, thread.hospital_user_id, thread.assigned_staff_user_id),
        sender_user_id: user.id,
        sender_name: actor.displayName,
        sender_role: actor.role,
        sender_title: actor.role === "doctor" ? actor.specialty : actor.department || (actor.isAdmin ? "Hospital Administration" : "Hospital Staff"),
        body: text,
        attachments,
        kind: body.correction_of ? "correction" : "message",
        corrects_message_id: body.correction_of ? String(body.correction_of) : "",
        read_by_doctor: isDoctor,
        read_by_hospital: !isDoctor,
        doctor_read_datetime: isDoctor ? stamp : "",
        hospital_read_datetime: !isDoctor ? stamp : "",
        datetime: stamp,
      });

      const updates = {
        message_count: (thread.message_count || 0) + 1,
        last_message_preview: previewOf(text, attachments),
        last_message_datetime: stamp,
        last_activity_datetime: stamp,
      };
      if (isDoctor) {
        updates.hospital_unread_count = (thread.hospital_unread_count || 0) + 1;
        updates.doctor_unread_count = 0;
        updates.doctor_last_read_datetime = stamp;
      } else {
        updates.doctor_unread_count = (thread.doctor_unread_count || 0) + 1;
        updates.hospital_unread_count = 0;
        updates.hospital_last_read_datetime = stamp;
      }
      if (thread.status === "resolved") {
        updates.status = "in_progress";
        updates.status_history = [
          ...(thread.status_history || []),
          { from: "resolved", to: "in_progress", by_name: actor.displayName, by_role: actor.role, note: "Reopened by a new message", datetime: stamp },
        ];
      }
      if (!isDoctor && !thread.assigned_staff_user_id && !actor.isAdmin) {
        updates.assigned_staff_user_id = actor.userId;
        updates.assigned_staff_name = actor.displayName;
        if (!thread.assigned_department && actor.department) updates.assigned_department = actor.department;
        updates.assignment_history = [
          ...(thread.assignment_history || []),
          { action: "assigned", staff_user_id: actor.userId, staff_name: actor.displayName, department: updates.assigned_department || "", by_name: actor.displayName, note: "Auto-assigned on first reply", datetime: stamp },
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
        actionLabel: "sent a message",
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

      const kind = isDoctor ? ((thread.message_count || 0) > 0 ? "reply" : "new_message") : "reply";
      const notificationMessage = previewOf(text, attachments);
      if (isDoctor) {
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
            title: `New message from Dr. ${thread.doctor_name}`,
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
          title: `${thread.hospital_name} replied`,
          message: notificationMessage,
          actorName: actor.displayName,
          actorUserId: user.id,
          category: thread.category,
          dedupeKey: `msg:${message.id}`,
        });
      }

      return Response.json({ thread: updatedThread, message });
    }

    if (action === "updateThread") {
      if (actor.role !== "hospital") return Response.json({ error: "Only hospital personnel can manage conversations." }, { status: 403 });
      const thread = await loadThread(body.thread_id);
      if (!thread) return denyThread(body.thread_id, "manage thread");

      const stamp = now();
      const updates = {};
      const statusHistory = [...(thread.status_history || [])];
      const assignmentHistory = [...(thread.assignment_history || [])];
      const systemLines = [];

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

      return Response.json({ thread: updated });
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
      const targets = affiliations.filter((a) => (scope === "department" ? a.specialization === department : true)).slice(0, 150);
      if (targets.length === 0) return Response.json({ error: "No affiliated doctors match that audience." }, { status: 400 });

      const stamp = now();
      let created = 0;
      for (let i = 0; i < targets.length; i += 6) {
        const batch = targets.slice(i, i + 6);
        const results = await Promise.allSettled(
          batch.map(async (affiliation) => {
            const thread = await base44.asServiceRole.entities.MessageThread.create({
              thread_ref: makeThreadRef(),
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
      const doctors = affiliations.map((a) => ({
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
      const rows = await queryRows(base44, "MessageNotification", { recipient_user_id: user.id }, { sort: "-created_date", limit: 50 });
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