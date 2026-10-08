import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faUser } from "@fortawesome/free-solid-svg-icons";
import $ from "jquery";
import "owl.carousel/dist/assets/owl.carousel.css";
import { buyAqarNow, getAqar, getOwner, getProfile, getUserAqars, storeComment } from "../api/auth";
import { showToast } from "../utils/notifications";
import { getImageUrls } from "../utils/media";
import { getLanguage, t, useLanguage } from "../i18n";
import ValidatedForm from "../Component/ValidatedForm";

window.jQuery = window.$ = $;
// Owl Carousel 2 expects two jQuery helpers removed in jQuery 4.
$.type ||= (value) => value == null
  ? String(value)
  : Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
$.camelCase ||= (value) => String(value).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
require("owl.carousel");

const imagesOf = (item) => getImageUrls(item);
const avatarUrlOf = (...records) => {
  const fields = [
    "avatar_url", "photo_url", "image_url", "profile_image", "profile_photo",
    "profile_picture", "avatar", "photo", "picture", "image", "image_path",
  ];
  const candidates = [];
  const collect = (record, depth = 0) => {
    if (!record || typeof record !== "object" || depth > 3) return;
    fields.forEach((field) => candidates.push(record[field]));
    ["user", "profile", "owner", "main_data", "data"].forEach((key) => collect(record[key], depth + 1));
  };
  records.forEach((record) => collect(record));
  const avatar = candidates
    .map((candidate) => typeof candidate === "string" ? candidate : candidate?.url || candidate?.image_url || candidate?.path || "")
    .find((candidate) => candidate.trim());
  if (!avatar) return "";
  try { return new URL(avatar, "https://sahmre.site/").toString(); } catch { return avatar; }
};

const reviewAvatarOf = (review) => avatarUrlOf(review);

