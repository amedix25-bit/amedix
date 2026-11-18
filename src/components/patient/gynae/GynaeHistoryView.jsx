import React from "react";
import InfoRow from "@/components/patient/medical/InfoRow";
import {
  normalizeGynaeHistory,
  labelFor,
  conditionLabel,
  calculatedGravida,
  CYCLE_REGULARITY,
  MENSTRUAL_FLOW,
  DYSMENORRHOEA,
  YES_NO_UNKNOWN,
  PREGNANCY_OUTCOMES,
  DELIVERY_MODES,
  NEONATAL_OUTCOMES,
  MENOPAUSE_SYMPTOMS,
  CONTRACEPTION_METHODS,
  ORAL_CONTRACEPTION_TYPES,
  sectionHasAnswers,
} from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Read-only presentation of the Gynaecological & Obstetric History. Shared by
// the patient's My Health (Past History) and by authorized treating doctors.
export default function GynaeHistoryView({ gynae, profile, showRecordInfo = true }) {
  const { t, isArabic } = usePatientLanguage();
  const g = normalizeGynaeHistory(gynae);
  const notRecorded = t("Not recorded");
  const value = (v) => (v === "" || v === null || v === undefined ? notRecorded : String(v));
  const yesNo = (v) => (v ? t(labelFor(YES_NO_UNKNOWN, v)) : notRecorded);

  const when = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(isArabic ? "ar" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  // Under each part: when it was first recorded, or when it was last updated —
  // so previously recorded answers are told apart from later ones.
  const stamp = (key) => {
    if (!showRecordInfo || !sectionHasAnswers(key, g[key])) return null;
    const iso = g.section_updated?.[key];
    return (
      <p className="text-[11px] text-muted-foreground">
        {iso ? `${t("Updated")} ${when(iso)}` : t("Recorded at registration")}
      </p>
    );
  };

  const pregnancyStatus =
    profile?.pregnancy_status === "pregnant" || profile?.pregnancy_status === "not_pregnant"
      ? profile.pregnancy_status
      : g.current_pregnancy.status;
  const pregnant = pregnancyStatus === "pregnant";
  // Gravida exists only while she is pregnant: it is calculated from all her
  // pregnancies, including the current one. Never shown otherwise.
  const gravida = calculatedGravida(g.obstetric, pregnancyStatus);
  // A postmenopausal patient is never asked about her cycle, so when she left it
  // blank the whole Menstrual History part is left out instead of being shown as
  // a list of "Not recorded" lines.
  const postmenopausal = g.menopause.status === "postmenopausal";
  const showMenstrual = !postmenopausal || sectionHasAnswers("menstrual", g.menstrual);

  return (
    <div className="space-y-5">
      {showRecordInfo && (g.recorded_datetime || g.updated_datetime) && (
        <p className="text-[11px] text-muted-foreground">
          {g.recorded_datetime ? `${t("Recorded")}: ${when(g.recorded_datetime)}` : ""}
          {g.recorded_datetime && g.updated_datetime ? " · " : ""}
          {g.updated_datetime ? `${t("Last updated")}: ${when(g.updated_datetime)}` : ""}
        </p>
      )}
      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Current Pregnancy")}</h4>
        {stamp("current_pregnancy")}
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow
            label={t("Pregnancy status")}
            value={
              pregnancyStatus === "pregnant"
                ? t("Pregnant")
                : pregnancyStatus === "not_pregnant"
                  ? t("Not pregnant")
                  : pregnancyStatus === "unknown"
                    ? t("Unknown")
                    : notRecorded
            }
          />
          {pregnant && (
            <>
              <InfoRow
                label={t("Gestational age")}
                value={value(profile?.gestational_age || g.current_pregnancy.gestational_age)}
              />
              <InfoRow
                label={t("Estimated due date")}
                value={value(profile?.estimated_due_date || g.current_pregnancy.edd)}
              />
              <InfoRow label={t("Last menstrual period (LMP)")} value={value(g.current_pregnancy.lmp || g.menstrual.lmp)} />
            </>
          )}
        </div>
      </section>

      {showMenstrual && (
        <section className="space-y-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Menstrual History")}</h4>
          {stamp("menstrual")}
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <InfoRow label={t("Last menstrual period (LMP)")} value={value(g.menstrual.lmp)} />
            <InfoRow label={t("Age at menarche")} value={value(g.menstrual.age_at_menarche)} />
            <InfoRow label={t("Cycle regularity")} value={value(labelFor(CYCLE_REGULARITY, g.menstrual.cycle_regularity))} />
            <InfoRow label={t("Cycle length (days)")} value={value(g.menstrual.cycle_length)} />
            <InfoRow label={t("Bleeding duration (days)")} value={value(g.menstrual.bleeding_duration)} />
            <InfoRow label={t("Menstrual flow")} value={value(labelFor(MENSTRUAL_FLOW, g.menstrual.flow))} />
            <InfoRow label={t("Dysmenorrhoea (period pain)")} value={value(labelFor(DYSMENORRHOEA, g.menstrual.dysmenorrhoea))} />
            <InfoRow label={t("Abnormal uterine bleeding")} value={yesNo(g.menstrual.abnormal_uterine_bleeding)} />
          </div>
          {g.menstrual.details && <p className="text-sm">{g.menstrual.details}</p>}
        </section>
      )}

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Gynaecological History")}</h4>
        {stamp("past")}
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow
            label={t("Previous gynaecological conditions")}
            value={
              (g.past.conditions || []).length
                ? g.past.conditions
                    .map((key) =>
                      g.past.condition_details?.[key]
                        ? `${t(conditionLabel(key))} (${g.past.condition_details[key]})`
                        : t(conditionLabel(key))
                    )
                    .join(" · ")
                : notRecorded
            }
          />
          <InfoRow label={t("Previous pelvic infections")} value={value(g.past.infections)} />
          <InfoRow label={t("Previous gynaecological operations")} value={value(g.past.surgeries)} />
          <InfoRow label={t("Treatments received")} value={value(g.past.treatments)} />
          <InfoRow label={t("Relevant investigations")} value={value(g.past.investigations)} />
          <InfoRow label={t("Fertility-related history")} value={value(g.past.fertility)} />
        </div>
        {g.past.other_details && <p className="text-sm">{g.past.other_details}</p>}
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Contraception History")}</h4>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow
            label={t("Current contraception")}
            value={value(labelFor(CONTRACEPTION_METHODS, g.past.contraception_method))}
          />
          {g.past.contraception_method === "oral" && (
            <InfoRow
              label={t("Oral contraception type")}
              value={value(labelFor(ORAL_CONTRACEPTION_TYPES, g.past.contraception_oral_type))}
            />
          )}
          {g.past.contraception_method === "oral" && g.past.contraception_oral_type === "other" && (
            <InfoRow label={t("Details")} value={value(g.past.contraception_oral_other)} />
          )}
          {g.past.contraception && <InfoRow label={t("Contraception history")} value={g.past.contraception} />}
        </div>
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Past Obstetric History")}</h4>
        {stamp("obstetric")}
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {pregnant && <InfoRow label={t("Gravida (G)")} value={gravida !== null ? String(gravida) : notRecorded} />}
          <InfoRow label={t("Para (P)")} value={value(g.obstetric.para)} />
          <InfoRow label={t("Term deliveries")} value={value(g.obstetric.term_deliveries)} />
          <InfoRow label={t("Preterm deliveries")} value={value(g.obstetric.preterm_deliveries)} />
          <InfoRow label={t("Miscarriages")} value={value(g.obstetric.miscarriages)} />
          <InfoRow label={t("Induced abortions")} value={value(g.obstetric.induced_abortions)} />
          <InfoRow label={t("Ectopic pregnancies")} value={value(g.obstetric.ectopic_pregnancies)} />
          <InfoRow label={t("Stillbirths")} value={value(g.obstetric.stillbirths)} />
          <InfoRow label={t("Living children")} value={value(g.obstetric.living_children)} />
        </div>
        {pregnant && (
          <p className="text-[11px] text-muted-foreground">
            {t("Gravida (G) counts every pregnancy once, including the current one.")}
          </p>
        )}
        {(g.obstetric.pregnancies || []).length > 0 && (
          <div className="space-y-2 pt-1">
            {(g.obstetric.pregnancies || []).map((entry, index) => (
              <div key={entry.entry_id || index} className="rounded-lg bg-muted px-3 py-2 space-y-1">
                <p className="text-sm font-medium">
                  {t("Pregnancy")} {index + 1}
                  {entry.year ? ` · ${entry.year}` : ""}
                  {entry.outcome ? ` · ${t(labelFor(PREGNANCY_OUTCOMES, entry.outcome))}` : ""}
                </p>
                <div className="grid sm:grid-cols-2 gap-x-6">
                  <InfoRow label={t("Gestational age at delivery or loss")} value={value(entry.gestational_age)} />
                  <InfoRow label={t("Mode of delivery")} value={value(labelFor(DELIVERY_MODES, entry.mode_of_delivery))} />
                  <InfoRow label={t("Neonatal outcome")} value={value(labelFor(NEONATAL_OUTCOMES, entry.neonatal_outcome))} />
                  <InfoRow label={t("Neonatal details")} value={value(entry.neonatal_details)} />
                </div>
                {entry.complications && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("Pregnancy complications")}: </span>
                    {entry.complications}
                  </p>
                )}
                {entry.delivery_complications && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("Delivery complications")}: </span>
                    {entry.delivery_complications}
                  </p>
                )}
                {entry.notes && <p className="text-sm">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">{t("Menopause")}</h4>
        {stamp("menopause")}
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow
            label={t("Menopause status")}
            value={
              g.menopause.status === "postmenopausal"
                ? t("Postmenopausal")
                : g.menopause.status === "premenopausal"
                  ? t("Premenopausal")
                  : g.menopause.status === "unknown"
                    ? t("Unknown")
                    : notRecorded
            }
          />
          {g.menopause.status === "postmenopausal" && (
            <>
              <InfoRow label={t("Age at menopause")} value={value(g.menopause.age_at_menopause)} />
              <InfoRow label={t("Year of menopause")} value={value(g.menopause.year_of_menopause)} />
              <InfoRow label={t("Date of last menstrual period")} value={value(g.menopause.last_menstrual_period)} />
              <InfoRow label={t("Postmenopausal vaginal bleeding")} value={yesNo(g.menopause.postmenopausal_bleeding)} />
              <InfoRow label={t("Hormone replacement therapy (HRT)")} value={yesNo(g.menopause.hrt)} />
              <InfoRow label={t("HRT details")} value={value(g.menopause.hrt_details)} />
              <InfoRow label={t("Osteoporosis")} value={yesNo(g.menopause.osteoporosis)} />
              <InfoRow label={t("Fragility fracture")} value={yesNo(g.menopause.fragility_fracture)} />
              <InfoRow
                label={t("Menopausal symptoms")}
                value={
                  (g.menopause.symptoms || []).length
                    ? g.menopause.symptoms
                        .map((key) => t(MENOPAUSE_SYMPTOMS.find((s) => s.key === key)?.label || key))
                        .join(" · ")
                    : notRecorded
                }
              />
              <InfoRow label={t("Surgical menopause")} value={yesNo(g.menopause.surgical_menopause)} />
              {g.menopause.surgical_menopause === "yes" && (
                <>
                  <InfoRow label={t("Reason for surgery")} value={value(g.menopause.surgical_menopause_reason)} />
                  <InfoRow label={t("Age at surgery")} value={value(g.menopause.surgical_menopause_age)} />
                </>
              )}
            </>
          )}
        </div>
        {g.menopause.status === "postmenopausal" && g.menopause.other_details && (
          <p className="text-sm">{g.menopause.other_details}</p>
        )}
      </section>
    </div>
  );
}