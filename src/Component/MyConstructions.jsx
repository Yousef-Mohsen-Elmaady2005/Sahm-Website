import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserConstructions, getConstruction, deleteConstruction, updateConstructionOfferStatus } from "../api/auth";
import { showToast } from "../utils/notifications";
import { getImageUrls } from "../utils/media";
import { getLanguage, t, useLanguage } from "../i18n";

const getItems = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
};

const imageUrl = (image) => {
  if (typeof image === "string") return image;
  if (!image || typeof image !== "object") return "";
  return image.url || image.image_url || image.path || image.original_url || image.src ||
    (typeof image.image === "string" ? image.image : "") ||
    image.image?.url || image.image?.image_url || image.image?.path || "";
};

const constructionImage = (construction) => {
  const sourceImages = construction?.images?.data?.data ?? construction?.images?.data ?? construction?.images;
  const imageList = Array.isArray(sourceImages) ? [...sourceImages] : sourceImages ? [sourceImages] : [];
  const hasImageMetadata = imageList.some((image) => image?.created_at || image?.updated_at || image?.id || image?.image_id);
  imageList.sort((left, right) => {
    const leftTime = Date.parse(left?.updated_at || left?.created_at || "");
    const rightTime = Date.parse(right?.updated_at || right?.created_at || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return rightTime - leftTime;
    const leftId = Number(left?.id ?? left?.image_id);
    const rightId = Number(right?.id ?? right?.image_id);
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) return rightId - leftId;
    return 0;
  });
  if (!hasImageMetadata) imageList.reverse();
  const candidates = [
    ...imageList,
    construction?.image,
    construction?.image_url,
    construction?.image_path,
    construction?.cover_image,
    construction?.construction_image,
    construction?.thumbnail,
  ];
  const found = candidates.map(imageUrl).find(Boolean);
  if (!found) return "";
  try {
    return new URL(found, "https://sahmre.site/").toString();
  } catch {
    return found;
  }
};

// Prefer the domain ID: an API relation may expose a separate generic `id`.
const constructionId = (construction) => construction?.construction_id || construction?.id || construction?.post_id;
const constructionImages = (construction) => {
  const images = getImageUrls(construction);
  return images.length ? images : [constructionImage(construction)].filter(Boolean);
};

const responseConstruction = (response) => {
  const payload = response?.data?.data;
  return payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
};

const getOffers = (construction) => {
  const offers = construction?.offers ?? construction?.construction_offers ?? construction?.data?.offers;
  if (Array.isArray(offers)) return offers;
  if (Array.isArray(offers?.data)) return offers.data;
  if (Array.isArray(offers?.data?.data)) return offers.data.data;
  return [];
};

const offerId = (offer) => offer?.id ?? offer?.offer_id;
const offerStatus = (offer) => Number(offer?.status ?? offer?.status_id ?? offer?.offer_status);

