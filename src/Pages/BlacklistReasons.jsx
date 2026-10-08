import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { t } from "../i18n";

const reasons = [
  {
    title: "نشر معلومات غير صحيحة",
    description: "يرجى إدخال بيانات صحيحة وتفاصيل حقيقية عن العقار، مثل:",
    points: [
      "عدم توفر العقار عند طلب المعاينة",
      "معلومات مضللة عن موقع ومواصفات العقار",
      "استخدام صور لا تعود للعقار المعروض",
    ],
  },
  {
    title: "تكرار نشر الإعلانات المضللة",
    description: "تكرار نشر إعلانات قديمة أو غير دقيقة، أو نشر الإعلان نفسه عدة مرات، قد يؤدي إلى حذف الإعلان أو تقييد الحساب.",
  },
  {
    title: "محاولة الاحتيال أو التضليل",
    description: "أي محاولة لخداع المستخدمين أو طلب مبالغ مالية خارج المنصة بطرق غير واضحة قد تؤدي إلى إيقاف الحساب.",
  },
  {
    title: "استخدام المنصة بشكل مخالف",
    description: "من أمثلة الاستخدام المخالف:",
    points: [
      "إساءة استخدام وسائل التواصل داخل الموقع",
      "إزعاج المستخدمين أو إرسال رسائل مزعجة",
      "استخدام الموقع لأغراض غير عقارية",
    ],
  },
  {
    title: "مخالفة الأنظمة أو القوانين",
    description: "يتم التعامل مع أي مخالفة وفق الأنظمة والقوانين المعمول بها، وقد يؤدي تكرار المخالفات إلى إيقاف الحساب.",
  },
];

const preventionSteps = [
  "إدخال معلومات صحيحة وواضحة",
  "التعامل بحسن وشفافية",
  "الالتزام بسياسات المنصة أثناء عرض العقارات",
];

function BulletList({ items }) {
  return (
    <ul className="mt-2 grid gap-x-8 gap-y-1 text-sm leading-7 text-slate-700 sm:grid-cols-2 sm:text-base sm:leading-8">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-[#399d8e]" />
          <span>{t(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BlacklistReasons() {
  return (
    <main dir="rtl" className="bg-white px-4 py-8 text-right sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-2 flex items-center gap-3 border-b border-slate-300 pb-5 sm:pb-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B65B3] text-white">
            <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold leading-8 text-slate-900 sm:text-2xl">{t("أسباب التعرض للقائمة السوداء")}</h1>
        </header>

        {reasons.map((reason, index) => (
          <section key={reason.title} className="border-b border-slate-300 py-5 sm:py-6">
            <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">
              <span className="ml-1 text-[#2B65B3]">{index + 1}.</span>
              {t(reason.title)}
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t(reason.description)}</p>
            {reason.points && <BulletList items={reason.points} />}
          </section>
        ))}

        <section className="border-b border-slate-300 py-5 sm:py-6">
          <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t("ماذا يحدث عند إدراج الحساب في القائمة السوداء؟")}</h2>
          <p className="mt-1 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t("قد يتم اتخاذ إجراء مناسب بحسب نوع المخالفة، مثل:")}</p>
          <BulletList items={["إخفاء الإعلانات من المنصة", "تعليق الحساب مؤقتًا", "إيقاف الحساب بشكل دائم عند تكرار المخالفات"]} />
        </section>

        <section className="border-b border-slate-300 py-5 sm:py-6">
          <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t("كيف يمكن تجنب ذلك؟")}</h2>
          <p className="mt-1 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t("يمكنك تجنب إدراج الحساب من خلال:")}</p>
          <BulletList items={preventionSteps} />
        </section>

        <section className="py-5 sm:py-6">
          <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t("التواصل معنا")}</h2>
          <p className="mt-1 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t("\n            إذا تم إيقاف حسابك بالخطأ، يمكنك مراجعة فريق الدعم عبر صفحة تواصل معنا لتقديم طلب المراجعة.\n          ")}</p>
        </section>
      </div>
    </main>
  );
}
