import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { loginRequest } from "../api/auth";
import { setAuthSession } from "../api/auth";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

export default function Login() {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "البريد الالكتروني مطلوب";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "البريد الالكتروني غير صحيح";
    if (!form.password) newErrors.password = "كلمة السر مطلوبة";
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
      const { data } = await loginRequest(form);
      const token =
        data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
      if (typeof token !== "string" || !token.trim()) {
        throw new Error("استجابة تسجيل الدخول لا تحتوي على رمز دخول صالح.");
      }
      setAuthSession(token);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || err.message || "حصل خطأ، حاول مرة تانية",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "h-10 sm:h-11 lg:h-12 w-full rounded-md border bg-white text-sm sm:text-base text-gray-900 outline-none transition focus:border-[#459c8d] focus:ring-1 focus:ring-[#459c8d]";

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-20 xl:px-[135px] xl:py-14"
    >
      <div className="mx-auto w-full max-w-[1620px]">
        <h1 className="mb-8 text-xl font-medium text-[#459c8d] sm:mb-10 sm:text-2xl md:mb-12 lg:mb-16">
          {t("تسجيل الدخول")} -
        </h1>

        <ValidatedForm onSubmit={handleSubmit} skipValidation>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-[30px]">
            {/* البريد الالكتروني */}
            <div className="min-w-0">
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-gray-900 sm:mb-3 sm:text-base"
              >
                {t("البريد الالكتروني")}
                <span className="mr-1">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  className={`${inputBase} pr-11 pl-4 sm:pr-12 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-800 sm:right-4">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
              </div>
              {errors.email && (
                <p id="login-email-error" role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-right text-sm text-red-600">{t(errors.email)}</p>
              )}
            </div>

            {/* كلمة السر */}
            <div className="min-w-0">
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-900 sm:mb-3 sm:text-base"
              >
                {t("كلمة السر")}
                <span className="mr-1">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={`${inputBase} pr-11 pl-11 sm:pr-12 sm:pl-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-800 sm:right-4">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={t(showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر")}
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-800 hover:text-[#459c8d] sm:left-3"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                )}
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-right text-sm text-red-600">{t(errors.password)}</p>
              )}
              <Link
                to="/forgot-password"
                className="mt-3 inline-block text-sm text-gray-900 hover:text-[#459c8d] sm:text-base"
              >
                {t("هل نسيت كلمة المرور ؟")}
              </Link>
            </div>
          </div>

          {errors.general && (
            <p className="mt-6 text-center text-xs text-red-500 sm:text-sm">
              {t(errors.general)}
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
                {t(loading ? t("جاري التحميل...") : t("تسجيل الدخول"))}
              </span>
            </button>

            <p className="text-center text-sm text-gray-900 sm:text-base">
              {t("ليس لديك حساب ؟")}{" "}
              <Link to="/register" className="hover:text-[#459c8d]">
                {t("إنشاء حساب")}
              </Link>
            </p>
          </div>
        </ValidatedForm>
      </div>
    </div>
  );
}
