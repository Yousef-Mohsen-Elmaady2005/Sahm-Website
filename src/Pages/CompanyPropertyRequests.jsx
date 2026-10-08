import { useEffect, useState } from "react";
import PropertiesSection from "../Component/ourproperties";
import { getAqars } from "../api/auth";
import { t, useLanguage } from "../i18n";
import { getImageUrls } from "../utils/media";
import { getLocalizedPropertyLocation, loadLocalizedAreas } from "../utils/localizedAreas";

const getItems = (response) => {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const imageOf = (item) => getImageUrls(item)[0] || "";

export default function CompanyPropertyRequests() {
  const { language } = useLanguage();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([getAqars(), loadLocalizedAreas(language).catch(() => [])])
      .then(([response, areas]) => {
        if (!active) return;
        const items = getItems(response).map((item) => ({
          id: item.id ?? item.aqar_id ?? item.post_id,
          image: imageOf(item),
          price: Number(item.final_price ?? item.price) || 0,
          title: item.title || item.name || t("عقار"),
          propertyType: item.aqar_type_title || item.type_title || "",
          propertyStatus: item.aqar_status_title || item.status_title || "",
          location: getLocalizedPropertyLocation(item, areas),
          area: item.space ?? "—",
          baths: item.bathroom_no ?? 0,
          rooms: item.room_no ?? 0,
        })).filter((item) => item.id != null);
        setProperties(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || t("تعذر تحميل العقارات حاليًا."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  return (
    <section dir="rtl" className="w-full min-w-0">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{t("طلبات العقارات المتاحة للشركات")}</h2>
      {loading ? <p role="status" className="py-10 text-center text-slate-500">{t("جاري تحميل العقارات...")}</p>
        : error ? <p role="alert" className="py-10 text-center text-red-600">{error}</p>
          : <PropertiesSection showHeading={false} compact propertyItems={properties} />}
    </section>
  );
}
