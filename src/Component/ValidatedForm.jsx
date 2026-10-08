import { useEffect, useRef, useState } from "react";
import { getLanguage, t, useLanguage } from "../i18n";

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^\+?[\d\s().-]+$/;

const knownLabels = {
  email: ["البريد الإلكتروني", "Email Address"],
  phone: ["رقم الهاتف", "Phone Number"],
  mobile: ["رقم الهاتف", "Phone Number"],
  message: ["الرسالة", "Message"],
  firstName: ["الاسم الأول", "First Name"],
  lastName: ["الاسم الأخير", "Last Name"],
};

function fieldLabel(field) {
  const language = getLanguage();
  const known = knownLabels[field.name];
  if (known) return language === "en" ? known[1] : known[0];
  const label = field.getAttribute("placeholder") || field.labels?.[0]?.textContent || field.closest("label")?.textContent;
  const fallback = label || field.getAttribute("aria-label") || field.name || field.id || "الحقل";
  return (language === "en" ? t(fallback) : fallback)
    .replace(/\*/g, "")
    .trim();
}

function validateForm(form) {
  const english = getLanguage() === "en";
  return Array.from(form.elements).flatMap((field) => {
    if (!(field instanceof HTMLElement) || field.disabled || ["button", "submit", "reset", "hidden", "file"].includes(field.type)) return [];
    const label = fieldLabel(field);
    const value = String(field.value || "").trim();
    if (field.required && !value) return [english ? `${label} is required.` : `${label} مطلوب.`];
    if (!value) return [];
    if (field.type === "email" && !emailPattern.test(value)) return [english ? `${label} must be a valid email address.` : `${label} يجب أن يكون بريدًا إلكترونيًا صالحًا.`];
    if (field.type === "tel" && (!phonePattern.test(value) || value.replace(/\D/g, "").length < 8 || value.replace(/\D/g, "").length > 15)) return [english ? `${label} must be a valid phone number.` : `${label} يجب أن يكون رقم هاتف صالحًا.`];
    if (field.minLength > 0 && value.length < field.minLength) return [english ? `${label} must be at least ${field.minLength} characters.` : `${label} يجب ألا يقل عن ${field.minLength} أحرف.`];
    return [];
  });
}

export default function ValidatedForm({ children, onSubmitCapture, noValidate = true, skipValidation = false, ...props }) {
  const { language } = useLanguage();
  const [errors, setErrors] = useState([]);
  const errorsRef = useRef([]);
  const formRef = useRef(null);
  const updateErrors = (nextErrors) => {
    errorsRef.current = nextErrors;
    setErrors(nextErrors);
  };
  const handleSubmitCapture = (event) => {
    if (skipValidation) {
      onSubmitCapture?.(event);
      return;
    }
    const nextErrors = validateForm(event.currentTarget);
    updateErrors(nextErrors);
    if (nextErrors.length) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation?.();
      event.currentTarget.querySelector(":invalid")?.focus();
    }
    onSubmitCapture?.(event);
  };

  const handleChangeCapture = (event) => {
    if (errorsRef.current.length && event.target.matches("input, select, textarea")) {
      updateErrors(validateForm(event.currentTarget));
    }
  };

  useEffect(() => {
    if (errorsRef.current.length && formRef.current) {
      updateErrors(validateForm(formRef.current));
    }
  }, [language]);

  return (
    <form ref={formRef} {...props} noValidate={noValidate} onSubmitCapture={handleSubmitCapture} onChangeCapture={handleChangeCapture}>
      {errors.length > 0 && (
        <div role="alert" aria-live="assertive" className="mb-6 rounded-md border border-red-200 bg-red-100 px-4 py-3 text-sm leading-6 text-red-700">
          {errors.map((error, index) => <p key={`${error}-${index}`}>{error}</p>)}
        </div>
      )}
      {children}
    </form>
  );
}
