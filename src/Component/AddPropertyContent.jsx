import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faImages } from "@fortawesome/free-solid-svg-icons";
import { deleteImage, getAqar, getAqarNatures, getAqarStatuses, getAqarTypes, getAreas, getAreaChildren, storeAqar, updateAqar } from "../api/auth";
import { showToast } from "../utils/notifications";
import { getImageUrls } from "../utils/media";
import { getLanguage, t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

const normalizeArea = (value) => String(value).replace(/^0+(?=\d)/, "");

const getItems = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
};

const resolvePropertyTypeId = (property, types) => {
  const rawType = property?.aqar_type ?? property?.type ?? property?.property_type;
  const possibleIds = [
    property?.aqar_type_id,
    property?.property_type_id,
    rawType?.id,
    rawType?.aqar_type_id,
    typeof rawType === "number" || /^\d+$/.test(String(rawType ?? "").trim()) ? rawType : null,
  ].filter((value) => value !== null && value !== undefined && value !== "");

  for (const id of possibleIds) {
    const match = types.find((type) => String(type.id) === String(id));
    if (match) return String(match.id);
  }

  const names = [
    typeof rawType === "string" && !/^\d+$/.test(rawType.trim()) ? rawType : null,
    rawType?.title,
    rawType?.name,
    property?.aqar_type_title,
    property?.type_title,
  ].filter(Boolean).map((name) => String(name).trim().toLocaleLowerCase());
  const match = types.find((type) => [type.title, type.name, type.title_ar, type.title_en]
    .filter(Boolean)
    .some((name) => names.includes(String(name).trim().toLocaleLowerCase())));
  return match ? String(match.id) : "";
};

const normalizeLookupText = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670ـ]/g, "")
  .trim()
  .replace(/\s+/g, " ")
  .toLocaleLowerCase();

const getSavedPropertyImages = (property) => {
  const source = property?.images?.data?.data ?? property?.images?.data ?? property?.images;
  const images = Array.isArray(source) ? source : source ? [source] : [];
  const saved = images.map((image, index) => {
    const url = getImageUrls({ images: [image] })[0] || "";
    return {
      id: image?.id ?? image?.image_id ?? null,
      url,
      key: String(image?.id ?? image?.image_id ?? (url || index)),
    };
  }).filter((image) => image.url);
  if (saved.length) return saved;
  const fallbackUrl = getImageUrls(property)[0] || "";
  return fallbackUrl ? [{ id: null, url: fallbackUrl, key: fallbackUrl }] : [];
};

const typeDetailFields = [
  { key: "space", requiredKey: "space_required", label: "المساحة (م²)" },
  { key: "floor", requiredKey: "floor_required", label: "رقم الطابق" },
  { key: "room_no", requiredKey: "room_no_required", label: "عدد الغرف" },
  { key: "bathroom_no", requiredKey: "bathroom_no_required", label: "عدد الحمامات" },
  { key: "garage_no", requiredKey: "garage_no_required", label: "عدد أماكن الجراج" },
  { key: "hall_no", requiredKey: "hall_no_required", label: "عدد الصالات" },
  { key: "street_no", requiredKey: "street_no_required", label: "عدد الشوارع" },
];

const typeDetailErrorAliases = {
  space: /\bspace\b|المساحة/i,
  floor: /\bfloor(?:_no)?\b|الدور|الطابق/i,
  room_no: /\broom(?:_no)?\b|الغرف/i,
  bathroom_no: /\bbathroom(?:_no)?\b|الحمامات/i,
  garage_no: /\bgarage(?:_no)?\b|الجراج/i,
  hall_no: /\bhall(?:_no)?\b|الصالات/i,
  street_no: /\bstreet(?:_no)?\b|الشوارع/i,
};

function FieldLabel({ children }) {
  return (
    <div className="relative flex h-[54px] w-full shrink-0 items-center justify-center rounded-md bg-white px-4 text-base text-slate-900 shadow-[0_2px_14px_rgba(15,23,42,0.08)] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:border-y-[10px] before:border-y-transparent before:border-r-[10px] before:border-r-white before:drop-shadow-[-2px_2px_3px_rgba(15,23,42,0.12)] before:hidden md:before:block lg:h-[64px]">
      {children}
    </div>
  );
}

