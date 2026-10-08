import { useEffect, useState } from "react";
import HeroSearch from "../Component/HeroSearch";
import FeaturedProperties from "../Component/FeaturedProperties";
import PropertiesSection from "../Component/ourproperties";
import AboutSection from "../Component/AboutSection";
import VisionMissionSection from "../Component/VisionMissionSection";
import StatsSection from "../Component/StatsSection";
import PinnedProperties from "../Component/PinnedProperties";
import ContractingCTASection from "../Component/ContractingCTASection";
import TestimonialsSection from "../Component/TestimonialsSection";
import { getAqars } from "../api/auth";
import { t, useLanguage } from "../i18n";
import { getLocalizedPropertyLocation, loadLocalizedAreas } from "../utils/localizedAreas";

const getItems = (response) => {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
};

const propertyImage = (item) => {
  const image = item.image || item.image_url || item.cover_image || item.thumbnail || item.images?.[0];
  return typeof image === "string" ? image : image?.url || image?.image_url || "";
};

function Home() {
  const { language } = useLanguage();
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getAqars(), loadLocalizedAreas(language).catch(() => [])])
      .then(([response, areas]) => {
        if (!active) return;
        const items = getItems(response).map((item) => ({
          id: item.id,
          image: propertyImage(item),
          price: Number(item.final_price ?? item.price) || 0,
          title: item.title || "عقار",
          propertyType: item.aqar_type_title || item.type_title || "",
          propertyStatus: item.aqar_status_title || item.status_title || "",
          location: getLocalizedPropertyLocation(item, areas),
          area: item.space ?? "—",
          baths: item.bathroom_no ?? 0,
          rooms: item.room_no ?? 0,
        }));
        setProperties(items);
      })
      .catch(() => {
        if (active) setProperties([]);
      })
      .finally(() => {
        if (active) setPropertiesLoading(false);
      });
    return () => { active = false; };
  }, [language]);

  return (
    <div>
      <HeroSearch />
      <FeaturedProperties />
      {propertiesLoading ? (
        <section dir="rtl" className="bg-gray-50 px-6 py-12 text-center text-gray-600">{t("جاري تحميل العقارات...")}</section>
      ) : (
        <PropertiesSection propertyItems={properties} />
      )}
      <AboutSection />
      <VisionMissionSection />
      <StatsSection />
      <PinnedProperties />
      <ContractingCTASection />
      <TestimonialsSection/>
    </div>
  );
    
}
 
export default Home;
