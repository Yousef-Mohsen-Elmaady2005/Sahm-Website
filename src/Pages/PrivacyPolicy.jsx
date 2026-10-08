
import { t } from "../i18n";

const sections = [
  {
    title: "المعلومات التي نقوم بجمعها",
    intro: "نجمع بعض المعلومات التي تساعدنا على تقديم خدماتنا والتواصل معك، مثل:",
    points: [
      "الاسم",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "بيانات العقار المطلوب أو المعروض",
      "أي معلومات أخرى تضيفها عند التواصل أو استخدام الخدمة",
    ],
    ending: "نستخدم هذه المعلومات لتقديم خدمة أفضل، ولا نجمع إلا ما يلزم لذلك.",
  },
  {
    title: "كيفية استخدام المعلومات",
    intro: "نستخدم المعلومات التي نجمعها من أجل:",
    points: [
      "التواصل معك بخصوص طلباتك",
      "تحسين خدماتنا وتجربة المستخدم",
      "تقديم الدعم والخدمات العقارية المناسبة",
      "تسهيل عملية البحث والتواصل",
      "حماية المنصة من الاستخدام غير المناسب",
      "تطوير خدماتنا بشكل مستمر",
    ],
    ending: "لا نقوم ببيع بياناتك الشخصية أو مشاركتها مع أطراف خارجية لأغراض تسويقية.",
  },
  {
    title: "حماية المعلومات",
    text: "نحرص على اتخاذ الإجراءات الفنية والتنظيمية المناسبة لحماية بيانات المستخدمين ومنع الوصول إليها أو استخدامها بشكل غير مصرح به.",
  },
  {
    title: "مشاركة المعلومات",
    text: "قد تتم مشاركة المعلومات الضرورية مع مقدم الخدمة عند طلبك ذلك، وبالقدر اللازم لإتمام التواصل أو تقديم الخدمة المطلوبة.",
  },
  {
    title: "ملفات تعريف الارتباط (Cookies)",
    text: "قد نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم، وفهم طريقة استخدام الموقع، وتقديم الخدمات بصورة أفضل.",
  },
  {
    title: "روابط المواقع الخارجية",
    text: "قد يحتوي الموقع على روابط لمواقع خارجية. لا نتحكم في سياسات الخصوصية أو محتوى تلك المواقع، لذلك ننصح بمراجعة سياسة الخصوصية الخاصة بكل موقع تزوره.",
  },
  {
    title: "تحديث سياسة الخصوصية",
    text: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة، ويعد استمرارك في استخدام الموقع بعد نشرها قبولًا بالتحديثات.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main dir="rtl" className="bg-white px-4 py-8 text-right sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <p className="border-b border-slate-300 pb-5 text-sm leading-7 text-slate-600 sm:pb-6 sm:text-base sm:leading-8">{t("\n          نولي في سهم اهتمامًا كبيرًا بخصوصية بياناتك الشخصية، ونعمل على حمايتها واستخدامها بمسؤولية. توضح هذه السياسة المعلومات التي نجمعها وكيفية استخدامها وحمايتها عند زيارتك للموقع أو استخدام خدماتنا.\n        ")}</p>

        <div>
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-300 py-5 sm:py-6">
              <h1 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">{t(section.title)}</h1>
              {section.intro && (
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{t(section.intro)}</p>
              )}
              {section.points && (
                <ul className="mt-2 grid gap-x-8 gap-y-1 text-sm leading-7 text-slate-700 sm:grid-cols-2 sm:text-base sm:leading-8">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#399d8e]" />
                      <span>{t(point)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(section.text || section.ending) && (
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  {t(section.text || section.ending)}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
