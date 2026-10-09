import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Component/Navbar";
import Footer from "./Component/Futar";
import DynamicPageHeader from "./Component/DynamicPageHeader";
import Home from "./Pages/Home";
import Aboutus from "./Pages/Aboutus";
import Contactus from "./Pages/Contactus";
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import Register from "./Pages/Register";
import RealEstate from "./Pages/RealEstate";
import Services from "./Pages/Services";
import Account, { AccountInfo, CompareProperties, FavoriteProperties, Invoices, MyProperties, MyPurchases } from "./Pages/Account";
import Notifications from "./Pages/Notifications";
import Messages from "./Pages/Messages";
import AddProperty from "./Pages/AddProperty";
import EditProperty from "./Pages/EditProperty";
import AddContracting from "./Pages/AddContracting";
import EditContracting from "./Pages/EditContracting";
import AccountRequests from "./Pages/AccountRequests";
import PropertyDetails from "./Pages/PropertyDetails";
import Help from "./Pages/Help";
import FAQ from "./Pages/FAQ";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import BlacklistReasons from "./Pages/BlacklistReasons";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { isAuthenticated } from "./api/auth";
import { FavoritesProvider } from "./context/FavoritesContext";
import { CompareProvider } from "./context/CompareContext";
import ToastNotice from "./Component/ToastNotice";
import { useLanguage } from "./i18n";

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function App() {
  const { dir, language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.documentElement.dataset.language = language;
    document.title = language === "en" ? "Sahm Real Estate" : "سهم للخدمات العقارية";
  }, [dir, language]);

  return (
    <div dir={dir} lang={language}>
      <BrowserRouter>
        <ScrollToTop />
        <FavoritesProvider>
        <CompareProvider>
        <ToastNotice />
        <Navbar />
        <DynamicPageHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<RequireAuth><Aboutus /></RequireAuth>} />
          <Route path="/contact" element={<RequireAuth><Contactus /></RequireAuth>} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/blacklist-reasons" element={<BlacklistReasons />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/real-estate" element={<RequireAuth><RealEstate /></RequireAuth>} />
          <Route path="/real-estate/:propertyId" element={<RequireAuth><PropertyDetails /></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><Services /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>}>
            <Route index element={<AccountInfo />} />
            <Route path="favorites" element={<FavoriteProperties />} />
            <Route path="compare" element={<CompareProperties />} />
            <Route path="my-properties" element={<MyProperties />} />
            <Route path="requests" element={<AccountRequests />} />
            <Route path="my-requests" element={<AccountRequests ownRequestsOnly />} />
            <Route path="company-constructions" element={<AccountRequests />} />
            <Route path="purchases" element={<MyPurchases />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/add-property" element={<RequireAuth><AddProperty /></RequireAuth>} />
          <Route path="/edit-property/:propertyId" element={<RequireAuth><EditProperty /></RequireAuth>} />
          <Route path="/add-contracting" element={<RequireAuth><AddContracting /></RequireAuth>} />
          <Route path="/edit-contracting/:constructionId" element={<RequireAuth><EditContracting /></RequireAuth>} />
        </Routes>
        <Footer />
        </CompareProvider>
        </FavoritesProvider>
      </BrowserRouter>
    </div>

  );
}

export default App;
