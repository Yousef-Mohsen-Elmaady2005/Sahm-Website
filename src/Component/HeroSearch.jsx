import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "../photo/hero.png";
import { getAqarTypes, getAreas, getAreaChildren } from "../api/auth";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";
 
const tabs = [
  { id: "sell", label: "بيع", icon: "fa-solid fa-house" },
  { id: "rent", label: "إيجار", icon: "fa-solid fa-building" },
  { id: "land", label: "قطعة أرض", icon: "fa-solid fa-map-location-dot" },
];
 
export default function HeroSearch() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("sell");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRooms, setSelectedRooms] = useState("");
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();
  const roomCounts = [1, 2, 3, 4];

  useEffect(() => {
    let active = true;
    const items = (response) => {
      const payload = response?.data?.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    };
    Promise.all([getAqarTypes(), getAreas()]).then(async ([typesResponse, areasResponse]) => {
      const parents = items(areasResponse);
      const childrenResponses = await Promise.all(
        parents.filter((area) => area.has_child).map((area) => getAreaChildren(area.id).catch(() => null))
      );
      if (!active) return;
      setPropertyTypes(items(typesResponse).filter((item) => item.id && (item.title || item.name)));
      setLocations([...parents, ...childrenResponses.flatMap(items)].filter((item) => item.id && (item.title || item.name)));
    }).catch(() => {
      if (active) {
        setPropertyTypes([]);
        setLocations([]);
      }
    });
    return () => { active = false; };
  }, [language]);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({ mode: activeTab });
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedType) params.set("type_id", selectedType);
    if (selectedLocation) params.set("location_id", selectedLocation);
    if (selectedRooms) params.set("rooms", selectedRooms);
    navigate(`/real-estate?${params.toString()}`);
  };
 
  return (
    <section
      dir="rtl"
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-0 pb-12 pt-8 sm:pb-20 sm:pt-12"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[rgba(10,10,20,0.33)]"></div>
 
      {/* Content */}
      <div className="relative z-10 w-full px-4 text-center text-white">
        <h1 className="mx-auto mb-3 max-w-5xl px-2 text-2xl font-bold leading-relaxed sm:text-3xl md:text-4xl">{t("\n          لا تفوت فرصة الحصول على عقار رائع في الموقع الأمثل لدينا\n        ")}</h1>
        <p className="mx-auto mb-6 max-w-3xl px-2 text-sm text-gray-200 sm:mb-8 sm:text-base">{t("\n          عند موافقة العميل المبدئية على التصميم يتم ازالة هذا النص من\n          التصميم ويتم وضع النصوص النهائية المطلوبة للتصميم\n        ")}</p>
 
        {/* Tabs */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mb-6 sm:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="group flex items-center gap-2 rounded-md px-1 py-1"
            >
              <span className="text-sm md:text-base">{t(tab.label)}</span>
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? "bg-teal-600"
                      : "bg-white/10 group-hover:bg-white/20"
                  }`}
              >
                <i className={tab.icon}></i>
              </span>
            </button>
          ))}
        </div>
 
        {/* Search Bar */}
        <div className="mx-auto w-[calc(100%-1rem)] lg:w-[85vw] max-w-[1620px] rounded-md bg-white/35 p-3 shadow-xl backdrop-blur-sm">
          <ValidatedForm onSubmit={handleSearch} className="flex flex-col items-stretch gap-3 rounded-md bg-white p-3 md:p-4 lg:flex-row lg:px-5 lg:py-[19px]">
          <input
            type="text"
            placeholder={t("أدخل الكلمات....")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label={t("ابحث بالكلمات")}
            className="h-[58px] min-w-0 flex-1 basis-0 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />

          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} aria-label={t("نوع العقار")} className="h-[58px] min-w-0 flex-1 basis-0 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 outline-none">
            <option value="">{t("إختر النوع")}</option>
            {propertyTypes.map((type) => <option key={type.id} value={type.id}>{t(type.title || type.name)}</option>)}
          </select>

          <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} aria-label={t("موقع العقار")} className="h-[58px] min-w-0 flex-1 basis-0 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 outline-none">
            <option value="">{t("إختر الموقع")}</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{t(location.title || location.name)}</option>)}
          </select>

          {activeTab !== "land" && (
            <select value={selectedRooms} onChange={(event) => setSelectedRooms(event.target.value)} aria-label={t("عدد الغرف")} className="h-[58px] min-w-0 flex-1 basis-0 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 outline-none">
              <option value="">{t("عدد الغرف")}</option>
              {roomCounts.map((rooms) => <option key={rooms} value={rooms}>{rooms}</option>)}
            </select>
          )}
 
          <button type="submit" className="h-[58px] min-w-0 flex-1 basis-0 rounded-md bg-[#419e8e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#378d7f]">{t("\n            إبحث\n          ")}</button>
          </ValidatedForm>
        </div>
      </div>
    </section>
  );
}
    
