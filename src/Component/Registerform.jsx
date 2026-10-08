import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faFlag,
  faAddressCard,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  registerRequest,
  getAreas,
  getAreaChildren,
  getUserTypes,
  getConstructionTypes,
  setAuthSession,
} from "../api/auth";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

export default function Register() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "",
    construction_type: "",
    commercial_number: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    country: "",
    city: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [constructionTypes, setConstructionTypes] = useState([]);
  const [loadingConstructionTypes, setLoadingConstructionTypes] = useState(true);
  const [loadingUserTypes, setLoadingUserTypes] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedUserType = userTypes.find((type) => String(type.id) === form.role);
  const hasTypeFlag = (value) => value === true || value === 1 || value === "1";
  const showConstructionType = hasTypeFlag(selectedUserType?.construction_type);
  const showCommercialNumber = hasTypeFlag(selectedUserType?.commercial_number);

  // تحميل الدول أول ما الصفحة تفتح
  useEffect(() => {
    getAreas()
      .then((res) => setCountries(res.data?.data || []))
      .catch(() =>
        setErrors((prev) => ({
          ...prev,
          general: "تعذر تحميل قائمة الدول، حاول مرة تانية",
        }))
      )
      .finally(() => setLoadingCountries(false));
  }, [language]);

  // أنواع الحسابات المتاحة للتسجيل.
  useEffect(() => {
    getUserTypes()
      .then((res) => {
        const types = Array.isArray(res.data?.data) ? res.data.data : [];
        setUserTypes(types);
        if (types.length) {
          setForm((prev) => ({ ...prev, role: prev.role || String(types[0].id) }));
        }
      })
      .catch(() =>
        setErrors((prev) => ({
          ...prev,
          general: "تعذر تحميل أنواع الحسابات، حاول مرة تانية",
        }))
      )
      .finally(() => setLoadingUserTypes(false));
  }, [language]);

  // أنواع المقاولات المعروضة في حقل التسجيل.
  useEffect(() => {
    getConstructionTypes()
      .then((res) => {
        const data = res.data?.data;
        setConstructionTypes(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => setConstructionTypes([]))
      .finally(() => setLoadingConstructionTypes(false));
  }, [language]);

  // تحميل المدن كل ما الدولة تتغير
  useEffect(() => {
    if (!form.country) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    getAreaChildren(form.country)
      .then((res) => setCities(res.data?.data || []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.country, language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country" ? { city: "" } : {}),
      ...(name === "role" ? { construction_type: "", commercial_number: "" } : {}),
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "country" ? { city: "" } : {}),
      ...(name === "role" ? { construction_type: "", commercial_number: "" } : {}),
      general: "",
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.role) newErrors.role = "نوع الحساب مطلوب";
    if (showConstructionType && !form.construction_type)
      newErrors.construction_type = "نوع المقاولة مطلوب";
    if (showCommercialNumber && !form.commercial_number.trim())
      newErrors.commercial_number = "رقم التسويق العقاري مطلوب";
    if (!form.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!form.email.trim()) newErrors.email = "البريد الالكتروني مطلوب";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "البريد الالكتروني غير صحيح";
    if (!form.phone.trim()) newErrors.phone = "رقم الجوال مطلوب";
    else if (!/^\+?\d{8,15}$/.test(form.phone.replace(/\s/g, "")))
      newErrors.phone = "رقم الجوال غير صحيح";
    if (!form.password) newErrors.password = "كلمة السر مطلوبة";
    else if (form.password.length < 6)
      newErrors.password = "كلمة السر لازم تكون 6 حروف على الأقل";
    if (!form.country) newErrors.country = "الدولة مطلوبة";
    else if (!form.city) newErrors.city = "المدينة مطلوبة";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const res = await registerRequest({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        type: Number(form.role),
        construction_type: showConstructionType ? form.construction_type : "",
        commercial_number: showCommercialNumber ? form.commercial_number : "",
        area_id: form.city, // id المدينة الحقيقي من السيرفر
      });
      const data = res.data;
      const token =
        data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
      if (typeof token !== "string" || !token.trim()) {
        throw new Error("استجابة إنشاء الحساب لا تحتوي على رمز دخول صالح.");
      }
      setAuthSession(token);
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      console.log("Register error:", data);

      if (data?.errors) {
        const serverErrors = {};
        Object.keys(data.errors).forEach((key) => {
          serverErrors[key] = data.errors[key][0];
        });
        setErrors(serverErrors);
      } else {
        setErrors({
          general: data?.message || err.message || "حصل خطأ، حاول مرة تانية",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "h-10 sm:h-11 lg:h-12 w-full rounded-md border bg-white text-sm sm:text-base text-gray-900 outline-none transition focus:border-[#459c8d] focus:ring-1 focus:ring-[#459c8d]";

  const iconRight =
    "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-800 sm:right-4";

  const borderClass = (field) =>
    errors[field] ? "border-red-500" : "border-gray-300";

  const Label = ({ htmlFor, children }) => (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm text-gray-900 sm:mb-3 sm:text-base"
    >
      {children}
      <span className="mr-1">*</span>
    </label>
  );

  const ErrorText = ({ field }) =>
    errors[field] ? (
      <p id={`register-${field}-error`} role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-right text-sm text-red-600">{t(errors[field])}</p>
    ) : null;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-20 xl:px-[135px] xl:py-14"
    >
      <div className="mx-auto w-full max-w-[1620px]">
        <h1 className="mb-8 text-xl font-medium text-[#459c8d] sm:mb-10 sm:text-2xl md:mb-12 lg:mb-16">{t("\n          إنشاء حساب مستخدم جديد -\n        ")}</h1>

        <ValidatedForm onSubmit={handleSubmit} skipValidation>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-[30px]">
            {/* تسجيل كـ */}
            <div className="min-w-0">
              <Label htmlFor="role">{t("تسجيل كـ")}</Label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  required
                  value={form.role}
                  onChange={handleChange}
                  disabled={loadingUserTypes || userTypes.length === 0}
                  className={`${inputBase} appearance-none pr-11 pl-10 sm:pr-12 ${borderClass(
                    "role"
                  )}`}
                >
                  {loadingUserTypes ? (
                    <option value="">{t("جاري تحميل أنواع الحسابات...")}</option>
                  ) : userTypes.length === 0 ? (
                    <option value="">{t("لا توجد أنواع حسابات متاحة")}</option>
                  ) : (
                    userTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {t(type.title || type.name)}
                    </option>
                    ))
                  )}
                </select>
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faAddressCard} />
                </span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  <FontAwesomeIcon icon={faChevronDown} />
                </span>
              </div>
              <ErrorText field="role" />
            </div>

            {showConstructionType && (
              <div className="min-w-0">
                <Label htmlFor="construction_type">{t("نوع المقاولة")}</Label>
                <div className="relative">
                  <select
                    id="construction_type"
                    name="construction_type"
                    required
                    value={form.construction_type}
                    onChange={handleChange}
                    disabled={loadingConstructionTypes || constructionTypes.length === 0}
                    className={`${inputBase} appearance-none pr-11 pl-10 sm:pr-12 ${borderClass("construction_type")}`}
                  >
                    <option value="" disabled>
                      {loadingConstructionTypes ? t("جاري تحميل الأنواع...") : constructionTypes.length ? t("اختر نوع المقاولة") : t("لا توجد أنواع متاحة")}
                    </option>
                    {constructionTypes.map((option) => (
                      <option key={option.id} value={option.id}>
                        {t(option.title || option.name)}
                      </option>
                    ))}
                  </select>
                  <span className={iconRight}>
                    <FontAwesomeIcon icon={faAddressCard} />
                  </span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </span>
                </div>
                {!loadingConstructionTypes && constructionTypes.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">{t("لا توجد أنواع مقاولات متاحة حاليًا.")}</p>
                )}
                <ErrorText field="construction_type" />
              </div>
            )}

            {showCommercialNumber && (
              <div className="min-w-0">
                <Label htmlFor="commercial_number">{t("رقم التسويق العقاري")}</Label>
                <div className="relative">
                  <input
                    id="commercial_number"
                    name="commercial_number"
                    type="text"
                    required={showCommercialNumber}
                    value={form.commercial_number}
                    onChange={handleChange}
                    className={`${inputBase} pr-11 pl-4 sm:pr-12 ${borderClass("commercial_number")}`}
                  />
                  <span className={iconRight}>
                    <FontAwesomeIcon icon={faAddressCard} />
                  </span>
                </div>
                <ErrorText field="commercial_number" />
              </div>
            )}

            {/* الاسم */}
            <div className="min-w-0">
              <Label htmlFor="name">{t("الاسم")}</Label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={`${inputBase} pr-11 pl-4 sm:pr-12 ${borderClass(
                    "name"
                  )}`}
                />
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faUser} />
                </span>
              </div>
              <ErrorText field="name" />
            </div>

            {/* البريد الالكتروني */}
            <div className="min-w-0">
              <Label htmlFor="email">{t("البريد الالكتروني")}</Label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`${inputBase} pr-11 pl-4 sm:pr-12 ${borderClass(
                    "email"
                  )}`}
                />
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
              </div>
              <ErrorText field="email" />
            </div>

            {/* رقم الجوال */}
            <div className="min-w-0">
              <Label htmlFor="phone">{t("رقم الجوال")}</Label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={`${inputBase} pr-11 pl-4 sm:pr-12 ${borderClass(
                    "phone"
                  )}`}
                />
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faPhone} />
                </span>
              </div>
              <ErrorText field="phone" />
            </div>

            {/* كلمة السر */}
            <div className="min-w-0">
              <Label htmlFor="password">{t("كلمة السر")}</Label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`${inputBase} pr-11 pl-11 sm:pr-12 sm:pl-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${borderClass(
                    "password"
                  )}`}
                />
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faLock} />
                </span>
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"
                    }
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-800 hover:text-[#459c8d] sm:left-3"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                )}
              </div>
              <ErrorText field="password" />
            </div>

            {/* الدولة */}
            <div className="min-w-0">
              <Label htmlFor="country">{t("الدولة")}</Label>
              <div className="relative">
                <select
                  id="country"
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                  disabled={loadingCountries}
                  className={`${inputBase} appearance-none pr-11 pl-10 sm:pr-12 ${
                    form.country ? "text-gray-900" : "text-gray-500"
                  } ${borderClass("country")}`}
                >
                  <option value="" disabled>
                    {loadingCountries ? t("جاري التحميل...") : t("اختر الدولة")}
                  </option>
                  {countries.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="text-gray-900"
                    >
                      {c.title}
                    </option>
                  ))}
                </select>
                <span className={iconRight}>
                  <FontAwesomeIcon icon={faFlag} />
                </span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  <FontAwesomeIcon icon={faChevronDown} />
                </span>
              </div>
              <ErrorText field="country" />
            </div>

            {/* المدينة */}
            {form.country && (
              <div className="min-w-0">
                <Label htmlFor="city">{t("المدينة")}</Label>
                <div className="relative">
                  <select
                    id="city"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    disabled={loadingCities}
                    className={`${inputBase} appearance-none pr-11 pl-10 sm:pr-12 ${
                      form.city ? "text-gray-900" : "text-gray-500"
                    } ${borderClass("city")}`}
                  >
                    <option value="" disabled>
                      {loadingCities ? t("جاري التحميل...") : t("اختر المدينة")}
                    </option>
                    {cities.map((city) => (
                      <option
                        key={city.id}
                        value={city.id}
                        className="text-gray-900"
                      >
                        {city.title}
                      </option>
                    ))}
                  </select>
                  <span className={iconRight}>
                    <FontAwesomeIcon icon={faFlag} />
                  </span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </span>
                </div>
                <ErrorText field="city" />
              </div>
            )}
          </div>

          {errors.general && (
            <p className="mt-6 text-center text-xs text-red-500 sm:text-sm">
              {errors.general}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative isolate h-10 w-full max-w-[200px] overflow-hidden rounded-md bg-[#459c8d] text-base text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-lg"
            >
              <span className="absolute inset-0 origin-right scale-x-0 bg-[#2B65B3] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              <span className="relative z-10">
                {loading ? t("جاري التحميل...") : t("إنشاء حساب")}
              </span>
            </button>

            <p className="text-center text-sm text-gray-900 sm:text-base">{t("\n              لديك حساب بالفعل ؟")}{" "}
              <Link to="/login" className="hover:text-[#459c8d]">{t("\n                تسجيل الدخول\n              ")}</Link>
            </p>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}
