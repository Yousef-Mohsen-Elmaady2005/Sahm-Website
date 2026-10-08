import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { getLanguage, t } from "../i18n";
import ValidatedForm from "./ValidatedForm";

function FilterSection({
  title,
  options,
  selected,
  onChange,
  initiallyOpen = false,
  inputType = "checkbox",
  inputName,
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <section className="border-b border-slate-200 last:border-b-0">
      <div className="flex min-h-[56px] items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center justify-between text-right text-base font-semibold text-slate-900"
        >
          <span>{title}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={`${isOpen ? "إغلاق" : "فتح"} ${title}`}
          aria-expanded={isOpen}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-800 transition hover:border-teal-600 hover:text-teal-700"
        >
          <FontAwesomeIcon icon={isOpen ? faMinus : faPlus} className="h-3 w-3" />
        </button>
      </div>

      {isOpen && (
        <div className="pb-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex min-h-[50px] cursor-pointer items-center justify-between gap-3 border-b border-slate-200 px-1 text-sm text-slate-700 last:border-b-0"
            >
              <span>{t(option)}</span>
              <input
                type={inputType}
                name={inputName}
                checked={inputType === "radio" ? selected === option : selected.includes(option)}
                onChange={() => onChange(option)}
                className="h-4 w-4 cursor-pointer accent-[#2463bd]"
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PropertySidebar({
  searchTerm = "",
  onSearchChange,
  locationOptions = [],
  selectedLocation = "كل المواقع",
  onLocationChange,
  propertyTypeOptions = [],
  selectedPropertyType = "كل الأنواع",
  onPropertyTypeChange,
  propertyStatusOptions = [],
  selectedStatuses = [],
  onStatusChange,
  priceRangeMax = 0,
  selectedMaxPrice = priceRangeMax,
  selectedMinimumPrice = 0,
  onPriceChange,
  onApplyFilters,
}) {
  const [submittedFilters, setSubmittedFilters] = useState(null);
  const pricePercentage = priceRangeMax ? (selectedMinimumPrice / priceRangeMax) * 100 : 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    const filters = {
      searchTerm,
      selectedLocation,
      selectedPropertyType,
      selectedStatuses,
      minimumPrice: selectedMinimumPrice,
    };
    onApplyFilters(filters);
    setSubmittedFilters(filters);
  };

  return (
    <aside className="w-full min-w-0 rounded-[18px] border border-slate-200 bg-white p-3 sm:p-4 lg:w-[320px] lg:shrink-0">
      <ValidatedForm onSubmit={handleSubmit}>
        <label className="flex h-11 items-center gap-2.5 rounded-[10px] border border-slate-200 px-3 text-slate-700 focus-within:border-teal-600">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-slate-700" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("إبحث ...")}
            aria-label={t("ابحث عن عقار")}
            className="min-w-0 flex-1 bg-transparent text-right text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-2">
          <FilterSection
            title={t("أين")}
            options={locationOptions}
            selected={selectedLocation}
            onChange={onLocationChange}
            initiallyOpen
            inputType="radio"
            inputName="property-location"
          />
          <FilterSection
            title={t("نوع العقار")}
            options={["كل الأنواع", ...propertyTypeOptions]}
            selected={selectedPropertyType}
            onChange={onPropertyTypeChange}
            inputType="radio"
            inputName="property-type"
          />
          <FilterSection
            title={t("حالة العقار")}
            options={[t("كل الحالات"), ...propertyStatusOptions]}
            selected={selectedStatuses[0] || t("كل الحالات")}
            onChange={onStatusChange}
            inputType="radio"
            inputName="property-status"
          />
        </div>

        <fieldset className="mt-2">
          <legend className="mb-3 w-full text-base font-semibold text-slate-900">{t("\n            السعر يبدأ من\n          ")}</legend>
          <input
            type="range"
            min="0"
            max={priceRangeMax || 1}
            step="1"
            value={selectedMinimumPrice}
            onChange={(event) => onPriceChange(Number(event.target.value))}
            aria-label={t("الحد الأدنى للسعر")}
            dir="rtl"
            style={{
              background: `linear-gradient(to left, #2463bd 0%, #2463bd ${pricePercentage}%, #e5e7eb ${pricePercentage}%, #e5e7eb 100%)`,
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#2463bd]"
          />
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600" dir="ltr">
            <span>{priceRangeMax.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</span>
            <span>{selectedMinimumPrice.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</span>
            <span>0</span>
          </div>
        </fieldset>

        <button
          type="submit"
          className="group relative mt-4 flex h-8 w-full items-center justify-center overflow-hidden rounded-md bg-[#419e8e] text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
        >
          <span className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"></span>
          <span className="relative z-10">{t("تصفية")}</span>
        </button>
        {submittedFilters && (
          <p role="status" className="mt-3 text-center text-sm text-teal-800">{t("\n            تم تحديث معايير البحث\n          ")}</p>
        )}
      </ValidatedForm>
    </aside>
  );
}
