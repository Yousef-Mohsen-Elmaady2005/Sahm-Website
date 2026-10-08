import { getLanguage, t } from "../i18n";

const PLACE_NAME = "سمارت فيجن لتصميم وبرمجة المواقع المنصورة";

// الأفضل تحط هنا لينك الـ embed بتاعك (Google Maps > Share > Embed a map > انسخ الـ src)
// لو سيبته فاضي هيدور على اسم المكان تلقائياً
export default function LocationMap({ src, title }) {
  const mapSrc = src || `https://www.google.com/maps?q=${encodeURIComponent(t(PLACE_NAME))}&hl=${getLanguage()}&z=15&output=embed`;
  return (
    <section
      dir="rtl"
      className="w-full bg-[#fcfcfc] px-3 pb-8 xs:px-4 sm:px-6 sm:pb-10 md:px-8 md:pb-12 lg:px-12 lg:pb-16 xl:px-16"
    >
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 sm:rounded-3xl">
        <div className="relative w-full aspect-[4/3] min-h-[280px] sm:aspect-[16/10] sm:min-h-[320px] md:aspect-[16/8] md:min-h-[360px] lg:aspect-auto lg:h-[430px] xl:h-[480px] 2xl:h-[520px]">
          <iframe
            title={title || t("موقعنا على الخريطة")}
            src={mapSrc}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 block h-full w-full border-0"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
