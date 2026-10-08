import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { getNotifications } from "../api/auth";
import { getLanguage, t, useLanguage } from "../i18n";

function getNotificationList(responseData) {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getLanguage() === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Notifications() {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    getNotifications()
      .then(({ data }) => {
        if (isCurrent) setNotifications(getNotificationList(data));
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.response?.data?.message || "تعذر تحميل الإشعارات");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [language]);

  return (
    <main dir="rtl" className="min-h-[60vh] bg-gray-50 px-4 py-8 sm:px-8 sm:py-10 lg:px-20">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-6 flex items-center gap-3 text-xl font-semibold text-[#2B65B3] sm:mb-8 sm:text-2xl">
          <FontAwesomeIcon icon={faBell} aria-hidden="true" />{t("\n          الإشعارات\n        ")}</h1>

        {loading ? (
          <p role="status" className="rounded-lg border border-gray-200 bg-white p-6 text-center text-slate-500 shadow-sm">{t("\n            جاري تحميل الإشعارات...\n          ")}</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-600 shadow-sm">
            {error}
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-slate-500 shadow-sm">{t("\n            لا توجد إشعارات حاليًا\n          ")}</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification, index) => {
              const data = notification?.data || {};
              const title = notification?.title || data?.title || "إشعار";
              const message =
                notification?.message || notification?.body || notification?.description ||
                data?.message || data?.body || notification?.text || "";
              const date = formatDate(
                notification?.created_at || notification?.createdAt || notification?.date
              );

              return (
                <li
                  key={notification?.id ?? notification?.uuid ?? index}
                  className="flex min-w-0 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2B65B3] sm:h-12 sm:w-12">
                    <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    {message && <p className="mt-1 break-words text-sm leading-6 text-slate-600">{message}</p>}
                    {date && <time className="mt-2 block text-xs text-slate-400">{date}</time>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
