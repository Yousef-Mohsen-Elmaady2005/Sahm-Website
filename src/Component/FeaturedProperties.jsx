import React from "react";
import { useNavigate } from "react-router-dom";
import { t } from "../i18n";
 
const services = [
  {
    title: "بيع",
    icon: "fa-solid fa-house",
    mode: "sell",
  },
  {
    title: "إيجار",
    icon: "fa-solid fa-house-user",
    mode: "rent",
  },
  {
    title: "قطعة أرض",
    icon: "fa-solid fa-house-circle-check",
    mode: "land",
  },
  {
    title: "مقاولات",
    icon: "fa-solid fa-house-circle-check",
    mode: "contracting",
  },
];
 
export default function ServicesSection() {
  const navigate = useNavigate();

  return (
    <section dir="rtl" className="bg-gray-50 py-16">
      <div className="mx-auto w-[90%] text-center">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{t("\n          خدماتنا\n        ")}</h2>
        <p className="text-gray-500 mb-12 text-sm md:text-base">{t("\n          وعند موافقه العميل المبدئيه على التصميم يتم ازالة هذا النص من\n          التصميم ويتم وضع النصوص النهائية\n        ")}</p>
 
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <button
              key={service.mode}
              type="button"
              onClick={() => navigate(`/real-estate?mode=${service.mode}`)}
              className="group relative flex min-h-[225px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-b-4 border-teal-500 bg-white p-8 text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              aria-label={`${t("عرض العقارات: ")}${t(service.title)}`}
            >
              {/* Fill effect from bottom to top */}
              <span className="absolute inset-x-0 bottom-0 h-0 bg-teal-600 transition-all duration-500 ease-out group-hover:h-full -z-0"></span>
 
              {/* Content stays above the fill */}
              <div className="relative z-10 w-20 h-20 rounded-xl flex items-center justify-center mb-6 bg-teal-600">
                <i className={`${service.icon} text-3xl text-white`}></i>
              </div>
              <h3 className="relative z-10 text-xl font-semibold transition-colors duration-300 group-hover:text-white">
                {t(service.title)}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
 
