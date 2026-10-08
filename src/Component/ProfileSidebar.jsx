import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightArrowLeft,
  faBars,
  faFileInvoice,
  faHeart,
  faHouse,
  faRightFromBracket,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getProfile, logoutRequest } from "../api/auth";
import { t, useLanguage } from "../i18n";
import { isCommercialProfileResponse } from "../utils/accountType";

const items = [
  { label: "المعلومات الشخصية", path: "/account", icon: faUser },
  { label: "المفضلة", path: "/account/favorites", icon: faHeart },
  { label: "المقارنة", path: "/account/compare", icon: faArrowRightArrowLeft },
  { label: "العقارات المعروضة", path: "/account/my-properties", icon: faHouse },
  { label: "طلبات", path: "/account/requests", icon: faHouse },
  { label: "طلباتي", path: "/account/my-requests", icon: faHouse, commercialOnly: true },
  { label: "مشترياتي", path: "/account/purchases", icon: faHouse },
  { label: "فواتيري", path: "/account/invoices", icon: faFileInvoice },
];

export default function ProfileSidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommercialAccount, setIsCommercialAccount] = useState(false);
  const { dir } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(({ data: responseData }) => {
        if (!active) return;
        setIsCommercialAccount(isCommercialProfileResponse(responseData));
      })
      .catch(() => {
        if (active) setIsCommercialAccount(false);
      });
    return () => { active = false; };
  }, []);

  const handleLogout = () => {
    logoutRequest().catch((error) => console.error("Logout request failed:", error));
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <aside dir={dir} className="flex w-full max-w-[296px] flex-col gap-5">
      <button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-controls="profile-sidebar-navigation"
        aria-label={isMenuOpen ? t("إغلاق القائمة") : t("فتح القائمة")}
        className="flex min-h-12 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-[#2864b5] shadow-sm lg:hidden"
      >
        <span className="text-base font-medium">{t("الملف الشخصي")}</span>
        <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} className="text-xl" aria-hidden="true" />
      </button>
      <h1 className="hidden h-[86px] items-center justify-center rounded-t-[22px] bg-[#2864b5] text-xl font-medium text-white lg:flex">
        {t("الملف الشخصي")}
      </h1>
      <div id="profile-sidebar-navigation" className={`${isMenuOpen ? "flex" : "hidden"} flex-col gap-5 lg:flex`}>
      <nav aria-label={t("قائمة الملف الشخصي")} className="flex flex-col gap-4 lg:gap-6">
        {items.filter((item) => !item.commercialOnly || isCommercialAccount).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[58px] items-center gap-4 rounded-lg px-5 text-right text-base transition lg:min-h-[74px] lg:rounded-none lg:px-8 ${
                active
                  ? "border-r-4 border-[#2864b5] bg-[#dfeaf8] font-semibold text-slate-900"
                  : "bg-white text-slate-800 hover:bg-[#f3f6fa]"
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={active ? "text-[#49a395]" : "text-slate-800"}
              />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-[#2864b5] text-white transition hover:bg-[#20579f] lg:min-h-[62px] lg:rounded-b-[22px]"
      >
        <FontAwesomeIcon icon={faRightFromBracket} />
        {t("تسجيل الخروج")}
      </button>
      </div>
    </aside>
  );
}
