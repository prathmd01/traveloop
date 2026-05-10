export type CityCatalogEntry = {
  id: string;
  city: string;
  country: string;
  costIndex: number;
  popularity: number;
  lat: number;
  lng: number;
  weatherSummary: string;
  tempC: number;
};

export const CITY_CATALOG: CityCatalogEntry[] = [
  {
    id: "par",
    city: "Paris",
    country: "France",
    costIndex: 78,
    popularity: 98,
    lat: 48.8566,
    lng: 2.3522,
    weatherSummary: "Partly cloudy",
    tempC: 14,
  },
  {
    id: "tok",
    city: "Tokyo",
    country: "Japan",
    costIndex: 72,
    popularity: 96,
    lat: 35.6762,
    lng: 139.6503,
    weatherSummary: "Clear",
    tempC: 18,
  },
  {
    id: "nyc",
    city: "New York",
    country: "USA",
    costIndex: 85,
    popularity: 97,
    lat: 40.7128,
    lng: -74.006,
    weatherSummary: "Windy",
    tempC: 12,
  },
  {
    id: "bar",
    city: "Barcelona",
    country: "Spain",
    costIndex: 65,
    popularity: 92,
    lat: 41.3851,
    lng: 2.1734,
    weatherSummary: "Sunny",
    tempC: 20,
  },
  {
    id: "sin",
    city: "Singapore",
    country: "Singapore",
    costIndex: 70,
    popularity: 90,
    lat: 1.3521,
    lng: 103.8198,
    weatherSummary: "Humid",
    tempC: 29,
  },
  {
    id: "dub",
    city: "Dubai",
    country: "UAE",
    costIndex: 68,
    popularity: 94,
    lat: 25.2048,
    lng: 55.2708,
    weatherSummary: "Hot",
    tempC: 34,
  },
  {
    id: "rom",
    city: "Rome",
    country: "Italy",
    costIndex: 70,
    popularity: 95,
    lat: 41.9028,
    lng: 12.4964,
    weatherSummary: "Mild",
    tempC: 17,
  },
  {
    id: "syd",
    city: "Sydney",
    country: "Australia",
    costIndex: 74,
    popularity: 88,
    lat: -33.8688,
    lng: 151.2093,
    weatherSummary: "Breezy",
    tempC: 22,
  },
];

export function searchCities(query: string): CityCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITY_CATALOG.slice(0, 8);
  return CITY_CATALOG.filter(
    (c) =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.id.includes(q),
  );
}
