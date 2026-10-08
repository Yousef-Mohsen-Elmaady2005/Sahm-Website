import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import PropertySidebar from "../Component/PropertySidebar";
import PropertiesSection from "../Component/ourproperties";
import {
  getAqars,
  getAqarStatuses,
  getAqarTypes,
  getAqarNatures,
  getAreas,
  getAreaChildren,
} from "../api/auth";
import { t, useLanguage } from "../i18n";
import { getLocalizedPropertyLocation } from "../utils/localizedAreas";

const asArray = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
};
const titleOf = (item) => item?.title ?? item?.name ?? "";
const priceOf = (item) => Number(item?.final_price ?? item?.price) || 0;
const normalize = (value = "") => value.toLocaleLowerCase("ar").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").trim();
const isLandProperty = (item) => [item?.aqar_type_title, item?.aqar_type, item?.type_title, item?.aqar_status_title, item?.aqar_status, item?.status_title]
  .some((value) => normalize(String(value || "")).includes("ارض"));
const findByTitle = (items, title) => {
  const normalizedTitle = normalize(title || "");
  if (!normalizedTitle) return undefined;
  return items.find((item) => normalize(titleOf(item)) === normalizedTitle)
    || items.find((item) => normalize(titleOf(item)).includes(normalizedTitle));
};
const getItems = (response) => {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
};

