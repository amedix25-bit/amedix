import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import { findLiveAccess } from "../../shared/patientAccess.ts";
import {
  computeDating,
  evaluateSchedule,
  evaluateAutomations,
  applySettings,
  normalizeSettings,
  evaluateFlags,
  evaluateContacts,
  evaluateRisk,
  ANTENATAL_RULES,
  DEFAULT_WINDOWS,
  todayStr,
} from "../../shared/antenatal.ts";

const ANTENATAL_RULES_SOURCE = ANTENATAL_RULES.source;
const ANTENATAL_RULES_VERSION = ANTENATAL_RULES.version;

// Gestational-age-based antenatal care and screening module.
// Built on the existing AMedix clinical system: doctors must hold an approved
// AccessRequest for the patient (the same enforcement as the clinical record
// reads), writes go through this function with the service role, and every
// clinical change is audit-logged. No patient records are duplicated — the
// module links to existing LabRequest / ImagingRequest orders.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body : {};
    const action = String(payload.action || "");
    const sr = base44.asServiceRole;

    // Admin-only configuration changes.
    if (action === "update_config") {
      if (user.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });
      const cfg = payload.config || {};
      if (!Array.isArray(cfg.windows) || cfg.windows.length === 0) {
        return Response.json({ error: "At least one schedule window is required." }, { status: 400 });
      }
      const now = new Date().toISOString();
      let record;
      if (payload.config_id) {
        const existing = await sr.entities.AntenatalScheduleConfig.get(String(payload.config_id));
        record = await sr.entities.AntenatalScheduleConfig.update(existing.id, {
          name: String(cfg.name || existing.name),
          windows: cfg.windows,
          settings: normalizeSettings(cfg.settings),
          is_active: cfg.is_active === true,
          version: (existing.version || 1) + 1,
          updated_datetime: now,
          updated_by_name: user.full_name || "",
        });
      } else {
        record = await sr.entities.AntenatalScheduleConfig.create({
          name: String(cfg.name || "Antenatal protocol"),
          windows: cfg.windows,
          settings: normalizeSettings(cfg.settings),
          is_active: cfg.is_active === true,
          version: 1,
          updated_datetime: now,
          updated_by_name: user.full_name || "",
        });
      }
      return Response.json({ ok: true, config: record });
    }

    // Doctor actions require an approved patient access request.
    const patientId = String(payload.patient_id || "");
    if (!patientId) return Response.json({ error: "Patient is required." }, { status: 400 });

    let doctor = null;
    if (payload.doctor_id) {
      try {
        const doc = await sr.entities.DoctorProfile.get(String(payload.doctor_id));
        if (doc && doc.user_id === user.id) doctor = doc;
      } catch (e) { doctor = null; }
    }
    if (!doctor) {
      const mine = await sr.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
      if (mine.length > 0) doctor = mine[0];
    }
    if (!doctor) return Response.json({ error: "Doctor profile not found." }, { status: 403 });

    // Only a LIVE authorization counts — an expired one, or one the patient
    // removed, is refused here exactly as in the clinical record reads.
    const liveAccess = await findLiveAccess(base44, doctor.id, patientId);
    if (!liveAccess) {
      return Response.json({ error: "You do not have authorized access to this patient's record." }, { status: 403 });
    }

    // Load the patient, the active pregnancy record and the schedule config.
    const [patientRes, pregnancies, configs] = await Promise.allSettled([
      sr.entities.PatientProfile.get(patientId),
      sr.entities.PregnancyRecord.filter({ patient_id: patientId, status: "active" }, { sort: "-created_date", limit: 1 }),
      sr.entities.AntenatalScheduleConfig.filter({ is_active: true }, { limit: 1 }),
    ]);
    const patient = patientRes.status === "fulfilled" ? patientRes.value : null;
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });
    const pregnancy = pregnancies.status === "fulfilled" && (pregnancies.value.items || []).length > 0 ? pregnancies.value.items[0] : null;
    const config = configs.status === "fulfilled" && configs.value.length > 0 ? configs.value[0] : null;
    const settings = normalizeSettings(config?.settings);
    const windows = applySettings(
      config && Array.isArray(config.windows) && config.windows.length > 0 ? config.windows : DEFAULT_WINDOWS,
      settings
    );

    const patientIdent = {
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
    };

    if (action === "get_overview") {
      const itemRecords = pregnancy ? (await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id }, { limit: 500 })).items || [] : [];
      const dating = pregnancy ? computeDating(pregnancy, todayStr()) : { complete: false, lmp: "", edd: "", dating_method: "lmp" };
      const schedule = evaluateSchedule(dating, windows, itemRecords);
      const conditionsPage = await sr.entities.MedicalCondition.filter({ patient_id: patientId, category: "known_case" }, { limit: 100 });
      const conditionNames = (conditionsPage.items || []).map((c) => c.name);
      const { flags, computed_risk_flags } = evaluateFlags(dating, pregnancy, patient, conditionNames);
      // Linked orders: a pending lab/imaging request keeps the item "ordered";
      // results available flip it to completed server-side display.
      const labIds = itemRecords.map((r) => r.linked_lab_request_id).filter(Boolean);
      const imgIds = itemRecords.map((r) => r.linked_imaging_request_id).filter(Boolean);
      const [labRes, imgRes] = await Promise.allSettled([
        labIds.length > 0 ? sr.entities.LabRequest.filter({ id: { $in: labIds } }, { limit: 200 }) : { items: [] },
        imgIds.length > 0 ? sr.entities.ImagingRequest.filter({ id: { $in: imgIds } }, { limit: 200 }) : { items: [] },
      ]);
      const labById = {};
      ((labRes.status === "fulfilled" ? labRes.value.items || [] : [])).forEach((l) => { labById[l.id] = l; });
      const imgById = {};
      ((imgRes.status === "fulfilled" ? imgRes.value.items || [] : [])).forEach((i) => { imgById[i.id] = i; });
      const linkState = (rec, kind) => {
        if (!rec) return null;
        const id = kind === "lab" ? rec.linked_lab_request_id : rec.linked_imaging_request_id;
        if (!id) return null;
        const linked = kind === "lab" ? labById[id] : imgById[id];
        if (!linked) return { state: "not_found", request_id: "" };
        const done = kind === "lab" ? linked.status === "results" : linked.status === "completed";
        const base = { state: done ? "results_available" : "awaiting_results", request_id: linked.request_id || "", status: linked.status };
        if (kind === "img") {
          // The imaging request flows through the existing AMedix radiology
          // workflow: the final report reaches the pregnancy record through it.
          return {
            ...base,
            workflow_status: linked.workflow_status || "",
            report: done ? String(linked.report || "") : "",
            final_report_datetime: linked.final_report_datetime || "",
            released_datetime: linked.released_datetime || "",
          };
        }
        return base;
      };
      const scheduleOut = schedule.map((w) => ({
        ...w,
        items: w.items.map((it) => {
          if (!it.record) return it;
          const lab = linkState(it.record, "lab");
          const img = linkState(it.record, "img");
          return {
            ...it,
            lab_link: lab,
            img_link: img,
            state: (lab && lab.state === "results_available") || (img && img.state === "results_available") ? "completed" : it.state,
          };
        }),
      }));
      const automations = evaluateAutomations(dating, pregnancy, scheduleOut, itemRecords, settings, todayStr());
      // Acknowledged alerts stop repeating — reminders are never duplicated.
      const acks = Array.isArray(pregnancy?.alert_acks) ? pregnancy.alert_acks : [];
      const ackKeys = new Set(acks.map((a) => a.rule_key));
      const openAutomations = automations.filter((a) => !ackKeys.has(a.key));
      // WHO eight-contact tracking + the structured, traceable risk factors.
      const contacts = evaluateContacts(dating, pregnancy, settings);
      const risk = evaluateRisk(pregnancy, conditionNames, itemRecords);
      // Upcoming antenatal appointments for this patient and this doctor.
      const apptRes = await sr.entities.Appointment.filter(
        { patient_id: patientId, status: "scheduled" },
        { sort: "date", limit: 10 }
      ).catch(() => ({ items: [] }));
      const upcomingAppointments = (apptRes.items || []).map((a) => ({
        id: a.id,
        date: a.date || "",
        time: a.time || "",
        reason: a.reason || "",
        doctor_name: a.doctor_name || "",
      }));
      return Response.json({
        patient: {
          id: patient.id,
          full_name: patient.full_name || "",
          cin: patient.cin || "",
          date_of_birth: patient.date_of_birth || "",
          pregnancy_status: patient.pregnancy_status || "",
        },
        pregnancy,
        dating,
        schedule: scheduleOut,
        automations: openAutomations,
        acknowledged_alerts: acks,
        contacts,
        risk,
        upcoming_appointments: upcomingAppointments,
        settings,
        flags,
        computed_risk_flags,
        config: config ? { id: config.id, name: config.name, version: config.version } : { name: "WHO / Libyan default schedule (not yet configured)", version: null },
      });
    }

    if (action === "save_pregnancy") {
      const rec = payload.record && typeof payload.record === "object" ? payload.record : null;
      if (!rec) return Response.json({ error: "Pregnancy record data is required." }, { status: 400 });
      const norm = {
        lmp_date: rec.lmp_date ? String(rec.lmp_date).slice(0, 10) : "",
        edd_date: rec.edd_date ? String(rec.edd_date).slice(0, 10) : "",
        dating_method: ["lmp", "ultrasound", "edd", "clinical_assessment"].includes(rec.dating_method) ? rec.dating_method : "lmp",
        ultrasound_dating_date: rec.ultrasound_dating_date ? String(rec.ultrasound_dating_date).slice(0, 10) : "",
        ultrasound_dating_weeks: Number.isFinite(rec.ultrasound_dating_weeks) ? rec.ultrasound_dating_weeks : null,
        ultrasound_dating_days: Number.isFinite(rec.ultrasound_dating_days) ? rec.ultrasound_dating_days : null,
        gravida: Number.isFinite(rec.gravida) ? rec.gravida : null,
        parity: Number.isFinite(rec.parity) ? rec.parity : null,
        previous_outcomes: Array.isArray(rec.previous_outcomes) ? rec.previous_outcomes : [],
        previous_cesarean: rec.previous_cesarean === true,
        previous_preeclampsia: rec.previous_preeclampsia === true,
        previous_gestational_diabetes: rec.previous_gestational_diabetes === true,
        previous_preterm_birth: rec.previous_preterm_birth === true,
        previous_fgr: rec.previous_fgr === true,
        risk_factors: Array.isArray(rec.risk_factors) ? rec.risk_factors.filter((r) => r && r.detail) : [],
        notes: String(rec.notes || "").slice(0, 2000),
      };
      const now = new Date().toISOString();
      const datingFields = ["lmp_date", "edd_date", "dating_method", "ultrasound_dating_date", "ultrasound_dating_weeks", "ultrasound_dating_days"];
      let datingChanged = false;
      let datingHistory = Array.isArray(pregnancy?.dating_history) ? pregnancy.dating_history : [];
      if (pregnancy) {
        datingChanged = datingFields.some((f) => String(pregnancy[f] ?? "") !== String(norm[f] ?? ""));
        if (datingChanged) {
          const reason = String(payload.dating_change_reason || "").trim();
          if (!reason) {
            return Response.json({ error: "A documented reason is required when correcting pregnancy dating." }, { status: 400 });
          }
          datingHistory = [
            ...datingHistory,
            {
              datetime: now,
              lmp_date: norm.lmp_date,
              edd_date: norm.edd_date,
              dating_method: norm.dating_method,
              ultrasound_dating_date: norm.ultrasound_dating_date,
              ultrasound_dating_weeks: norm.ultrasound_dating_weeks,
              ultrasound_dating_days: norm.ultrasound_dating_days,
              reason,
              by_user_id: user.id,
              by_name: doctor.full_name || "",
            },
          ];
        }
      }
      let saved;
      if (pregnancy) {
        saved = await sr.entities.PregnancyRecord.update(pregnancy.id, { ...norm, dating_history: datingHistory });
      } else {
        saved = await sr.entities.PregnancyRecord.create({
          ...norm,
          ...patientIdent,
          patient_id: patientId,
          status: "active",
          dating_history: [],
          risk_level: "pending_assessment",
          initial_assessment_done: rec.initial_assessment_done === true,
        });
      }
      // Initial assessment documentation + latest clinical review.
      const extra = {};
      if (rec.initial_assessment_done === true && !saved.initial_assessment_datetime) {
        extra.initial_assessment_datetime = now;
      }
      extra.last_clinical_review_datetime = now;
      extra.last_reviewed_by_name = doctor.full_name || "";
      if (Object.keys(extra).length > 0) {
        saved = await sr.entities.PregnancyRecord.update(saved.id, extra);
      }
      // Keep the unified AMedix Patient Record pregnancy fields in sync.
      const dating = computeDating(saved, todayStr());
      const profileSync = { pregnancy_status: "pregnant" };
      if (dating.complete) {
        profileSync.gestational_age = dating.label;
        profileSync.estimated_due_date = dating.edd;
      } else if (saved.edd_date) {
        profileSync.estimated_due_date = saved.edd_date;
      }
      await sr.entities.PatientProfile.update(patient.id, profileSync).catch(() => {});
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: pregnancy ? "updated_pregnancy_record" : "created_pregnancy_record",
        action_label: pregnancy ? "updated the antenatal pregnancy record" : "created the antenatal pregnancy record",
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, pregnancy: saved, dating, dating_changed: datingChanged });
    }

    if (action === "set_risk_level") {
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      const level = String(payload.risk_level || "");
      if (!["high", "intermediate", "low", "pending_assessment"].includes(level)) {
        return Response.json({ error: "Invalid risk level." }, { status: 400 });
      }
      const now = new Date().toISOString();
      // The classification trace: which documented factors the clinician
      // based the level on, traced to the rule source and version. Risk is
      // never auto-classified — the clinician confirms and signs the level.
      const factorKeys = Array.isArray(payload.factor_keys) ? payload.factor_keys.map(String).slice(0, 50) : [];
      const riskAssessment = {
        assessed_datetime: now,
        by_name: doctor.full_name || "",
        level,
        factor_keys: factorKeys,
        rules_source: ANTENATAL_RULES_SOURCE,
        rules_version: ANTENATAL_RULES_VERSION,
        notes: String(payload.reason || "").slice(0, 1000),
      };
      const saved = await sr.entities.PregnancyRecord.update(pregnancy.id, {
        risk_level: level,
        risk_level_reason: String(payload.reason || "").slice(0, 1000),
        risk_level_datetime: now,
        risk_level_by_name: doctor.full_name || "",
        risk_assessment: riskAssessment,
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "assessed_pregnancy_risk",
        action_label: `classified the pregnancy as ${level} risk`,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, pregnancy: saved });
    }

    if (action === "record_item") {
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      // Structured screening statuses — never interchangeable. Timing states
      // (not yet due / due soon / due now / overdue) are derived from the
      // gestational age; the recorded status is what the clinician documents.
      const status = String(payload.status || "");
      if (!["completed", "ordered", "skipped", "sample_collected", "pending_result", "result_available", "normal", "negative", "abnormal", "positive", "inconclusive", "followup_required", "declined", "not_indicated"].includes(status)) {
        return Response.json({ error: "Invalid screening status." }, { status: 400 });
      }
      const itemKey = String(payload.item_key || "");
      if (!itemKey) return Response.json({ error: "Item key is required." }, { status: 400 });
      const now = new Date().toISOString();
      const outcome = payload.outcome === "abnormal" || payload.outcome === "normal" ? payload.outcome
        : status === "abnormal" || status === "positive" ? "abnormal"
        : status === "normal" || status === "negative" ? "normal" : "";
      const followupPlan = String(payload.followup_plan || "").trim();
      const deferralReason = String(payload.deferral_reason || "").trim();
      if (outcome === "abnormal" && !followupPlan) {
        // Any abnormal finding requires a documented management or follow-up
        // plan before it can be filed — a missing result is never a negative.
        return Response.json({ error: "A documented management or follow-up plan is required when recording an abnormal finding." }, { status: 400 });
      }
      if ((status === "declined" || status === "not_indicated") && !deferralReason) {
        return Response.json({ error: "A documented reason is required when recording declined or not-indicated investigations." }, { status: 400 });
      }
      // Abnormal, inconclusive and follow-up-required results enter the
      // clinical review workflow — the system tracks whether appropriate
      // action has been taken, not just the result status.
      const entersReview = ["abnormal", "positive", "inconclusive", "followup_required", "result_available"].includes(status);
      const data = {
        status,
        notes: String(payload.notes || "").slice(0, 1000),
        outcome,
        followup_plan: followupPlan.slice(0, 1000),
        item_label: String(payload.item_label || ""),
        window_key: String(payload.window_key || ""),
        clinical_indication: String(payload.clinical_indication || "").slice(0, 500),
        guideline_source: String(payload.guideline_source || "").slice(0, 200),
        guideline_version: String(payload.guideline_version || "").slice(0, 100),
        order_datetime: payload.order_datetime ? String(payload.order_datetime) : "",
        specimen_collection_datetime: payload.specimen_collection_datetime ? String(payload.specimen_collection_datetime) : "",
        result_value: String(payload.result_value || "").slice(0, 200),
        result_units: String(payload.result_units || "").slice(0, 50),
        reference_range: String(payload.reference_range || "").slice(0, 200),
        interpretation: String(payload.interpretation || "").slice(0, 1000),
        responsible_clinician: String(payload.responsible_clinician || "").slice(0, 200),
        deferral_reason: deferralReason.slice(0, 500),
        review_status: entersReview ? "awaiting_review" : "",
        reviewing_clinician: "",
        review_datetime: "",
        completion_datetime: ["completed", "normal", "negative", "abnormal", "positive"].includes(status) ? now : "",
        linked_lab_request_id: payload.linked_lab_request_id ? String(payload.linked_lab_request_id) : "",
        linked_imaging_request_id: payload.linked_imaging_request_id ? String(payload.linked_imaging_request_id) : "",
        recorded_datetime: now,
        recorded_by_user_id: user.id,
        recorded_by_name: doctor.full_name || "",
      };
      const existing = (await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id, item_key: itemKey }, { limit: 1 })).items || [];
      let saved;
      if (existing.length > 0) {
        saved = await sr.entities.AntenatalItemRecord.update(existing[0].id, data);
      } else {
        saved = await sr.entities.AntenatalItemRecord.create({ ...data, pregnancy_id: pregnancy.id, patient_id: patientId, ...patientIdent, item_key: itemKey });
      }
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "recorded_antenatal_item",
        action_label: `recorded antenatal screening item as ${status}`,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, item: saved });
    }

    if (action === "review_item") {
      // Documented clinical review of an abnormal / inconclusive result: the
      // system tracks whether appropriate action has been taken instead of
      // simply changing the result status to completed.
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      const itemKey = String(payload.item_key || "");
      if (!itemKey) return Response.json({ error: "Item key is required." }, { status: 400 });
      const existing = (await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id, item_key: itemKey }, { limit: 1 })).items || [];
      if (existing.length === 0) return Response.json({ error: "No recorded item to review." }, { status: 404 });
      const rec = existing[0];
      const plan = String(payload.followup_plan || "").trim();
      if ((rec.outcome === "abnormal" || rec.status === "abnormal" || rec.status === "positive") && !plan && !rec.followup_plan) {
        return Response.json({ error: "A documented management or follow-up plan is required to review an abnormal finding." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const saved = await sr.entities.AntenatalItemRecord.update(rec.id, {
        review_status: "reviewed",
        reviewing_clinician: doctor.full_name || "",
        review_datetime: now,
        followup_plan: plan || rec.followup_plan || "",
        responsible_clinician: String(payload.responsible_clinician || rec.responsible_clinician || doctor.full_name || "").slice(0, 200),
        notes: String(payload.notes || rec.notes || "").slice(0, 1000),
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "reviewed_antenatal_result",
        action_label: `clinically reviewed the antenatal item "${rec.item_label || itemKey}"`,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, item: saved });
    }

    if (action === "record_contact") {
      // A contact counts as completed ONLY when a qualifying antenatal
      // encounter is documented — a reminder or an ordered test never
      // completes a contact.
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      const no = Number(payload.contact_no);
      if (!Number.isFinite(no) || no < 1) return Response.json({ error: "Contact number is required." }, { status: 400 });
      const evidence = String(payload.encounter_evidence || "").trim();
      if (!evidence) {
        return Response.json({ error: "Documented evidence of the qualifying encounter is required (clinical note reference, encounter ID or the documented review). Reminders and ordered investigations do not complete a contact." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const datingNow = computeDating(pregnancy, todayStr());
      const week = datingNow.complete ? datingNow.weeks : null;
      const settingsNow = normalizeSettings(config?.settings);
      const standardCount = settingsNow.contact_weeks && settingsNow.contact_weeks.length > 0 ? settingsNow.contact_weeks.length : 8;
      const additional = payload.additional === true || no > standardCount;
      const additionalReason = String(payload.additional_reason || "").trim();
      if (additional && !additionalReason) {
        return Response.json({ error: "A documented clinical indication is required for an additional contact." }, { status: 400 });
      }
      const entry = {
        contact_no: no,
        additional,
        additional_reason: additionalReason,
        week,
        completed_datetime: now,
        completed_by_name: doctor.full_name || "",
        completed_by_user_id: user.id,
        encounter_evidence: evidence.slice(0, 500),
        notes: String(payload.notes || "").slice(0, 1000),
      };
      const list = Array.isArray(pregnancy.contacts) ? pregnancy.contacts : [];
      const idx = list.findIndex((c) => Number(c.contact_no) === no && (c.additional === true) === additional);
      const nextList = idx >= 0 ? list.map((c, i) => (i === idx ? entry : c)) : [...list, entry];
      const saved = await sr.entities.PregnancyRecord.update(pregnancy.id, {
        contacts: nextList,
        last_clinical_review_datetime: now,
        last_reviewed_by_name: doctor.full_name || "",
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "documented_antenatal_contact",
        action_label: additional ? `documented an additional antenatal contact (#${no})` : `documented antenatal contact ${no} as completed`,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, pregnancy: saved });
    }

    if (action === "acknowledge_alert") {
      // Alert acknowledgement with the action taken; acknowledged alerts stop
      // repeating so reminders are not duplicated.
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      const ruleKey = String(payload.rule_key || "");
      const actionTaken = String(payload.action_taken || "").trim();
      if (!ruleKey || !actionTaken) {
        return Response.json({ error: "The rule key and the action taken are required to acknowledge an alert." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const acks = Array.isArray(pregnancy.alert_acks) ? pregnancy.alert_acks : [];
      const saved = await sr.entities.PregnancyRecord.update(pregnancy.id, {
        alert_acks: [...acks, { rule_key: ruleKey, acknowledged_datetime: now, by_name: doctor.full_name || "", action_taken: actionTaken.slice(0, 500) }],
      });
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "acknowledged_antenatal_alert",
        action_label: `acknowledged the antenatal alert "${ruleKey}" — action: ${actionTaken.slice(0, 100)}`,
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, pregnancy: saved });
    }

    if (action === "get_summary") {
      // Structured antenatal summary for continuity of care — the original
      // clinical records and the audit trail are preserved; the summary
      // generation itself is audit-logged.
      if (!pregnancy) return Response.json({ error: "No active pregnancy record for this patient." }, { status: 404 });
      const itemRecords = (await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id }, { limit: 500 })).items || [];
      const conditionsPage = await sr.entities.MedicalCondition.filter({ patient_id: patientId, category: "known_case" }, { limit: 100 });
      const conditionNames = (conditionsPage.items || []).map((c) => c.name);
      const dating = computeDating(pregnancy, todayStr());
      const settings = normalizeSettings(config?.settings);
      const windows = applySettings(
        config && Array.isArray(config.windows) && config.windows.length > 0 ? config.windows : DEFAULT_WINDOWS,
        settings
      );
      const schedule = evaluateSchedule(dating, windows, itemRecords);
      const contacts = evaluateContacts(dating, pregnancy, settings);
      const risk = evaluateRisk(pregnancy, conditionNames, itemRecords);
      const imgIds = itemRecords.map((r) => r.linked_imaging_request_id).filter(Boolean);
      const imgPage = imgIds.length > 0
        ? await sr.entities.ImagingRequest.filter({ id: { $in: imgIds } }, { limit: 200 }).catch(() => ({ items: [] }))
        : { items: [] };
      const ultrasoundReports = (imgPage.items || []).filter((r) => String(r.report || "").trim()).map((r) => ({
        request_id: r.request_id || "",
        scan_type: r.scan_type || "",
        examination: r.examination || "",
        workflow_status: r.workflow_status || "",
        final_report_datetime: r.final_report_datetime || "",
        report: String(r.report || ""),
      }));
      const flat = schedule.flatMap((w) => w.items.map((it) => ({ ...it, window: w.label })));
      const outstanding = flat.filter((it) => ["due", "overdue", "ordered", "sample_collected", "pending_result", "result_available", "awaiting_dating"].includes(it.state));
      const abnormal = flat.filter((it) => it.record && (it.record.outcome === "abnormal" || it.record.review_status === "awaiting_review"));
      const summary = {
        generated_datetime: new Date().toISOString(),
        patient: { id: patient.id, full_name: patient.full_name || "", cin: patient.cin || "", date_of_birth: patient.date_of_birth || "" },
        dating: dating.complete ? { lmp: dating.lmp, edd: dating.edd, gestational_age: dating.label, method: dating.dating_method } : { complete: false },
        obstetric_history: {
          gravida: pregnancy.gravida ?? null,
          parity: pregnancy.parity ?? null,
          previous_outcomes: pregnancy.previous_outcomes || [],
          previous_cesarean: pregnancy.previous_cesarean === true,
        },
        maternal_risk: { risk_level: pregnancy.risk_level || "pending_assessment", factors: risk.factors, assessed: pregnancy.risk_assessment || null },
        contacts: { completed_count: contacts.completed_count, total: contacts.total, contacts: contacts.contacts, additional: contacts.additional },
        screening_history: flat.filter((it) => it.record).map((it) => ({
          item: it.label,
          window: it.window,
          status: it.record.status || it.state,
          result_value: it.record.result_value,
          result_units: it.record.result_units,
          reference_range: it.record.reference_range,
          interpretation: it.record.interpretation,
          reviewing_clinician: it.record.reviewing_clinician,
          review_status: it.record.review_status,
          followup_plan: it.record.followup_plan,
          recorded_datetime: it.record.recorded_datetime,
          recorded_by_name: it.record.recorded_by_name,
        })),
        abnormal_findings: abnormal.map((it) => ({ item: it.label, review_status: it.record.review_status, followup_plan: it.record.followup_plan, outcome: it.record.outcome })),
        ultrasound_reports: ultrasoundReports,
        current_plan: flat.filter((it) => it.record && it.record.followup_plan).map((it) => ({ item: it.label, plan: it.record.followup_plan })),
        outstanding_investigations: outstanding.map((it) => ({ item: it.label, window: it.window, state: it.state })),
        delivery_planning: flat.filter((it) => ["birth_planning", "delivery_plan_review", "delivery_planning_review_post"].includes(it.key)).map((it) => ({ item: it.label, state: it.state })),
      };
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "generated_antenatal_summary",
        action_label: "generated the structured antenatal summary for continuity of care",
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        hospital: doctor.hospital || "",
      });
      return Response.json({ ok: true, summary });
    }

    if (action === "list_open_imaging_requests") {
      // Open imaging requests of this patient, so the doctor can link an
      // existing radiology order (created through the normal imaging
      // workflow) to a schedule item.
      const page = await sr.entities.ImagingRequest.filter({ patient_id: patientId, status: "requested" }, { sort: "-request_datetime", limit: 50 });
      const requests = (page.items || []).map((r) => ({
        id: r.id,
        request_id: r.request_id || "",
        scan_type: r.scan_type || "",
        examination: r.examination || "",
        priority: r.priority || "",
        workflow_status: r.workflow_status || "",
        request_datetime: r.request_datetime || "",
      }));
      return Response.json({ ok: true, requests });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}