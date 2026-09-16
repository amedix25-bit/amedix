import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";

// The AMedix story shown on the Home page above the account-type cards.
// English stays as is; the Arabic version is shown when the app language
// is Arabic (the layout direction flips app-wide to RTL automatically).
const AR_PARAGRAPHS = [
  "تأسست AMedix على يد طالبين في الطب، ايةالله عابد العليقي ومحمد سعد السبع، برؤية واضحة تتمثل في جعل الرعاية الصحية أكثر ترابطًا وتنظيمًا وسهولة في الوصول إليها، سواء للمرضى أو لمتخصصي الرعاية الصحية.",
  "في صميم AMedix تكمن فكرة أن المعلومات الصحية الخاصة بالمريض يجب أن تكون منظمة بشكل آمن، ومتاحة بسهولة في أي وقت ومن أي مكان عند الحاجة إليها. تجمع المنصة المعلومات الصحية الأساسية في مكان واحد، بما في ذلك المواعيد الطبية، ونتائج الفحوصات المخبرية، والصور التشخيصية، والوثائق الطبية، والوصفات الطبية، والأدوية، مما يوفر سجلًا صحيًا رقميًا شاملًا وسهل الوصول إليه.",
  "وبالإضافة إلى إدارة السجلات الصحية، صُممت AMedix لإنشاء منظومة رعاية صحية مترابطة تجمع المرضى والأطباء والمختبرات وخدمات الأشعة وغيرهم من مقدمي الرعاية الصحية من خلال منصة موحدة. ومن خلال تمكين المعلومات الصحية من الانتقال بكفاءة وأمان بين مختلف نقاط تقديم الرعاية الصحية، تهدف AMedix إلى تحسين التواصل، ودعم استمرارية الرعاية، والحد من التشتت الذي غالبًا ما يوجد داخل منظومة الرعاية الصحية.",
  "والأهم من ذلك، تضع AMedix المريض في مركز رحلته الصحية. فمن خلال ربط المتخصصين في الرعاية الصحية والخدمات والمعلومات حول كل مريض، تهدف المنصة إلى توفير تجربة رعاية صحية أبسط وأكثر تنسيقًا ووضوحًا.",
];

export default function AboutAmedix() {
  const { isArabic } = useAppLanguage();

  if (isArabic) {
    return (
      <div className="max-w-2xl mx-auto mt-6 space-y-4">
        {AR_PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {p}
          </p>
        ))}
        <div className="pt-2">
          <p className="font-semibold text-foreground">رؤيتنا بسيطة:</p>
          <p className="text-primary font-semibold text-lg sm:text-xl mt-1">
            مريض واحد. رحلة صحية مترابطة. كل شيء في مكان واحد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        AMedix was founded by two medical students, Ayatallah Abed Elallegy and
        Mohammed Saad Alsaba, with a clear vision: to make healthcare connected,
        organized, and accessible for both patients and healthcare professionals.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        At the heart of AMedix is the idea that a patient's healthcare information
        should be securely organized and readily accessible whenever and wherever
        it is needed. The platform brings essential health information together in
        one place, including medical appointments, laboratory results, diagnostic
        imaging, medical documents, prescriptions, and medications, creating a
        comprehensive and accessible digital health record.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Beyond record management, AMedix is designed to create an interconnected
        healthcare ecosystem that brings patients, physicians, laboratories,
        radiology services, and other healthcare providers together through a
        unified platform. By enabling healthcare information to move efficiently
        and securely across different points of care, AMedix aims to improve
        communication, support continuity of care, and reduce the fragmentation
        that often exists within the healthcare system.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Most importantly, AMedix keeps the patient at the center of the healthcare
        journey. By connecting healthcare professionals, services, and information
        around each patient, the platform aims to create a simpler, more
        coordinated, and more informed healthcare experience.
      </p>
      <div className="pt-2">
        <p className="font-semibold text-foreground">Our vision is simple:</p>
        <p className="text-primary font-semibold text-lg sm:text-xl mt-1">
          One patient. One connected healthcare journey. All in one place.
        </p>
      </div>
    </div>
  );
}