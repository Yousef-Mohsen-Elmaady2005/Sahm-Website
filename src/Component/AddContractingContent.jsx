import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faImages } from "@fortawesome/free-solid-svg-icons";
import { deleteImage, getAreas, getAreaChildren, getConstructionTypes, storeConstruction, updateConstruction } from "../api/auth";
import { showToast } from "../utils/notifications";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

const getItems = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
};

function FieldLabel({ children }) {
  return (
    <div className="relative flex h-[54px] w-full shrink-0 items-center justify-center rounded-md bg-white px-4 text-base text-slate-900 shadow-[0_2px_14px_rgba(15,23,42,0.08)] before:absolute before:-left-3 before:top-1/2 before:hidden before:-translate-y-1/2 before:border-y-[10px] before:border-y-transparent before:border-r-[10px] before:border-r-white before:drop-shadow-[-2px_2px_3px_rgba(15,23,42,0.12)] md:before:block lg:h-[64px]">
      {children}
    </div>
  );
}

function ContractingRow({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(180px,250px)_minmax(0,1fr)] md:items-center md:gap-x-6">
      <FieldLabel>{label}</FieldLabel>
      <div className="w-full min-w-0 md:max-w-[730px]">{children}</div>
    </div>
  );
}

const imageUrl = (image) => typeof image === "string"
  ? image
  : image?.url || image?.image_url || image?.path || image?.original_url || image?.src ||
    (typeof image?.image === "string" ? image.image : "") ||
    image?.image?.url || image?.image?.image_url || image?.image?.path || "";

const constructionImages = (construction) => {
  const sourceImages = construction?.images?.data?.data ?? construction?.images?.data ?? construction?.images;
  const images = Array.isArray(sourceImages) ? sourceImages : sourceImages ? [sourceImages] : [];
  const normalized = images.map((image, index) => ({
    id: image?.id ?? image?.image_id ?? null,
    url: (() => {
      const url = imageUrl(image);
      if (!url) return "";
      try { return new URL(url, "https://sahmre.site/").toString(); } catch { return url; }
    })(),
    key: String(image?.id ?? image?.image_id ?? imageUrl(image) ?? index),
  })).filter((image) => image.url);
  if (normalized.length) return normalized;
  const fallback = [construction?.image, construction?.image_url, construction?.image_path,
    construction?.cover_image, construction?.construction_image, construction?.thumbnail]
    .map(imageUrl).find(Boolean);
  return fallback ? [{ id: null, url: fallback, key: fallback }] : [];
};

const constructionImage = (construction) => {
  // Updates may append a replacement to the images collection; prefer the
  // newest entry so the edit form reflects the image the user just uploaded.
  const sourceImages = construction?.images?.data ?? construction?.images;
  const images = Array.isArray(sourceImages) ? [...sourceImages] : [sourceImages];
  const hasImageMetadata = images.some((image) => image?.created_at || image?.updated_at || image?.id || image?.image_id);
  images.sort((left, right) => {
    const leftTime = Date.parse(left?.updated_at || left?.created_at || "");
    const rightTime = Date.parse(right?.updated_at || right?.created_at || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return rightTime - leftTime;
    const leftId = Number(left?.id ?? left?.image_id);
    const rightId = Number(right?.id ?? right?.image_id);
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) return rightId - leftId;
    return 0;
  });
  if (!hasImageMetadata) images.reverse();
  const image = [...images, construction?.image, construction?.image_url, construction?.image_path,
    construction?.cover_image, construction?.construction_image, construction?.thumbnail]
    .map(imageUrl).find(Boolean);
  if (!image) return "";
  try { return new URL(image, "https://sahmre.site/").toString(); } catch { return image; }
};

const normalizeName = (value) => String(value || "").trim().replace(/[إأآ]/g, "ا").replace(/ى/g, "ي");
const normalizeAreaName = (value) => normalizeName(value).toLocaleLowerCase();
const normalizeArea = (value) => String(value).replace(/^0+(?=\d)/, "");

