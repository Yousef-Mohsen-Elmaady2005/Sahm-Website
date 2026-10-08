const API_ORIGIN = "https://sahmre.site/";
const IMAGE_FIELDS = new Set([
  "image", "image_url", "cover_image", "thumbnail", "images", "photos", "gallery",
  "property_images", "construction_images", "aqar_images", "url", "original_url", "image_path", "path", "src",
]);

const resolveImage = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return new URL(value.trim(), API_ORIGIN).toString();
  } catch {
    return "";
  }
};

export function getImageUrls(record) {
  const urls = [];
  const visit = (value, field = "") => {
    if (typeof value === "string") {
      if (IMAGE_FIELDS.has(field)) {
        const url = resolveImage(value);
        if (url) urls.push(url);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, field));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      if (IMAGE_FIELDS.has(normalizedKey) || normalizedKey === "data") visit(nested, normalizedKey);
    }
  };

  visit(record);
  return [...new Set(urls)];
}
