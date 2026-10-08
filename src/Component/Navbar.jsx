import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCommentDots,
  faCircleInfo,
  faCircleQuestion,
  faRightFromBracket,
  faRightToBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { clearAuthSession, isAuthenticated, logoutRequest } from "../api/auth";
import logo from "../photo/lojjo.png";
import { setLanguage, t, useLanguage } from "../i18n";
export default function Navbar() {
  const [isStuck, setIsStuck] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const switchLanguage = () => setLanguage(language === "ar" ? "en" : "ar");

  const handleLogout = () => {
    // Start the server request while the current token is still available,
    // then end the browser session immediately.
    logoutRequest().catch((err) => console.error("Logout request failed:", err));
    clearAuthSession();
    setIsMenuOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(isAuthenticated());
    window.addEventListener("sahm-auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("sahm-auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // Recheck auth after navigation as a fallback to the auth-change event.
  // Login stores the session and then navigates to the home page.
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsStuck(window.scrollY > 5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  // قفل سكرول الصفحة لما القائمة تكون مفتوحة على الموبايل
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);
 
  // قفل القائمة تلقائيًا عند تغيير الصفحة
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
 
  const linkClass = (path) =>
    `transition-colors hover:text-slate-950 ${
      location.pathname === path ? "font-bold text-slate-900" : ""
    }`;
 
  const navLinks = [
    { to: "/", label: t("الرئيسية") },
    { to: "/about", label: t("من نحن") },
    { to: "/services", label: t("خدماتنا") },
    { to: "/real-estate", label: t("العقارات") },
    { to: "/contact", label: t("تواصل معنا") },
  ];
 
  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="font-sans text-slate-800">
      {/* الشريط الأزرق العلوي - يختفي على الموبايل */}
      <div className="hidden h-[42px] bg-[#2B65B3] text-white md:block lg:h-[62px]">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-4 text-[13px] lg:text-[16px]">
          <div dir="ltr" className="flex flex-row-reverse items-center gap-3 lg:gap-5">
            <Link to="/privacy-policy" className="flex items-center gap-1.5 text-white hover:text-white">
              {t("سياسة الخصوصية")}
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
            </Link>
            <Link to="/help" className="flex items-center gap-1.5 text-white hover:text-white">
              {t("المساعدة")}
              <FontAwesomeIcon icon={faCircleQuestion} aria-hidden="true" />
            </Link>
          </div>
 
          <div dir="ltr" className={`flex items-center gap-3 lg:gap-5 ${isLoggedIn ? "" : "flex-row-reverse"}`}>
            {isLoggedIn ? (
              <>
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 whitespace-nowrap text-white">
                  {t("تسجيل الخروج")}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                    <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  </span>
                </button>
                <Link to="/account" aria-label={t("حسابي")} title={t("حسابي")} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                </Link>
                <Link to="/notifications" aria-label={t("الإشعارات")} title={t("الإشعارات")} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                  <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                </Link>
                <Link to="/messages" aria-label={t("الرسائل")} title={t("الرسائل")} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                  <FontAwesomeIcon icon={faCommentDots} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" dir="rtl" className="flex items-center gap-2 whitespace-nowrap no-underline">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  </span>
                  {t("تسجيل الدخول")}
                </Link>
                <Link to="/register" dir="rtl" className="flex items-center gap-2 whitespace-nowrap no-underline">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2B65B3] lg:h-9 lg:w-9">
                    <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
                  </span>
                  {t("إنشاء حساب")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
 
      {/* الشريط الأبيض - ثابت أثناء التمرير */}
      <div
        dir="rtl"
        className={`fixed left-0 right-0 z-50 h-[52px] bg-white transition-[top,box-shadow] md:h-[82px] lg:h-[112px] ${
          isStuck ? "top-0" : "top-0 md:top-[42px] lg:top-[62px]"
        } ${isStuck ? "shadow-lg" : "shadow-sm"}`}
      >
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-3 px-4 lg:gap-6">
          {/* الشعار */}
          <Link to="/" className="shrink-0" aria-label={t("سهم للخدمات العقارية")}>
            <img
              src={logo}
              alt={t("سهم للخدمات العقارية - Find Your Place")}
              className="h-[38px] w-auto object-contain md:h-[56px] lg:h-[70px]"
            />
          </Link>
 
          {/* الروابط - تظهر فقط من شاشات lg فأكبر */}
          <div dir={language === "ar" ? "rtl" : "ltr"} className="hidden flex-1 items-center justify-center gap-x-[3vw] whitespace-nowrap text-[13px] text-slate-700 lg:flex xl:gap-x-[4vw] xl:text-[16px]">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>
 
          {/* Add property action and language switch */}
          <div dir={language === "ar" ? "rtl" : "ltr"} className="hidden shrink-0 items-center gap-3 text-[13px] md:flex lg:gap-4 lg:text-[16px]">
            <button type="button" onClick={switchLanguage} className="font-bold text-slate-700 hover:text-[#2B65B3]" aria-label={language === "ar" ? "Switch to English" : t("التبديل إلى العربية")}>
              {language === "ar" ? "EN" : "عربي"}
            </button>
            <Link to="/add-property" className="group relative flex h-[32px] items-center gap-2 overflow-hidden rounded-md bg-[#2B65B3] px-3 text-[11px] text-white lg:h-[36px] lg:px-5 lg:text-[16px]">
              <span className="absolute inset-0 origin-right scale-x-0 bg-[#3fa08a] transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <i className="fa-solid fa-plus relative z-10" />
              <span className="relative z-10">{t("إضافة عقار")}</span>
            </Link>
          </div>
 
          {/* زر الهامبرغر - يظهر فقط على الموبايل والتابلت */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={t("فتح القائمة")}
            aria-expanded={isMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-2xl text-[#2B65B3] lg:hidden"
          >
            <i className={`fa-solid ${isMenuOpen ? "fa-xmark" : "fa-bars"}`} />
          </button>
        </div>
      </div>
 
      {/* خلفية معتمة عند فتح القائمة */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
 
      {/* قائمة الموبايل المنسدلة */}
      <div
        className={`fixed ${language === "ar" ? "right-0" : "left-0"} top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-[78%] max-w-[320px] transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMenuOpen ? "translate-x-0" : language === "ar" ? "translate-x-full" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <img src={logo} alt={t("سهم للخدمات العقارية")} className="h-10 w-auto object-contain" />
          <button
            onClick={() => setIsMenuOpen(false)}
            aria-label={t("إغلاق القائمة")}
            className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-slate-500"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
 
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-5 py-4 pb-8 text-lg text-slate-700" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-2 py-3 ${
                location.pathname === link.to
                  ? "font-bold text-[#2B65B3]"
                  : "transition-colors hover:text-slate-950"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/privacy-policy"
            className={`rounded-md px-2 py-3 ${
              location.pathname === "/privacy-policy"
                ? "font-bold text-[#2B65B3]"
                : "transition-colors hover:text-slate-950"
            }`}
          >
            {t("سياسة الخصوصية")}
          </Link>

          <Link
            to="/help"
            className={`rounded-md px-2 py-3 ${
              location.pathname === "/help"
                ? "font-bold text-[#2B65B3]"
                : "transition-colors hover:text-slate-950"
            }`}
          >
            {t("المساعدة")}
          </Link>
 
          <div className="my-3 h-px bg-slate-100" />
 
          {isLoggedIn ? (
            <>
              <Link to="/account" className="flex items-center gap-2 px-2 py-3 hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faUser} />
                {t("حسابي")}
              </Link>
              <Link to="/notifications" className="flex items-center gap-2 px-2 py-3 hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faBell} />
                {t("الإشعارات")}
              </Link>
              <Link to="/messages" className="flex items-center gap-2 px-2 py-3 hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faCommentDots} />
                {t("الرسائل")}
              </Link>
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-2 py-3 text-right hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faRightFromBracket} />
                {t("تسجيل الخروج")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 px-2 py-3 hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faUser} />
                {t("تسجيل الدخول")}
              </Link>
              <Link to="/register" className="flex items-center gap-2 px-2 py-3 hover:text-[#2B65B3]">
                <FontAwesomeIcon icon={faRightToBracket} />
                {t("إنشاء حساب")}
              </Link>
            </>
          )}
 
          <div className="my-3 h-px bg-slate-100" />
 
          <Link to="/add-property" className="mt-1 flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#2B65B3] px-4 text-white">
            <i className="fa-solid fa-plus" />
            {t("إضافة عقار")}
          </Link>

          <button type="button" onClick={switchLanguage} className="mt-4 flex items-center gap-2 px-2 text-sm font-bold text-slate-500" aria-label={language === "ar" ? "Switch to English" : t("التبديل إلى العربية")}>
            <i className="fa-solid fa-globe" />
            {language === "ar" ? "EN" : "عربي"}
          </button>
          </div>
        </div>
      </div>
 
      {/* مسافة تعويضية بحسب ارتفاع الناف بار الفعلي في كل حجم شاشة */}
      <div className="h-[52px] md:h-[82px] lg:h-[112px]" aria-hidden="true" />
    </div>
  );
}
 
