import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { t, useLanguage } from "../i18n";

const questions = [
  {
    question: "كيف أبحث عن عقار مناسب؟",
    answer: "استخدم خيارات البحث لتحديد العقار الذي يناسب احتياجاتك وميزانيتك:",
    points: ["المدينة أو الحي", "نوع العقار", "السعر المناسب", "نوع العرض (بيع أو إيجار)"],
    note: "ويمكنك ترتيب النتائج أو تصفيتها للوصول إلى العقار المناسب.",
  },
  {
    question: "كيف أتواصل بخصوص عقار معين؟",
    answer: "داخل كل إعلان عقاري ستجد بيانات التواصل أو نموذجًا لإرسال استفسارك، وسيتواصل معك المعلن بأسرع وقت.",
  },
  {
    question: "كيف أعرض عقاري للبيع أو الإيجار؟",
    answer: "أضف عقارك من خلال خيار «إضافة عقار»، ثم أدخل بياناته وأرفق الصور ليظهر للمستخدمين بعد مراجعة الإعلان.",
  },
  {
    question: "هل الصور والمعلومات المعروضة حقيقية؟",
    answer: "نحرص على عرض معلومات دقيقة قدر الإمكان، وننصحك بالتواصل مع المعلن والتحقق من تفاصيل العقار قبل إتمام أي اتفاق.",
  },
  {
    question: "هل تساعدون في إجراءات الشراء أو الإيجار؟",
    answer: "نعم، يمكن لفريقنا إرشادك إلى الخطوات التالية ومساعدتك في الوصول إلى المعلومات اللازمة لإتمام طلبك.",
  },
  {
    question: "كيف أعرف أحدث العقارات المتاحة؟",
    answer: "تابع صفحة العقارات باستمرار، واستخدم خيارات الترتيب والتصفية لمشاهدة الإعلانات الأحدث والأنسب لك.",
  },
];

export default function Help() {
  const { dir } = useLanguage();
  return (
    <main dir={dir} className="bg-white px-4 py-8 text-right sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-slate-300 pb-6 sm:pb-8">
          <div className="mb-4 flex items-center gap-3 text-[#2B65B3]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B65B3] text-white">
              <FontAwesomeIcon icon={faCircleQuestion} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold sm:text-base">{t("المساعدة")}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{t("مركز المساعدة")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            {t("مرحبًا بك في مركز المساعدة. جمعنا هنا إجابات لأكثر الاستفسارات شيوعًا لتسهيل استخدامك لخدماتنا العقارية.")}
          </p>
        </header>

        <section aria-label={t("الأسئلة الشائعة")}>
          {questions.map((item) => (
            <article key={item.question} className="border-b border-slate-300 py-5 sm:py-6">
              <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t(item.question)}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t(item.answer)}</p>
              {item.points && (
                <>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm text-slate-700 sm:grid-cols-2 sm:text-base">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-sm bg-[#399d8e]" />
                        <span>{t(point)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t(item.note)}</p>
                </>
              )}
            </article>
          ))}
        </section>

        <section className="py-6 sm:py-8">
          <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t("تحتاج مساعدة مباشرة؟")}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            {t("إذا لم تجد إجابة لسؤالك، يسعدنا تقديم الدعم.")} <Link to="/contact" className="font-bold text-[#2B65B3] underline underline-offset-4 hover:text-[#399d8e]">{t("تواصل معنا")}</Link> {t("وسنساعدك في أقرب وقت.")}
          </p>
        </section>
      </div>
    </main>
  );
}
