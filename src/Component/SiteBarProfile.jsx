import { NavLink } from "react-router-dom";
import { t } from "../i18n";

const links = [
  { to: "/profile", label: "المعلومات الشخصية", icon: "fa-regular fa-user", end: true },
  { to: "/profile/favorites", label: "المفضلة", icon: "fa-regular fa-heart" },
  { to: "/profile/compare", label: "المقارنة", icon: "fa-solid fa-right-left" },
  { to: "/profile/my-properties", label: "العقارات المعروضة", icon: "fa-regular fa-house" },
  { to: "/profile/requests", label: "طلبات", icon: "fa-regular fa-house" },
  { to: "/profile/purchases", label: "مشترياتي", icon: "fa-regular fa-house" },
  { to: "/profile/invoices", label: "فواتيري", icon: "fa-regular fa-newspaper" },
];

export default function ProfileSidebar({ onLogout }) {
  return (
    <aside dir="rtl" className="w-full max-w-[286px] flex flex-col gap-5">
      {/* العنوان */}
      <div className="bg-[#2260b3] text-white text-center py-6 rounded-t-3xl text-base">{t("\n        الملف الشخصي\n      ")}</div>

      {/* الروابط */}
      <nav className="flex flex-col gap-5">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 h-[62px] px-5 text-sm transition-colors ${
                isActive
                  ? "bg-[#eef1f6] border-r-4 border-[#2260b3] font-bold text-[#4a9d8a]"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i
                  className={`${item.icon} text-lg ${
                    isActive ? "text-[#4a9d8a]" : "text-gray-800"
                  }`}
                />
                <span>{t(item.label)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* تسجيل الخروج */}
      <button
        type="button"
        onClick={onLogout}
        className="bg-[#2260b3] text-white text-center py-6 rounded-b-3xl text-base cursor-pointer hover:bg-[#1c4f96] transition-colors"
      >{t("\n        تسجيل الخروج\n      ")}</button>
    </aside>
  );
}
