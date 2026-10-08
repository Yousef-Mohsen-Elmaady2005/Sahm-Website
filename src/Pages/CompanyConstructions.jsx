import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { getCompanyConstructions, storeConstructionOffer } from "../api/auth";
import { t, useLanguage } from "../i18n";

const listFromResponse = (response) => {
  let value = response?.data?.data ?? response?.data;
  for (let depth = 0; depth < 4 && value && !Array.isArray(value); depth += 1) {
    const list = [value.data, value.constructions, value.items, value.main_data]
      .find(Array.isArray);
    if (list) return list;
    value = value.data ?? value.constructions ?? value.items ?? value.main_data;
  }
  return Array.isArray(value) ? value : [];
};

const assertBusinessSuccess = (response) => {
  const result = response?.data ?? {};
  const message = String(result.message || "");
  if (String(result.status || "").toLowerCase() === "error" || /do not have permission|permission denied/i.test(message)) {
    throw new Error(message || t("تعذر تنفيذ الطلب."));
  }
  return result;
};

export default function CompanyConstructions() {
  const { language } = useLanguage();
  const [constructions, setConstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [prices, setPrices] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    getCompanyConstructions()
      .then((response) => {
        const result = assertBusinessSuccess(response);
        if (active) setConstructions(listFromResponse({ data: result }));
      })
      .catch((error) => {
        if (active) setLoadError(error.response?.data?.message || error.message || t("تعذر تحميل طلبات الشركات."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  const submitOffer = async (event, construction) => {
    event.preventDefault();
    const constructionId = construction.id ?? construction.construction_id ?? construction.post_id;
    const price = String(prices[constructionId] ?? "").trim();
    if (!constructionId || !price || Number(price) < 0 || sendingId != null) return;

    setSendingId(String(constructionId));
    setNotice(null);
    try {
      const response = await storeConstructionOffer({ construction_id: constructionId, price });
      const result = assertBusinessSuccess(response);
      setPrices((current) => ({ ...current, [constructionId]: "" }));
      setNotice({ type: "success", text: result.message || t("تم إرسال العرض بنجاح.") });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.response?.data?.message || error.message || t("تعذر إرسال العرض."),
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <section dir="rtl" className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e3f1ef] text-[#419e8e]"><FontAwesomeIcon icon={faBriefcase} /></span>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("طلبات المقاولات المتاحة للشركات")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("قدّم عرض سعر على الطلب المناسب.")}</p>
        </div>
      </div>

      {notice && <p role={notice.type === "error" ? "alert" : "status"} className={`mb-5 rounded-md px-4 py-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{notice.text}</p>}
      {loading && <p role="status" className="py-10 text-center text-slate-500">{t("جاري تحميل الطلبات...")}</p>}
      {!loading && loadError && <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
      {!loading && !loadError && constructions.length === 0 && <p className="py-10 text-center text-slate-500">{t("لا توجد طلبات مقاولات متاحة حاليًا.")}</p>}

      {!loadError && constructions.length > 0 && <div className="space-y-4">
        {constructions.map((construction, index) => {
          const id = construction.id ?? construction.construction_id ?? construction.post_id ?? index;
          const title = construction.title || construction.name || t("طلب مقاولة");
          const description = construction.description || construction.details || construction.content;
          const area = construction.area || construction.area_title || construction.city;
          return (
            <article key={id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  {area && <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><FontAwesomeIcon icon={faLocationDot} />{t(area)}</p>}
                  {construction.space != null && <p className="mt-2 text-sm text-slate-600">{t("المساحة")}: {construction.space} {t("م²")}</p>}
                  {description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{description}</p>}
                  {construction.created_at && <p className="mt-3 text-xs text-slate-400">{construction.created_at}</p>}
                </div>
                <form onSubmit={(event) => submitOffer(event, construction)} className="flex w-full flex-col gap-3 sm:w-64">
                  <label className="text-sm font-medium text-slate-700" htmlFor={`offer-price-${id}`}>{t("قيمة العرض")}</label>
                  <input
                    id={`offer-price-${id}`}
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={prices[id] ?? ""}
                    onChange={(event) => setPrices((current) => ({ ...current, [id]: event.target.value }))}
                    placeholder={t("أدخل السعر")}
                    className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#419e8e] focus:ring-1 focus:ring-[#419e8e]"
                  />
                  <button type="submit" disabled={sendingId != null} className="h-11 rounded-md bg-[#419e8e] px-4 font-medium text-white transition hover:bg-[#2B65B3] disabled:cursor-wait disabled:opacity-60">
                    {sendingId === String(id) ? t("جاري إرسال العرض...") : t("إرسال عرض")}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>}
    </section>
  );
}
