import { Router } from "express";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import { ACTIVITY_TEMPLATES } from "../../lib/catalog/activities";

const router = Router();
router.use(authMiddleware);

router.post("/trips/:tripId/suggestions", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
    include: { stops: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const cities = trip.stops.map((s) => s.city).join(", ");
  const picks = ACTIVITY_TEMPLATES.slice(0, 4).map((a, i) => ({
    ...a,
    rationale: `Fits your route through ${cities || "your destinations"}.`,
    priority: i + 1,
  }));

  return res.json({
    message: "AI-style suggestions (demo): curated picks based on your stops.",
    suggestions: picks,
  });
});

export default router;
