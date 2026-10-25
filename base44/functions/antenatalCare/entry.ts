import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";
import {
  computeDating,
  evaluateSchedule,
  evaluateFlags,
  DEFAULT_WINDOWS,
  todayStr,
} from "../../shared/antenatal.ts";

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
          is_active: cfg.is_active === true,
          version: (existing.version || 1) + 1,
          updated_datetime: now,
          updated_by_name: user.full_name || "",
        });
      } else {
        record = await sr.entities.AntenatalScheduleConfig.create({
          name: String(cfg.name || "Antenatal protocol"),
          windows: cfg.windows,
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
      const docs = await sr.entities.DoctorProfile.filter({ id: String(payload.doctor_id) }, { limit: 1 });
      if (docs.length > 0 && docs[0].user_id === user.id) doctor = docs[0];
    }
    if (!doctor) {
      const mine = await sr.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 });
      if (mine.length > 0) doctor = mine[0];
    }
    if (!doctor) return Response.json({ error: "Doctor profile not found." }, { status: 403 });

    const access = await sr.entities.AccessRequest.filter(
      { patient_id: patientId, doctor_id: doctor.id, status: "approved" },
      { limit: 1 }
    );
    if (access.length === 0) {
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
    const pregnancy = pregnancies.status === "fulfilled" && pregnancies.value.length > 0 ? pregnancies.value[0] : null;
    const config = configs.status === "fulfilled" && configs.value.length > 0 ? configs.value[0] : null;
    const windows = config && Array.isArray(config.windows) && config.windows.length > 0 ? config.windows : DEFAULT_WINDOWS;

    const patientIdent = {
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
    };

    if (action === "get_overview") {
      const itemRecords = pregnancy ? await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id }, { limit: 500 }) : [];
      const dating = pregnancy ? computeDating(pregnancy, todayStr()) : { complete: false, lmp: "", edd: "", dating_method: "lmp" };
      const schedule = evaluateSchedule(dating, windows, itemRecords);
      const conditions = await sr.entities.MedicalCondition.filter({ patient_id: patientId, category: "known_case" }, { limit: 100 });
      const conditionNames = (conditions || []).map((c) => c.name);
      const { flags, computed_risk_flags } = evaluateFlags(dating, pregnancy, patient, conditionNames);
      // Linked orders: a pending lab/imaging request keeps the item "ordered";
      // results available flip it to completed server-side display.
      const labIds = itemRecords.map((r) => r.linked_lab_request_id).filter(Boolean);
      const imgIds = itemRecords.map((r) => r.linked_imaging_request_id).filter(Boolean);
      const [labRes, imgRes] = await Promise.allSettled([
        labIds.length > 0 ? sr.entities.LabRequest.filter({ id: { $in: labIds } }, { limit: 200 }) : [],
        imgIds.length > 0 ? sr.entities.ImagingRequest.filter({ id: { $in: imgIds } }, { limit: 200 }) : [],
      ]);
      const labById = {};
      (labRes.status === "fulfilled" ? labRes.value : []).forEach((l) => { labById[l.id] = l; });
      const imgById = {};
      (imgRes.status === "fulfilled" ? imgRes.value : []).forEach((i) => { imgById[i.id] = i; });
      const linkState = (rec, kind) => {
        if (!rec) return null;
        const id = kind === "lab" ? rec.linked_lab_request_id : rec.linked_imaging_request_id;
        if (!id) return null;
        const linked = kind === "lab" ? labById[id] : imgById[id];
        if (!linked) return { state: "not_found", request_id: "" };
        const done = kind === "lab" ? linked.status === "results" : linked.status === "completed";
        return { state: done ? "results_available" : "awaiting_results", request_id: linked.request_id || "", status: linked.status };
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
      const saved = await sr.entities.PregnancyRecord.update(pregnancy.id, {
        risk_level: level,
        risk_level_reason: String(payload.reason || "").slice(0, 1000),
        risk_level_datetime: now,
        risk_level_by_name: doctor.full_name || "",
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
      const status = String(payload.status || "");
      if (!["completed", "ordered", "skipped"].includes(status)) {
        return Response.json({ error: "Item status must be completed, ordered or skipped." }, { status: 400 });
      }
      const itemKey = String(payload.item_key || "");
      if (!itemKey) return Response.json({ error: "Item key is required." }, { status: 400 });
      const now = new Date().toISOString();
      const data = {
        status,
        notes: String(payload.notes || "").slice(0, 1000),
        item_label: String(payload.item_label || ""),
        window_key: String(payload.window_key || ""),
        linked_lab_request_id: payload.linked_lab_request_id ? String(payload.linked_lab_request_id) : "",
        linked_imaging_request_id: payload.linked_imaging_request_id ? String(payload.linked_imaging_request_id) : "",
        recorded_datetime: now,
        recorded_by_user_id: user.id,
        recorded_by_name: doctor.full_name || "",
      };
      const existing = await sr.entities.AntenatalItemRecord.filter({ pregnancy_id: pregnancy.id, item_key: itemKey }, { limit: 1 });
      let saved;
      if (existing.length > 0) {
        saved = await sr.entities.AntenatalItemRecord.update(existing[0].id, data);
      } else {
        saved = await sr.entities.AntenatalItemRecord.create({ ...data, pregnancy_id: pregnancy.id, ...patientIdent, item_key: itemKey });
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

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}