function PropertyRow({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(180px,250px)_minmax(0,1fr)] md:items-center md:gap-x-6 xl:gap-x-12">
      <FieldLabel>{label}</FieldLabel>
      <div className="w-full min-w-0 md:max-w-[730px]">{children}</div>
    </div>
  );
}

export default function AddPropertyContent({ propertyId = null, initialProperty = null }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [natures, setNatures] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [types, setTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [typeDetails, setTypeDetails] = useState({});
  const [serverRequiredTypeFields, setServerRequiredTypeFields] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [offer, setOffer] = useState("0");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [savedImages, setSavedImages] = useState([]);
  const [selectedSavedImage, setSelectedSavedImage] = useState("");
  const [selectedNewImageIndex, setSelectedNewImageIndex] = useState(null);
  const [pendingSavedImageDeletion, setPendingSavedImageDeletion] = useState(null);
  const [deletingSavedImageIds, setDeletingSavedImageIds] = useState([]);
  const [editLoading, setEditLoading] = useState(Boolean(propertyId));
  const [editPropertyData, setEditPropertyData] = useState(initialProperty);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("platform");
  const [feeMode, setFeeMode] = useState("discount");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitErrors, setSubmitErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);
  const selectedLocationName = locations.find((location) => String(location.id) === selectedLocation);
  const selectedPropertyType = types.find((type) => String(type.id) === selectedType);
  const selectedPropertyStatus = statuses.find((status) => String(status.id) === selectedStatus);
  const imagePreviewSrc = selectedNewImageIndex != null
    ? imagePreviews[selectedNewImageIndex] || selectedSavedImage
    : selectedSavedImage || imagePreviews[0] || "";
  const numericPrice = Number(price);
  const configuredFee = Number(selectedPropertyStatus?.pay_amount);
  const calculatedFee = selectedPropertyStatus && Number.isFinite(configuredFee) && Number.isFinite(numericPrice) && numericPrice > 0
    ? (String(selectedPropertyStatus.pay_type).toLowerCase() === "percent"
      ? numericPrice * configuredFee / 100
      : configuredFee)
    : 0;
  const roundedFee = Math.round(calculatedFee * 100) / 100;
  const totalPrice = Math.max(0, numericPrice + (feeMode === "add" ? roundedFee : -roundedFee));
  const visibleTypeFields = typeDetailFields.filter((field) => {
    if (propertyId && serverRequiredTypeFields.includes(field.key)) return true;
    if (!selectedPropertyType) return false;
    const required = Number(selectedPropertyType[field.requiredKey]) === 1;
    const supported = Number(selectedPropertyType[field.key]) > 0;
    return required || supported;
  });
  const mapPlace = selectedLocationName?.title || selectedLocationName?.name || t("مصر");
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapPlace)}&hl=${getLanguage()}&z=12&output=embed`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitErrors([]);

    if (propertyId && editLoading) return;

    const invalidFields = Array.from(event.currentTarget.elements)
      .filter((field) => field.willValidate && !field.validity.valid)
      .map((field) => {
        const label = field.getAttribute("aria-label")
          || field.labels?.[0]?.textContent?.trim().replace(/\s*\*\s*$/, "")
          || field.name
          || t("هذا الحقل");
        return field.validity.valueMissing
          ? `${label} مطلوب.`
          : `${label}: ${field.validationMessage}`;
      });
    if (invalidFields.length) {
      setSubmitErrors(invalidFields);
      return;
    }

    if (!propertyId && !images.length) {
      setSubmitErrors([t("يجب اختيار صورة واحدة على الأقل.")]);
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", content.trim());
    formData.append("price", price);
    formData.append("offer", offer);
    formData.append("aqar_type", selectedType);
    formData.append("type_id", selectedStatus);
    formData.append("area_id", selectedLocation);
    formData.append("pin", isPinned ? "1" : "0");
    formData.append("pay_type", paymentMethod === "platform" ? "0" : "1");
    if (propertyId) formData.append("aqar_id", propertyId);
    formData.append("user_pay_type", feeMode === "discount" ? "0" : "1");
    formData.append("fees", String(roundedFee));
    if (typeDetails.aqar_nature) formData.append("nature_id", typeDetails.aqar_nature);

    const apiFieldNames = {
      space: "space",
      floor: "floor",
      room_no: "room_no",
      bathroom_no: "bathroom_no",
      garage_no: "garage_no",
      hall_no: "hall_no",
      street_no: "street_no",
    };
    Object.entries(apiFieldNames).forEach(([formKey, apiKey]) => {
      if (typeDetails[formKey] !== undefined && typeDetails[formKey] !== "") {
        formData.append(apiKey, typeDetails[formKey]);
      }
    });
    images.forEach((image) => formData.append("images[]", image));
    if (latitude !== "") formData.append("lat", latitude);
    if (longitude !== "") formData.append("lng", longitude);

    try {
      setSubmitting(true);
      const response = await (propertyId ? updateAqar(formData) : storeAqar(formData));
      const result = response.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || t(propertyId ? "تعذر تحديث العقار." : "تعذر إرسال العقار."));
      }
      showToast(result.message || t(propertyId ? "تم تحديث العقار بنجاح." : "تم إرسال العقار بنجاح."));
      navigate("/account/my-properties", { replace: true });
    } catch (submitRequestError) {
      const responseData = submitRequestError.response?.data;
      const validationErrors = responseData?.errors;
      const validationMessages = validationErrors
        ? Object.values(validationErrors).flat().filter(Boolean).map(String)
        : [];
      const validationText = [
        ...Object.keys(validationErrors || {}),
        ...validationMessages,
        responseData?.message || "",
      ].join(" ");
      const missingTypeFields = Object.entries(typeDetailErrorAliases)
        .filter(([, pattern]) => pattern.test(validationText))
        .map(([key]) => key);
      if (missingTypeFields.length) {
        setServerRequiredTypeFields((current) => [...new Set([...current, ...missingTypeFields])]);
      }
      setSubmitErrors(validationMessages.length
        ? validationMessages
        : [responseData?.message || t(propertyId ? "تعذر تحديث العقار. تحقق من البيانات وحاول مرة أخرى." : "تعذر إرسال العقار. تحقق من البيانات وحاول مرة أخرى.")]);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const [typesResponse, areasResponse, statusesResponse, naturesResponse] = await Promise.all([
          getAqarTypes(),
          getAreas(),
          getAqarStatuses(),
          getAqarNatures(),
        ]);
        const parents = getItems(areasResponse);
        const childResponses = await Promise.all(
          parents.filter((area) => area.has_child).map((area) => getAreaChildren(area.id).catch(() => null))
        );
        const loadedTypes = getItems(typesResponse).filter((item) => item.id && (item.title || item.name));
        const loadedStatuses = getItems(statusesResponse).filter((item) => item.id && (item.title || item.name));
        const loadedNatures = getItems(naturesResponse).filter((item) => item.id && (item.title || item.name));
        const loadedLocations = [...parents, ...childResponses.flatMap(getItems)]
          .filter((item) => item.id && (item.title || item.name));

        if (!active) return;
        setTypes(loadedTypes);
        setStatuses(loadedStatuses);
        setNatures(loadedNatures);
        setLocations(loadedLocations);
      } catch {
        if (active) setError("تعذر تحميل أنواع العقارات والمدن.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOptions();
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (!propertyId) return undefined;
    let active = true;
    setEditLoading(true);
    getAqar(propertyId)
      .then((response) => {
        const payload = response?.data?.data;
        const details = Array.isArray(payload) ? payload[0] : payload?.data || payload;
        if (!active) return;
        if (!details) throw new Error(t("تعذر تحميل بيانات العقار للتعديل."));
        const nonNullDetails = Object.fromEntries(Object.entries(details).filter(([, value]) => value !== null && value !== undefined));
        const property = { ...(initialProperty || {}), ...nonNullDetails };
        setEditPropertyData(property);
        setTitle(property.title || "");
        setContent(property.description || "");
        setPrice(String(property.price ?? ""));
        setOffer(String(property.offer ?? "0"));
        setSelectedStatus(String(property.type_id ?? property.aqar_status_id ?? property.status_id ?? ""));
        setSelectedLocation(String(property.area_id ?? ""));
        setIsPinned(String(property.pin ?? "0") === "1");
        setPaymentMethod(String(property.pay_type ?? "0") === "1" ? "self" : "platform");
        setFeeMode(String(property.user_pay_type ?? "0") === "1" ? "add" : "discount");
        setTypeDetails({
          space: property.space ?? "",
          floor: property.floor ?? "",
          room_no: property.room_no ?? "",
          bathroom_no: property.bathroom_no ?? "",
          garage_no: property.garage_no ?? "",
          hall_no: property.hall_no ?? "",
          street_no: property.street_no ?? "",
          aqar_nature: property.nature_id ?? property.aqar_nature_id ?? property.aqar_nature?.id ?? property.nature?.id ?? (typeof property.aqar_nature === "number" ? property.aqar_nature : ""),
        });
        setLatitude(String(property.lat ?? ""));
        setLongitude(String(property.lng ?? ""));
        const loadedImages = getSavedPropertyImages(property);
        setSavedImages(loadedImages);
        setSelectedSavedImage(loadedImages[0]?.url || "");
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || loadError.message || t("تعذر تحميل بيانات العقار للتعديل."));
      })
      .finally(() => { if (active) setEditLoading(false); });
    return () => { active = false; };
  }, [propertyId, initialProperty, language]);

  useEffect(() => {
    if (!propertyId || !editPropertyData || !types.length) return;
    setSelectedType(resolvePropertyTypeId(editPropertyData, types));
  }, [propertyId, editPropertyData, types]);

  useEffect(() => {
    if (!propertyId || !editPropertyData) return;
    const rawNatureValues = [editPropertyData.aqar_nature, editPropertyData.nature].filter((value) => value != null && value !== "");
    const natureIds = [
      editPropertyData.nature_id,
      editPropertyData.aqar_nature_id,
      ...rawNatureValues.flatMap((value) => [value?.id, value?.nature_id, value?.aqar_nature_id]),
      ...rawNatureValues.filter((value) => typeof value === "number" || /^\d+$/.test(String(value).trim())),
    ].filter((value) => value != null && value !== "" && Number(value) > 0).map(String);
    const matchedById = natures.find((nature) => natureIds.includes(String(nature.id)));
    if (matchedById) {
      setTypeDetails((current) => current.aqar_nature === String(matchedById.id)
        ? current
        : { ...current, aqar_nature: String(matchedById.id) });
      return;
    }

    if (!natures.length) return;
    const natureNames = [
      ...rawNatureValues.flatMap((value) => typeof value === "string" ? [value] : [value?.title, value?.name, value?.title_ar, value?.title_en]),
      editPropertyData.nature_title,
      editPropertyData.aqar_nature_title,
    ].filter((value) => value != null && value !== "" && !/^\d+$/.test(String(value).trim())).map(normalizeLookupText);
    const matchedByName = natures.find((nature) => [nature.title, nature.name, nature.title_ar, nature.title_en, nature.name_ar, nature.name_en]
      .filter(Boolean)
      .some((name) => natureNames.includes(normalizeLookupText(name))));
    const resolvedNatureId = matchedByName ? String(matchedByName.id) : "";
    setTypeDetails((current) => current.aqar_nature === resolvedNatureId
      ? current
      : { ...current, aqar_nature: resolvedNatureId });
  }, [propertyId, editPropertyData, natures]);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.currentTarget.value = "";
    const knownFiles = new Set(images.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
    const additions = selectedFiles.filter((file) => !knownFiles.has(`${file.name}:${file.size}:${file.lastModified}`));
    if (!additions.length) return;
    setImages((current) => [...current, ...additions]);
    setSelectedNewImageIndex(images.length);
    setSelectedSavedImage("");
  };

  const removeSelectedImage = (removedIndex) => {
    const remaining = images.filter((_, index) => index !== removedIndex);
    setImages(remaining);
    if (selectedNewImageIndex === removedIndex) setSelectedNewImageIndex(remaining.length ? Math.min(removedIndex, remaining.length - 1) : null);
    else if (selectedNewImageIndex != null && selectedNewImageIndex > removedIndex) setSelectedNewImageIndex(selectedNewImageIndex - 1);
    if (!remaining.length && !selectedSavedImage && savedImages.length) setSelectedSavedImage(savedImages[0].url);
  };

  const removeSavedImage = async (image) => {
    if (!propertyId || image?.id == null) return;
    setDeletingSavedImageIds((current) => [...current, image.id]);
    try {
      const response = await deleteImage(propertyId, image.id);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") throw new Error(result.message || t("تعذر حذف الصورة."));
      const remaining = savedImages.filter((item) => String(item.id) !== String(image.id));
      setSavedImages(remaining);
      if (selectedSavedImage === image.url) {
        setSelectedSavedImage(remaining[0]?.url || "");
        setSelectedNewImageIndex(remaining.length ? null : (images.length ? 0 : null));
      }
      setPendingSavedImageDeletion(null);
      showToast(result.message || t("تم حذف الصورة بنجاح."));
    } catch (requestError) {
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر حذف الصورة. حاول مرة أخرى."), "error");
    } finally {
      setDeletingSavedImageIds((current) => current.filter((id) => String(id) !== String(image.id)));
    }
  };

  if (propertyId && !editLoading && error) {
    return <main dir="rtl" className="min-h-[65vh] bg-white px-4 py-12"><p role="alert" className="mx-auto max-w-3xl text-center text-red-600">{error}</p></main>;
  }

  return (
    <main dir="rtl" className="min-h-[65vh] bg-white px-2 py-5 sm:px-4 lg:px-6 lg:py-5">
      <ValidatedForm onSubmit={handleSubmit}>
      <section className="mx-auto w-[90%] max-w-[1540px]">
        <h1 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t(propertyId ? "تعديل العقار" : "\n          نوع الملكية والموقع\n        ")}</h1>
        {editLoading && <p role="status" className="py-8 text-center text-slate-500">{t("جاري تحميل بيانات العقار...")}</p>}

        <div className="mt-6 flex flex-col gap-6 lg:mt-10 lg:gap-8">
          <PropertyRow label={t("نوع العقار *")}>
            <select
              value={selectedType}
              required
              onChange={(event) => {
                setSelectedType(event.target.value);
                setTypeDetails({});
              }}
              disabled={loading || types.length === 0}
              aria-label={t("نوع العقار")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] disabled:text-slate-500 lg:h-[64px]"
            >
              <option value="">{loading ? t("جاري التحميل...") : t("اختر")}</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{t(type.title || type.name)}</option>
              ))}
            </select>
          </PropertyRow>

          <PropertyRow label={t("حالة العقار *")}>
            <fieldset className="grid min-w-0 grid-cols-2 items-center gap-2 md:flex md:justify-start md:gap-4">
              <legend className="sr-only">{t("حالة العقار")}</legend>
              {statuses.map((option) => (
                <label
                  key={option.id}
                  className="flex h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#fafafa] px-2 text-[11px] text-slate-900 transition-colors hover:bg-slate-100 md:h-[58px] md:w-auto md:gap-2 md:px-6 md:text-base"
                >
                  <input
                    type="radio"
                    name="property-mode"
                    value={option.id}
                    required
                    checked={selectedStatus === String(option.id)}
                    onChange={() => setSelectedStatus(String(option.id))}
                    className="h-4 w-4 shrink-0 accent-[#2463b5] md:h-[18px] md:w-[18px]"
                  />
                  <span>{t(option.title || option.name)}</span>
                </label>
              ))}
              {loading && statuses.length === 0 && <span className="text-sm text-slate-500">{t("جاري تحميل الحالات...")}</span>}
              {!loading && statuses.length === 0 && <span className="text-sm text-red-600">{t("لا توجد حالات متاحة.")}</span>}
            </fieldset>
          </PropertyRow>

          {visibleTypeFields.map((field) => (
            <PropertyRow key={field.key} label={`${t(field.label)}${(serverRequiredTypeFields.includes(field.key) || Number(selectedPropertyType?.[field.requiredKey]) === 1) ? " *" : ""}`}>
              <input
                type="number"
                min="0"
                value={typeDetails[field.key] ?? ""}
                onChange={(event) => setTypeDetails((current) => ({ ...current, [field.key]: field.key === "space" ? normalizeArea(event.target.value) : event.target.value }))}
                required={serverRequiredTypeFields.includes(field.key) || Number(selectedPropertyType?.[field.requiredKey]) === 1}
                aria-label={t(field.label)}
                className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
              />
            </PropertyRow>
          ))}
          <PropertyRow label={t("المدينة *")}>
            <select
              value={selectedLocation}
              required
              onChange={(event) => setSelectedLocation(event.target.value)}
              disabled={loading || locations.length === 0}
              aria-label={t("المدينة")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] disabled:text-slate-500 lg:h-[64px]"
            >
              <option value="">{loading ? t("جاري التحميل...") : t("اختر")}</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{t(location.title || location.name)}</option>
              ))}
            </select>
          </PropertyRow>
          <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-sm">
            <iframe
              title={t("خريطة موقع العقار")}
              src={mapSrc}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[230px] w-full border-0 sm:h-[280px] lg:h-[375px]"
            />
          </div>
          <PropertyRow label={t("العنوان *")}>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("أدخل عنوان العقار")}
              aria-label={t("عنوان العقار")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
            />
          </PropertyRow>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PropertyRow label={t("خط العرض")}>
              <input type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} aria-label={t("خط العرض")} className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]" />
            </PropertyRow>
            <PropertyRow label={t("خط الطول")}>
              <input type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} aria-label={t("خط الطول")} className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]" />
            </PropertyRow>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
        </div>

        <section className="mt-8">
          <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n            المزيد\n          ")}</h2>
          <div className="mt-6 flex flex-col gap-6 lg:gap-8">
            <PropertyRow label={t("المحتوى *")}>
              <textarea
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                aria-label={t("محتوى العقار")}
                className="h-[120px] w-full min-w-0 resize-y rounded-md border-0 bg-[#fafafa] px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[106px]"
              />
            </PropertyRow>
            <PropertyRow label={t("السعر *")}>
              <input
                type="number"
                required
                dir="ltr"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-label={t("سعر العقار")}
                className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-right text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
              />
            </PropertyRow>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t(propertyId ? "إرفع صور" : "\n            إرفع صور *\n          ")}</h2>
          <div className="mt-6 flex justify-start sm:mt-8">
            <label className="relative flex aspect-[4/3] min-h-[180px] w-full max-w-[470px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-white p-4 text-center shadow-[0_2px_18px_rgba(15,23,42,0.08)] outline-none transition hover:shadow-[0_4px_22px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-[#2463b5] sm:aspect-[470/262]">
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label={t("رفع صور العقار")}
                className="sr-only"
                onChange={handleImageChange}
              />
              {imagePreviewSrc
                ? <img src={imagePreviewSrc} alt={propertyId ? t("صورة العقار") : t("معاينة صور العقار")} className="absolute inset-0 h-full w-full bg-slate-100 object-contain" />
                : <FontAwesomeIcon icon={faImages} aria-hidden="true" className="text-[88px] text-[#b0bdb9] sm:text-[112px]" />}
              {propertyId && savedImages.some((image) => image.url === selectedSavedImage && image.id != null) && (
                <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); const image = savedImages.find((item) => item.url === selectedSavedImage && item.id != null); if (image) setPendingSavedImageDeletion(image); }} disabled={deletingSavedImageIds.length > 0} aria-label={t("حذف الصورة الحالية")} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-2xl text-white transition hover:bg-red-600 disabled:opacity-60">×</button>
              )}
              {images.length > 0 && (
                <span role="status" className="text-sm text-slate-600">{t("\n                  تم اختيار ")}{images.length} {images.length === 1 ? t("صورة") : t("صور")}
                </span>
              )}
              {!images.length && propertyId && <span className="relative z-10 rounded bg-white/90 px-2 py-1 text-xs text-slate-700">{imagePreviewSrc ? t("اضغط لإضافة صور") : t("لا توجد صورة حالية")}</span>}
            </label>
          </div>
          {propertyId && savedImages.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-start gap-3" aria-label={t("الصور المحفوظة")}>
              {savedImages.map((image, index) => (
                <div key={image.key} className={`relative h-24 w-32 overflow-hidden rounded-md bg-slate-100 ${selectedSavedImage === image.url && selectedNewImageIndex == null ? "ring-2 ring-[#2463b5]" : ""}`}>
                  <button type="button" onClick={() => { setSelectedSavedImage(image.url); setSelectedNewImageIndex(null); }} aria-label={`${t("عرض الصورة")} ${index + 1}`} className="h-full w-full">
                    <img src={image.url} alt={`${t("صورة العقار الحالية")} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                  {image.id != null ? (
                    <button type="button" onClick={() => setPendingSavedImageDeletion(image)} disabled={deletingSavedImageIds.some((id) => String(id) === String(image.id))} aria-label={`${t("حذف الصورة")} ${index + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-lg text-white transition hover:bg-red-600 disabled:opacity-60">{deletingSavedImageIds.some((id) => String(id) === String(image.id)) ? "…" : "×"}</button>
                  ) : <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-center text-[10px] text-white">{t("لا يوجد معرّف للصورة")}</span>}
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-start gap-3" aria-label={t("الصور المختارة")}>
              {imagePreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} className={`relative h-24 w-32 overflow-hidden rounded-md bg-slate-100 ${selectedNewImageIndex === index ? "ring-2 ring-[#2463b5]" : ""}`}>
                  <button type="button" onClick={() => { setSelectedNewImageIndex(index); setSelectedSavedImage(""); }} aria-label={`${t("عرض الصورة")} ${index + 1}`} className="h-full w-full"><img src={preview} alt={`${t("صورة العقار")} ${index + 1}`} className="h-full w-full object-cover" /></button>
                  <button type="button" onClick={() => removeSelectedImage(index)} aria-label={`${t("إزالة الصورة")} ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-white">×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {pendingSavedImageDeletion && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 p-4" dir="rtl">
            <section role="alertdialog" aria-modal="true" aria-labelledby="delete-property-image-title" aria-describedby="delete-property-image-description" className="w-full max-w-[540px] rounded-md bg-white px-6 py-8 text-center shadow-2xl sm:px-10 sm:py-10">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-[88px] text-orange-300 sm:text-[104px]" aria-hidden="true" />
              <h2 id="delete-property-image-title" className="mt-6 text-2xl font-bold text-slate-700">{t("هل أنت متأكد من حذف هذه الصورة؟")}</h2>
              <p id="delete-property-image-description" className="mt-3 text-base text-slate-500">{t("إذا حذفت الصورة فلن تتمكن من استرجاعها مرة أخرى.")}</p>
              <div className="mt-7 flex items-center justify-center gap-3">
                <button type="button" onClick={() => setPendingSavedImageDeletion(null)} disabled={deletingSavedImageIds.length > 0} className="min-w-[78px] rounded-lg border-2 border-slate-200 bg-slate-100 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">{t("لا")}</button>
                <button type="button" onClick={() => removeSavedImage(pendingSavedImageDeletion)} disabled={deletingSavedImageIds.length > 0} className="min-w-[88px] rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60">{deletingSavedImageIds.length > 0 ? t("جاري الحذف...") : t("نعم")}</button>
              </div>
            </section>
          </div>
        )}

        <section className="mt-8">
          <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n            التثبيت\n          ")}</h2>
          <fieldset className="mt-6 grid grid-cols-2 gap-3 md:flex md:justify-start md:gap-5">
            <legend className="sr-only">{t("خيارات تثبيت العقار")}</legend>
            <label className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-2 text-sm text-slate-900 transition-colors hover:bg-slate-100 md:h-[64px] md:w-[244px] md:text-base">
              <input
                type="radio"
                name="property-pinning"
                checked={isPinned}
                onChange={() => setIsPinned(true)}
                className="h-4 w-4 shrink-0 accent-[#2463b5]"
              />
              <span>{t("تثبيت للأعلى")}</span>
            </label>
            <label className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-2 text-sm text-slate-900 transition-colors hover:bg-slate-100 md:h-[64px] md:w-[244px] md:text-base">
              <input
                type="radio"
                name="property-pinning"
                checked={!isPinned}
                onChange={() => setIsPinned(false)}
                className="h-4 w-4 shrink-0 accent-[#2463b5]"
              />
              <span>{t("عدم التثبيت")}</span>
            </label>
          </fieldset>
        </section>

        <section className="mt-8">
          <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n            نوع الدفع *\n          ")}</h2>
          <div className="mt-6 flex flex-col gap-6">
            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:gap-5">
              <legend className="sr-only">{t("طريقة الدفع")}</legend>
              <label className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-3 text-sm leading-snug text-slate-900 transition-colors hover:bg-slate-100 sm:min-h-[64px] lg:h-[64px] lg:min-h-0 lg:w-[470px] lg:text-base">
                <input
                  type="radio"
                  name="payment-method"
                  value="platform"
                  checked={paymentMethod === "platform"}
                  onChange={() => setPaymentMethod("platform")}
                  className="h-4 w-4 shrink-0 accent-[#2463b5]"
                />
                <span className="min-w-0 text-center">{t("الدفع عن طريق سهم للخدمات العقارية")}</span>
              </label>
              <label className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-3 text-sm leading-snug text-slate-900 transition-colors hover:bg-slate-100 sm:min-h-[64px] lg:h-[64px] lg:min-h-0 lg:w-[290px] lg:text-base">
                <input
                  type="radio"
                  name="payment-method"
                  value="self"
                  checked={paymentMethod === "self"}
                  onChange={() => setPaymentMethod("self")}
                  className="h-4 w-4 shrink-0 accent-[#2463b5]"
                />
                <span>{t("الدفع عن طريقي")}</span>
              </label>
            </fieldset>

            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:gap-5">
              <legend className="sr-only">{t("نوع الرسوم")}</legend>
              <label className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-3 text-sm text-slate-900 transition-colors hover:bg-slate-100 sm:h-[64px] lg:w-[265px] lg:text-base">
                <input
                  type="radio"
                  name="fee-mode"
                  value="discount"
                  checked={feeMode === "discount"}
                  onChange={() => setFeeMode("discount")}
                  className="h-4 w-4 shrink-0 accent-[#2463b5]"
                />
                <span>{t("خصم الرسوم")}</span>
              </label>
              <label className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fafafa] px-3 text-sm text-slate-900 transition-colors hover:bg-slate-100 sm:h-[64px] lg:w-[265px] lg:text-base">
                <input
                  type="radio"
                  name="fee-mode"
                  value="add"
                  checked={feeMode === "add"}
                  onChange={() => setFeeMode("add")}
                  className="h-4 w-4 shrink-0 accent-[#2463b5]"
                />
                <span>{t("إضافة الرسوم")}</span>
              </label>
            </fieldset>

            <PropertyRow label={t(feeMode === "discount" ? "قيمة الخصم" : "قيمة الرسوم")}>
              <input
                type="text"
                dir="ltr"
                readOnly
                value={selectedPropertyStatus ? roundedFee : ""}
                placeholder={t("اختر حالة العقار وأدخل السعر")}
                aria-label={t(feeMode === "discount" ? "قيمة الخصم" : "قيمة الرسوم")}
                className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-right text-sm text-slate-900 outline-none lg:h-[64px]"
              />
            </PropertyRow>

            <PropertyRow label={t("المبلغ الإجمالي")}>
              <input
                type="text"
                dir="ltr"
                readOnly
                value={selectedPropertyStatus && Number.isFinite(numericPrice) && numericPrice > 0 ? Math.round(totalPrice * 100) / 100 : ""}
                placeholder={t("اختر حالة العقار وأدخل السعر")}
                aria-label={t("المبلغ الإجمالي")}
                className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-right text-sm text-slate-900 outline-none lg:h-[64px]"
              />
            </PropertyRow>

            <div>
              <button
                type="submit"
                disabled={submitting || editLoading}
                className="group relative flex h-[54px] w-full items-center justify-center overflow-hidden rounded-md bg-[#419e8e] px-8 text-base font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B65B3] focus:ring-offset-2 sm:w-[126px]"
              >
                <span className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                <span className="relative z-10">{submitting ? t("جاري الإرسال...") : t(propertyId ? "حفظ التعديلات" : "إرسال")}</span>
              </button>
              {submitErrors.length > 0 && (
                <div className="mt-3 space-y-2" role="alert" aria-live="assertive">
                  {submitErrors.map((message, index) => (
                    <p key={`${message}-${index}`} className="text-sm text-red-600">{message}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
      </ValidatedForm>
    </main>
  );
}
