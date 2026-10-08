import React, { useRef } from "react";
import sec3 from "../photo/sec3.png";
import RichText from "./RichText";
import { t } from "../i18n";

function TiltImage({ src, alt, children }) {
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const centerX = rect.width / 2;

    const rotateY = -((x - centerX) / centerX) * 15;

    tiltRef.current.style.transform = `perspective(1000px) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      tiltRef.current.style.transform = "none";
      return;
    }
    if (window.innerWidth < 1024) {
      tiltRef.current.style.transform = "none";
      return;
    }
    tiltRef.current.style.transform =
      "perspective(1000px) rotateY(8deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="[perspective:1000px] w-full"
    >
      <div
        ref={tiltRef}
        className="relative transition-transform duration-200 ease-out will-change-transform lg:[transform:perspective(1000px)_rotateY(8deg)]"
      >
        <img
          src={src}
          alt={alt}
          className="block w-full aspect-[4/5] object-cover rounded-2xl sm:rounded-3xl shadow-xl"
        />
        {children}
      </div>
    </div>
  );
}

const services = [
  "بيع وشراء العقارات السكنية والتجارية",
  "تأجير الشقق والفلل والوحدات التجارية",
  "تسويق العقارات للملاك والمستثمرين",
  "إدارة الأملاك العقارية",
  "تقديم استشارات عقارية",
  "عرض فرص استثمار عقاري مميزة",
];

function InfoBlock({ title, children, isLast }) {
  return (
    <div className={`py-5 sm:py-6 ${!isLast ? "border-b border-gray-200" : ""}`}>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h3>
      <div className="mt-3 text-sm sm:text-base text-gray-600 leading-7">{children}</div>
    </div>
  );
}

export default function VisionMissionSection({ contentHtml, imageSrc }) {
  return (
    <section dir="rtl" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col items-center lg:items-start gap-12 sm:gap-14 lg:flex-row-reverse">
        {/* الصورة والبادجات */}
        <div className="w-full lg:w-[38%] flex justify-center">
          <div className="relative w-full max-w-[18rem] sm:max-w-[22rem] lg:max-w-[25rem] mb-6 sm:mb-8 lg:mb-0">
            <TiltImage src={imageSrc || sec3} alt={t("عقار مميز")}>
              {/* بادج إيجار */}
              <div className="absolute top-10 sm:top-14 lg:top-16 -left-3 sm:-left-5 lg:-left-6 rounded-lg sm:rounded-xl bg-teal-500/90 px-2.5 sm:px-3.5 lg:px-4 py-1.5 sm:py-2 text-center text-white shadow-lg">
                <span className="block text-sm sm:text-base lg:text-lg font-bold leading-none">0+</span>
                <span className="mt-1 block text-[10px] sm:text-xs">{t("إيجار")}</span>
              </div>

              {/* بادج بيع */}
              <div className="absolute top-1/2 -right-3 sm:-right-5 lg:-right-6 rounded-lg sm:rounded-xl bg-blue-600/90 px-2.5 sm:px-3.5 lg:px-4 py-1.5 sm:py-2 text-center text-white shadow-lg">
                <span className="block text-sm sm:text-base lg:text-lg font-bold leading-none">1+</span>
                <span className="mt-1 block text-[10px] sm:text-xs">{t("بيع")}</span>
              </div>

              {/* بادج عميل */}
              <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 rounded-lg sm:rounded-xl bg-white/80 px-3.5 sm:px-4.5 lg:px-5 py-1.5 sm:py-2 text-center text-blue-600 shadow-lg">
                <span className="block text-sm sm:text-base lg:text-lg font-bold leading-none">135+</span>
                <span className="mt-1 block text-[10px] sm:text-xs">{t("عميل")}</span>
              </div>
            </TiltImage>
          </div>
        </div>

        {/* النصوص */}
        <div className="flex-1 w-full text-right">
          {contentHtml ? (
            <RichText html={contentHtml} className="text-sm sm:text-base" />
          ) : <>
          <InfoBlock title={t("رؤيتنا")}>
            <p>{t("\n              نطمح نكون من الجهات العقارية الموثوقة في السوق، ونقدم خدمات\n              تساعد عملاءنا يحصلون على أفضل الفرص العقارية بكل سهولة واطمئنان.\n            ")}</p>
          </InfoBlock>

          <InfoBlock title={t("رسالتنا")}>
            <p>{t("\n              تقديم خدمات عقارية باحترافية عالية تساعد عملاءنا يتخذون القرار\n              الصحيح، مع توفير معلومات واضحة وخيارات مناسبة تضمن تجربة مريحة\n              في البيع أو الشراء أو التأجير.\n            ")}</p>
          </InfoBlock>

          <InfoBlock title={t("خدماتنا")}>
            <p>{t("نقدم مجموعة خدمات عقارية متكاملة تشمل:")}</p>
            <ul className="mt-3 space-y-1.5 text-right list-disc pr-5">
              {services.map((service) => (
                <li key={service}>{t(service)}</li>
              ))}
            </ul>
          </InfoBlock>

          <InfoBlock title={t("ليه تختار سهمر للعقارات؟")} isLast>
            <p>{t("\n              لأننا نركز على فهم احتياج العميل أولًا، ونحرص نوفر أفضل\n              الخيارات العقارية، مع متابعة كل خطوات الصفقة لضمان تجربة مريحة\n              وآمنة.\n            ")}</p>
          </InfoBlock>
          </>}
        </div>
      </div>
    </section>
  );
}
