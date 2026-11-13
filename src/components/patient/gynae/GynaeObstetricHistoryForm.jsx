import React from "react";
import MenstrualHistoryFields from "./MenstrualHistoryFields";
import GynaePastHistoryFields from "./GynaePastHistoryFields";
import ObstetricHistoryFields from "./ObstetricHistoryFields";
import CurrentPregnancyFields from "./CurrentPregnancyFields";
import MenopauseFields from "./MenopauseFields";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The one Gynaecological & Obstetric History section of the female patient.
// The order follows the clinical questions: pregnancy status first, then the
// previous pregnancy outcomes it depends on — so Gravida can be calculated and
// shown only while she is pregnant. A pregnant patient can never be recorded as
// postmenopausal.
export default function GynaeObstetricHistoryForm({ value, onChange }) {
  const { t } = usePatientLanguage();
  const update = (key) => (patch) => onChange({ ...value, [key]: { ...value[key], ...patch } });
  const pregnant = value.current_pregnancy.status === "pregnant";
  const postmenopausal = value.menopause.status === "postmenopausal" && !pregnant;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-primary">
          {t("Gynaecological & Obstetric History")} *
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          {t("Answered by you and saved in your Past History. Anything you are unsure about stays marked as unknown — never as a negative history. This information is access-controlled and available to your treating doctors.")}
        </p>
      </div>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-primary">{t("Current Pregnancy")}</h4>
        <CurrentPregnancyFields value={value.current_pregnancy} onChange={update("current_pregnancy")} />
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary">{t("Past Obstetric History")}</h4>
        <ObstetricHistoryFields
          value={value.obstetric}
          onChange={update("obstetric")}
          pregnant={pregnant}
          postmenopausal={postmenopausal}
        />
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary">{t("Menstrual History")}</h4>
        <MenstrualHistoryFields value={value.menstrual} onChange={update("menstrual")} />
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary">{t("Past Gynaecological History")}</h4>
        <GynaePastHistoryFields value={value.past} onChange={update("past")} />
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-primary">{t("Menopause")}</h4>
        <MenopauseFields value={value.menopause} onChange={update("menopause")} pregnant={pregnant} />
      </section>
    </div>
  );
}