export default function PropertyDetails() {
  const { language } = useLanguage();
  const { propertyId } = useParams();
  const locationState = useLocation();
  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [currentUserPropertyIds, setCurrentUserPropertyIds] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenGalleryOpen, setFullscreenGalleryOpen] = useState(false);
  const mainCarouselRef = useRef(null);
  const thumbnailCarouselRef = useRef(null);
  const images = useMemo(() => property ? imagesOf(property) : [], [property]);
  const imageCount = images.length;
  const imageSignature = images.join("|");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [purchaseConfirmOpen, setPurchaseConfirmOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getAqar(propertyId)
      .then((response) => {
        const payload = response?.data?.data;
        return Array.isArray(payload) ? payload[0] : payload?.data || payload;
      })
      .then((item) => {
        if (!active) return;
        setProperty(item || null);
        setActiveImage(0);
        setSelectedRating(0);
        setReviewText("");
        setSubmittedReviews([]);
        if (!item) setError(true);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [propertyId, language]);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(({ data: responseData }) => {
        const data = responseData?.data ?? responseData;
        const profile = data?.main_data ?? data?.user ?? data?.profile ?? data;
        if (active) setCurrentUserProfile(profile || null);
      })
      .catch(() => { if (active) setCurrentUserProfile(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getUserAqars()
      .then((response) => {
        const payload = response?.data?.data;
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (active) {
          setCurrentUserPropertyIds(items
            .map((item) => item?.id ?? item?.aqar_id ?? item?.property_id ?? item?.post_id)
            .filter((id) => id !== undefined && id !== null)
            .map(String));
        }
      })
      .catch(() => { if (active) setCurrentUserPropertyIds([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const ownerId = property?.user_id ?? property?.owner_id ?? property?.user?.id ?? property?.owner?.id;
    if (!ownerId) {
      setOwner(null);
      return undefined;
    }
    let active = true;
    getOwner(ownerId)
      .then((response) => {
        const payload = response?.data?.data;
        const ownerData = payload?.main_data ?? payload?.data?.main_data ?? payload?.owner ?? payload;
        if (active) setOwner(ownerData || null);
      })
      .catch(() => { if (active) setOwner(null); });
    return () => { active = false; };
  }, [property, language]);

  useEffect(() => {
    const mainElement = mainCarouselRef.current;
    const thumbnailsElement = thumbnailCarouselRef.current;
    setActiveImage(0);
    if (!mainElement || !imageCount) return undefined;

    const $main = $(mainElement);
    const $thumbnails = thumbnailsElement ? $(thumbnailsElement) : null;
    const isRtl = language === "ar";
    $main.owlCarousel({
      items: 1,
      loop: false,
      rewind: true,
      dots: false,
      nav: false,
      rtl: isRtl,
      smartSpeed: 400,
      mouseDrag: imageCount > 1,
      touchDrag: imageCount > 1,
    });
    if ($thumbnails) {
      $thumbnails.owlCarousel({
        items: 2,
        loop: false,
        rewind: true,
        dots: false,
        nav: false,
        rtl: isRtl,
        margin: 12,
        smartSpeed: 300,
      responsive: { 0: { items: 2 }, 640: { items: 3 }, 1024: { items: 5 } },
      });
    }

    const syncActiveImage = (event) => {
      const index = event.item?.index ?? 0;
      setActiveImage(index);
      $thumbnails?.trigger("to.owl.carousel", [index, 300, true]);
    };
    $main.on("changed.owl.carousel", syncActiveImage);

    return () => {
      $main.off("changed.owl.carousel", syncActiveImage);
      $main.trigger("destroy.owl.carousel");
      $thumbnails?.trigger("destroy.owl.carousel");
    };
  }, [imageSignature, imageCount, language]);

  useEffect(() => {
    if (!fullscreenGalleryOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") setFullscreenGalleryOpen(false);
      if (event.key === "ArrowLeft") $(mainCarouselRef.current).trigger("prev.owl.carousel", [300]);
      if (event.key === "ArrowRight") $(mainCarouselRef.current).trigger("next.owl.carousel", [300]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenGalleryOpen]);

  if (loading) return <main className="min-h-[60vh] py-16 text-center text-slate-600">{t("جاري تحميل تفاصيل العقار...")}</main>;
  if (error || !property) return <main className="min-h-[60vh] py-16 text-center text-slate-600">{t("تعذر العثور على هذا العقار.")}</main>;

  const title = property.title || "عقار";
  const location = [property.area_parent_title, property.area].filter(Boolean).map((part) => t(part)).join(" - ");
  const price = Number(property.final_price ?? property.price) || 0;
  const currentUserId = currentUserProfile?.id ?? currentUserProfile?.user_id;
  const propertyOwnerId = property?.user_id ?? property?.owner_id ?? property?.user?.id ?? property?.owner?.id ?? owner?.id;
  const isOwnedByCurrentUser = currentUserId != null && propertyOwnerId != null &&
    String(currentUserId) === String(propertyOwnerId);
  const hidePurchaseAction = Boolean(locationState.state?.hidePurchaseAction) ||
    isOwnedByCurrentUser || currentUserPropertyIds.includes(String(property.id)) ||
    property?.is_mine === true || property?.is_owner === true;
  const details = [
    ["عدد الحمامات", property.bathroom_no, "fa-bath"],
    ["المساحة", property.space, "fa-ruler-combined"],
    ["طبيعة العقار", property.aqar_nature_title || property.aqar_nature || property.nature_title, "fa-house"],
    ["عدد الغرف", property.room_no, "fa-bed"],
    ["الدور", property.floor, "fa-building"],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");
  const publishDate = property.created_at || property.created_date || property.date || "";
  const ownerName = property.username || property.owner_name || property.user?.name || "سهم للخدمات العقارية";
  const displayedOwnerName = owner?.name || owner?.username || ownerName;
  const ownerAvatar = avatarUrlOf(owner) || (isOwnedByCurrentUser ? avatarUrlOf(currentUserProfile) : "");
  const ownerRating = Math.max(0, Math.min(5, Number(owner?.stars ?? owner?.rating) || 0));
  const ownerComments = Array.isArray(owner?.comments) ? owner.comments : [];
  const reviewCount = Number(property.reviews_count ?? property.comments_count ?? property.comments?.length ?? 0) + submittedReviews.length;
  const reviewItems = [...(Array.isArray(property.reviews) ? property.reviews : Array.isArray(property.comments) ? property.comments : []), ...submittedReviews];
  const ratedReviews = reviewItems.map((review) => Number(review.rating ?? review.stars) || 0).filter((rating) => rating > 0);
  const averageRating = Number(property.rating) || (ratedReviews.length
    ? ratedReviews.reduce((sum, rating) => sum + rating, 0) / ratedReviews.length
    : 0);
  const submitReview = async (event) => {
    event.preventDefault();
    const comment = reviewText.trim();
    if (!comment || !selectedRating || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      const response = await storeComment({
        model: "Post",
        model_id: property.id,
        body: comment,
        stars: selectedRating,
      });
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || "تعذر إرسال التقييم.");
      }
      const savedComment = result.data?.data || result.data || {};
      setSubmittedReviews((reviews) => [...reviews, {
        id: savedComment.id || `review-${Date.now()}`,
        username: savedComment.username || savedComment.user?.name || currentUserProfile?.name || currentUserProfile?.full_name || "أنت",
        avatar: savedComment.avatar_url || savedComment.avatar || savedComment.user?.avatar_url || savedComment.user?.avatar || currentUserProfile?.avatar_url || currentUserProfile?.photo_url || currentUserProfile?.image_url || currentUserProfile?.profile_image || currentUserProfile?.profile_photo || currentUserProfile?.avatar || currentUserProfile?.image || "",
        body: savedComment.body || savedComment.comment || comment,
        stars: Number(savedComment.stars ?? savedComment.rating) || selectedRating,
      }]);
      setReviewText("");
      setSelectedRating(0);
      showToast(result.message || t("تم إرسال تقييمك بنجاح."));
    } catch (requestError) {
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر إرسال التقييم، حاول مرة أخرى."), "error");
    } finally {
      setReviewSubmitting(false);
    }
  };
  const confirmPurchase = async () => {
    setPurchasing(true);
    try {
      const response = await buyAqarNow(property.id);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || "تعذر إتمام الشراء.");
      }
      setPurchaseConfirmOpen(false);
      showToast(result.message || t("تمت إضافة العقار إلى مشترياتك."));
    } catch (requestError) {
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر إتمام الشراء."), "error");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-[70vh] bg-white">
        {images.length ? (
          <>
            <div className="relative w-full px-2 sm:px-5 lg:px-8">
              <div className="property-main-carousel owl-carousel" ref={mainCarouselRef}>
                {images.map((image, index) => <div key={`${image}-${index}`} className="flex h-[48vh] min-h-[300px] items-center justify-center sm:h-[56vh] lg:h-[60vh]"><button type="button" onClick={() => setFullscreenGalleryOpen(true)} aria-label={`${t("تكبير الصورة")} ${index + 1}`} className="flex h-full w-full items-center justify-center"><img src={image} alt={`${title} ${index + 1}`} className="max-h-full max-w-[90vw] cursor-zoom-in object-contain" /></button></div>)}
              </div>
              {images.length > 1 && <>
                <button type="button" onClick={() => $(mainCarouselRef.current).trigger("prev.owl.carousel", [400])} aria-label={t("الصورة السابقة")} className="absolute left-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] bg-white text-[#419e8e] transition hover:bg-[#419e8e] hover:text-white sm:left-8 lg:left-12"><FontAwesomeIcon icon={faChevronLeft} /></button>
                <button type="button" onClick={() => $(mainCarouselRef.current).trigger("next.owl.carousel", [400])} aria-label={t("الصورة التالية")} className="absolute right-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] bg-white text-[#419e8e] transition hover:bg-[#419e8e] hover:text-white sm:right-8 lg:right-12"><FontAwesomeIcon icon={faChevronRight} /></button>
              </>}
            </div>
            <div className="relative mx-auto mt-5 min-h-[112px] w-full px-12 sm:px-16">
              {images.length > 1 && <button type="button" onClick={() => $(mainCarouselRef.current).trigger("prev.owl.carousel", [400])} aria-label={t("الصورة السابقة")} className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] text-[#419e8e] hover:bg-[#419e8e] hover:text-white sm:left-4"><FontAwesomeIcon icon={faChevronLeft} /></button>}
              <div className="w-full min-w-0">
                <div className="property-thumbnails-carousel owl-carousel" ref={thumbnailCarouselRef}>
                  {images.map((image, index) => <div key={`${image}-${index}`} className="px-1 py-1"><button type="button" onClick={() => $(mainCarouselRef.current).trigger("to.owl.carousel", [index, 400, true])} aria-current={index === activeImage ? "true" : undefined} className={`block w-full rounded border-2 p-1 transition-colors ${index === activeImage ? "border-blue-600" : "border-transparent hover:border-blue-300"}`}><img src={image} alt={`${title} ${index + 1}`} className="h-28 w-full rounded object-cover" /></button></div>)}
                </div>
              </div>
              {images.length > 1 && <button type="button" onClick={() => $(mainCarouselRef.current).trigger("next.owl.carousel", [400])} aria-label={t("الصورة التالية")} className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] text-[#419e8e] hover:bg-[#419e8e] hover:text-white sm:right-4"><FontAwesomeIcon icon={faChevronRight} /></button>}
            </div>
          </>
        ) : <div className="flex min-h-[280px] items-center justify-center sm:min-h-[350px]"><p className="text-slate-400">{t("لا توجد صور لهذا العقار")}</p></div>}
      {fullscreenGalleryOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[12000] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={t("معرض صور العقار")}>
          <button type="button" onClick={() => setFullscreenGalleryOpen(false)} aria-label={t("إغلاق")} className="absolute right-5 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-700 hover:bg-slate-200">×</button>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-16 py-12 sm:px-24">
            <img src={images[activeImage]} alt={`${title} ${activeImage + 1}`} className="max-h-full max-w-full object-contain" />
            {images.length > 1 && <>
              <button type="button" onClick={() => $(mainCarouselRef.current).trigger("prev.owl.carousel", [300])} aria-label={t("الصورة السابقة")} className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] bg-white text-[#419e8e] hover:bg-[#419e8e] hover:text-white sm:left-10"><FontAwesomeIcon icon={faChevronLeft} /></button>
              <button type="button" onClick={() => $(mainCarouselRef.current).trigger("next.owl.carousel", [300])} aria-label={t("الصورة التالية")} className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#419e8e] bg-white text-[#419e8e] hover:bg-[#419e8e] hover:text-white sm:right-10"><FontAwesomeIcon icon={faChevronRight} /></button>
            </>}
          </div>
          {images.length > 1 && <div className="mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-4 pb-5 sm:px-8">
            {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => $(mainCarouselRef.current).trigger("to.owl.carousel", [index, 300, true])} aria-current={index === activeImage ? "true" : undefined} className={`h-20 w-32 shrink-0 overflow-hidden rounded border-2 p-1 transition-colors sm:h-24 sm:w-48 ${index === activeImage ? "border-blue-600" : "border-transparent hover:border-blue-300"}`}><img src={image} alt={`${title} ${index + 1}`} className="h-full w-full rounded object-cover" /></button>)}
          </div>}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-right"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>{(property.aqar_nature_title || property.aqar_nature || property.nature_title) && <span className="rounded bg-slate-100 px-4 py-2 text-blue-700">{t(property.aqar_nature_title || property.aqar_nature || property.nature_title)}</span>}</div>
            {location && <p className="mt-3 text-slate-700"><i className="fa-solid fa-location-dot ml-2 text-slate-500" />{location}</p>}
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500"><span><i className="fa-regular fa-calendar ml-2" />{publishDate || "—"}</span><span><i className="fa-regular fa-comments ml-2" />{reviewCount}</span></div>
          </div>
          <aside className="flex flex-row items-center justify-between sm:min-w-[190px] sm:flex-col sm:items-start sm:gap-8"><strong className="text-xl text-blue-700 sm:text-2xl">${price}</strong>{!hidePurchaseAction && <button type="button" onClick={() => setPurchaseConfirmOpen(true)} className="group relative overflow-hidden rounded bg-[#419e8e] px-7 py-3 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B65B3] focus:ring-offset-2"><span aria-hidden="true" className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" /><span className="relative z-10">{t("اشترِ الآن")}</span></button>}</aside>
        </div>

        <section aria-label={t("بيانات المالك")} className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
            {ownerAvatar ? <img src={ownerAvatar} alt="" className="h-full w-full object-cover" /> : <FontAwesomeIcon icon={faUser} className="text-3xl" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">{t("صاحب العقار")}: {displayedOwnerName}</h2>
            {owner?.area && <p className="mt-1 text-sm text-slate-500">{t(owner.area)}</p>}
            <div className="mt-2 flex items-center gap-1" aria-label={`${ownerRating} من 5`}>
              {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= ownerRating ? "text-amber-400" : "text-slate-300"}>★</span>)}
              <span className="mr-1 text-sm text-slate-500">({ownerComments.length})</span>
            </div>
          </div>
          {owner?.commercial_number && <p className="text-sm text-slate-600">{t("رقم السجل التجاري")}: {owner.commercial_number}</p>}
        </section>

        <div className="mt-12 space-y-10">
          <section><h2 className="border-r-2 border-blue-600 pr-3 font-bold text-slate-900">{t("الوصف")}</h2><p className="mt-3 whitespace-pre-line rounded bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm">{property.description || property.details || t("لا يوجد وصف لهذا العقار.")}</p></section>
          <section><h2 className="border-r-2 border-blue-600 pr-3 font-bold text-slate-900">{t("المحتوى")}</h2><dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value, icon]) => <div key={label} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded bg-[#e3f1ef] text-[#419e8e]"><i className={`fa-solid ${icon}`} /></span><div><dt className="text-sm text-slate-700">{t(label)}</dt><dd className="mt-1 text-xs text-slate-500">{t(value)}</dd></div></div>)}</dl></section>
          <section><h2 className="border-r-2 border-blue-600 pr-3 font-bold text-slate-900">{t("آراء العملاء")}</h2><div className="mt-3 flex items-center gap-1" aria-label={`متوسط التقييم ${averageRating.toFixed(1)} من 5`}>{[1, 2, 3, 4, 5].map((star) => <i key={star} className={`fa-solid fa-star ${star <= averageRating ? "text-amber-400" : "text-slate-300"}`} />)}<span className="mr-1 text-slate-500">({reviewCount})</span></div>
            {reviewItems.length > 0 && <div className="mt-5 space-y-3">{reviewItems.map((review, index) => {
              const rating = Number(review.rating ?? review.stars) || 0;
              const avatar = reviewAvatarOf(review);
              return (
                <article key={review.id || index} className="flex items-start gap-3 rounded border border-slate-200 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <FontAwesomeIcon icon={faUser} className="text-2xl" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-slate-800">{review.username || review.user?.name || t("عميل")}</strong>
                    <div className="mt-1 flex items-center gap-0.5" aria-label={`${rating} من 5`}>
                      {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= rating ? "text-amber-400" : "text-slate-300"}>★</span>)}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{review.comment || review.message || review.body}</p>
                  </div>
                </article>
              );
            })}</div>}
          </section>
          <section><h2 className="border-r-2 border-blue-600 pr-3 font-bold text-slate-900">{t("أضف تقييمك")}</h2><ValidatedForm onSubmit={submitReview}>
            <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label={t("اختر تقييمك")}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" role="radio" aria-checked={selectedRating === star} aria-label={`${star} نجوم`} disabled={reviewSubmitting} onClick={() => setSelectedRating(star)} className={`text-xl transition-colors disabled:cursor-wait ${star <= selectedRating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}>★</button>)}</div>
            <textarea aria-label={t("اكتب تقييمك")} value={reviewText} disabled={reviewSubmitting} onChange={(event) => setReviewText(event.target.value)} placeholder={t("اكتب تقييمك هنا")} className="mt-3 h-32 w-full resize-y rounded border border-slate-300 p-3 outline-none focus:border-[#419e8e] focus:ring-1 focus:ring-[#419e8e] disabled:bg-slate-50" />
            <div className="mt-2 flex justify-start"><button type="submit" disabled={!reviewText.trim() || !selectedRating || reviewSubmitting} className="group relative overflow-hidden rounded bg-[#419e8e] px-7 py-2.5 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B65B3] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true" className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" /><span className="relative z-10">{reviewSubmitting ? t("جاري الإرسال...") : t("إرسال")}</span></button></div>
          </ValidatedForm></section>
        </div>
      </div>
      {purchaseConfirmOpen && <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !purchasing) setPurchaseConfirmOpen(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="purchase-confirm-title" aria-describedby="purchase-confirm-description" className="w-full max-w-md rounded-xl bg-white p-6 text-right shadow-2xl" dir="rtl">
          <h2 id="purchase-confirm-title" className="text-xl font-bold text-slate-900">{t("تأكيد الشراء")}</h2>
          <p id="purchase-confirm-description" className="mt-3 text-slate-600">{t("هل تريد شراء «")}{title}{t("» بسعر $")}{price.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}{t("؟")}</p>
          <div className="mt-6 flex gap-3"><button type="button" disabled={purchasing} onClick={() => setPurchaseConfirmOpen(false)} className="rounded border border-slate-300 px-5 py-2 text-slate-700 disabled:opacity-50">{t("إلغاء")}</button><button type="button" disabled={purchasing} onClick={confirmPurchase} className="rounded bg-[#419e8e] px-5 py-2 font-medium text-white transition hover:bg-[#2B65B3] disabled:cursor-wait disabled:opacity-60">{purchasing ? t("جاري الشراء...") : t("تأكيد الشراء")}</button></div>
        </section>
      </div>}
    </main>
  );
}
