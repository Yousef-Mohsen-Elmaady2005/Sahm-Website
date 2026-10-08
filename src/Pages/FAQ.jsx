import { useEffect, useState } from "react";
import { getCommonQuestions } from "../api/auth";
import { t, useLanguage } from "../i18n";

export default function FAQ() {
  const { dir, language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCommonQuestions()
      .then((response) => {
        const payload = response?.data?.data;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.questions)
              ? payload.questions
              : [];
        if (active) {
          const validItems = items.filter((item) => item?.question || item?.title || item?.name);
          setQuestions(validItems);
          setOpenIndex(validItems.length ? 0 : -1);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "تعذر تحميل الأسئلة الشائعة حاليًا.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  return (
    <main dir={dir} className="min-h-[50vh] bg-[#fafafa] px-4 py-8 sm:px-6 sm:py-10">
      <section aria-label={t("الأسئلة الشائعة")} className="mx-auto grid w-full max-w-[1080px] gap-4">
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-500">{t("جاري تحميل الأسئلة الشائعة...")}</p>
        ) : error ? (
          <p role="alert" className="py-8 text-center text-sm text-red-600">{t(error)}</p>
        ) : questions.length ? (
          questions.map((item, index) => {
            const question = language === "en"
              ? item.question_en || item.questionEn || item.title_en || item.titleEn || item.question || item.title || item.name
              : item.question_ar || item.questionAr || item.title_ar || item.titleAr || item.question || item.title || item.name;
            const answer = language === "en"
              ? item.answer_en || item.answerEn || item.description_en || item.descriptionEn || item.answer || item.description || item.body || ""
              : item.answer_ar || item.answerAr || item.description_ar || item.descriptionAr || item.answer || item.description || item.body || "";
            const isOpen = openIndex === index;
            const answerUrl = typeof answer === "string" && /^https?:\/\//i.test(answer.trim()) ? answer.trim() : "";
            return (
              <article key={item.id ?? `${question}-${index}`} className="overflow-hidden rounded-lg border border-[#dedede] bg-white">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`common-question-answer-${index}`}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex min-h-[58px] w-full items-center justify-between gap-4 px-4 py-3 text-right text-base font-medium text-[#399d8e] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2864b5] sm:min-h-[64px] sm:px-5 sm:text-lg"
                  >
                    <span>{t(question)}</span>
                    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-base leading-none text-[#399d8e]">{isOpen ? "−" : "+"}</span>
                  </button>
                </h2>
                <div id={`common-question-answer-${index}`} hidden={!isOpen} className="border-t border-slate-100 px-4 py-3 text-sm leading-7 text-slate-700 sm:px-5 sm:text-base sm:leading-8">
                  {answerUrl ? <a href={answerUrl} target="_blank" rel="noreferrer" className="break-all text-[#2864b5] underline underline-offset-2">{answerUrl}</a> : answer ? t(answer) : t("لا توجد إجابة متاحة لهذا السؤال حاليًا.")}
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">{t("لا توجد أسئلة شائعة متاحة حاليًا.")}</p>
        )}
      </section>
    </main>
  );
}
