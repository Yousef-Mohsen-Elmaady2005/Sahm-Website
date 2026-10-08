import { useEffect, useState } from "react";
import AboutSection from "../Component/AboutSection";
import VisionMissionSection from "../Component/VisionMissionSection";
import StatsSection from "../Component/StatsSection";
import { getAbout } from "../api/auth";
import { t, useLanguage } from "../i18n";

function resolveImageUrl(path) {
  if (!path || typeof path !== "string") return "";
  try {
    return new URL(path, "https://sahmre.site/").toString();
  } catch {
    return "";
  }
}

function Aboutus() {
  const { language } = useLanguage();
  const [aboutData, setAboutData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    getAbout()
      .then(({ data: responseData }) => {
        if (!isCurrent) return;
        const payload = responseData?.data ?? responseData;
        setAboutData(payload);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.response?.data?.message || t("تعذر تحميل محتوى صفحة من نحن"));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [language]);

  return (
    <div>
      {error && (
        <p role="alert" className="bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <AboutSection
        contentHtml={aboutData?.aboutus_text}
        imageSrc={resolveImageUrl(aboutData?.aboutus_image1)}
      />
      <VisionMissionSection
        contentHtml={aboutData?.aboutus_text2}
        imageSrc={resolveImageUrl(aboutData?.aboutus_image2)}
      />
      <StatsSection />
    </div>
  );
}

export default Aboutus;
