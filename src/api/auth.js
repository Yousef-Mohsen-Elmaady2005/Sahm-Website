import axios from "axios";
import { getLanguage, t } from "../i18n";

export const AUTH_TOKEN_KEY = "sahm_auth_token";
export const AUTH_SESSION_KEY = "sahm_authenticated";

// Keep the login limited to the current browser session. Older versions stored
// these values permanently in localStorage, so discard those stale sessions.
const clearLegacyAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
};

export const setAuthSession = (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("استجابة تسجيل الدخول لا تحتوي على رمز دخول صالح.");
  }
  clearLegacyAuth();
  sessionStorage.setItem(AUTH_TOKEN_KEY, token.trim());
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
  window.dispatchEvent(new Event("sahm-auth-change"));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event("sahm-auth-change"));
};

export const isAuthenticated = () => {
  clearLegacyAuth();
  return Boolean(sessionStorage.getItem(AUTH_TOKEN_KEY));
};

const api = axios.create({
  baseURL: "https://sahmre.site/api/",
  headers: {
    Accept: "application/json",
    Lang: getLanguage(),
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers.Lang = getLanguage();
  return config;
});

const localizeApiMessages = (payload) => {
  if (!payload || typeof payload !== "object") return;
  const translateMessages = (value) => {
    if (typeof value === "string") return t(value);
    if (Array.isArray(value)) return value.map(translateMessages);
    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (["message", "error", "errors"].includes(key.toLowerCase())) {
          value[key] = translateMessages(nested);
        } else if (nested && typeof nested === "object") {
          translateMessages(nested);
        }
      }
    }
    return value;
  };
  translateMessages(payload);
};

api.interceptors.response.use(
  (response) => {
    localizeApiMessages(response.data);
    return response;
  },
  (error) => {
    localizeApiMessages(error.response?.data);
    return Promise.reject(error);
  },
);

export const loginRequest = ({ email, password }) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  return api.post("/login", formData);
};

export const registerRequest = ({
  name,
  email,
  phone,
  password,
  type,
  construction_type,
  commercial_number,
  area_id,
}) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("type", type);
  if (Array.isArray(construction_type)) {
    construction_type.forEach((value) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append("construction_type[]", value);
      }
    });
  } else if (construction_type !== undefined && construction_type !== null && construction_type !== "") {
    formData.append("construction_type[]", construction_type);
  }
  if (commercial_number) formData.append("commercial_number", commercial_number);
  formData.append("area_id", area_id);
  formData.append("password", password);
  formData.append("password_confirmation", password);

  return api.post("/register", formData);
};

