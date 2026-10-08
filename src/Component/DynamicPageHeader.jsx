import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAqar } from "../api/auth";
import { t, useLanguage } from "../i18n";

const pageTitles = {
  "/about": "من نحن",
  "/contact": "تواصل معنا",
  "/help": "المساعدة",
  "/faq": "الأسئلة الشائعة",
  "/privacy-policy": "سياسة الخصوصية",
  "/blacklist-reasons": "أسباب التعرض للقائمة السوداء",
  "/terms": "الشروط والأحكام",
  "/login": "تسجيل الدخول",
  "/forgot-password": "استعادة كلمة المرور",
  "/register": "إنشاء حساب",
  "/real-estate": "العقارات",
  "/services": "خدماتنا",
  "/account": "الملف الشخصي",
  "/account/favorites": "الملف الشخصي",
  "/account/compare": "الملف الشخصي",
  "/account/my-properties": "الملف الشخصي",
  "/account/requests": "الملف الشخصي",
  "/account/purchases": "الملف الشخصي",
  "/account/invoices": "الملف الشخصي",
  "/notifications": "الإشعارات",
  "/messages": "الرسائل",
  "/add-property": "إضافة عقار",
  "/add-contracting": "إضافة مقاولة",
};

export default function DynamicPageHeader() {
  const { dir, language } = useLanguage();
  const location = useLocation();
  const propertyMatch = location.pathname.match(/^\/real-estate\/([^/]+)$/);
  const propertyId = propertyMatch?.[1];
  const [propertyTitle, setPropertyTitle] = useState(location.state?.propertyTitle || "العقارات");

  useEffect(() => {
    if (!propertyId) return;
    if (location.state?.propertyTitle) {
      setPropertyTitle(location.state.propertyTitle);
      return;
    }
    let active = true;
    getAqar(propertyId).then((response) => {
      const payload = response?.data?.data;
      const property = Array.isArray(payload) ? payload[0] : payload?.data || payload;
      if (active && property) setPropertyTitle(property.title || "العقارات");
    }).catch(() => {});
    return () => { active = false; };
  }, [location.pathname, location.state, propertyId, language]);

  if (location.pathname === "/") {
    return null;
  }

  const title = propertyMatch ? propertyTitle : pageTitles[location.pathname] ||
    (/^\/edit-contracting\/[^/]+$/.test(location.pathname) ? "تعديل مقاولة" : "الصفحة");

  return (
    <div dir={dir} className="w-full bg-white">
      <div className="pt-6 pb-2 sm:pt-8 sm:pb-3">
        <div className="flex items-center justify-center gap-2 text-[14px] sm:text-[18px] text-black">
          <span className="font-medium text-black">{t("الرئيسية")}</span>
          <span className="text-black">/</span>
          <span className="font-medium text-[#2B65B3]">{t(title)}</span>
        </div>
        <div className="mt-6 h-px w-full bg-slate-200" />
      </div>
    </div>
  );
}