function RealEstate() {
  const { language } = useLanguage();
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialMode = queryParams.get("mode") || "";
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState(queryParams.get("q") || "");
  const [selectedLocation, setSelectedLocation] = useState(queryParams.get("location") || "كل المواقع");
  const [selectedPropertyType, setSelectedPropertyType] = useState(queryParams.get("type") || "كل الأنواع");
  const [selectedStatuses, setSelectedStatuses] = useState(() => queryParams.getAll("status"));
  const [selectedRooms] = useState(queryParams.get("rooms") || "");
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [priceRangeMax, setPriceRangeMax] = useState(0);
  const [properties, setProperties] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [natures, setNatures] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [typesResponse, statusesResponse, naturesResponse, areasResponse] = await Promise.all([
          getAqarTypes(), getAqarStatuses(), getAqarNatures(), getAreas(),
        ]);
        const loadedTypes = asArray(typesResponse);
        const loadedStatuses = asArray(statusesResponse);
        const loadedNatures = asArray(naturesResponse);
        const parents = asArray(areasResponse);
        const childResponses = await Promise.all(
          parents.filter((area) => area.has_child).map((area) => getAreaChildren(area.id).catch(() => null))
        );
        const childLocations = childResponses.flatMap((response) => asArray(response));
        const allLocations = [...parents, ...childLocations];
        const landStatus = loadedStatuses.find((item) => normalize(titleOf(item)).includes("ارض"));
        const initialParams = {};
        const initialSearch = queryParams.get("q")?.trim();
        if (initialSearch) initialParams.search = initialSearch;
        const initialType = loadedTypes.find((item) => String(item.id) === queryParams.get("type_id"))
          || findByTitle(loadedTypes, queryParams.get("type"));
        if (initialType) initialParams.aqar_type = initialType.id;
        const initialLocation = allLocations.find((item) => String(item.id) === queryParams.get("location_id"))
          || findByTitle(allLocations, queryParams.get("location"));
        if (initialLocation) {
          if (initialLocation.has_child) initialParams.area_parent_id = initialLocation.id;
          else initialParams.area_id = initialLocation.id;
        }
        const modeStatus = initialMode === "sell" ? "بيع" : initialMode === "rent" ? "إيجار" : "";
        const wantedStatus = queryParams.get("status") || modeStatus;
        const initialStatus = findByTitle(loadedStatuses, wantedStatus);
        if (initialStatus) initialParams.aqar_status = initialStatus.id;
        const contractingType = loadedTypes.find((item) => normalize(titleOf(item)).includes("مقاول"));
        const contractingNature = loadedNatures.find((item) => normalize(titleOf(item)).includes("مقاول"));
        if (initialMode === "contracting") {
          if (contractingType) initialParams.aqar_type = contractingType.id;
          else if (contractingNature) initialParams.aqar_nature = contractingNature.id;
          else if (!initialSearch) initialParams.search = "مقاولات";
        }
        if (selectedRooms) initialParams.room_no = selectedRooms;
        const listingResponse = await getAqars(initialParams);
        if (!active) return;
        setTypes(loadedTypes);
        setStatuses(loadedStatuses);
        setNatures(loadedNatures);
        setLocations(allLocations);
        if (initialType) setSelectedPropertyType(titleOf(initialType));
        else if (initialMode === "contracting" && contractingType) setSelectedPropertyType(titleOf(contractingType));
        if (initialLocation) setSelectedLocation(titleOf(initialLocation));
        if (wantedStatus && initialStatus) setSelectedStatuses([titleOf(initialStatus)]);
        else if (initialMode === "land" && landStatus) setSelectedStatuses([titleOf(landStatus)]);
        if (initialMode === "contracting" && !initialSearch && !contractingType && !contractingNature) setSearchTerm("مقاولات");
        const initialProperties = getItems(listingResponse);
        setPriceRangeMax(Math.max(0, ...initialProperties.map(priceOf)));
        setProperties(initialProperties.filter((item) =>
          (initialMode !== "land" || isLandProperty(item))
          && (!selectedRooms || Number(item.room_no) === Number(selectedRooms))
        ));
      } catch {
        if (active) setError("تعذر تحميل العقارات حاليًا. حاول مرة أخرى.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [initialMode, queryParams, selectedRooms, language]);

  const typeOptions = useMemo(() => types.map(titleOf).filter(Boolean), [types]);
  const statusOptions = useMemo(() => statuses.map(titleOf).filter(Boolean), [statuses]);
  const locationOptions = useMemo(() => ["كل المواقع", ...locations.map(titleOf).filter(Boolean)], [locations]);

  const handleApplyFilters = async (filters) => {
    const params = {};
    if (filters.searchTerm.trim()) params.search = filters.searchTerm.trim();
    if (initialMode !== "land" && filters.selectedPropertyType !== "كل الأنواع") {
      const type = types.find((item) => String(item.id) === filters.selectedPropertyType) || findByTitle(types, filters.selectedPropertyType);
      if (type) params.aqar_type = type.id;
    }
    if (filters.selectedLocation !== "كل المواقع") {
      const area = locations.find((item) => String(item.id) === filters.selectedLocation) || findByTitle(locations, filters.selectedLocation);
      if (area) {
        if (area.has_child) params.area_parent_id = area.id;
        else params.area_id = area.id;
      }
    }
    let statusTitle = filters.selectedStatuses[0];
    if (!statusTitle && initialMode && initialMode !== "land" && !filters.showAllStatuses) {
      statusTitle = initialMode === "sell" ? "بيع" : initialMode === "rent" ? "إيجار" : initialMode === "land" ? "قطعة أرض" : "";
    }
    if (initialMode !== "land" && statusTitle) {
      const status = findByTitle(statuses, statusTitle);
      if (status) params.aqar_status = status.id;
    }
    if (initialMode === "contracting") {
      const contractingType = types.find((item) => normalize(titleOf(item)).includes("مقاول"));
      const contractingNature = natures.find((item) => normalize(titleOf(item)).includes("مقاول"));
      if (contractingType) params.aqar_type = contractingType.id;
      else if (contractingNature) params.aqar_nature = contractingNature.id;
      else if (!filters.searchTerm.trim()) params.search = "مقاولات";
    }
    if (selectedRooms) params.room_no = selectedRooms;
    // Apply the minimum-price boundary locally below. The API's `from_price`
    // filter can exclude a property priced exactly at the selected minimum.
    setLoading(true);
    setError("");
    try {
      const response = await getAqars(params);
      setProperties(getItems(response).filter((item) =>
        (initialMode !== "land" || isLandProperty(item))
        && (!selectedRooms || Number(item.room_no) === Number(selectedRooms))
        && priceOf(item) >= Number(filters.minimumPrice || 0)
      ));
    } catch {
      setError("تعذر تحميل العقارات المطابقة للفلاتر.");
    } finally {
      setLoading(false);
    }
  };

  const visibleProperties = properties.map((item) => ({
    id: item.id,
    image: item.image || "",
    price: priceOf(item),
    title: item.title || "عقار",
    propertyType: item.aqar_type_title || item.type_title || "",
    propertyStatus: item.aqar_status_title || item.status_title || "",
    location: getLocalizedPropertyLocation(item, locations),
    area: item.space ?? "—",
    baths: item.bathroom_no ?? 0,
    rooms: item.room_no ?? 0,
  }));

  const toggleStatus = (status) => setSelectedStatuses(status === "كل الحالات" ? [] : [status]);

  return (
    <main className="min-h-[75vh] bg-gray-50 py-6 sm:py-8 lg:py-10">
      <div className="mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] flex-col items-stretch gap-5 sm:w-[90%] lg:flex-row lg:items-start lg:gap-6">
        <PropertySidebar
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          locationOptions={locationOptions} selectedLocation={selectedLocation} onLocationChange={setSelectedLocation}
          propertyTypeOptions={typeOptions} selectedPropertyType={selectedPropertyType} onPropertyTypeChange={setSelectedPropertyType}
          propertyStatusOptions={statusOptions} selectedStatuses={selectedStatuses} onStatusChange={toggleStatus}
          priceRangeMax={priceRangeMax} selectedMinimumPrice={minimumPrice} onPriceChange={setMinimumPrice}
          onApplyFilters={handleApplyFilters}
        />
        <section className="min-w-0 flex-1">
          <div className="mb-2 flex flex-col gap-3 px-1 sm:px-2 md:flex-row md:items-center md:justify-between">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{t("نتائج البحث: ")}<span className="text-[#419e8e]">{visibleProperties.length}{t(" عقار")}</span></h1>
            <div className="flex items-center gap-1.5" dir="ltr">
              <button type="button" onClick={() => setViewMode("list")} aria-label={t("عرض قائمة")} aria-pressed={viewMode === "list"} className={`flex h-11 w-[46px] items-center justify-center rounded-md border ${viewMode === "list" ? "border-[#419e8e] text-[#419e8e]" : "border-slate-300 text-slate-600"}`}><FontAwesomeIcon icon={faBars} /></button>
              <button type="button" onClick={() => setViewMode("grid")} aria-label={t("عرض شبكي")} aria-pressed={viewMode === "grid"} className={`flex h-11 w-[46px] items-center justify-center rounded-md border ${viewMode === "grid" ? "border-[#419e8e] text-[#419e8e]" : "border-slate-300 text-slate-600"}`}><FontAwesomeIcon icon={faTableCellsLarge} /></button>
              <div className="relative min-w-0 flex-1 md:w-[344px] md:flex-none">
                <select
                  value={selectedStatuses[0] || t("كل الحالات")}
                  onChange={(event) => {
                    const showAllStatuses = event.target.value === "كل الحالات";
                    const nextStatuses = showAllStatuses ? [] : [event.target.value];
                    setSelectedStatuses(nextStatuses);
                    handleApplyFilters({
                      searchTerm,
                      selectedPropertyType,
                      selectedLocation,
                      selectedStatuses: nextStatuses,
                      minimumPrice,
                      showAllStatuses,
                    });
                  }}
                  aria-label={t("تصفية حسب حالة العقار")}
                  className="h-11 w-full appearance-none rounded-md border border-slate-300 bg-white px-4 pl-10 text-right text-sm text-slate-900 outline-none focus:border-[#419e8e] focus:ring-1 focus:ring-[#419e8e]"
                >
                  <option value="كل الحالات">{t("الكل")}</option>
                  {statusOptions.map((status) => <option key={status} value={status}>{t(status)}</option>)}
                </select>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">⌄</span>
              </div>
            </div>
          </div>
          {loading ? <p className="py-12 text-center text-slate-600">{t("جاري تحميل العقارات...")}</p> : error ? <p role="alert" className="py-12 text-center text-red-600">{error}</p> : <PropertiesSection showHeading={false} viewMode={viewMode} compact propertyItems={visibleProperties} />}
        </section>
      </div>
    </main>
  );
}

export default RealEstate;
