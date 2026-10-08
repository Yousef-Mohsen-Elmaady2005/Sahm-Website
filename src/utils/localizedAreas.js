import { getAreaChildren, getAreas } from "../api/auth";
import { getLanguage } from "../i18n";

const areaCache = new Map();

const getItems = (response) => {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const titleOf = (area) => area?.title || area?.name || "";

export function loadLocalizedAreas(language = getLanguage()) {
  if (areaCache.has(language)) return areaCache.get(language);

  const request = (async () => {
    const parents = getItems(await getAreas());
    const childResponses = await Promise.all(
      parents
        .filter((area) => area.has_child)
        .map((area) => getAreaChildren(area.id).catch(() => null)),
    );
    return [...parents, ...childResponses.flatMap(getItems)];
  })().catch((error) => {
    areaCache.delete(language);
    throw error;
  });

  areaCache.set(language, request);
  return request;
}

export function getLocalizedPropertyLocation(property, areas = []) {
  const byId = new Map(areas.map((area) => [String(area.id), area]));
  const areaValue = property?.area;
  const parentValue = property?.area_parent;
  const cityId = property?.area_id ?? areaValue?.id ?? property?.city_id;
  const city = cityId != null ? byId.get(String(cityId)) : null;
  const parentId = property?.area_parent_id
    ?? parentValue?.id
    ?? city?.parent_id
    ?? city?.parent?.id
    ?? city?.parent_area_id
    ?? city?.area_parent_id;
  const parent = parentId != null ? byId.get(String(parentId)) : null;

  const parentTitle = titleOf(parent) || titleOf(parentValue) || property?.area_parent_title || "";
  const cityTitle = titleOf(city)
    || titleOf(areaValue)
    || (typeof areaValue === "string" ? areaValue : "")
    || property?.area_title
    || "";

  return [parentTitle, cityTitle].filter(Boolean);
}
