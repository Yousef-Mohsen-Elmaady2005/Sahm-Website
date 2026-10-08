import { useEffect, useState } from "react";
import { getSettings, storeContact } from "../api/auth";
import { t, useLanguage } from "../i18n";
import ValidatedForm from "./ValidatedForm";

// تصفير أي margin/padding/top/transform جاي من CSS عام على <i>
const iconReset = "!m-0 !p-0 !top-0 !translate-y-0 !leading-none";

const inputClass =
  "w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-right text-sm text-gray-700 " +
  "placeholder:text-gray-400 outline-none transition focus:border-[#469b8d] focus:ring-2 focus:ring-[#469b8d]/20";

export default function ContactUs() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;
    getSettings()
      .then(({ data }) => {
        if (active) setSettings(data?.data ?? data);
      })
      .catch((error) => {
        if (active) setSettingsError(error.response?.data?.message || t("تعذر تحميل بيانات التواصل."));
      });
    return () => { active = false; };
  }, [language]);

  const contactItems = [
    settings?.email && { icon: "fa-solid fa-envelope", text: settings.email, href: `mailto:${settings.email}` },
    settings?.phone && { icon: "fa-solid fa-phone-volume", text: settings.phone, href: `tel:${settings.phone}` },
    settings?.address && {
      icon: "fa-solid fa-location-dot",
      text: settings.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`,
    },
  ].filter(Boolean);
  const socialLinks = [
    { icon: "fa-brands fa-twitter", label: "تويتر", href: settings?.twitter_link },
    { icon: "fa-brands fa-snapchat", label: "سناب شات", href: settings?.snapchat_link },
    { icon: "fa-brands fa-instagram", label: "انستجرام", href: settings?.instagram_link },
    { icon: "fa-brands fa-linkedin-in", label: "لينكدإن", href: settings?.linkedin_link },
  ].filter((item) => item.href);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");
    try {
      const response = await storeContact({
        name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        mobile: form.phone.trim(),
        message: form.message.trim(),
      });
      setSubmitMessage(response.data?.message || t("تم إرسال رسالتك بنجاح. شكرًا لتواصلك معنا."));
      setForm({ firstName: "", lastName: "", phone: "", email: "", message: "" });
    } catch (error) {
      setSubmitError(error.response?.data?.message || t("تعذر إرسال الرسالة. حاول مرة أخرى."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section dir="rtl" className="w-full bg-[#fcfcfc] px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(260px,320px)] lg:gap-10">
        {/* الفورم (يمين - العمود الأول في RTL) */}
        <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("تواصل معنا")}</h2>
          <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">{t("\n            وعند موافقة العميل المبدئيه على التصميم يتم ازالة هذا النص من التصميم ويتم وضع النصوص النهائية\n          ")}</p>

          <ValidatedForm onSubmit={handleSubmit} className="mt-8 space-y-5 sm:mt-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder={t("أدخل الإسم الأول")}
                required
                className={inputClass}
              />
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder={t("أدخل الإسم الأخير")}
                required
                className={inputClass}
              />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t("أدخل رقم الجوال")}
                required
                className={inputClass}
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t("أدخل البريد الالكتروني")}
                required
                className={inputClass}
              />
            </div>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={t("أدخل الرسالة")}
              required
              rows={6}
              className={`${inputClass} resize-y`}
            />

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full overflow-hidden rounded-md bg-[#469b8d] px-12 py-2 text-lg font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#215fb0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-right scale-x-0 bg-[#215fb0] transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                ></span>
                <span className="relative">{submitting ? t("جاري الإرسال...") : t("إرسال")}</span>
              </button>
            </div>
            {submitMessage && <p role="status" className="text-sm text-emerald-700">{submitMessage}</p>}
            {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
          </ValidatedForm>
        </div>

        {/* كارت التواصل (يسار - العمود التاني في RTL) */}
        <aside className="order-2 flex flex-col justify-between gap-5 rounded-2xl bg-[#469b8d] px-4 py-5 text-white lg:order-none lg:col-start-2 lg:row-start-1 lg:min-h-[500px] lg:px-5 lg:py-6">
          <ul className="space-y-4">
            {settingsError && <li role="alert" className="text-sm">{settingsError}</li>}
            {contactItems.map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center text-xl leading-none">
                  <i className={`${item.icon} ${iconReset}`} aria-hidden="true"></i>
                </span>
                {item.href ? (
                  <a href={item.href} dir="ltr" target="_blank" rel="noreferrer" className="cursor-pointer break-all text-base">
                    {item.text}
                  </a>
                ) : (
                  <span className="text-base">{item.text}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-center gap-3 pb-[20px] sm:justify-between">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={t(s.label)}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-lg leading-none text-[#469b8d]"
              >
                <i className={`${s.icon} ${iconReset}`} aria-hidden="true"></i>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
