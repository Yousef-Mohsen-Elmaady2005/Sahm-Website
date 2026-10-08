import React from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { useCompare } from "../context/CompareContext";
import { t, useLanguage } from "../i18n";

function PropertyCard({ property, isList, compact, language }) {
  const navigate = useNavigate();
  const { isFavorite, isPending, toggle } = useFavorites();
  const comparison = useCompare();
  const favorite = isFavorite(property.id);
  const compared = comparison.isCompared(property.id);
  const translatedLocationParts = useMemo(() => {
    const parts = Array.isArray(property.location)
      ? property.location
      : typeof property.location === "string"
        ? property.location.split(/\s+-\s+/)
        : [property.location];
    return parts.filter(Boolean);
  }, [property.location, language]);

  return (
    <article
      dir="rtl"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title } })}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title } }); } }}
      aria-label={`${t("عرض تفاصيل ")}${property.title}`}
      className={`w-full cursor-pointer ${isList ? "min-[520px]:flex min-[520px]:max-w-[860px] min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-4" : compact ? "max-w-none" : "max-w-[400px]"} ${compact ? "justify-self-center" : "justify-self-start"} rounded-[18px] bg-[#f7f7f7] px-3 py-3 ${compact ? "min-[520px]:px-4 min-[520px]:py-3" : "sm:px-5 sm:py-4"}`}
    >
      {/* الصورة + الهافر أوفرلاي */}
      <div
        className={`group relative overflow-hidden rounded-[18px] ${
          isList ? "aspect-[16/9] min-[520px]:w-[42%] min-[520px]:shrink-0" : "aspect-[2/1]"
        }`}
      >
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : null}
 
        {/* الأوفرلاي عند الهافر */}
        <div className="absolute inset-0 flex flex-row-reverse items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:gap-[56px]">
          <button
            type="button"
            aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            aria-pressed={favorite}
            disabled={isPending(property.id)}
            onClick={(event) => { event.stopPropagation(); toggle(property); }}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-60 md:h-11 md:w-11 ${
              favorite
                ? "bg-white text-[#419e8e] hover:bg-white"
                : "bg-black/80 text-white hover:bg-black"
            }`}
          >
            <i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart text-lg md:text-xl`}></i>
          </button>
 
          <button
            type="button"
            aria-label={t("مقارنة")}
            aria-pressed={compared}
            disabled={comparison.isPending(property.id)}
            onClick={(event) => { event.stopPropagation(); comparison.toggle(property); }}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition disabled:opacity-60 md:h-11 md:w-11 ${compared ? "bg-[#419e8e]" : "bg-black/80 hover:bg-black"}`}
          >
            <i className="fa-solid fa-right-left text-lg md:text-xl"></i>
          </button>
 
          <button
            type="button"
            aria-label={t("مشاركة")}
            onClick={(event) => event.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black md:h-11 md:w-11"
          >
            <i className="fa-solid fa-arrow-up-from-bracket text-lg md:text-xl"></i>
          </button>
        </div>
 
        {/* بادج المساحة */}
        <div className={`absolute top-3 right-3 bg-white/90 text-gray-800 ${compact ? "text-xs" : "text-sm"} font-semibold px-3 py-1 rounded-full flex items-center gap-1`}>
          <i className="fa-solid fa-ruler-combined text-xs"></i>
          {t(property.area)}
        </div>
      </div>
 
      {/* بيانات العقار */}
      <div className={`pt-4 ${isList ? "min-[520px]:flex-1 min-[520px]:py-4 min-[520px]:pt-0" : ""}`} dir="rtl">
        <span className={`font-bold text-blue-600 ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
          ${property.price}
        </span>
        <h3 className={`mt-1 font-bold text-gray-900 ${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
          {property.title}
        </h3>
        <p className={`text-gray-500 flex items-center gap-1 mt-1 ${compact ? "text-xs" : "text-sm"}`}>
          <i className="fa-solid fa-location-dot"></i>
          {translatedLocationParts.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 ? " - " : ""}{part}
            </span>
          ))}
        </p>
 
        <div className={`mt-3 flex flex-row-reverse flex-wrap items-center justify-end gap-x-2 gap-y-2 pt-2 text-gray-600 sm:gap-x-6 ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-ruler-combined"></i>
            {t(property.area)}
          </span>
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-bath"></i>
            {property.baths}{t(" دورة مياة\n          ")}</span>
          <span className="flex items-center gap-1">
            <i className="fa-solid fa-bed"></i>
            {property.rooms}{t(" غرفة\n          ")}</span>
        </div>
      </div>
    </article>
  );
}
 
export default function PropertiesSection({
  showHeading = true,
  viewMode = "grid",
  compact = false,
  propertyItems = [],
}) {
  const { language } = useLanguage();
  return (
    <section dir="rtl" className={compact ? "bg-gray-50 px-1 py-5 sm:px-4 sm:py-8" : "bg-gray-50 px-6 py-12"}>
      <div className="mx-auto min-w-0 max-w-6xl">
        {showHeading && (
          <>
            <h2 className={`font-bold text-gray-900 ${compact ? "text-2xl" : "text-3xl"}`}>{t("عقارتنا")}</h2>
            <p className="text-gray-500 mt-2 max-w-2xl">{t("\n              وعند موافقه العميل المبدئيه على التصميم يتم ازالة هذا النص من التصميم ويتم وضع النصوص النهائية\n            ")}</p>
          </>
        )}
 
        <div className={`${compact ? "mx-auto mt-6 gap-3" : "mt-8 gap-4"} grid w-full ${viewMode === "list" ? "grid-cols-1" : compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
          {propertyItems.length > 0 ? (
            propertyItems.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isList={viewMode === "list"}
                compact={compact}
                language={language}
              />
            ))
          ) : (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">{t("\n              لا توجد عقارات في الموقع المحدد\n            ")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
 
