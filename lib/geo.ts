import { CITY_CATALOG } from "@/lib/catalog/cities";

export function coordsForCity(city: string, country: string) {
  const hit = CITY_CATALOG.find(
    (c) =>
      c.city.toLowerCase() === city.toLowerCase() && c.country.toLowerCase() === country.toLowerCase(),
  );
  if (hit) return { lat: hit.lat, lng: hit.lng };
  return { lat: 20, lng: 0 };
}
