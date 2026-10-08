import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCompares, isAuthenticated, toggleCompare as toggleCompareRequest } from "../api/auth";
import { showToast } from "../utils/notifications";
import { t, useLanguage } from "../i18n";

const CompareContext = createContext(null);

const getItems = (response) => {
  let payload = response?.data?.data;
  while (payload && !Array.isArray(payload) && typeof payload === "object" && payload.data) {
    payload = payload.data;
  }
  return Array.isArray(payload) ? payload : [];
};

const normalizeComparedProperty = (item) => {
  const property = item?.aqar || item?.property || item?.aqar_data || item;
  return { ...property, id: property?.id ?? item?.post_id ?? item?.model_id };
};

export function CompareProvider({ children }) {
  const { language } = useLanguage();
  const [compares, setCompares] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [error, setError] = useState("");

  const refreshCompares = useCallback(async () => {
    if (!isAuthenticated()) {
      setCompares([]);
      return [];
    }
    const response = await getCompares();
    const items = getItems(response).map(normalizeComparedProperty).filter((item) => item.id != null);
    setCompares(items);
    setError("");
    return items;
  }, []);

  useEffect(() => {
    const refreshIfAuthenticated = () => {
      if (isAuthenticated()) refreshCompares().catch(() => setError("تعذر تحميل قائمة المقارنة."));
      else setCompares([]);
    };
    refreshIfAuthenticated();
    window.addEventListener("sahm-auth-change", refreshIfAuthenticated);
    return () => window.removeEventListener("sahm-auth-change", refreshIfAuthenticated);
  }, [refreshCompares, language]);

  const isCompared = useCallback((id) => compares.some((item) => String(item.id) === String(id)), [compares]);
  const toggle = useCallback(async (property) => {
    if (!property?.id || pendingIds.includes(String(property.id))) return false;
    const id = String(property.id);
    const previous = compares;
    const alreadyCompared = previous.some((item) => String(item.id) === id);
    setPendingIds((current) => [...current, id]);
    setError("");
    setCompares(alreadyCompared
      ? previous.filter((item) => String(item.id) !== id)
      : [...previous, property]);
    try {
      await toggleCompareRequest(id);
      showToast(alreadyCompared ? t("تمت إزالة العقار من المقارنة") : t("تمت إضافة العقار للمقارنة بنجاح"));
      try {
        await refreshCompares();
      } catch {
        setError("تم تحديث المقارنة، لكن تعذر تحديث القائمة الآن.");
      }
      return true;
    } catch (requestError) {
      setCompares(previous);
      const message = requestError.response?.data?.message || "تعذر تحديث قائمة المقارنة.";
      setError(message);
      showToast(message, "error");
      return false;
    } finally {
      setPendingIds((current) => current.filter((pendingId) => pendingId !== id));
    }
  }, [compares, pendingIds, refreshCompares]);

  const value = useMemo(() => ({
    compares,
    error,
    isCompared,
    isPending: (id) => pendingIds.includes(String(id)),
    toggle,
  }), [compares, error, isCompared, pendingIds, toggle]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
}