export const logoutRequest = () => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  return api.post("/logout", null, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// الدول (المستوى الأول)
export const getAreas = () => api.get("/areas");

// المدن اللي تحت دولة معينة، مثلًا /area/1
export const getAreaChildren = (parentId) => api.get(`/area/${parentId}`);

// أنواع الحسابات المتاحة في نموذج التسجيل.
export const getUserTypes = () => api.get("/user_types");
export const getConstructionTypes = () => api.get("/construction_types");

// بيانات المستخدم الحالي (يتطلب Bearer token من الجلسة الحالية).
export const getProfile = () => api.get("/profile");
export const updateProfile = (formData) => api.post("/update/profile", formData);
export const updateNotificationPreference = (isNotify) => {
  const formData = new FormData();
  formData.append("is_notify", isNotify ? "1" : "0");
  return api.post("/is_notify", formData);
};
export const changePassword = ({ current_password, password, password_confirmation }) =>
  api.put("/change/password", null, {
    params: { current_password, password, password_confirmation },
  });

// إشعارات المستخدم الحالي (يتطلب Bearer token من الجلسة الحالية).  
export const getNotifications = () => api.get("/notifications");

// محادثات المستخدم ورسائل محادثة محددة.
export const getConversations = () => api.get("/conversations");
export const getConversationMessages = (conversationId) => api.get(`/conversation/${conversationId}`);
export const searchChatUsers = (name) => {
  const formData = new FormData();
  formData.append("name", name);
  return api.post("/search_user", formData);
};
export const startChatConversation = (userId) => api.get(`/new_conversation/${userId}`);
export const sendChatMessage = ({ conversation_id, message }) => {
  const formData = new FormData();
  formData.append("conversation_id", conversation_id);
  formData.append("message", message);
  return api.post("/send_message", formData);
};
// إعدادات الموقع العامة، ومنها بيانات التواصل.
export const getSettings = () => api.get("/setting");
export const getBoarding = () => api.get("/boarding");

// محتوى صفحة "من نحن" والصور المرتبطة بها.
export const getAbout = () => api.get("/about");
export const getCommonQuestions = () => api.get("/common_question");
export const storeComment = ({ model, model_id, body, stars }) => {
  const formData = new FormData();
  formData.append("model", model);
  formData.append("model_id", model_id);
  formData.append("body", body);
  formData.append("stars", stars);
  return api.post("/store_comment", formData);
};
export const storeNewsletter = (email) => {
  const formData = new FormData();
  formData.append("email", email);
  return api.post("/store-newsletter", formData);
};

export const storeContact = ({ name, last_name, email, mobile, message }) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("last_name", last_name);
  formData.append("email", email);
  formData.append("mobile", mobile);
  formData.append("message", message);
  return api.post("/store-contact", formData);
};

// العقارات والبيانات المستخدمة في فلاتر صفحة العقارات.
export const getAqars = (params = {}) => api.get("/aqars", { params });
export const getAqar = (id) => api.get(`/aqar/${id}`);
export const getOwner = (userId) => api.get(`/owner/${userId}`);
export const updateAqar = (formData) => api.post("/update/aqar", formData);
export const getPurchases = () => api.get("/purchases");
export const buyAqarNow = (postId) => {
  const formData = new FormData();
  formData.append("post_id", postId);
  return api.post("/buy_now", formData);
};
export const getUserAqars = () => api.get("/user/aqars");
export const deleteAqar = (postId) => api.delete("/delete/aqar", { params: { post_id: postId } });
export const deleteImage = (postId, imageId) =>
  api.delete("/delete_image", { params: { post_id: postId, image_id: imageId } });
export const getFavorites = () => api.get("/favourites");
export const toggleFavorite = (postId) => {
  const formData = new FormData();
  formData.append("post_id", postId);
  return api.post("/toggle_fav", formData);
};
export const getCompares = () => api.get("/compares");
export const toggleCompare = (postId) => {
  const formData = new FormData();
  formData.append("post_id", postId);
  return api.post("/toggle_compare", formData);
};
export const getAqarTypes = () => api.get("/aqar_types");
export const getAqarStatuses = () => api.get("/aqar_status");
export const getAqarNatures = () => api.get("/aqar_natures");
export const storeAqar = (formData) => api.post("/store/aqar", formData);
export const storeConstruction = (formData) => api.post("/store/construction", formData);
export const getUserConstructions = () => api.get("/user/constructions");
export const getConstruction = (constructionId) => api.get(`/construction/${constructionId}`);
export const updateConstruction = (formData) => api.post("/update/construction", formData);
export const deleteConstruction = (constructionId) => api.delete("/delete/construction", { params: { post_id: constructionId } });
export const getCompanyConstructions = () => api.get("/company/constructions");
export const storeConstructionOffer = ({ construction_id, price }) => {
  const formData = new FormData();
  formData.append("construction_id", construction_id);
  formData.append("price", price);
  return api.post("/store/construction/offer", formData);
};
export const updateConstructionOfferStatus = ({ construction_id, offer_id, status }) => {
  const formData = new FormData();
  formData.append("construction_id", construction_id);
  formData.append("offer_id", offer_id);
  formData.append("status", status);
  return api.post("/update/offer/status", formData);
};

export default api;
