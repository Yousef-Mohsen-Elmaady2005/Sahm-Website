import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import logo from "../photo/lojjo.png";
import { getBoarding, storeNewsletter } from "../api/auth";
import { showToast } from "../utils/notifications";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

const websiteLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "من نحن", href: "/about" },
  { label: "تواصل معنا", href: "/contact" },
  { label: "العقارات", href: "/real-estate" },
  { label: "خدماتنا", href: "/services" },
];

const helpLinks = [
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
  { label: "المساعدة", href: "/help" },
  { label: "أسباب التعرض للقائمة السوداء", href: "/blacklist-reasons" },
  { label: "الشروط والأحكام", href: "/terms" },
  { label: "الأسئلة الشائعة", href: "/faq" },
];

const socialLinks = [
  { icon: "fa-brands fa-whatsapp", label: "واتساب", href: "https://wa.me/" },
  { icon: "fa-brands fa-snapchat", label: "سناب شات", href: "https://snapchat.com" },
  { icon: "fa-brands fa-x-twitter", label: "إكس", href: "https://x.com" },
  { icon: "fa-brands fa-instagram", label: "انستغرام", href: "https://instagram.com" },
];

const fallbackFooterDescription = "وعند موافقة العميل المبدئية على التصميم يتم إزالة هذا النص من التصميم ويتم وضع النصوص النهائية";

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="relative inline-block pb-3 mb-5 text-[20px] sm:text-[22px] lg:text-[24px] font-medium leading-tight text-[#183247] after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-9 after:-translate-x-1/2 after:bg-[#2563b9] sm:after:left-auto sm:after:right-0 sm:after:translate-x-0">
        {t(title)}
      </h3>
      <ul className="flex flex-col gap-3 sm:gap-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.href}
              className="text-[14px] sm:text-[14.5px] text-slate-700 hover:text-teal-700 transition-colors"
            >
              {t(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { dir, language } = useLanguage();
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [footerDescription, setFooterDescription] = useState(fallbackFooterDescription);

  useEffect(() => {
    let active = true;
    getBoarding()
      .then(({ data }) => {
        const content = data?.data;
        if (active && typeof content === "string" && content.trim()) {
          setFooterDescription(content.trim());
        }
      })
      .catch(() => {
        // Keep the existing footer copy if the endpoint is unavailable.
      });

    return () => { active = false; };
  }, [language]);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || newsletterSubmitting) return;

    setNewsletterSubmitting(true);
    try {
      const response = await storeNewsletter(email);
      const result = response?.data || {};
      if (String(result.status || "").toLowerCase() === "error") {
        throw new Error(result.message || "تعذر الاشتراك في النشرة البريدية.");
      }
      setNewsletterEmail("");
      showToast(result.message || t("تم تسجيل بريدك الإلكتروني بنجاح."));
    } catch (error) {
      showToast(error.response?.data?.message || error.message || t("تعذر الاشتراك، حاول مرة أخرى."), "error");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <footer
      dir={dir}
      className="bg-white border-t border-slate-100 pt-10 sm:pt-12 px-4 sm:px-6 font-[Tajawal,Cairo,sans-serif]"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.9fr] gap-x-10 lg:gap-x-20 gap-y-10 text-right">
        {/* الشعار + الوصف + السوشيال ميديا */}
        <div className="flex flex-col gap-4 items-center sm:items-start text-center sm:text-right">
          <img
            src={logo}
            alt={t("سهم للخدمات العقارية")}
            className="h-14 sm:h-16 w-auto object-contain"
          />

          <p className="text-sm leading-7 sm:leading-8 text-slate-500 max-w-xs">
            {t(footerDescription)}
          </p>

          <div className="flex gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={t(s.label)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] rounded-full bg-emerald-50 text-teal-700 flex items-center justify-center text-[14px] sm:text-[15px] hover:text-[#2160b7] transition-colors"
              >
                <i className={s.icon}></i>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center sm:text-right">
          <FooterColumn title={t("خريطة الموقع")} links={websiteLinks} />
        </div>

        <div className="text-center sm:text-right">
          <FooterColumn title={t("المساعدة")} links={helpLinks} />
        </div>

        {/* النشرة البريدية */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-right sm:col-span-2 lg:col-span-1">
          <h3 className="relative inline-block pb-3 mb-5 text-[20px] sm:text-[22px] lg:text-[24px] font-medium leading-tight text-[#183247] after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-9 after:-translate-x-1/2 after:bg-[#2563b9] sm:after:left-auto sm:after:right-0 sm:after:translate-x-0">
            {t("النشرة البريدية")}
          </h3>
          <ValidatedForm
            onSubmit={handleNewsletterSubmit}
            className="flex w-full max-w-[320px] flex-col gap-4"
          >
            <div className="relative">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder={t("أدخل البريد الالكتروني")}
                aria-label={t("البريد الإلكتروني للنشرة البريدية")}
                className="w-full h-[44px] sm:h-[42px] box-border pl-12 pr-4 border border-[#2160b7] rounded-[12px] text-left text-[15px] sm:text-[16px] outline-none focus:ring-1 focus:ring-[#2160b7]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2160b7] text-[16px]">
                <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
              </span>
            </div>
            <button
              type="submit"
              disabled={newsletterSubmitting}
              className="group relative isolate self-center sm:self-end h-[46px] sm:h-[48px] w-full sm:w-[110px] overflow-hidden rounded-[8px] bg-[#399d8e] px-4 text-[15px] sm:text-[16px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2160b7] disabled:cursor-wait disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-right scale-x-0 bg-[#2160b7] transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <span className="relative z-10">{t(newsletterSubmitting ? t("جاري الإرسال...") : t("إشتراك"))}</span>
            </button>
          </ValidatedForm>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 sm:mt-10 py-5 border-t border-slate-100 text-center text-[12.5px] sm:text-[13.5px] text-slate-500">
        {t("جميع الحقوق محفوظة لشركة سهم للخدمات العقارية")} © {year}
      </div>
    </footer>
  );
}
