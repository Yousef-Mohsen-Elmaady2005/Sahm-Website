import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBed, faCamera, faCircleExclamation, faCircleXmark, faPenToSquare, faRulerCombined, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import { Outlet, useNavigate } from "react-router-dom";
import ProfileSidebar from "../Component/ProfileSidebar";
import { changePassword, deleteAqar, getAreas, getAreaChildren, getProfile, getPurchases, getUserAqars, updateNotificationPreference, updateProfile } from "../api/auth";
import { useFavorites } from "../context/FavoritesContext";
import { useCompare } from "../context/CompareContext";
import { getLanguage, t, useLanguage } from "../i18n";
import { showToast } from "../utils/notifications";
import ValidatedForm from "../Component/ValidatedForm";

function ProfileField({ label, name, type = "text", value, onChange }) {
  return (
    <label className="block text-right text-base text-slate-800">
      <span className="mb-1.5 block">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#2B65B3] focus:ring-1 focus:ring-[#2B65B3]"
      />
    </label>
  );
}

export function AccountInfo() {
  const { language } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [updatingNotificationPreference, setUpdatingNotificationPreference] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [savedPhotoUrl, setSavedPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const savedPhotoObjectUrl = useRef("");

  useEffect(() => () => {
    if (savedPhotoObjectUrl.current) URL.revokeObjectURL(savedPhotoObjectUrl.current);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    getProfile()
      .then(({ data: responseData }) => {
        if (!isCurrent) return;

        const data = responseData?.data ?? responseData;
        const profile = data?.main_data ?? data?.user ?? data?.profile ?? data;
        setNotificationsEnabled(String(profile?.is_notify ?? "0") === "1");

        setForm((current) => ({
          ...current,
          name: profile?.name ?? profile?.full_name ?? "",
          email: profile?.email ?? "",
          phone:
            profile?.phone ??
            profile?.phone_number ??
            profile?.mobile ??
            profile?.mobile_number ??
            "",
        }));
        setAreaId(String(profile?.area_id ?? profile?.area?.id ?? ""));

        const imagePath =
          profile?.avatar_url ?? profile?.photo_url ?? profile?.image_url ??
          profile?.profile_image ?? profile?.profile_photo ?? profile?.avatar ?? profile?.image;
        if (typeof imagePath === "string" && imagePath) {
          try {
            setProfileImage(new URL(imagePath, "https://sahmre.site/").toString());
          } catch {
            setProfileImage(imagePath);
          }
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setProfileError(error.response?.data?.message || t("تعذر تحميل بيانات الملف الشخصي"));
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingProfile(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [language]);

  useEffect(() => {
    let active = true;
    getAreas().then(async (response) => {
      const payload = response?.data?.data;
      const parents = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const childResponses = await Promise.all(parents.filter((area) => area.has_child).map((area) => getAreaChildren(area.id).catch(() => null)));
      const children = childResponses.flatMap((childResponse) => {
        const childPayload = childResponse?.data?.data;
        return Array.isArray(childPayload) ? childPayload : Array.isArray(childPayload?.data) ? childPayload.data : [];
      });
      if (active) setAreas([...parents, ...children].filter((area) => area.id && (area.title || area.name)));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleNotificationToggle = async () => {
    if (updatingNotificationPreference || loadingProfile) return;
    const nextValue = !notificationsEnabled;
    setUpdatingNotificationPreference(true);
    try {
      const response = await updateNotificationPreference(nextValue);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || t("تعذر تحديث إعداد الإشعارات."));
      }
      const updatedProfile = result.data?.main_data ?? result.data?.user ?? result.data?.profile ?? result.data;
      const confirmedValue = updatedProfile?.is_notify;
      const confirmedEnabled = confirmedValue == null
        ? nextValue
        : [1, true, "1"].includes(confirmedValue);
      setNotificationsEnabled(confirmedEnabled);
      if (confirmedEnabled !== nextValue) {
        showToast(t("السيرفر لم يؤكد تغيير إعداد الإشعارات."), "error");
      } else {
        showToast(result.message || t(nextValue ? "تم تفعيل الإشعارات." : "تم إيقاف الإشعارات."));
      }
    } catch (requestError) {
      showToast(requestError.response?.data?.message || requestError.message || t("تعذر تحديث إعداد الإشعارات."), "error");
    } finally {
      setUpdatingNotificationPreference(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaved(false);
    setSaving(true);
    setProfileError("");
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("_method", "put");
    payload.append("email", form.email);
    payload.append("phone", form.phone);
    payload.append("area_id", areaId);
    if (photoFile) payload.append("photo_profile", photoFile);
    try {
      const response = await updateProfile(payload);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") throw new Error(result.message || "تعذر حفظ بيانات الحساب.");
      setSaved(true);
      if (photoFile) {
        if (savedPhotoObjectUrl.current) URL.revokeObjectURL(savedPhotoObjectUrl.current);
        savedPhotoObjectUrl.current = URL.createObjectURL(photoFile);
        setSavedPhotoUrl(savedPhotoObjectUrl.current);
      }
      setPhotoFile(null);
      showToast(result.message || t("تم تحديث بيانات الحساب بنجاح."));
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setProfileError((validationErrors && Object.values(validationErrors).flat()[0]) || requestError.response?.data?.message || requestError.message || t("تعذر حفظ بيانات الحساب."));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordError("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (passwordForm.password.length < 6) {
      setPasswordError(t("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."));
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError(t("تأكيد كلمة المرور غير مطابق."));
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changePassword(passwordForm);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || "تعذر تغيير كلمة المرور.");
      }
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
      showToast(result.message || t("تم تغيير كلمة المرور بنجاح."));
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setPasswordError((validationErrors && Object.values(validationErrors).flat()[0]) || requestError.response?.data?.message || requestError.message || t("تعذر تغيير كلمة المرور."));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
        <section className="min-w-0">
          <div className="mb-8 flex min-h-[220px] items-start justify-center lg:justify-start">
            <label className="group relative flex h-[190px] w-full max-w-[240px] cursor-pointer items-end justify-center overflow-hidden rounded-lg bg-[#f7f8f9] pt-4 text-[#858585] outline-none focus-within:ring-2 focus-within:ring-[#2B65B3] sm:h-[220px] sm:max-w-[280px] lg:h-[200px] lg:w-[250px]">
              <input
                type="file"
                accept="image/*"
                aria-label={t("اختيار صورة شخصية")}
                className="sr-only"
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              />
              {photoUrl || savedPhotoUrl || profileImage ? (
                <img
                  src={photoUrl || savedPhotoUrl || profileImage}
                  alt={t("معاينة الصورة الشخصية")}
                  className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} aria-hidden="true" className="h-[82%] w-[82%]" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-[#83bfae]/0 text-white transition-colors duration-200 group-hover:bg-[#83bfae]/80 group-focus-within:bg-[#83bfae]/80">
                <FontAwesomeIcon icon={faCamera} className="rounded-full bg-white px-3 py-2 text-2xl text-[#479f90] opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
              </span>
            </label>
          </div>

          <div className="mb-7 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-right">
              <p className="font-medium text-slate-900">{t("استقبال الإشعارات")}</p>
              <p className="mt-1 text-sm text-slate-500">{notificationsEnabled ? t("الإشعارات مفعلة") : t("الإشعارات متوقفة")}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label={t("استقبال الإشعارات")}
              aria-checked={notificationsEnabled}
              onClick={handleNotificationToggle}
              disabled={loadingProfile || updatingNotificationPreference}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${notificationsEnabled ? "bg-[#459f91]" : "bg-slate-300"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${notificationsEnabled ? "right-1" : "left-1"}`} />
            </button>
          </div>

          <ValidatedForm
            className="grid grid-cols-1 gap-x-7 gap-y-5 sm:gap-y-6 md:grid-cols-2 lg:gap-y-7"
            onSubmit={handleSubmit}
          >
            {loadingProfile && (
              <p role="status" className="text-sm text-slate-500 md:col-span-2">{t("جاري تحميل بيانات الملف الشخصي...")}</p>
            )}
            {profileError && (
              <p role="alert" className="text-sm text-red-600 md:col-span-2">{profileError}</p>
            )}
            <ProfileField label={t("الاسم")} name="name" value={form.name} onChange={handleChange} />
            <ProfileField label={t("البريد الالكتروني")} name="email" type="email" value={form.email} onChange={handleChange} />
            <label className="block text-right text-base text-slate-800">
              <span className="mb-1.5 block">{t("المنطقة")}</span>
              <select value={areaId} onChange={(event) => { setAreaId(event.target.value); setSaved(false); }} className="h-12 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B65B3] focus:ring-1 focus:ring-[#2B65B3]">
                <option value="">{t("اختر المنطقة")}</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{t(area.title || area.name)}</option>)}
              </select>
            </label>
            <ProfileField label={t("رقم الجوال")} name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <div className="flex flex-col items-stretch gap-3 md:col-span-2 md:flex-row md:items-center md:gap-4">
              <button type="submit" disabled={saving} className="h-12 w-full rounded-md bg-[#459f91] px-10 text-base text-white transition hover:bg-[#398c80] disabled:opacity-60 md:h-[53px] md:w-[160px]">
                {saving ? t("جاري الحفظ...") : t("حفظ")}
              </button>
              {saved && <span role="status" className="text-sm text-[#398c80]">{t("تم حفظ التغييرات")}</span>}
            </div>
          </ValidatedForm>
          <ValidatedForm onSubmit={handlePasswordSubmit} className="mt-10 border-t border-slate-200 pt-7">
            <h2 className="mb-5 text-right text-xl font-semibold text-slate-900">{t("تغيير كلمة المرور")}</h2>
            <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProfileField label={t("كلمة المرور الحالية")} name="current_password" type="password" value={passwordForm.current_password} onChange={handlePasswordChange} />
              <ProfileField label={t("كلمة المرور الجديدة")} name="password" type="password" value={passwordForm.password} onChange={handlePasswordChange} />
              <ProfileField label={t("تأكيد كلمة المرور الجديدة")} name="password_confirmation" type="password" value={passwordForm.password_confirmation} onChange={handlePasswordChange} />
            </div>
            {passwordError && <p role="alert" className="mt-4 text-right text-sm text-red-600">{passwordError}</p>}
            <button type="submit" disabled={changingPassword} className="mt-5 h-12 w-full rounded-md bg-[#459f91] px-8 text-base text-white transition hover:bg-[#398c80] disabled:opacity-60 sm:w-auto">
              {changingPassword ? t("جاري تغيير كلمة المرور...") : t("تغيير كلمة المرور")}
            </button>
          </ValidatedForm>
        </section>
  );
}

export function ProfileEmptyState() {
  return (
    <section className="flex min-h-[240px] items-start justify-center pt-8 sm:min-h-[320px] sm:pt-10 lg:min-h-[420px]">
      <p className="text-center text-base text-red-500">{t("لا يوجد بيانات")}</p>
    </section>
  );
}

const getUserAqarItems = (response) => {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const propertyImage = (property) => {
  const image = property?.image || property?.image_url || property?.cover_image || property?.images?.[0];
  if (typeof image === "string") return image;
  return image?.url || image?.image_url || "";
};

function MyPropertyImage({ image, property }) {
  const { isFavorite, isPending, toggle } = useFavorites();
  const comparison = useCompare();
  const favorite = isFavorite(property.id);
  const compared = comparison.isCompared(property.id);

  return (
    <div className="group relative aspect-[2/1] overflow-hidden rounded-[18px] bg-slate-100">
      {image ? (
        <img src={image} alt={property.title || t("صورة العقار")} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">{t("لا توجد صورة")}</div>
      )}
      <div className="absolute inset-0 flex flex-row-reverse items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:gap-[56px]">
        <button
          type="button"
          aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          aria-pressed={favorite}
          disabled={isPending(property.id)}
          onClick={(event) => { event.stopPropagation(); toggle(property); }}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60 md:h-[52px] md:w-[52px] ${favorite ? "bg-white text-[#419e8e]" : "bg-black/80 text-white hover:bg-black"}`}
        >
          <i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart text-lg md:text-xl`} aria-hidden="true"></i>
        </button>
        <button
          type="button"
          aria-label={t("مقارنة العقار")}
          aria-pressed={compared}
          disabled={comparison.isPending(property.id)}
          onClick={(event) => { event.stopPropagation(); comparison.toggle(property); }}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition disabled:opacity-60 md:h-[52px] md:w-[52px] ${compared ? "bg-[#419e8e]" : "bg-black/80 hover:bg-black"}`}
        >
          <i className="fa-solid fa-right-left text-lg md:text-xl" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          aria-label={t("مشاركة العقار")}
          onClick={(event) => event.stopPropagation()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black md:h-[52px] md:w-[52px]"
        >
          <i className="fa-solid fa-arrow-up-from-bracket text-lg md:text-xl" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}

export function MyProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingIds, setDeletingIds] = useState([]);
  const [propertyPendingDeletion, setPropertyPendingDeletion] = useState(null);

  useEffect(() => {
    let active = true;
    getUserAqars()
      .then((response) => {
        if (active) setProperties(getUserAqarItems(response));
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "تعذر تحميل عقاراتك المعروضة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [language]);

  const handleDelete = (property) => setPropertyPendingDeletion(property);

  const confirmDelete = async () => {
    const property = propertyPendingDeletion;
    if (!property) return;
    setDeletingIds((current) => [...current, property.id]);
    try {
      const response = await deleteAqar(property.id);
      const result = response.data || {};
      const message = String(result.message || "");
      if (/permission|unauthori[sz]ed|صلاحية|مصرح|مسموح|إذن/i.test(message)) {
        throw new Error(message || "ليس لديك صلاحية لحذف هذا العقار.");
      }
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(message || "تعذر حذف العقار.");
      }
      setProperties((current) => current.filter((item) => String(item.id) !== String(property.id)));
      setPropertyPendingDeletion(null);
      showToast(message || t("تم حذف العقار بنجاح."));
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "تعذر حذف العقار. حاول مرة أخرى.";
      setPropertyPendingDeletion(null);
      showToast(message, "error");
    } finally {
      setDeletingIds((current) => current.filter((id) => String(id) !== String(property.id)));
    }
  };

  if (loading) {
    return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل عقاراتك...")}</p>;
  }
  if (error) {
    return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  }
  if (!properties.length) {
    return <p className="py-12 text-center text-slate-500">{t("لا توجد عقارات معروضة في حسابك.")}</p>;
  }

  return (
    <section dir="rtl" aria-label={t("العقارات المعروضة")}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {properties.map((property) => {
          const image = propertyImage(property);
          const price = Number(property.final_price ?? property.price) || 0;
          const location = [property.area_parent_title, property.area].filter(Boolean).map((part) => t(part)).join(" - ");
          return (
            <article
              key={property.id}
              role="link"
              tabIndex={0}
              aria-label={`عرض تفاصيل ${property.title || "العقار"}`}
              onClick={() => navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title || "عقار", hidePurchaseAction: true } })}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title || "عقار", hidePurchaseAction: true } });
                }
              }}
              className="flex h-full cursor-pointer flex-col rounded-[20px] bg-[#f7f7f7] p-3 sm:p-5"
            >
              <MyPropertyImage image={image} property={property} />
              <div className="flex flex-1 flex-col py-4 text-right">
                <p className="font-bold text-blue-600">${price.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{property.title || t("عقار بدون عنوان")}</h2>
                {location && <p className="mt-1 text-sm text-slate-500">{location}</p>}
                {property.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{property.description}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                  {property.space != null && <span>{t("المساحة: ")}{property.space}{t(" م²")}</span>}
                  {property.room_no != null && <span>{property.room_no}{t(" غرفة")}</span>}
                  {property.bathroom_no != null && <span>{property.bathroom_no}{t(" حمام")}</span>}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <button
                    type="button"
                    aria-label={`${t("تعديل العقار")} ${property.title || ""}`}
                    onClick={(event) => { event.stopPropagation(); navigate(`/edit-property/${property.id}`, { state: { property } }); }}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#459f91] text-white transition hover:bg-[#398c80]"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                    {t("تعديل")}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); handleDelete(property); }}
                    disabled={deletingIds.some((id) => String(id) === String(property.id))}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-slate-200 text-red-600 transition hover:bg-slate-300 disabled:cursor-wait disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                    {deletingIds.some((id) => String(id) === String(property.id)) ? t("جاري الحذف...") : t("حذف")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {propertyPendingDeletion && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
            aria-describedby="delete-property-description"
            className="w-full max-w-[600px] rounded-md bg-white px-6 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
          >
            <FontAwesomeIcon icon={faCircleExclamation} className="text-[88px] text-orange-300 sm:text-[104px]" aria-hidden="true" />
            <h2 id="delete-property-title" className="mt-8 text-2xl font-bold text-slate-700 sm:text-3xl">{t("\n              هل أنت متأكد من حذف هذا العنصر؟\n            ")}</h2>
            <p id="delete-property-description" className="mt-4 text-base text-slate-500 sm:text-lg">{t("\n              إذا قمت بحذف هذا العنصر لن تتمكن من استرجاعه مرة أخرى!\n            ")}</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPropertyPendingDeletion(null)}
                disabled={deletingIds.length > 0}
                className="min-w-[78px] rounded-lg border-2 border-slate-200 bg-slate-100 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >{t("\n                لا\n              ")}</button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingIds.length > 0}
                className="min-w-[88px] rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingIds.length > 0 ? t("جاري الحذف...") : t("نعم")}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export function MyPurchases() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPurchases()
      .then((response) => {
        const payload = response?.data?.data;
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (active) setPurchases(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "تعذر تحميل مشترياتك حاليًا.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  if (loading) return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل مشترياتك...")}</p>;
  if (error) return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  if (!purchases.length) return <p className="py-12 text-center text-slate-500">{t("لا توجد مشتريات في حسابك.")}</p>;

  return (
    <section dir="rtl" aria-label={t("مشترياتي")}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {purchases.map((purchase) => {
          const image = propertyImage(purchase);
          const title = purchase.title || "عقار";
          const location = [purchase.area_parent_title, purchase.area].filter(Boolean).join(" - ");
          const propertyId = purchase.aqar_id ?? purchase.post_id ?? purchase.id;
          return (
            <article
              key={`${propertyId}-${purchase.model_id ?? "purchase"}`}
              role="link"
              tabIndex={0}
              aria-label={`عرض تفاصيل ${title}`}
              onClick={() => navigate(`/real-estate/${propertyId}`, { state: { propertyTitle: title, hidePurchaseAction: true } })}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  navigate(`/real-estate/${propertyId}`, { state: { propertyTitle: title, hidePurchaseAction: true } });
                }
              }}
              className="flex h-full cursor-pointer flex-col rounded-[20px] bg-[#f7f7f7] p-3 sm:p-5"
            >
              <MyPropertyImage image={image} property={purchase} />
              <div className="flex flex-1 flex-col py-4 text-right">
                <p className="font-bold text-blue-600">${Number(purchase.final_price ?? purchase.price ?? 0).toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
                {location && <p className="mt-1 text-sm text-slate-500">{location}</p>}
                {purchase.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{purchase.description}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                  {purchase.space != null && <span>{t("المساحة: ")}{purchase.space}{t(" م²")}</span>}
                  {purchase.room_no != null && <span>{purchase.room_no}{t(" غرفة")}</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function FavoriteProperties() {
  const navigate = useNavigate();
  const { favorites, error } = useFavorites();

  if (error && !favorites.length) {
    return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  }
  if (!favorites.length) {
    return <p className="py-12 text-center text-slate-500">{t("قائمة المفضلة فارغة.")}</p>;
  }

  return (
    <section dir="rtl" aria-label={t("العقارات المفضلة")}>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {favorites.map((property) => {
          const image = propertyImage(property);
          const price = Number(property.final_price ?? property.price) || 0;
          const location = [property.area_parent_title, property.area].filter(Boolean).map((part) => t(part)).join(" - ");
          return (
            <article
              key={property.id}
              role="link"
              tabIndex={0}
              aria-label={`${t("عرض تفاصيل ")}${property.title || t("العقار")}`}
              onClick={() => navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title || "عقار" } })}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  navigate(`/real-estate/${property.id}`, { state: { propertyTitle: property.title || "عقار" } });
                }
              }}
              className="cursor-pointer rounded-[20px] bg-[#f7f7f7] p-3 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2864b5] sm:p-5"
            >
              <MyPropertyImage image={image} property={property} />
              <div className="py-4 text-right">
                <p className="font-bold text-blue-600">${price.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{property.title || t("عقار بدون عنوان")}</h2>
                {location && <p className="mt-1 text-sm text-slate-500">{location}</p>}
                {property.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{property.description}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CompareProperties() {
  const { compares, error, isPending, toggle } = useCompare();

  if (error && !compares.length) {
    return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  }
  if (!compares.length) {
    return <p className="py-12 text-center text-slate-500">{t("قائمة المقارنة فارغة.")}</p>;
  }

  return (
    <section dir="rtl" aria-label={t("العقارات في المقارنة")}>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid h-[90px] grid-cols-4 items-center rounded-2xl bg-white text-center text-base font-semibold text-[#2864b5]">
            <span>{t("صور العقار")}</span>
            <span>{t("سعر العقار")}</span>
            <span>{t("عدد الغرف")}</span>
            <span>{t("مساحة العقار")}</span>
          </div>
          <div className="mt-5 flex flex-col gap-5">
            {compares.map((property) => {
              const image = propertyImage(property);
              const price = Number(property.final_price ?? property.price) || 0;
              return (
                <article key={property.id} className="grid min-h-[200px] grid-cols-4 items-center rounded-[24px] bg-[#eeeeee] px-5 py-5 text-center text-base text-slate-700">
                  <div className="flex flex-col items-center gap-2">
                    {image ? (
                      <img src={image} alt={property.title || t("صورة العقار")} className="h-[125px] w-[188px] rounded-xl bg-slate-100 object-contain" />
                    ) : (
                      <div className="flex h-[125px] w-[188px] items-center justify-center rounded-xl bg-slate-300 text-sm text-slate-500">{t("لا توجد صورة")}</div>
                    )}
                    <button
                      type="button"
                      disabled={isPending(property.id)}
                      onClick={() => toggle(property)}
                      className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCircleXmark} aria-hidden="true" />{t("\n                      إزالة من المقارنة\n                    ")}</button>
                  </div>
                  <span className="font-medium text-[#2864b5]">${price.toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</span>
                  <span className="inline-flex items-center justify-center gap-1">
                    <FontAwesomeIcon icon={faBed} aria-hidden="true" />
                    {property.room_no ?? 0}{t(" غرفة\n                  ")}</span>
                  <span className="inline-flex items-center justify-center gap-1">
                    <FontAwesomeIcon icon={faRulerCombined} aria-hidden="true" />
                    {property.space ?? "—"}{property.space != null ? t(" م²") : ""}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Invoices() {
  const { language } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    let active = true;
    getPurchases()
      .then((response) => {
        const payload = response?.data?.data;
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (active) setInvoices(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "تعذر تحميل فواتيرك حاليًا.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  if (loading) return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل فواتيرك...")}</p>;
  if (error) return <p role="alert" className="py-12 text-center text-red-600">{error}</p>;
  if (!invoices.length) return <p className="py-12 text-center text-slate-500">{t("لا توجد فواتير في حسابك.")}</p>;

  return (
    <section dir="rtl" className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-5 text-center">
        <thead>
          <tr className="h-[90px] rounded-2xl bg-white text-lg font-semibold text-[#2864b5]">
            <th scope="col" className="rounded-tr-2xl px-4">{t("صورة العقار")}</th>
            <th scope="col" className="px-4">{t("عنوان العقار")}</th>
            <th scope="col" className="px-4">{t("السعر")}</th>
            <th scope="col" className="rounded-tl-2xl px-4">{t("إجراء")}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const title = invoice.title || "عقار";
            const image = propertyImage(invoice);
            return (
            <tr key={`${invoice.id}-${invoice.model_id ?? "purchase"}`} className="h-[165px] bg-[#eeeeee] text-base text-slate-900">
              <td className="rounded-r-[24px] px-6 py-4">
                {image ? <img src={image} alt={title} className="mx-auto h-[100px] w-[150px] rounded-xl object-cover" /> : <div className="mx-auto flex h-[100px] w-[150px] items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-500">{t("لا توجد صورة")}</div>}
              </td>
              <td className="px-6 py-4 font-medium">{title}</td>
              <td className="px-6 py-4">${Number(invoice.final_price ?? invoice.price ?? 0).toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</td>
              <td className="rounded-l-[24px] px-6 py-4">
                <button type="button" onClick={() => setSelectedInvoice(invoice)} className="text-[#2864b5] underline-offset-4 hover:underline">{t("\n                  عرض الفاتورة\n                ")}</button>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedInvoice(null); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="invoice-title" dir="rtl" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 id="invoice-title" className="text-xl font-bold text-slate-900">{t("تفاصيل العقار المشترى")}</h2>
              <button type="button" onClick={() => setSelectedInvoice(null)} aria-label={t("إغلاق الفاتورة")} className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">×</button>
            </div>
            <div className="pt-5">
              {propertyImage(selectedInvoice) && <img src={propertyImage(selectedInvoice)} alt={selectedInvoice.title || t("صورة العقار")} className="mb-5 max-h-[360px] w-full rounded-xl bg-slate-100 object-contain" />}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-bold text-slate-900">{selectedInvoice.title || t("عقار")}</h3>
                <strong className="text-xl text-[#2864b5]">${Number(selectedInvoice.final_price ?? selectedInvoice.price ?? 0).toLocaleString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</strong>
              </div>
              {[selectedInvoice.area_parent_title, selectedInvoice.area].filter(Boolean).length > 0 && (
                <p className="mt-2 text-slate-600">{[selectedInvoice.area_parent_title, selectedInvoice.area].filter(Boolean).join(" - ")}</p>
              )}
              {selectedInvoice.description && <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{selectedInvoice.description}</p>}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
                {selectedInvoice.space != null && <span>{t("المساحة: ")}{selectedInvoice.space}{t(" م²")}</span>}
                {selectedInvoice.room_no != null && <span>{selectedInvoice.room_no}{t(" غرفة")}</span>}
                {selectedInvoice.created_at && <span>{t("تاريخ الشراء: ")}{new Date(selectedInvoice.created_at).toLocaleDateString(getLanguage() === "ar" ? "ar-EG" : "en-US")}</span>}
                <span className="font-semibold text-emerald-700">{t("تم الدفع عن طريق الموقع")}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default function Account() {
  return (
    <main dir="rtl" className="min-h-[70vh] border-b border-slate-200 bg-[#fcfcfc] px-4 pb-12 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1620px] grid-cols-1 gap-6 pt-8 lg:grid-cols-[370px_minmax(0,1fr)] lg:gap-[25px] lg:pt-10">
        <div className="order-first lg:order-none lg:col-start-1 lg:row-start-1">
          <ProfileSidebar />
        </div>
        <div className="order-last min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
