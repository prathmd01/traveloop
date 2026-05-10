export type CatalogActivityCategory =
  | "ADVENTURE"
  | "FOOD"
  | "SIGHTSEEING"
  | "NATURE"
  | "NIGHTLIFE"
  | "OTHER";

export type ActivityTemplate = {
  id: string;
  title: string;
  category: CatalogActivityCategory;
  cost: number;
  duration: number;
  image: string;
  rating: number;
};

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: "at-1",
    title: "Sunrise hike & viewpoints",
    category: "ADVENTURE",
    cost: 45,
    duration: 180,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    rating: 4.8,
  },
  {
    id: "at-2",
    title: "Evening food crawl",
    category: "FOOD",
    cost: 65,
    duration: 150,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    rating: 4.9,
  },
  {
    id: "at-3",
    title: "Old town walking tour",
    category: "SIGHTSEEING",
    cost: 35,
    duration: 120,
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
    rating: 4.7,
  },
  {
    id: "at-4",
    title: "Botanical gardens visit",
    category: "NATURE",
    cost: 18,
    duration: 90,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    rating: 4.6,
  },
  {
    id: "at-5",
    title: "Rooftop cocktails",
    category: "NIGHTLIFE",
    cost: 55,
    duration: 120,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    rating: 4.5,
  },
  {
    id: "at-6",
    title: "Kayak coastal route",
    category: "ADVENTURE",
    cost: 72,
    duration: 150,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    rating: 4.8,
  },
  {
    id: "at-7",
    title: "Cooking class with locals",
    category: "FOOD",
    cost: 85,
    duration: 180,
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
    rating: 4.9,
  },
  {
    id: "at-8",
    title: "Museum highlights pass",
    category: "SIGHTSEEING",
    cost: 42,
    duration: 200,
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b865f28e?w=800&q=80",
    rating: 4.7,
  },
];

export function searchActivities(query: string, category?: CatalogActivityCategory) {
  const q = query.trim().toLowerCase();
  let list = ACTIVITY_TEMPLATES;
  if (category) list = list.filter((a) => a.category === category);
  if (!q) return list;
  return list.filter((a) => a.title.toLowerCase().includes(q));
}