export default function MyConstructions() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedConstruction, setSelectedConstruction] = useState(null);
  const [selectedConstructionImage, setSelectedConstructionImage] = useState(0);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState("");
  const [updatingOfferId, setUpdatingOfferId] = useState(null);

  useEffect(() => {
    let active = true;
    getUserConstructions()
      .then((constructionsResponse) => {
        if (!active) return;
        setItems(getItems(constructionsResponse));
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "تعذر تحميل طلبات المقاولات.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await deleteConstruction(constructionId(pendingDelete));
      const result = response.data || {};
      const message = String(result.message || "");
      if (String(result.status || "").toLowerCase() === "error" || /do not have permission|ليس لديك صلاحية|غير مصرح/i.test(message)) {
        throw new Error(message || "ليس لديك صلاحية لحذف هذه المقاولة.");
      }
      setItems((current) => current.filter((item) => String(constructionId(item)) !== String(constructionId(pendingDelete))));
      setPendingDelete(null);
      showToast(message || t("تم حذف طلب المقاولة بنجاح."));
    } catch (requestError) {
      setPendingDelete(null);
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر حذف طلب المقاولة."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const openOffers = async (construction) => {
    setSelectedConstruction(construction);
    setSelectedConstructionImage(0);
    setOffersError("");
    const embeddedOffers = getOffers(construction);
    setOffers(embeddedOffers);

    setOffersLoading(true);
    try {
      const response = await getConstruction(constructionId(construction));
      const details = responseConstruction(response);
      if (details) setSelectedConstruction((current) => current ? { ...current, ...details } : current);
      const loadedOffers = getOffers(details);
      setOffers(loadedOffers.length ? loadedOffers : embeddedOffers);
    } catch (requestError) {
      if (!embeddedOffers.length) setOffersError(requestError.response?.data?.message || t("تعذر تحميل عروض الشركات لهذا الطلب."));
    } finally {
      setOffersLoading(false);
    }
  };

  const changeOfferStatus = async (offer, status) => {
    const id = offerId(offer);
    if (!id || !selectedConstruction) return;
    setUpdatingOfferId(id);
    setOffersError("");
    try {
      const response = await updateConstructionOfferStatus({
        construction_id: constructionId(selectedConstruction),
        offer_id: id,
        status,
      });
      const result = response?.data || {};
      const message = String(result.message || "");
      if (String(result.status || "").toLowerCase() === "error" || /do not have permission|ليس لديك صلاحية|غير مصرح/i.test(message)) {
        throw new Error(message || "ليس لديك صلاحية لتغيير حالة هذا العرض.");
      }
      setOffers((current) => current.map((item) => String(offerId(item)) === String(id) ? { ...item, status } : item));
      showToast(message || (status === 2 ? t("تم قبول العرض.") : t("تم رفض العرض.")));
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setOffersError((validationErrors && Object.values(validationErrors).flat()[0]) || requestError.response?.data?.message || requestError.message || t("تعذر تحديث حالة العرض."));
    } finally {
      setUpdatingOfferId(null);
    }
  };

  if (loading) return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل طلبات المقاولات...")}</p>;
  if (error) return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  if (!items.length) return <p className="py-12 text-center text-slate-500">{t("لا توجد طلبات مقاولات في حسابك.")}</p>;

  return (
    <section dir="rtl" aria-label={t("طلبات المقاولات")} className="space-y-5">
      {items.map((construction) => {
        const image = constructionImage(construction);
        const offersCount = construction.offers_count ?? construction.offers?.length ?? 0;
        return (
          <article key={constructionId(construction)} className="flex flex-col items-stretch gap-4 rounded-2xl border border-[#9fc1e5] bg-white p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-[18px]">
            <div className="flex shrink-0 items-center justify-center">
              {image ? <img src={image} alt={construction.title || t("صورة المقاولة")} className="h-[148px] w-full rounded-xl bg-slate-100 object-contain sm:w-[248px]" /> : <div className="flex h-[148px] w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 sm:w-[248px]">{t("لا توجد صورة")}</div>}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-right">
              <h2 className="truncate text-lg font-medium text-slate-900">{construction.title || t("طلب مقاولة")}</h2>
              <button type="button" onClick={() => openOffers(construction)} className="mt-3 font-medium text-[#2864b5] underline-offset-4 hover:underline" aria-label={`${t("عرض عروض الشركات لطلب ")}${construction.title || t("المقاولة")}`}>
                {offersCount}{t(" عروض الشركات\n              ")}</button>
            </div>
            <div className="flex shrink-0 flex-row gap-3 sm:w-[170px] sm:flex-col">
              <button type="button" onClick={() => navigate(`/edit-contracting/${constructionId(construction)}`, { state: { construction } })} className="h-12 flex-1 rounded-xl bg-[#49a395] px-4 text-white transition hover:bg-[#398c80] sm:flex-none">{t("تعديل الطلب")}</button>
              <button type="button" onClick={() => setPendingDelete(construction)} className="h-12 flex-1 rounded-xl bg-[#c9c9c9] px-4 text-slate-900 transition hover:bg-[#b7b7b7] sm:flex-none">{t("حذف الطلب")}</button>
            </div>
          </article>
        );
      })}

      {selectedConstruction && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 p-4" dir="rtl" onMouseDown={(event) => { if (event.target === event.currentTarget && !updatingOfferId) setSelectedConstruction(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="construction-offers-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 id="construction-offers-title" className="text-xl font-semibold text-slate-900">{t("تفاصيل طلب المقاولة")}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedConstruction.title || t("طلب مقاولة")}</p>
              </div>
              <button type="button" onClick={() => setSelectedConstruction(null)} aria-label={t("إغلاق العروض")} className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button>
            </div>
            {constructionImages(selectedConstruction).length > 0 && (
              <div className="mt-5">
                {(() => {
                  const images = constructionImages(selectedConstruction);
                  const activeIndex = Math.min(selectedConstructionImage, images.length - 1);
                  return <>
                    <img src={images[activeIndex]} alt={`${t("صورة المقاولة")} ${activeIndex + 1}`} className="mx-auto max-h-64 w-full rounded-xl bg-slate-100 object-contain" />
                    {images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedConstructionImage(index)} aria-label={`${t("عرض الصورة")} ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`shrink-0 rounded border-2 p-1 ${index === activeIndex ? "border-blue-600" : "border-transparent"}`}><img src={image} alt="" className="h-16 w-24 rounded object-cover" /></button>)}</div>}
                  </>;
                })()}
              </div>
            )}
            {offersLoading ? <p role="status" className="py-10 text-center text-slate-500">{t("جاري تحميل العروض...")}</p> : offers.length ? (
              <div className="mt-5 space-y-4">
                <h3 className="font-semibold text-slate-800">{t("عروض الشركات")}</h3>
                {offers.map((offer) => {
                  const id = offerId(offer);
                  const status = offerStatus(offer);
                  const company = offer.company_name || offer.company?.name || offer.username || offer.user?.name || t("شركة");
                  const price = offer.price ?? offer.amount ?? offer.offer_price;
                  return (
                    <article key={id ?? `${company}-${price}`} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{company}</h3>
                          {price != null && <p className="mt-1 text-[#2864b5]">{t("السعر: ")}{Number(price).toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</p>}
                          <p className="mt-1 text-sm text-slate-500">{status === 2 ? t("مقبول") : status === 1 ? t("مرفوض") : t("بانتظار الرد")}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={!id || !!updatingOfferId || status === 2} onClick={() => changeOfferStatus(offer, 2)} className="rounded-lg bg-[#459f91] px-4 py-2 text-sm text-white disabled:opacity-50">{updatingOfferId === id ? t("جاري...") : t("قبول")}</button>
                          <button type="button" disabled={!id || !!updatingOfferId || status === 1} onClick={() => changeOfferStatus(offer, 1)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-800 disabled:opacity-50">{updatingOfferId === id ? t("جاري...") : t("رفض")}</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : !offersError && <p className="py-10 text-center text-slate-500">{t("لا توجد عروض شركات لهذا الطلب حاليًا.")}</p>}
            {offersError && <p role="alert" className="mt-4 text-sm text-red-600">{offersError}</p>}
          </section>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <section role="alertdialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-7 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-800">{t("هل أنت متأكد من حذف طلب المقاولة؟")}</h2>
            <p className="mt-3 text-sm text-slate-500">{t("لا يمكن استرجاع الطلب بعد حذفه.")}</p>
            <div className="mt-7 flex justify-center gap-3">
              <button type="button" onClick={() => setPendingDelete(null)} disabled={deleting} className="rounded-lg bg-slate-100 px-6 py-3 text-slate-700">{t("إلغاء")}</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-lg bg-red-500 px-6 py-3 text-white disabled:opacity-60">{deleting ? t("جاري الحذف...") : t("حذف الطلب")}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
