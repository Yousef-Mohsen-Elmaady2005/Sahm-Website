import React, { useRef } from "react";
import sec3 from "../photo/sec3.png";
import RichText from "./RichText";
import { t } from "../i18n";

function TiltImage({ src, alt }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const centerX = rect.width / 2;

    const rotateY = ((x - centerX) / centerX) * 15;

    imgRef.current.style.transform = `perspective(1000px) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      imgRef.current.style.transform = "none";
      return;
    }
    if (window.innerWidth < 1024) {
      imgRef.current.style.transform = "none";
      return;
    }
    imgRef.current.style.transform =
      "perspective(1000px) rotateY(-8deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="[perspective:1000px] w-full"
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[440px] object-cover rounded-2xl sm:rounded-3xl shadow-xl transition-transform ease-in-out will-change-transform lg:[transform:perspective(1000px)_rotateY(-8deg)]"
      />
    </div>
  );
}

export default function AboutSection({ contentHtml, imageSrc }) {
  return (
    <section dir="rtl" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col-reverse items-center lg:items-start gap-8 sm:gap-10 lg:flex-row-reverse">
        <div className="flex-1 w-full lg:w-[55%] text-right">
          {contentHtml ? (
            <RichText html={contentHtml} className="text-sm sm:text-base" />
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 leading-snug">{t("\n                لا تفوت فرصة الحصول على عقار رائع في الموقع الأمثل لدينا\n              ")}</h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-gray-600 leading-7">
                <p>{t("يعمل لدينا أكثر من 39,000 شخص في أكثر من 70 دولة في جميع أنحاء هذه التغطية العالمية، إلى جانب الخدمات المتخصصة")}</p>
                <p>{t("في ")}<span className="font-bold text-gray-900">{t("سهم للعقارات")}</span>{t(" نهدف إننا نسهّل على عملائنا رحلة البحث عن العقار المناسب، سواء كان سكن لعائلتك، أو فرصة استثمارية، أو موقع مناسب لنشاطك التجاري.")}</p>
                <p>{t("نشتغل بخبرة في السوق العقاري ونسعى دائمًا نوفر خيارات متنوعة تناسب احتياجات وميزانيات عملائنا، مع حرصنا على إن تجربة البيع أو الشراء أو التأجير تكون سهلة وواضحة وآمنة للجميع.")}</p>
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-[40%] flex justify-center">
          <div className="w-full max-w-[20rem] sm:max-w-[24rem] lg:max-w-[26rem]">
            <TiltImage src={imageSrc || sec3} alt={t("عقار مميز")} />
          </div>
        </div>
      </div>
    </section>
  );
}
