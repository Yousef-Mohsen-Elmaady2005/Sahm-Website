import React from "react";
import { Link } from "react-router-dom";
import garden from "../photo/garden.png";
import { t } from "../i18n";

export default function ContractingCTASection() {
  return (
    <section dir="rtl" className="px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-[14px] bg-[#e3f0ee] px-5 py-8 sm:gap-8 sm:px-8 sm:py-10 md:min-h-[430px] md:flex-row-reverse md:justify-between md:gap-10 md:px-10 lg:px-14">
        {/* الصورة */}
        <div className="w-full max-w-[280px] flex-shrink-0 sm:max-w-[380px] md:max-w-[450px] lg:max-w-[550px] xl:max-w-[600px]">
          <img
            src={garden}
            alt={t("طلب مقاولات")}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* النص والزرار */}
        <div className="flex-1 text-center md:text-right">
          <h2 className="text-lg font-bold leading-snug text-gray-900 sm:text-xl md:text-2xl lg:text-3xl">{t("\n            لطلب المقاولات يمكن زيارة الصفحة أدناه\n          ")}</h2>
          <p className="mt-3 text-sm text-gray-500 sm:mt-4 sm:text-base md:text-lg">{t("\n            يمكنك طلب مقاولة عن طريق إضافة البيانات الخاصة بك وإرسالها وتنتظر الرد في أقرب وقت\n          ")}</p>

          <Link
            to="/add-contracting"
            className="group relative mt-5 inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-[#419e8e] px-5 py-3 text-sm font-semibold text-white sm:mt-6 sm:w-auto sm:px-6 sm:text-base"
          >
            <span className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100"></span>
            <span className="relative flex items-center gap-3">
              <i className="fa-solid fa-arrow-left"></i>{t("\n              الذهاب للصفحة\n            ")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}