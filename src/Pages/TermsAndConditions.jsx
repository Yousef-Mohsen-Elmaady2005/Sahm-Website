import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import { t } from "../i18n";

const termsSections = [
  {
    title: "استخدام الموقع",
    text: "يسمح باستخدام الموقع لغرض البحث عن العقارات أو عرض العقارات والاستفادة من الخدمات العقارية المقدمة، ويجب استخدام الموقع بشكل قانوني وبما لا يضر بالموقع أو بالمستخدمين الآخرين.",
  },
  {
    title: "مسؤولية المعلومات",
    text: "نسعى في سهم للعقارات إلى تقديم معلومات دقيقة ومحدثة حول العقارات المعروضة، إلا أن بعض البيانات يتم إدخالها من قبل المعلنين أو الملاك، لذلك لا نتحمل مسؤولية أي معلومات غير دقيقة يتم نشرها من قبل أطراف أخرى. ننصح المستخدمين دائمًا بمعاينة العقار والتأكد من جميع التفاصيل قبل إتمام أي اتفاق.",
  },
  {
    title: "الإعلانات العقارية",
    text: "يتحمل المعلن مسؤولية صحة المعلومات والصور والأسعار المعروضة للعقار، ويحق للموقع حذف أو تعديل أي إعلان مخالف لسياسات الاستخدام دون إشعار مسبق.",
  },
  {
    title: "حقوق الملكية الفكرية",
    text: "جميع محتويات الموقع من نصوص وتصاميم وشعارات وصور محمية بحقوق الملكية الفكرية، ولا يجوز استخدامها أو إعادة استخدامها دون إذن مسبق من إدارة الموقع.",
  },
  {
    title: "حدود المسؤولية",
    text: "لا يتحمل الموقع مسؤولية أي اتفاق يتم بين المستخدمين خارج المنصة، كما لا يتحمل أي خسائر ناتجة عن سوء استخدام المعلومات أو التعاملات المباشرة بين الأطراف.",
  },
  {
    title: "تعليق أو إيقاف الحسابات",
    text: "يحق لإدارة الموقع تعليق أو إيقاف أي حساب يخالف شروط الاستخدام أو يقوم بنشر معلومات مضللة أو إساءة استخدام خدمات الموقع.",
  },
  {
    title: "تعديل الشروط والأحكام",
    text: "يحق لإدارة الموقع تعديل هذه الشروط في أي وقت بما يتناسب مع تطوير الخدمات أو التغييرات التنظيمية، ويعتبر استمرار استخدام الموقع موافقة على التحديثات.",
  },
  {
    title: "التواصل معنا",
    text: "في حال وجود أي استفسار حول الشروط والأحكام يمكنكم التواصل معنا عبر صفحة تواصل معنا داخل الموقع.",
  },
];

export default function TermsAndConditions() {
  return (
    <main dir="rtl" className="bg-white px-4 py-8 text-right sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-slate-300 pb-5 sm:pb-6">
          <div className="mb-4 flex items-center gap-3 text-[#2B65B3]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B65B3] text-white">
              <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold sm:text-base">{t("الشروط والأحكام")}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{t("الشروط والأحكام")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t("\n            باستخدامك للموقع وخدماته العقارية المقدمة، فإنك توافق على الالتزام بالشروط والأحكام الموضحة في هذه الصفحة. يرجى قراءتها بعناية قبل استخدام الموقع.\n          ")}</p>
        </header>

        <div>
          {termsSections.map((section) => (
            <section key={section.title} className="border-b border-slate-300 py-5 sm:py-6">
              <h2 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t(section.title)}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t(section.text)}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
