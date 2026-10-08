import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faStar, faChevronRight, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { t } from "../i18n";

const testimonials = [
  { name: "YOUSEF", rating: "ممتاز", stars: 5 },
  { name: "MOHSEN", rating: "ممتاز", stars: 5 },
  { name: "MOHAMED", rating: "جيد", stars: 3 },
  { name: "ELAWADY", rating: "جيد جدا", stars: 4 },
  { name: "ELMAANDY", rating: "ممتاز", stars: 5 },
  { name: "AHMED", rating: "ممتاز", stars: 5 },
  { name: "MOHAMED", rating: "ممتاز", stars: 5 },
];

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setPerView(1);
      else if (window.innerWidth < 1024) setPerView(2);
      else setPerView(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(testimonials.length - perView, 0);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [maxIndex, index]);

  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));

  return (
    <section dir="rtl" className="bg-gray-50 py-12 px-4 sm:py-16 sm:px-8">
      <div className="max-w-6xl mx-auto text-center mb-8 sm:mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-2 sm:text-2xl sm:mb-3 md:text-3xl">{t("\n          اراء العملاء\n        ")}</h2>
        <p className="text-gray-500 text-xs px-2 sm:text-sm sm:px-0 md:text-base">{t("\n          وعند موافقه العميل المبدئيه على التصميم يتم ازالة هذا النص من\n          التصميم ويتم وضع النصوص النهائية\n        ")}</p>
      </div>

      <div className="relative mx-auto w-full max-w-[1400px]">
        {/* Prev */}
        <button
          onClick={prev}
          aria-label={t("السابق")}
          className="absolute -left-2 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm transition"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs sm:text-sm" />
        </button>

        {/* Next */}
        <button
          onClick={next}
          aria-label={t("التالي")}
          className="absolute -right-2 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm transition"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs sm:text-sm" />
        </button>

        {/* Track */}
        <div className="overflow-hidden mx-5 sm:mx-8 md:mx-10">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${index * (100 / perView)}%)` }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="shrink-0 px-2 sm:px-3"
                style={{ width: `${100 / perView}%` }}
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 h-full min-h-[180px] sm:min-h-[200px] flex flex-col justify-between hover:shadow-md transition">
                  <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <FontAwesomeIcon icon={faUser} className="text-3xl sm:text-4xl text-gray-400" />
                    <span className="font-semibold text-gray-800 text-sm sm:text-base">{t.name}</span>
                  </div>

                  <div>
                    <p className="text-gray-700 mb-2 text-sm sm:text-base">{t.rating}</p>
                    <div className="flex gap-1 text-yellow-400 text-xs sm:text-sm">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <FontAwesomeIcon
                          key={s}
                          icon={faStar}
                          className={s < t.stars ? "text-yellow-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}