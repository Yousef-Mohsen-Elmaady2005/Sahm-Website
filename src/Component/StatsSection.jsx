import React from "react";
import { t } from "../i18n";

const stats = [
  {
    icon: "fa-solid fa-city",
    value: 9,
    label: "مبيعات",
    withStars: false,
  },
  {
    icon: "fa-solid fa-building-lock",
    value: 1,
    label: "بيع",
    withStars: false,
  },
  {
    icon: "fa-solid fa-building-lock",
    value: 0,
    label: "إيجار",
    withStars: false,
  },
  {
    icon: "fa-solid fa-user",
    value: 135,
    label: "عملاء سعداء",
    withStars: true,
  },
];

export default function StatsSection() {
  return (
    <div dir="rtl" className="w-full bg-white px-4 py-6 sm:px-6 sm:py-8 md:p-10">
      <div className="bg-gray-100 rounded-xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center"
          >
            <i
              className={`${stat.icon} text-emerald-600 text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2`}
            ></i>

            {stat.withStars && (
              <div className="flex gap-0.5 sm:gap-1 mb-1 sm:mb-2 text-emerald-600 text-[10px] sm:text-xs">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            )}

            <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mb-0.5 sm:mb-1">
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm text-gray-600">
              {t(stat.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