export default function AddContractingContent({ mode = "create", construction = null, constructionId = "" }) {
  const { language } = useLanguage();
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [cityLoading, setCityLoading] = useState(true);
  const [cityError, setCityError] = useState(false);
  const [contractTypes, setContractTypes] = useState([]);
  const [contractTypeLoading, setContractTypeLoading] = useState(true);
  const [contractTypeError, setContractTypeError] = useState(false);
  const [contractType, setContractType] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [mapLocation, setMapLocation] = useState("");
  const [content, setContent] = useState("");
  const [area, setArea] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [savedImages, setSavedImages] = useState([]);
  const [deletingSavedImageIds, setDeletingSavedImageIds] = useState([]);
  const [pendingSavedImageDeletion, setPendingSavedImageDeletion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const previewObjectUrl = useRef("");

  useEffect(() => () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
  }, []);

  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  useEffect(() => {
    if (!construction) return;
    const rawType = construction.construction_type_id ?? construction.construction_type?.id ??
      construction.construction_type?.value ?? construction.construction_type;
    setAddress(construction.title || "");
    setContent(construction.description || "");
    setArea(construction.space == null ? "" : normalizeArea(construction.space));
    const areaId = construction.area_id ?? construction.area?.id ?? construction.city_id ?? construction.area_parent_id;
    const areaName = typeof construction.area === "string"
      ? construction.area
      : construction.area?.title || construction.area?.name || construction.area_title || construction.area_parent_title;
    const normalizedAreaName = normalizeAreaName(areaName);
    const areaAliases = ["saudi", "saudi arabia"].includes(normalizedAreaName)
      ? ["saudi", "saudi arabia", normalizeAreaName("السعودية")]
      : [normalizedAreaName];
    const matchedArea = cities.find((item) => {
      const optionName = normalizeAreaName(item.title || item.name);
      return areaAliases.includes(optionName) || areaAliases.some((alias) => alias && optionName.includes(alias));
    });
    const hasAreaId = areaId != null && cities.some((item) => String(item.id) === String(areaId));
    if (hasAreaId) setCity(String(areaId));
    else if (matchedArea) setCity(String(matchedArea.id));
    setContractType(String(rawType ?? ""));
    setImagePreview(constructionImage(construction));
    setSavedImages(constructionImages(construction));
  }, [construction, cities]);

  useEffect(() => {
    if (!construction || !contractTypes.length) return;
    const rawType = construction.construction_type_id ?? construction.construction_type?.id ??
      construction.construction_type?.value ?? construction.construction_type;
    const rawTypeName = typeof construction.construction_type === "string"
      ? construction.construction_type
      : construction.construction_type?.title || construction.construction_type?.name || "";
    const matchedType = contractTypes.find((type) =>
      String(type.id) === String(rawType) || normalizeName(type.title || type.name) === normalizeName(rawTypeName)
    );
    if (matchedType) setContractType(String(matchedType.id));
  }, [construction, contractTypes]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    if (!address.trim() || !contractType || !city || !content.trim() || !area) {
      setSubmitError(t("من فضلك أكمل نوع المقاولة والمدينة والعنوان والمحتوى والمساحة."));
      return;
    }

    const formData = new FormData();
    if (isEdit) formData.append("construction_id", constructionId || construction.id || construction.construction_id || construction.post_id);
    formData.append("title", address.trim());
    formData.append("description", content.trim());
    formData.append("space", area);
    formData.append("construction_type", contractType);
    formData.append("area_id", city);
    images.forEach((image) => formData.append("images[]", image));

    try {
      setSubmitting(true);
      const response = await (isEdit ? updateConstruction(formData) : storeConstruction(formData));
      const result = response.data || {};
      const message = String(result.message || "");
      if (String(result.status || "").toLowerCase() === "error" || /do not have permission|ليس لديك صلاحية|غير مصرح/i.test(message)) {
        throw new Error(message || "ليس لديك صلاحية لتعديل هذه المقاولة.");
      }
      if (isEdit) {
        showToast(message || t("تم تعديل طلب المقاولة بنجاح."));
        navigate("/account/requests", { replace: true });
      } else {
        showToast(message || t("تم إرسال طلب المقاولة بنجاح."));
        navigate("/account/requests", { replace: true });
      }
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const validationErrors = responseData?.errors;
      const firstValidationError = validationErrors ? Object.values(validationErrors).flat()[0] : "";
      setSubmitError(firstValidationError || responseData?.message || requestError.message || t("تعذر إرسال طلب المقاولة. تحقق من البيانات وحاول مرة أخرى."));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadCities = async () => {
      try {
        const response = await getAreas();
        const parents = getItems(response);
        const childResponses = await Promise.all(
          parents.filter((area) => area.has_child).map((area) => getAreaChildren(area.id).catch(() => null))
        );
        const loadedCities = [...parents, ...childResponses.flatMap(getItems)]
          .filter((area) => area.id && (area.title || area.name));

        if (active) setCities(loadedCities);
      } catch {
        if (active) setCityError(true);
      } finally {
        if (active) setCityLoading(false);
      }
    };

    loadCities();
    return () => { active = false; };
  }, [language]);

  const handleImageChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);
    event.currentTarget.value = "";
    const nextImages = [...images, ...selectedImages.filter((selected) => !images.some((image) =>
        image.name === selected.name && image.size === selected.size && image.lastModified === selected.lastModified
      ))];
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = nextImages[0] ? URL.createObjectURL(nextImages[0]) : "";
    setImages(nextImages);
    setImagePreview(previewObjectUrl.current || (isEdit ? constructionImage(construction) : ""));
  };

  const removeSelectedImage = (removedIndex) => {
    const remaining = images.filter((_, index) => index !== removedIndex);
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = remaining[0] ? URL.createObjectURL(remaining[0]) : "";
    setImages(remaining);
    setImagePreview(previewObjectUrl.current || (isEdit ? constructionImage(construction) : ""));
  };

  const removeSavedImage = async (image) => {
    const postId = constructionId || construction?.id || construction?.construction_id || construction?.post_id;
    if (!postId || image?.id == null) return;
    setDeletingSavedImageIds((current) => [...current, image.id]);
    try {
      const response = await deleteImage(postId, image.id);
      const result = response.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || t("تعذر حذف الصورة."));
      }
      const remaining = savedImages.filter((item) => String(item.id) !== String(image.id));
      setSavedImages(remaining);
      if (imagePreview === image.url) {
        setImagePreview(previewObjectUrl.current || remaining[0]?.url || "");
      }
      showToast(result.message || t("تم حذف الصورة بنجاح."));
      setPendingSavedImageDeletion(null);
    } catch (requestError) {
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر حذف الصورة. حاول مرة أخرى."), "error");
    } finally {
      setDeletingSavedImageIds((current) => current.filter((id) => String(id) !== String(image.id)));
    }
  };

  useEffect(() => {
    let active = true;
    getConstructionTypes()
      .then((response) => {
        const loadedTypes = getItems(response).filter((item) => item.id && (item.title || item.name));
        if (active) setContractTypes(loadedTypes);
      })
      .catch(() => { if (active) setContractTypeError(true); })
      .finally(() => { if (active) setContractTypeLoading(false); });
    return () => { active = false; };
  }, [language]);

  return (
    <main dir="rtl" className="min-h-[65vh] bg-white px-2 py-5 sm:px-4 lg:px-6 lg:py-5">
      <ValidatedForm onSubmit={handleSubmit}>
      <section className="mx-auto w-[90%] max-w-[1540px]">
        <h1 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n          نوع الملكية والموقع\n        ")}</h1>

        <div className="mt-6 flex flex-col gap-6 lg:mt-10 lg:gap-8">
          <ContractingRow label={t("حالة العقار")}>
            <fieldset className="grid min-w-0 grid-cols-2 items-center gap-2 md:flex md:flex-wrap md:justify-start md:gap-4">
              <legend className="sr-only">{t("نوع المقاولة")}</legend>
              {contractTypeLoading ? (
                <p className="text-sm text-slate-500">{t("جاري تحميل أنواع المقاولات...")}</p>
              ) : contractTypeError ? (
                <p className="text-sm text-red-600">{t("تعذر تحميل أنواع المقاولات.")}</p>
              ) : contractTypes.length === 0 ? (
                <p className="text-sm text-slate-500">{t("لا توجد أنواع مقاولات متاحة.")}</p>
              ) : contractTypes.map((type) => (
                <label
                  key={type.id}
                  className="flex h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#fafafa] px-2 text-[11px] text-slate-900 transition-colors hover:bg-slate-100 md:h-[58px] md:w-auto md:gap-2 md:px-6 md:text-base"
                >
                  <input
                    type="radio"
                    name="contract-type"
                    value={type.id}
                    checked={String(contractType) === String(type.id)}
                    onChange={() => setContractType(String(type.id))}
                    className="h-4 w-4 shrink-0 accent-[#2463b5] md:h-[18px] md:w-[18px]"
                  />
                  <span>{t(type.title || type.name)}</span>
                </label>
              ))}
            </fieldset>
          </ContractingRow>

          <ContractingRow label={t("المدينة")}>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              aria-label={t("المدينة")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
            >
              <option value="">
                {cityLoading ? t("جاري التحميل...") : cityError ? t("تعذر تحميل المدن") : t("اختر")}
              </option>
              {cities.map((area) => (
                <option key={area.id} value={area.id}>{t(area.title || area.name)}</option>
              ))}
            </select>
          </ContractingRow>

          <ContractingRow label={t("عنوان المقاولة")}>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={t("أدخل عنوان المقاولة")}
              aria-label={t("عنوان المقاولة")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
            />
          </ContractingRow>

          <ContractingRow label={t("المكان على الخريطة")}>
            <input
              type="text"
              value={mapLocation}
              onChange={(event) => setMapLocation(event.target.value)}
              placeholder={t("أدخل الموقع")}
              aria-label={t("المكان على الخريطة")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
            />
          </ContractingRow>
        </div>
      </section>

      <section className="mx-auto mt-8 w-[90%] max-w-[1540px]">
        <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n          المزيد\n        ")}</h2>

        <div className="mt-6 flex flex-col gap-6 lg:mt-10 lg:gap-8">
          <ContractingRow label={t("المحتوى")}>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-label={t("المحتوى")}
              className="h-[120px] w-full min-w-0 resize-y rounded-md border-0 bg-[#fafafa] px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[106px]"
            />
          </ContractingRow>

          <ContractingRow label={t("المساحة")}>
            <input
              type="number"
              dir="ltr"
              min="0"
              value={area}
              onChange={(event) => setArea(normalizeArea(event.target.value))}
              aria-label={t("المساحة")}
              className="h-[54px] w-full min-w-0 rounded-md border-0 bg-[#fafafa] px-3 text-right text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#2463b5] lg:h-[64px]"
            />
          </ContractingRow>
        </div>
      </section>

      <section className="mx-auto mt-8 w-[90%] max-w-[1540px]">
        <h2 className="flex min-h-[52px] items-center justify-start rounded-md bg-[#2463b5] px-5 text-lg font-medium text-white sm:min-h-[62px] sm:px-6 sm:text-xl">{t("\n          إرفع صور\n        ")}</h2>
        <div className="mt-6 flex justify-start sm:mt-8">
          <label className="relative flex aspect-[4/3] min-h-[180px] w-full max-w-[470px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-white p-4 text-center shadow-[0_2px_18px_rgba(15,23,42,0.08)] outline-none transition hover:shadow-[0_4px_22px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-[#2463b5] sm:aspect-[470/262]">
            <input
              type="file"
              accept="image/*"
              multiple
              aria-label={t("رفع صور المقاولة")}
              className="sr-only"
              onChange={handleImageChange}
            />
            {imagePreview ? <img src={imagePreview} alt={isEdit ? "صورة المقاولة" : "معاينة الصورة"} className="absolute inset-0 h-full w-full bg-slate-100 object-contain" /> : <FontAwesomeIcon icon={faImages} aria-hidden="true" className="text-[88px] text-[#b0bdb9] sm:text-[112px]" />}
            {isEdit && savedImages.some((image) => image.url === imagePreview && image.id != null) && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const image = savedImages.find((item) => item.url === imagePreview && item.id != null);
                  if (image) setPendingSavedImageDeletion(image);
                }}
                disabled={deletingSavedImageIds.length > 0}
                aria-label={t("حذف الصورة الحالية")}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-2xl text-white transition hover:bg-red-600 disabled:opacity-60"
              >×</button>
            )}
            {images.length > 0 && (
              <span role="status" className="text-sm text-slate-600">{t("\n                تم اختيار ")}{images.length} {images.length === 1 ? t("صورة جديدة") : t("صور جديدة")}
              </span>
            )}
            {!images.length && isEdit && <span className="relative z-10 rounded bg-white/90 px-2 py-1 text-xs text-slate-700">{imagePreview ? t("اضغط لإضافة صور") : t("لا توجد صورة حالية")}</span>}
          </label>
        </div>
        {isEdit && savedImages.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-start gap-3" aria-label={t("الصور المحفوظة")}>
            {savedImages.map((image, index) => (
              <div key={image.key} className={`relative h-24 w-32 overflow-hidden rounded-md bg-slate-100 ${imagePreview === image.url ? "ring-2 ring-[#2463b5]" : ""}`}>
                <button type="button" onClick={() => setImagePreview(image.url)} aria-label={`${t("عرض الصورة")} ${index + 1}`} className="h-full w-full">
                  <img src={image.url} alt={`${t("صورة محفوظة للمقاولة")} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
                {image.id != null ? (
                  <button
                    type="button"
                    onClick={() => setPendingSavedImageDeletion(image)}
                    disabled={deletingSavedImageIds.some((id) => String(id) === String(image.id))}
                    aria-label={`${t("حذف الصورة")} ${index + 1}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-lg text-white transition hover:bg-red-600 disabled:opacity-60"
                  >{deletingSavedImageIds.some((id) => String(id) === String(image.id)) ? "…" : "×"}</button>
                ) : (
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-center text-[10px] text-white">{t("لا يوجد معرّف للصورة")}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {imagePreviews.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-start gap-3" aria-label={t("الصور المختارة")}>
            {imagePreviews.map((preview, index) => (
              <div key={`${preview}-${index}`} className="relative h-24 w-32 overflow-hidden rounded-md bg-slate-100">
                <img src={preview} alt={`${t("صورة المقاولة")} ${index + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeSelectedImage(index)} aria-label={`${t("إزالة الصورة")} ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-white">×</button>
              </div>
            ))}
          </div>
        )}
      </section>
      {pendingSavedImageDeletion && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-construction-image-title"
            aria-describedby="delete-construction-image-description"
            className="w-full max-w-[540px] rounded-md bg-white px-6 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
          >
            <FontAwesomeIcon icon={faCircleExclamation} className="text-[88px] text-orange-300 sm:text-[104px]" aria-hidden="true" />
            <h2 id="delete-construction-image-title" className="mt-6 text-2xl font-bold text-slate-700">{t("هل أنت متأكد من حذف هذه الصورة؟")}</h2>
            <p id="delete-construction-image-description" className="mt-3 text-base text-slate-500">{t("إذا حذفت الصورة فلن تتمكن من استرجاعها مرة أخرى.")}</p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingSavedImageDeletion(null)}
                disabled={deletingSavedImageIds.length > 0}
                className="min-w-[78px] rounded-lg border-2 border-slate-200 bg-slate-100 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >{t("لا")}</button>
              <button
                type="button"
                onClick={() => removeSavedImage(pendingSavedImageDeletion)}
                disabled={deletingSavedImageIds.length > 0}
                className="min-w-[88px] rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
              >{deletingSavedImageIds.length > 0 ? t("جاري الحذف...") : t("نعم")}</button>
            </div>
          </section>
        </div>
      )}
      <section className="mx-auto mt-8 w-[90%] max-w-[1540px] pb-8">
        {submitError && <p role="alert" className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || contractTypeLoading || cityLoading}
          className="group relative flex h-[54px] w-full items-center justify-center overflow-hidden rounded-md bg-[#419e8e] px-8 text-base font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B65B3] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[126px]"
        >
          <span aria-hidden="true" className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
          <span className="relative z-10">{submitting ? (isEdit ? t("جاري الحفظ...") : t("جاري الإرسال...")) : (isEdit ? t("حفظ التعديلات") : t("إرسال"))}</span>
        </button>
      </section>
      </ValidatedForm>
    </main>
  );
}
