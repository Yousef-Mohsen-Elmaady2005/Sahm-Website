import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFavorites, isAuthenticated, toggleFavorite as toggleFavoriteRequest } from "../api/auth";
import { showToast } from "../utils/notifications";
import { t, useLanguage } from "../i18n";

const FavoritesContext = createContext(null);

const getItems = (response) => {
  let payload = response?.data?.data;
  while (payload && !Array.isArray(payload) && typeof payload === "object" && payload.data) {
    payload = payload.data;
  }
  return Array.isArray(payload) ? payload : [];
};

const normalizeFavorite = (item) => {
  const property = item?.aqar || item?.property || item?.aqar_data || item;
  return { ...property, id: property?.id ?? item?.aqar_id };
};

export function FavoritesProvider({ children }) {
  const { language } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [error, setError] = useState("");

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated()) {
      setFavorites([]);
      return [];
    }
    const response = await getFavorites();
    const items = getItems(response).map(normalizeFavorite).filter((item) => item.id != null);
    setFavorites(items);
    setError("");
    return items;
  }, []);

  useEffect(() => {
    const refreshIfAuthenticated = () => {
      if (isAuthenticated()) {
        refreshFavorites().catch(() => setError("تعذر تحميل قائمة المفضلة."));
      } else {
        setFavorites([]);
      }
    };
    refreshIfAuthenticated();
    window.addEventListener("sahm-auth-change", refreshIfAuthenticated);
    return () => window.removeEventListener("sahm-auth-change", refreshIfAuthenticated);
  }, [refreshFavorites, language]);

  const isFavorite = useCallback((id) => favorites.some((item) => String(item.id) === String(id)), [favorites]);

  const toggle = useCallback(async (property) => {
    if (!property?.id || pendingIds.includes(String(property.id))) return false;
    const id = String(property.id);
    const previousFavorites = favorites;
    const wasFavorite = previousFavorites.some((item) => String(item.id) === id);
    setError("");
    setPendingIds((current) => [...current, id]);
    setFavorites(wasFavorite
      ? previousFavorites.filter((item) => String(item.id) !== id)
      : [...previousFavorites, property]);
    try {
      await toggleFavoriteRequest(id);
      showToast(wasFavorite ? t("تم حذف العقار من المفضلة") : t("تمت إضافة العقار إلى المفضلة بنجاح"));
      try {
        await refreshFavorites();
      } catch {
        setError("تم تحديث المفضلة، لكن تعذر تحديث القائمة الآن.");
      }
      return true;
    } catch (requestError) {
      setFavorites(previousFavorites);
      const message = requestError.response?.data?.message || "تعذر تحديث المفضلة.";
      setError(message);
      showToast(message, "error");
      return false;
    } finally {
      setPendingIds((current) => current.filter((pendingId) => pendingId !== id));
    }
  }, [favorites, pendingIds, refreshFavorites]);

  const value = useMemo(() => ({
    favorites,
    error,
    refreshFavorites,
    isFavorite,
    isPending: (id) => pendingIds.includes(String(id)),
    toggle,
  }), [favorites, error, isFavorite, pendingIds, refreshFavorites, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
