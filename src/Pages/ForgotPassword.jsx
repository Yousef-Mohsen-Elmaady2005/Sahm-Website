import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { t } from "../i18n";
import ValidatedForm from "../Component/ValidatedForm";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setNotice("");
    if (!email.trim()) {
      setError("اكتب البريد الإلكتروني أولًا.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("تأكد من كتابة بريد إلكتروني صحيح.");
      return;
    }

    setError("");
    setNotice("واجهة الاستعادة جاهزة، لكن لم نتمكن من إرسال الطلب لأن مسار استعادة كلمة المرور غير موجود ضمن الـAPI المتاح.");
  };

  return (
    <main dir="rtl" className="flex min-h-[65vh] items-center justify-center bg-[#f7f9fc] px-4 py-12 sm:px-6 lg:py-16">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_20px_60px_-30px_rgba(24,57,97,0.28)]">
        <div className="h-2 bg-gradient-to-l from-[#459c8d] to-[#2864b5]" />
        <div className="px-5 py-8 sm:px-10 sm:py-11">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f3f2] text-2xl text-[#459c8d] sm:h-[72px] sm:w-[72px]">
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{t("نسيت كلمة المرور؟")}</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-7 text-slate-600 sm:text-base">{t("\n            أدخل البريد الإلكتروني المسجل في حسابك لبدء استعادة كلمة المرور.\n          ")}</p>

          <ValidatedForm onSubmit={handleSubmit} className="mt-8 sm:mt-9">
            <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">{t("البريد الإلكتروني")}</label>
            <div className={`relative rounded-xl border bg-white transition focus-within:ring-4 focus-within:ring-[#2864b5]/10 ${error ? "border-red-400 focus-within:border-red-500" : "border-slate-300 focus-within:border-[#2864b5]"}`}>
              <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); setNotice(""); }}
                placeholder="name@example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "reset-email-error" : undefined}
                className="h-12 w-full rounded-xl bg-transparent py-2 pl-4 pr-11 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:h-14 sm:text-base"
                dir="ltr"
              />
            </div>
            {error && <p id="reset-email-error" role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            {notice && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{notice}</p>}

            <button type="submit" className="group relative isolate mt-6 h-12 w-full overflow-hidden rounded-xl bg-[#459c8d] font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2864b5] sm:h-14">
              <span className="absolute inset-0 origin-right scale-x-0 bg-[#2864b5] transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              <span className="relative z-10">{t("إرسال رابط الاستعادة")}</span>
            </button>
          </ValidatedForm>

          <Link to="/login" className="mx-auto mt-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#2864b5] transition hover:text-[#459c8d] sm:text-base">
            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />{t("\n            العودة إلى تسجيل الدخول\n          ")}</Link>
        </div>
      </section>
    </main>
  );
}
