import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import AddContractingContent from "../Component/AddContractingContent";
import { getConstruction } from "../api/auth";
import { t, useLanguage } from "../i18n";

const getConstructionData = (response) => {
  let payload = response?.data?.data ?? response?.data;
  while (payload && !Array.isArray(payload) && typeof payload === "object" && payload.data) {
    payload = payload.data;
  }
  return payload && !Array.isArray(payload) && typeof payload === "object" ? payload : null;
};

export default function EditContracting() {
  const { language } = useLanguage();
  const { constructionId } = useParams();
  const location = useLocation();
  const [construction, setConstruction] = useState(location.state?.construction || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getConstruction(constructionId)
      .then((response) => {
        const details = getConstructionData(response);
        if (!details) throw new Error("لم يتم العثور على تفاصيل طلب المقاولة.");
        if (active) setConstruction({ ...location.state?.construction, ...details });
      })
      .catch((requestError) => {
        if (!active) return;
        if (location.state?.construction) {
          setConstruction(location.state.construction);
          return;
        }
        setError(requestError.response?.data?.message || requestError.message || "تعذر تحميل طلب المقاولة.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [constructionId, location.state, language]);

  if (loading) return <p role="status" className="py-12 text-center text-slate-500">{t("جاري تحميل طلب المقاولة...")}</p>;
  if (error || !construction) return <p role="alert" className="py-12 text-center text-red-600">{error || t("طلب المقاولة غير موجود.")}</p>;
  return <AddContractingContent mode="edit" construction={construction} constructionId={constructionId} />;
}
