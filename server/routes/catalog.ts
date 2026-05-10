import { Router } from "express";
import { z } from "zod";
import { searchCities, CITY_CATALOG } from "../../lib/catalog/cities";
import { searchActivities, type CatalogActivityCategory } from "../../lib/catalog/activities";

const categorySchema = z.enum(["ADVENTURE", "FOOD", "SIGHTSEEING", "NATURE", "NIGHTLIFE", "OTHER"]);

const router = Router();

router.get("/cities", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  return res.json({ cities: searchCities(q) });
});

router.get("/cities/:id/weather", (req, res) => {
  const city = CITY_CATALOG.find((c) => c.id === req.params.id);
  if (!city) return res.status(404).json({ error: "City not found" });
  return res.json({
    cityId: city.id,
    summary: city.weatherSummary,
    tempC: city.tempC + Math.round((Math.random() - 0.5) * 4),
  });
});

router.get("/activities", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const cat = req.query.category;
  const parsed = categorySchema.safeParse(cat);
  return res.json({
    activities: searchActivities(q, parsed.success ? (parsed.data as CatalogActivityCategory) : undefined),
  });
});

export default router;
