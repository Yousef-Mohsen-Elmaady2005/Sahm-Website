import React, { useEffect, useState } from "react";
import { getAqars } from "../api/auth";
import { useLanguage } from "../i18n";
import { useFavorites } from "../context/FavoritesContext";
import { useCompare } from "../context/CompareContext";
import { useNavigate } from "react-router-dom";
import { t } from "../i18n";
import { getLocalizedPropertyLocation, loadLocalizedAreas } from "../utils/localizedAreas";

const getItems = (response) => {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
};

const imageOf = (item) => {
  const image = item.image || item.image_url || item.cover_image || item.thumbnail || item.images?.[0];
  return typeof image === "string" ? image : image?.url || image?.image_url || "";
};

function PinnedRibbon() {
  return (
    <div className="pointer-events-none absolute -top-1 -left-11 z-10 w-40 rotate-[-45deg]">
      <div className="flex items-center justify-center gap-1 bg-blue-700 py-1 text-xs font-bold text-white shadow-md">
        <i className="fa-solid fa-thumbtack text-[10px]"></i>{t("\n        التثبيت\n      ")}</div>
    </div>
  );
}

function PropertyCard({ property }) {
  const navigate = useNavigate();
  const { isFavorite, isPending, toggle } = useFavorites();
  const comparison = useCompare();
  const favorite = isFavorite(property.id);
  const compared = comparison.isCompared(property.id);
  const locationParts = Array.isArray(property.location)
    ? property.location
    : typeof property.location === "string"
      ? property.location.split(/\s+-\s+/)
      : [property.location];

  return (
    <div
      dir="rtl"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title } })}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title } }); } }}
      className="w-full max-w-[440px] cursor-pointer justify-self-start rounded-[20px] bg-[#f7f7f7] px-3 py-3 sm:px-5 sm:py-4"
    >
      {/* الصورة + الهافر أوفرلاي */}
      <div className="group relative aspect-[2/1] overflow-hidden rounded-[18px]">
        {property.pinned && <PinnedRibbon />}

        {property.image ? <img src={property.image} alt={property.title} className="h-full w-full object-cover" /> : null}

        {/* الأوفرلاي عند الهافر */}
        <div className="absolute inset-0 flex flex-row-reverse items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:gap-[56px]">
          <button
            type="button"
            aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            aria-pressed={favorite}
            disabled={isPending(property.id)}
            onClick={(event) => { event.stopPropagation(); toggle(property); }}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60 md:h-[52px] md:w-[52px] ${
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
            className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition disabled:opacity-60 md:h-[52px] md:w-[52px] ${compared ? "bg-[#419e8e]" : "bg-black/80 hover:bg-black"}`}
          >
            <i className="fa-solid fa-right-left text-lg md:text-xl"></i>
          </button>

          <button
            type="button"
            aria-label={t("مشاركة")}
            onClick={(event) => event.stopPropagation()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black md:h-[52px] md:w-[52px]"
          >
            <i className="fa-solid fa-arrow-up-from-bracket text-lg md:text-xl"></i>
          </button>
        </div>

      </div>

      {/* بيانات العقار */}
      <div className="pt-4" dir="rtl">
        <span className="text-base font-bold text-blue-600 sm:text-lg">
          ${property.price}
        </span>
        <h3 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <i className="fa-solid fa-location-dot"></i>
          {locationParts.filter(Boolean).map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 ? " - " : ""}{part}
            </span>
          ))}
        </p>

        <div className="mt-3 flex flex-row-reverse flex-wrap items-center justify-end gap-x-2 gap-y-2 pt-2 text-sm text-gray-600 sm:gap-x-6 sm:text-base">
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
    </div>
  );
}

export default function PropertiesSection() {
  const { language } = useLanguage();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getAqars(), loadLocalizedAreas(language).catch(() => [])]).then(([response, areas]) => {
      if (!active) return;
      const pinnedItems = getItems(response).filter((item) =>
        [item.pinned, item.is_pinned, item.pin].some((value) =>
          value === true || value === 1 || String(value).toLowerCase() === "true" || String(value) === "1",
        ),
      );
      setProperties(pinnedItems.map((item) => ({
        id: item.id,
        image: imageOf(item),
        price: Number(item.final_price ?? item.price) || 0,
        title: item.title || "عقار",
        location: getLocalizedPropertyLocation(item, areas),
        area: item.space ?? "—",
        baths: item.bathroom_no ?? 0,
        rooms: item.room_no ?? 0,
        pinned: true,
      })));
    }).catch(() => {
      if (active) setProperties([]);
    });
    return () => { active = false; };
  }, [language]);

  if (!properties.length) return null;

  return (
    <section dir="rtl" className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900">{t("العقارات المثبتة")}</h2>
        <p className="mt-2 max-w-2xl text-gray-500">{t("\n          وعند موافقه العميل المبدئيه على التصميم يتم ازالة هذا النص من التصميم ويتم وضع النصوص النهائية\n        ")}</p>

        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
